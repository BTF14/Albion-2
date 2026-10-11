import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DailyChecklistItem, CityId, TodoTaskCategory, IslandTimer } from '../types';
import { CITIES, ALBION_ITEMS } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { NumericInput } from './NumericInput';
import { loadTimers, saveTimers } from '../utils/storage';
import { playHarvestChime } from '../utils/audioAlert';
import {
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  RotateCcw,
  CheckSquare,
  Sparkles,
  Wheat,
  ShoppingCart,
  Truck,
  CookingPot,
  ClipboardList,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Check,
  Star,
  Users,
  User,
  BookmarkCheck,
  Zap,
  Printer,
} from 'lucide-react';
import { CharacterProfile } from '../domain/models/character';
import {
  ALBION_ROUTINE_TEMPLATES,
  AlbionTodoTemplate,
  generateRoutineFromCharacterProfiles,
  resetRoutineForNewCycle,
} from '../domain/use-cases/generateDailyTodoRoutine';

interface DailyTodoListProps {
  checklist: DailyChecklistItem[];
  onSaveChecklist: (items: DailyChecklistItem[]) => void;
  currentCityId: CityId;
  onNavigateToLoggerWithPreset: (preset: {
    cityId: CityId;
    itemId?: string;
    plotsCount?: number;
    targetDate?: string;
  }) => void;
  onNavigateToCalendar?: () => void;
  activeCharacterName?: string;
  characterProfiles?: CharacterProfile[];
  onOpenCharacterModal?: () => void;
  onOpenDailyRoadmap?: () => void;
}

export const DailyTodoList: React.FC<DailyTodoListProps> = ({
  checklist,
  onSaveChecklist,
  currentCityId,
  onNavigateToLoggerWithPreset,
  onNavigateToCalendar,
  activeCharacterName,
  characterProfiles = [],
  onOpenCharacterModal,
  onOpenDailyRoadmap,
}) => {
  // Filtros de visualización
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'islands' | 'chores' | 'completed'>('all');
  const [selectedCityFilter, setSelectedCityFilter] = useState<CityId | 'all'>('all');

  // Estado de modales
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<'island' | 'chore'>('island');

  // Formulario para Islas
  const [islandTitle, setIslandTitle] = useState<string>('');
  const [islandCity, setIslandCity] = useState<CityId>(currentCityId);
  const [islandItem, setIslandItem] = useState<string>('crop_wheat');
  const [islandPlots, setIslandPlots] = useState<number>(5);
  const [islandUsesFocus, setIslandUsesFocus] = useState<boolean>(true);
  const [islandNotes, setIslandNotes] = useState<string>('');
  const [islandPriority, setIslandPriority] = useState<'normal' | 'high'>('normal');

  // Formulario para Tareas Libres
  const [choreTitle, setChoreTitle] = useState<string>('');
  const [choreCategory, setChoreCategory] = useState<TodoTaskCategory>('market');
  const [choreCity, setChoreCity] = useState<CityId>(currentCityId);
  const [chorePriority, setChorePriority] = useState<'normal' | 'high'>('normal');
  const [choreNotes, setChoreNotes] = useState<string>('');

  // Mensaje de éxito temporal
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const actionNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (actionNoticeTimeoutRef.current) {
        clearTimeout(actionNoticeTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    if (actionNoticeTimeoutRef.current) {
      clearTimeout(actionNoticeTimeoutRef.current);
    }
    actionNoticeTimeoutRef.current = setTimeout(() => setActionNotice(null), 3500);
  };

  // Helper para determinar si un item está 100% completado
  const isItemComplete = (item: DailyChecklistItem): boolean => {
    if (item.isCustomTask) {
      return !!item.completed;
    }
    return item.harvested && item.replanted;
  };

  // Métricas globales de la lista de tareas
  const stats = useMemo(() => {
    const total = checklist.length;
    let completedCount = 0;
    let islandCount = 0;
    let islandCompleted = 0;
    let choreCount = 0;
    let choreCompleted = 0;
    let totalPlots = 0;
    let focusEstimatedIslands = 0;

    checklist.forEach((item) => {
      const isDone = isItemComplete(item);
      if (isDone) completedCount++;

      if (item.isCustomTask) {
        choreCount++;
        if (item.completed) choreCompleted++;
      } else {
        islandCount++;
        totalPlots += item.plotsCount || 0;
        if (item.usedFocus) focusEstimatedIslands += (item.plotsCount || 0) * 9;
        if (item.harvested && item.replanted) islandCompleted++;
      }
    });

    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return {
      total,
      completedCount,
      percent,
      islandCount,
      islandCompleted,
      choreCount,
      choreCompleted,
      totalPlots,
      focusEstimatedIslands,
    };
  }, [checklist]);

  // Lista filtrada
  const filteredList = useMemo(() => {
    return checklist.filter((item) => {
      // Filtro de ciudad si no es 'all'
      if (selectedCityFilter !== 'all' && item.cityId !== selectedCityFilter) {
        return false;
      }

      const isDone = isItemComplete(item);

      if (filterMode === 'pending') return !isDone;
      if (filterMode === 'completed') return isDone;
      if (filterMode === 'islands') return !item.isCustomTask;
      if (filterMode === 'chores') return !!item.isCustomTask;
      return true;
    });
  }, [checklist, filterMode, selectedCityFilter]);

  // Cambiar estado de un campo en una isla
  const handleToggleIslandField = (
    id: string,
    field: 'harvested' | 'replanted' | 'usedFocus'
  ) => {
    const nextList = checklist.map((item) => {
      if (item.id === id) {
        const nextVal = !item[field];
        const updated = { ...item, [field]: nextVal };
        // Si al cambiar este campo la tarea se completa al 100%, emitir sonido
        if (field !== 'usedFocus' && updated.harvested && updated.replanted && !item.harvested) {
          playHarvestChime();
        }
        return updated;
      }
      return item;
    });
    onSaveChecklist(nextList);
  };

  // Toggle de tarea simple
  const handleToggleChoreCompleted = (id: string) => {
    const nextList = checklist.map((item) => {
      if (item.id === id) {
        const nextState = !item.completed;
        if (nextState) playHarvestChime();
        return { ...item, completed: nextState };
      }
      return item;
    });
    onSaveChecklist(nextList);
  };

  // Acciones en lote
  const handleMarkAllIslands = (field: 'harvested' | 'replanted' | 'usedFocus', value: boolean) => {
    const nextList = checklist.map((item) => {
      if (!item.isCustomTask) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onSaveChecklist(nextList);
    showToast(
      value
        ? `Todas las parcelas marcadas como ${field === 'harvested' ? 'cosechadas' : field === 'replanted' ? 'resembradas' : 'con foco'}.`
        : `Marcas de ${field} restablecidas.`
    );
  };

  const handleCompleteAllChores = (value: boolean) => {
    const nextList = checklist.map((item) => {
      if (item.isCustomTask) {
        return { ...item, completed: value };
      }
      return item;
    });
    onSaveChecklist(nextList);
    showToast(value ? 'Todas las tareas libres marcadas como completadas.' : 'Tareas libres pendientes.');
  };

  // Reiniciar rutina diaria para un nuevo día (Reinicio 10:00 UTC)
  const handleResetDay = () => {
    const nextList = resetRoutineForNewCycle(checklist);
    onSaveChecklist(nextList);
    showToast('¡Nueva jornada iniciada! Todas las tareas se encuentran listas para el nuevo ciclo diario.');
  };

  // Sincronizar automáticamente islas desde los perfiles de personajes (Alts)
  const handleSyncFromProfiles = () => {
    if (!characterProfiles || characterProfiles.length === 0) {
      if (onOpenCharacterModal) {
        onOpenCharacterModal();
      }
      showToast('No tienes personajes registrados aún. Crea uno en el Gestor de Alts con sus islas.');
      return;
    }

    const totalIslandsInProfiles = characterProfiles.reduce(
      (sum, p) => sum + (p.islands?.length || 0),
      0
    );

    if (totalIslandsInProfiles === 0) {
      if (onOpenCharacterModal) {
        onOpenCharacterModal();
      }
      showToast('Tus personajes no tienen islas asignadas todavía. Añade una isla a tu personaje.');
      return;
    }

    const { updatedList, addedCount } = generateRoutineFromCharacterProfiles(
      checklist,
      characterProfiles
    );

    if (addedCount > 0) {
      onSaveChecklist(updatedList);
      showToast(`✨ ¡${addedCount} isla${addedCount > 1 ? 's' : ''} sincronizada${addedCount > 1 ? 's' : ''} exitosamente a tu rutina diaria!`);
    } else {
      showToast('Todas las islas de tus personajes ya están incluidas en la lista.');
    }
  };

  // Añadir una tarea desde plantilla rápida de Albion
  const handleApplyTemplate = (tpl: AlbionTodoTemplate) => {
    const now = Date.now();
    const newItem: DailyChecklistItem = {
      id: `task_${tpl.id}_${now}_${Math.random().toString(36).substring(2, 6)}`,
      title: tpl.title,
      cityId: tpl.cityId,
      category: tpl.category,
      isCustomTask: tpl.category !== 'island',
      plotsCount: tpl.defaultPlots || 5,
      itemId: tpl.defaultItemId || 'crop_wheat',
      harvested: false,
      replanted: false,
      usedFocus: false,
      completed: false,
      priority: tpl.priority,
      notes: tpl.notes,
      createdAt: now,
    };

    onSaveChecklist([...checklist, newItem]);
    setShowTemplateModal(false);
    showToast(`Tarea rápida "${tpl.title}" agregada a tu lista.`);
  };

  // Eliminar elemento de la lista
  const handleDeleteItem = (id: string) => {
    const nextList = checklist.filter((item) => item.id !== id);
    onSaveChecklist(nextList);
  };

  // Agregar Isla
  const handleAddIsland = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: DailyChecklistItem = {
      id: `island_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: islandTitle.trim() || `Isla de ${CITIES.find((c) => c.id === islandCity)?.name}`,
      cityId: islandCity,
      itemId: islandItem,
      plotsCount: Math.max(1, islandPlots),
      harvested: false,
      replanted: false,
      usedFocus: islandUsesFocus,
      category: 'island',
      isCustomTask: false,
      priority: islandPriority,
      notes: islandNotes.trim() || undefined,
      createdAt: Date.now(),
    };

    onSaveChecklist([...checklist, newItem]);
    setIslandTitle('');
    setIslandNotes('');
    setShowAddModal(false);
    showToast(`Isla "${newItem.title}" agregada a tu lista diaria.`);
  };

  // Agregar Tarea Libre
  const handleAddChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreTitle.trim()) return;

    const newItem: DailyChecklistItem = {
      id: `chore_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: choreTitle.trim(),
      cityId: choreCity,
      plotsCount: 0,
      harvested: false,
      replanted: false,
      usedFocus: false,
      category: choreCategory,
      isCustomTask: true,
      completed: false,
      priority: chorePriority,
      notes: choreNotes.trim() || undefined,
      createdAt: Date.now(),
    };

    onSaveChecklist([...checklist, newItem]);
    setChoreTitle('');
    setChoreNotes('');
    setShowAddModal(false);
    showToast(`Tarea "${newItem.title}" añadida.`);
  };

  // Iniciar alarma de 22h directamente desde una isla resembrada
  const handleStartTimerForIsland = (item: DailyChecklistItem) => {
    const timers = loadTimers();
    const now = Date.now();
    const newTimer: IslandTimer = {
      id: `timer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.title,
      cityId: item.cityId,
      itemId: item.itemId || 'crop_wheat',
      plotsCount: item.plotsCount,
      plantedAt: now,
      durationHours: 22,
      targetTime: now + 22 * 3600 * 1000,
      notes: item.notes || 'Alarma iniciada desde lista de cosas por hacer',
    };

    saveTimers([...timers, newTimer]);
    showToast(`⏰ Alarma de 22 horas iniciada para "${item.title}". Madurará mañana a la misma hora.`);
  };

  // Helper de icono por categoría
  const getCategoryIcon = (category?: TodoTaskCategory) => {
    switch (category) {
      case 'market':
        return <ShoppingCart size={15} className="text-amber-400" />;
      case 'transport':
        return <Truck size={15} className="text-blue-400" />;
      case 'crafting':
        return <CookingPot size={15} className="text-emerald-400" />;
      case 'island':
        return <Wheat size={15} className="text-lime-400" />;
      default:
        return <ClipboardList size={15} className="text-slate-400" />;
    }
  };

  const getCategoryLabel = (category?: TodoTaskCategory) => {
    switch (category) {
      case 'market':
        return 'Mercado';
      case 'transport':
        return 'Transporte';
      case 'crafting':
        return 'Cocina / Alquimia';
      case 'island':
        return 'Isla de Cultivo';
      default:
        return 'Tarea General';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast informativo */}
      {actionNotice && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/80 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg shadow-emerald-950/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Principal con Barra de Progreso y Estadísticas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
                <ListTodo size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  Lista de Cosas por Hacer
                  <span className="text-xs font-mono font-bold bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full border border-slate-800">
                    {stats.percent}% Completado
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Planifica y marca tus tareas de granja, cosechas de islas, compras en el mercado y transporte.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sincronización Automática desde Islas de Alts */}
            <button
              type="button"
              onClick={handleSyncFromProfiles}
              className="bg-slate-950 hover:bg-slate-850 text-amber-400 border border-amber-500/40 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:border-amber-400"
              title="Generar e incorporar automáticamente las islas registradas en tus personajes"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Sincronizar Islas</span>
            </button>

            {/* Plantillas Rápidas de Rutina de Albion */}
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="bg-slate-950 hover:bg-slate-850 text-indigo-300 border border-indigo-500/40 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:border-indigo-400"
              title="Añadir rutinas habituales de Albion (gasto de foco, compras en mercado, transporte, etc.)"
            >
              <BookmarkCheck size={14} className="text-indigo-400" />
              <span>Plantillas Albion</span>
            </button>

            {/* Imprimir Hoja de Ruta Diaria */}
            {onOpenDailyRoadmap && (
              <button
                type="button"
                onClick={onOpenDailyRoadmap}
                className="bg-slate-950 hover:bg-slate-850 text-cyan-300 border border-cyan-500/40 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:border-cyan-400"
                title="Imprimir u obtener hoja de ruta diaria en papel/PDF"
              >
                <Printer size={14} className="text-cyan-400" />
                <span>Hoja de Ruta</span>
              </button>
            )}

            {onOpenCharacterModal && (
              <button
                type="button"
                onClick={onOpenCharacterModal}
                className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm hover:border-slate-700"
                title="Administrar personajes y registrar sus islas"
              >
                <Users size={14} className="text-slate-400" />
                <span>{activeCharacterName ? `Alts: ${activeCharacterName}` : 'Gestor de Alts'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetDay}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Limpiar marcas de cosechas y tareas para iniciar un nuevo día económico (10:00 UTC)"
            >
              <RotateCcw size={14} className="text-slate-400" />
              <span>Nuevo Ciclo (10:00 UTC)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <Plus size={16} />
              <span>Agregar Tarea o Isla</span>
            </button>
          </div>
        </div>

        {/* Barra de Progreso Global */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span>Progreso de hoy:</span>
              <strong className="text-emerald-400 font-mono">
                {stats.completedCount} de {stats.total} tareas terminadas
              </strong>
            </span>
            <span className="font-mono text-amber-400 font-bold">{stats.percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>

        {/* Tarjetas resumen de métricas clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Wheat size={13} className="text-lime-400" />
              <span>Islas Listas</span>
            </div>
            <div className="text-base font-black text-slate-100 font-mono tabular-nums">
              {stats.islandCompleted} / {stats.islandCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
              {stats.totalPlots} parcelas en total
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Sparkles size={13} className="text-amber-400" />
              <span>Foco Diario</span>
            </div>
            <div className="text-base font-black text-amber-300 font-mono tabular-nums">
              {stats.focusEstimatedIslands > 0 ? `${stats.focusEstimatedIslands} casillas` : 'Sin Foco'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Islas configuradas con foco
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <ClipboardList size={13} className="text-blue-400" />
              <span>Tareas Libres</span>
            </div>
            <div className="text-base font-black text-slate-100 font-mono tabular-nums">
              {stats.choreCompleted} / {stats.choreCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Compras, viajes y crafteo
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock size={13} className="text-purple-400" />
              <span>Alarmas de 22h</span>
            </div>
            <div className="text-base font-black text-slate-100 font-mono">
              {stats.islandCompleted > 0 ? 'Listas p/ Alarma' : 'Pendientes'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {onNavigateToCalendar ? (
                <button
                  type="button"
                  onClick={onNavigateToCalendar}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  Ver temporizadores →
                </button>
              ) : (
                'Maduración de cultivos'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Acciones Rápidas en Lote */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filtros de estado */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter size={12} /> Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todas ({checklist.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Pendientes ({checklist.length - stats.completedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('islands')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterMode === 'islands'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🌾 Islas ({stats.islandCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('chores')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterMode === 'chores'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🛒 Tareas Libres ({stats.choreCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            ✓ Listas ({stats.completedCount})
          </button>
        </div>

        {/* Filtro por ciudad y acciones masivas */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value as CityId | 'all')}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg font-medium cursor-pointer"
          >
            <option value="all">Todas las ciudades</option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Acciones en lote */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleMarkAllIslands('harvested', true)}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Marcar todas las islas como Cosechadas"
            >
              <CheckSquare size={12} className="text-emerald-400" />
              <span>Cosechar Todo</span>
            </button>
            <button
              type="button"
              onClick={() => handleMarkAllIslands('replanted', true)}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              title="Marcar todas las islas como Resembradas"
            >
              <CheckSquare size={12} className="text-amber-400" />
              <span>Resembrar Todo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Tareas y Rutinas */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="font-bold text-slate-200 text-base">No hay tareas con los filtros actuales</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {checklist.length === 0
                ? 'Agrega tus islas de cultivo o tareas de comercio para organizar tu rutina de juego diaria.'
                : 'Has completado todas las tareas o no hay tareas en esta categoría.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> Crear Tarea o Isla
            </button>
          </div>
        ) : (
          filteredList.map((item) => {
            const cityDef = CITIES.find((c) => c.id === item.cityId);
            const itemDef = item.itemId ? ALBION_ITEMS.find((i) => i.id === item.itemId) : null;
            const isDone = isItemComplete(item);

            // RENDER: TAREA LIBRE (Mercado, Transporte, Cocina, etc.)
            if (item.isCustomTask) {
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.completed
                      ? 'border-slate-800/60 bg-slate-900/40 opacity-75'
                      : item.priority === 'high'
                      ? 'border-amber-500/50 bg-slate-900'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleChoreCompleted(item.id)}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        item.completed
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-950 border border-slate-700 hover:border-amber-400 text-transparent'
                      }`}
                      title={item.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                      <Check size={15} className={item.completed ? 'block stroke-[3]' : 'hidden'} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            item.completed ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                        >
                          {item.title}
                        </span>

                        {/* Badge de categoría */}
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                          {getCategoryIcon(item.category)}
                          <span>{getCategoryLabel(item.category)}</span>
                        </span>

                        {/* Badge de Prioridad Alta */}
                        {item.priority === 'high' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5 font-bold">
                            <AlertCircle size={10} /> Alta Prioridad
                          </span>
                        )}

                        {/* Ciudad asociada */}
                        {cityDef && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800"
                            style={{ color: cityDef.color }}
                          >
                            ● {cityDef.name}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p
                          className={`text-xs mt-1 ${
                            item.completed ? 'text-slate-600 line-through' : 'text-slate-400'
                          }`}
                        >
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar tarea"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            }

            // RENDER: RUTINA DE ISLA / COSECHA DE CULTIVO O ANIMALES
            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all space-y-3 ${
                  isDone
                    ? 'border-emerald-900/60 bg-emerald-950/10'
                    : item.priority === 'high'
                    ? 'border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Cabecera de la Isla */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Icono del ítem si existe */}
                    {itemDef ? (
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        <ItemIcon name={itemDef.iconName} size={28} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Wheat size={22} />
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                          {isDone ? (
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Circle size={18} className="text-slate-600 shrink-0" />
                          )}
                          <span>{item.title}</span>
                        </h4>

                        {item.priority === 'high' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                            Prioritaria
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span style={{ color: cityDef?.color }} className="font-semibold">
                          ● {cityDef?.name}
                        </span>
                        <span>•</span>
                        <span>
                          {item.plotsCount} parcelas ({item.plotsCount * 9} casillas)
                        </span>
                        {itemDef && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300 font-medium">
                              T{itemDef.tier} {itemDef.nameEs}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Navegación Rápida */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Botón: Registrar Cosecha en Diario con 1 Clic */}
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToLoggerWithPreset({
                          cityId: item.cityId,
                          itemId: item.itemId,
                          plotsCount: item.plotsCount,
                        })
                      }
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      title="Abrir formulario de Registro Diario con los datos de esta isla"
                    >
                      <span>Registrar en Diario</span>
                      <ArrowRight size={13} />
                    </button>

                    {/* Botón: Iniciar Alarma de 22 Horas (si resembrado) */}
                    <button
                      type="button"
                      onClick={() => handleStartTimerForIsland(item)}
                      className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold p-2 rounded-xl transition-colors cursor-pointer"
                      title="Iniciar temporizador de maduración de 22h para esta isla"
                    >
                      <Clock size={15} className="text-amber-400" />
                    </button>

                    {/* Eliminar Isla */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar de la rutina"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Notas de la isla si las tiene */}
                {item.notes && (
                  <div className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
                    {item.notes}
                  </div>
                )}

                {/* 3 Interruptores Táctiles de Cosecha */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/70">
                  {/* 1. Cosechado */}
                  <button
                    type="button"
                    onClick={() => handleToggleIslandField(item.id, 'harvested')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      item.harvested
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-inner'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {item.harvested ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>✓ Cosechado</span>
                      </>
                    ) : (
                      <>
                        <Circle size={14} className="text-slate-600" />
                        <span>🌾 Cosechar</span>
                      </>
                    )}
                  </button>

                  {/* 2. Resembrado */}
                  <button
                    type="button"
                    onClick={() => handleToggleIslandField(item.id, 'replanted')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      item.replanted
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-inner'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {item.replanted ? (
                      <>
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>✓ Resembrado</span>
                      </>
                    ) : (
                      <>
                        <Circle size={14} className="text-slate-600" />
                        <span>🌱 Resembrar</span>
                      </>
                    )}
                  </button>

                  {/* 3. Regado / Foco */}
                  <button
                    type="button"
                    onClick={() => handleToggleIslandField(item.id, 'usedFocus')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      item.usedFocus
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-inner'
                        : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <Sparkles size={14} className={item.usedFocus ? 'text-amber-400' : 'text-slate-600'} />
                    <span>{item.usedFocus ? '⚡ Regado (Foco)' : 'Sin Foco'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL / PANEL DESPLEGABLE PARA AGREGAR NUEVA TAREA O ISLA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ListTodo className="text-amber-400" size={20} />
                <h3 className="text-base font-bold text-slate-100">
                  Agregar a tu Lista de Cosas por Hacer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selector de Modo: Isla vs Tarea Libre */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddMode('island')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  addMode === 'island'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wheat size={14} />
                <span>Isla de Cultivo / Animales</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode('chore')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  addMode === 'chore'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ClipboardList size={14} />
                <span>Tarea Libre / Comercio</span>
              </button>
            </div>

            {/* FORMULARIO: ISLA DE CULTIVO */}
            {addMode === 'island' && (
              <form onSubmit={handleAddIsland} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nombre de la Isla o Personaje:
                  </label>
                  <input
                    type="text"
                    value={islandTitle}
                    onChange={(e) => setIslandTitle(e.target.value)}
                    placeholder="Ej. Isla Principal - Thetford"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ciudad:</label>
                    <select
                      value={islandCity}
                      onChange={(e) => setIslandCity(e.target.value as CityId)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cultivo / Animal Sembrado:
                    </label>
                    <select
                      value={islandItem}
                      onChange={(e) => setIslandItem(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {ALBION_ITEMS.map((it) => (
                        <option key={it.id} value={it.id}>
                          T{it.tier} {it.nameEs}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cantidad de Parcelas (1-30):
                    </label>
                    <NumericInput
                      value={islandPlots}
                      onChange={(val) => setIslandPlots(Math.max(1, Math.min(30, val)))}
                      min={1}
                      max={30}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Prioridad:</label>
                    <select
                      value={islandPriority}
                      onChange={(e) => setIslandPriority(e.target.value as 'normal' | 'high')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">Alta Prioridad ⭐</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-island-focus"
                    checked={islandUsesFocus}
                    onChange={(e) => setIslandUsesFocus(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 cursor-pointer"
                  />
                  <label htmlFor="chk-island-focus" className="text-slate-300 cursor-pointer">
                    Usar Foco habitualmente en esta isla (estimar gasto de foco)
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Notas o Recordatorio (Opcional):
                  </label>
                  <input
                    type="text"
                    value={islandNotes}
                    onChange={(e) => setIslandNotes(e.target.value)}
                    placeholder="Ej. Guardar excedente de semillas en cofre de gremio"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus size={15} />
                    <span>Guardar Isla</span>
                  </button>
                </div>
              </form>
            )}

            {/* FORMULARIO: TAREA LIBRE / CHORE */}
            {addMode === 'chore' && (
              <form onSubmit={handleAddChore} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Descripción de la Tarea:
                  </label>
                  <input
                    type="text"
                    value={choreTitle}
                    onChange={(e) => setChoreTitle(e.target.value)}
                    placeholder="Ej. Comprar 500 Zanahorias en Martlock para ganado"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Plantillas de un clic */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Plantillas rápidas sugeridas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setChoreTitle('Comprar alimento para ganado en mercado');
                        setChoreCategory('market');
                      }}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      🛒 Comprar Alimento
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChoreTitle('Transportar carnes y hierbas a Caerleon');
                        setChoreCategory('transport');
                        setChoreCity('caerleon');
                        setChorePriority('high');
                      }}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      🐂 Viaje a Caerleon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChoreTitle('Craftear lote de Guisos de Cerdo con bono');
                        setChoreCategory('crafting');
                      }}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      🍲 Craftear Comida
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChoreTitle('Revisar órdenes de venta y recoger plata');
                        setChoreCategory('market');
                      }}
                      className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      💰 Recoger Órdenes
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Categoría:</label>
                    <select
                      value={choreCategory}
                      onChange={(e) => setChoreCategory(e.target.value as TodoTaskCategory)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="market">🛒 Mercado y Compras</option>
                      <option value="transport">🐂 Transporte y Rutas</option>
                      <option value="crafting">🍲 Cocina / Alquimia</option>
                      <option value="custom">📌 Tarea General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Ciudad Relacionada:
                    </label>
                    <select
                      value={choreCity}
                      onChange={(e) => setChoreCity(e.target.value as CityId)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Prioridad:</label>
                  <select
                    value={chorePriority}
                    onChange={(e) => setChorePriority(e.target.value as 'normal' | 'high')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Alta Prioridad ⭐</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Detalles o Notas (Opcional):
                  </label>
                  <input
                    type="text"
                    value={choreNotes}
                    onChange={(e) => setChoreNotes(e.target.value)}
                    placeholder="Ej. Dejar orden con precio mínimo de 290 plata"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus size={15} />
                    <span>Añadir a la Lista</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Plantillas Rápidas de Rutina de Albion */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTemplateModal(false);
          }}
        >
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <BookmarkCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Plantillas de Rutina Habitual de Albion
                  </h3>
                  <p className="text-xs text-slate-400">
                    Añade con un clic las tareas clave para optimizar foco, transporte y mercado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {ALBION_ROUTINE_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3.5 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-slate-900 border border-slate-800">
                        {getCategoryIcon(tpl.category)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {tpl.title}
                      </h4>
                      {tpl.priority === 'high' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Prioridad Alta
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      {tpl.notes}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Añadir</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
