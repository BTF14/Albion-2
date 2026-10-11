import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DailyLogEntry, CityId, IslandTimer, DailyChecklistItem } from '../types';
import { ALBION_ITEMS, CITIES } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { NumericInput } from './NumericInput';
import { DailyTodoList } from './DailyTodoList';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import {
  loadTimers,
  saveTimers,
  loadChecklist,
  saveChecklist,
} from '../utils/storage';
import { getLocalDateString, parseYMDToLocalDate, formatLongSpanishDate } from '../utils/date';
import { playHarvestChime } from '../utils/audioAlert';
import {
  Calendar as CalendarIcon,
  Clock,
  Timer as TimerIcon,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  Sparkles,
  ListTodo,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  CheckSquare,
} from 'lucide-react';

interface HarvestCalendarProps {
  logs: DailyLogEntry[];
  currentCityId: CityId;
  onNavigateToLoggerWithPreset: (preset: {
    cityId: CityId;
    itemId?: string;
    plotsCount?: number;
    targetDate?: string;
  }) => void;
}

export const HarvestCalendar: React.FC<HarvestCalendarProps> = ({
  logs,
  currentCityId,
  onNavigateToLoggerWithPreset,
}) => {
  // Estado de fecha actual local (timezone safe)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getLocalDateString(today), [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayStr);

  // Estado de temporizadores de maduración de 22 horas
  const [timers, setTimers] = useState<IslandTimer[]>(() => loadTimers());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Alertas de sonido y notificaciones
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('albion_farm_sound_enabled') !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });

  // Registro de timers ya alertados para no sonar repetidamente
  const alertedTimerIdsRef = useRef<Set<string>>(new Set());

  // Estado del checklist diario de islas
  const [checklist, setChecklist] = useState<DailyChecklistItem[]>(() => loadChecklist());

  // Subpestaña activa dentro del módulo de calendario
  const [subTab, setSubTab] = useState<'calendar' | 'timers' | 'checklist'>('calendar');

  // Formulario para crear un nuevo temporizador
  const [showAddTimer, setShowAddTimer] = useState<boolean>(false);
  const [newTimerName, setNewTimerName] = useState<string>('Isla Principal');
  const [newTimerCity, setNewTimerCity] = useState<CityId>(currentCityId);
  const [newTimerItem, setNewTimerItem] = useState<string>('crop_wheat');
  const [newTimerPlots, setNewTimerPlots] = useState<number>(5);
  const [newTimerHours, setNewTimerHours] = useState<number>(22);

  // Formulario para agregar item al checklist
  const [showAddChecklist, setShowAddChecklist] = useState<boolean>(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState<string>('Isla 3 - Brecilien');
  const [newChecklistCity, setNewChecklistCity] = useState<CityId>(currentCityId);
  const [newChecklistPlots, setNewChecklistPlots] = useState<number>(4);

  // Actualizar el reloj cada segundo para los temporizadores
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [notificationWarning, setNotificationWarning] = useState<string | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  // Guardar preferencia de sonido
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('albion_farm_sound_enabled', String(nextVal));
    if (nextVal) {
      playHarvestChime(true);
    }
  };

  // Solicitar permiso de notificaciones del sistema
  const handleToggleNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setNotificationWarning('Tu navegador o el entorno actual no soporta notificaciones de escritorio del sistema.');
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      warningTimeoutRef.current = setTimeout(() => setNotificationWarning(null), 4000);
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    } else if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      } catch {
        setNotificationWarning('No se pudo solicitar el permiso de notificaciones en esta ventana.');
        if (warningTimeoutRef.current) {
          clearTimeout(warningTimeoutRef.current);
        }
        warningTimeoutRef.current = setTimeout(() => setNotificationWarning(null), 4000);
      }
    }
  };

  // Verificar temporizadores finalizados y disparar alertas
  useEffect(() => {
    timers.forEach((timer) => {
      if (currentTime >= timer.targetTime && !alertedTimerIdsRef.current.has(timer.id)) {
        alertedTimerIdsRef.current.add(timer.id);

        // Alerta sonora Web Audio API
        if (soundEnabled) {
          playHarvestChime(true);
        }

        // Notificación de escritorio
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('¡Cosecha Lista en Albion Online! 🌾', {
              body: `${timer.name}: Tus parcelas ya han terminado su ciclo de maduración de ${timer.durationHours}h.`,
            });
          } catch (e) {
            console.warn('Error displaying system notification', e);
          }
        }
      }
    });
  }, [currentTime, timers, soundEnabled]);

  // Guardar temporizadores
  const handleSaveTimers = (newTimers: IslandTimer[]) => {
    setTimers(newTimers);
    saveTimers(newTimers);
  };

  // Guardar checklist
  const handleSaveChecklist = (newChecklist: DailyChecklistItem[]) => {
    setChecklist(newChecklist);
    saveChecklist(newChecklist);
  };

  // Agregar nuevo temporizador
  const handleCreateTimer = () => {
    const now = Date.now();
    const duration = Math.max(1, newTimerHours);
    const newTimer: IslandTimer = {
      id: `timer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newTimerName.trim() || 'Isla de Cultivo',
      cityId: newTimerCity,
      itemId: newTimerItem,
      plotsCount: Math.max(1, newTimerPlots),
      plantedAt: now,
      durationHours: duration,
      targetTime: now + duration * 3600 * 1000,
    };
    const updated = [newTimer, ...timers];
    handleSaveTimers(updated);
    setShowAddTimer(false);
  };

  // Reiniciar temporizador (vuelto a sembrar)
  const handleRestartTimer = (id: string, hours: number = 22) => {
    const now = Date.now();
    alertedTimerIdsRef.current.delete(id); // Permitir nueva alerta cuando vuelva a madurar
    const updated = timers.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          plantedAt: now,
          durationHours: hours,
          targetTime: now + hours * 3600 * 1000,
        };
      }
      return t;
    });
    handleSaveTimers(updated);
  };

  // Eliminar temporizador
  const handleDeleteTimer = (id: string) => {
    alertedTimerIdsRef.current.delete(id);
    const updated = timers.filter((t) => t.id !== id);
    handleSaveTimers(updated);
  };

  // Agregar item al checklist
  const handleAddChecklistItem = () => {
    const newItem: DailyChecklistItem = {
      id: `check_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newChecklistTitle.trim() || 'Nueva Isla',
      cityId: newChecklistCity,
      plotsCount: Math.max(1, newChecklistPlots),
      harvested: false,
      replanted: false,
      usedFocus: false,
    };
    const updated = [...checklist, newItem];
    handleSaveChecklist(updated);
    setShowAddChecklist(false);
    setNewChecklistTitle('');
  };

  // Toggle de un checklist item
  const handleToggleChecklistField = (
    id: string,
    field: 'harvested' | 'replanted' | 'usedFocus'
  ) => {
    const updated = checklist.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: !item[field] };
      }
      return item;
    });
    handleSaveChecklist(updated);
  };

  // Acciones en lote para el checklist (Power User)
  const handleMarkAllChecklist = (field: 'harvested' | 'replanted' | 'usedFocus', value: boolean) => {
    const updated = checklist.map((item) => ({
      ...item,
      [field]: value,
    }));
    handleSaveChecklist(updated);
  };

  // Eliminar item del checklist
  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter((item) => item.id !== id);
    handleSaveChecklist(updated);
  };

  // Reiniciar checklist para un nuevo día
  const handleResetChecklist = () => {
    const updated = checklist.map((item) => ({
      ...item,
      harvested: false,
      replanted: false,
      usedFocus: false,
    }));
    handleSaveChecklist(updated);
  };

  // Agrupación de cosechas por fecha 'YYYY-MM-DD' (Timezone safe)
  const logsByDate = useMemo(() => {
    const map: { [dateStr: string]: DailyLogEntry[] } = {};
    logs.forEach((log) => {
      if (!map[log.dateStr]) {
        map[log.dateStr] = [];
      }
      map[log.dateStr].push(log);
    });
    return map;
  }, [logs]);

  // Días del mes actual para la cuadrícula (100% Timezone Safe)
  const monthDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysCount = lastDay.getDate();
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; dayNumber: number }[] = [];

    // Días del mes previo para rellenar
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, d, 12, 0, 0);
      const dateStr = getLocalDateString(prevDate);
      days.push({
        date: prevDate,
        dateStr,
        isCurrentMonth: false,
        dayNumber: d,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysCount; d++) {
      const curDate = new Date(currentYear, currentMonth, d, 12, 0, 0);
      const dateStr = getLocalDateString(curDate);

      days.push({
        date: curDate,
        dateStr,
        isCurrentMonth: true,
        dayNumber: d,
      });
    }

    // Rellenar hasta múltiplo de 7 (para completar la grilla)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(currentYear, currentMonth + 1, d, 12, 0, 0);
      const dateStr = getLocalDateString(nextDate);
      days.push({
        date: nextDate,
        dateStr,
        isCurrentMonth: false,
        dayNumber: d,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Nombre del mes en español
  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1, 12, 0, 0);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Registros de la fecha seleccionada en el calendario
  const selectedDayLogs = useMemo(() => {
    return logsByDate[selectedDateStr] || [];
  }, [logsByDate, selectedDateStr]);

  // Métricas de la fecha seleccionada
  const selectedDaySummary = useMemo(() => {
    let profit = 0;
    let revenue = 0;
    let costs = 0;
    let focus = 0;

    selectedDayLogs.forEach((l) => {
      profit += l.netProfit || 0;
      revenue += l.netRevenue || 0;
      costs += l.totalCosts || 0;
      focus += l.focusPointsSpent || 0;
    });

    return { profit, revenue, costs, focus, count: selectedDayLogs.length };
  }, [selectedDayLogs]);

  // Métricas de todo el mes visualizado
  const monthSummary = useMemo(() => {
    let monthProfit = 0;
    let monthHarvests = 0;
    const yearMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    logs.forEach((l) => {
      if (l.dateStr && l.dateStr.startsWith(yearMonthStr)) {
        monthProfit += l.netProfit || 0;
        monthHarvests++;
      }
    });

    return { monthProfit, monthHarvests };
  }, [logs, currentYear, currentMonth]);

  // Cuenta de temporizadores listos vs en progreso
  const timersSummary = useMemo(() => {
    let readyCount = 0;
    let runningCount = 0;

    timers.forEach((t) => {
      if (currentTime >= t.targetTime) {
        readyCount++;
      } else {
        runningCount++;
      }
    });

    return { readyCount, runningCount, total: timers.length };
  }, [timers, currentTime]);

  // Resumen del checklist de hoy
  const checklistSummary = useMemo(() => {
    const total = checklist.length;
    const harvestedCount = checklist.filter((i) => i.harvested).length;
    const replantedCount = checklist.filter((i) => i.replanted).length;
    const completedAll = checklist.filter((i) => i.harvested && i.replanted).length;
    const percent = total > 0 ? Math.round((completedAll / total) * 100) : 0;
    return { total, harvestedCount, replantedCount, completedAll, percent };
  }, [checklist]);

  // Actualizar el título de la pestaña con badge dinámico si hay cosechas listas
  useEffect(() => {
    const ready = timersSummary.readyCount;
    if (ready > 0) {
      document.title = `(${ready} 🌾 Listo) Albion Online - Gestor de Cultivos`;
    } else {
      document.title = `Albion Online - Gestor de Cultivos, Hierbas y Ganadería`;
    }
  }, [timersSummary.readyCount]);

  // Función matemática precisa para calcular el progreso de maduración de un temporizador
  const formatTimeRemaining = (timer: IslandTimer) => {
    const diff = timer.targetTime - currentTime;
    if (diff <= 0) {
      const overdue = Math.abs(diff);
      const overdueHours = Math.floor(overdue / (3600 * 1000));
      const overdueMins = Math.floor((overdue % (3600 * 1000)) / (60 * 1000));
      return {
        isReady: true,
        text: overdueHours > 0 ? `Listo hace ${overdueHours}h ${overdueMins}m` : `Listo hace ${overdueMins}m`,
        percent: 100,
      };
    }

    const hours = Math.floor(diff / (3600 * 1000));
    const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    const totalDurationMs = Math.max(1, timer.durationHours || 22) * 3600 * 1000;
    const elapsedMs = Math.max(0, currentTime - timer.plantedAt);
    const percent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));

    return {
      isReady: false,
      text: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`,
      percent,
    };
  };

  // Reloj UTC de Albion en tiempo real
  const albionUtcTimeStr = useMemo(() => {
    const now = new Date(currentTime);
    return `${now.toUTCString().slice(17, 25)} UTC`;
  }, [currentTime]);

  return (
    <div className="space-y-6">
      {/* Barra Superior de Estado: Reloj de Albion Online y Controles */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Hora del Servidor (Albion):</span>
              <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {albionUtcTimeStr}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Hora local: <span className="text-slate-300 font-mono">{new Date(currentTime).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Notificaciones & Alarmas */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Toggle de Sonido Web Audio */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Sonido activado (clic para silenciar)' : 'Sonido silenciado (clic para activar)'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
          </button>

          {/* Toggle de Notificaciones de Escritorio */}
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              notificationsEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Notificaciones de escritorio del navegador"
          >
            {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span>{notificationsEnabled ? 'Alertas ON' : 'Activar Alertas'}</span>
          </button>

          {/* Indicador de Alarmas listas */}
          {timersSummary.readyCount > 0 ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 px-3 py-1.5 rounded-lg font-bold animate-pulse">
              <Sparkles size={14} />
              <span>{timersSummary.readyCount} {timersSummary.readyCount === 1 ? 'isla lista para cosechar' : 'islas listas para cosechar'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-950 text-slate-400 border border-slate-800 px-3 py-1.5 rounded-lg">
              <TimerIcon size={14} className="text-amber-400" />
              <span>{timersSummary.runningCount} en maduración</span>
            </div>
          )}
        </div>
      </div>

      {notificationWarning && (
        <div className="bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-between shadow">
          <span>⚠️ {notificationWarning}</span>
          <button
            type="button"
            onClick={() => setNotificationWarning(null)}
            className="text-amber-400 hover:text-amber-200 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subnavegación del Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'calendar'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CalendarIcon size={16} />
          Calendario Mensual
        </button>

        <button
          type="button"
          onClick={() => setSubTab('timers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer relative ${
            subTab === 'timers'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <TimerIcon size={16} />
          Alarmas de 22 Horas ({timers.length})
          {timersSummary.readyCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'checklist'
              ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ListTodo size={16} />
          Rutina de Islas ({checklistSummary.completedAll}/{checklistSummary.total})
        </button>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: CALENDARIO MENSUAL                             */}
      {/* ======================================================== */}
      {subTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cuadrícula del Calendario (2 columnas) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            {/* Header del Calendario: Mes, Año y Controles */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-100 capitalize">
                  {monthName}
                </h3>
                <p className="text-xs text-slate-400">
                  {monthSummary.monthHarvests} cosechas registradas •{' '}
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      monthSummary.monthProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {monthSummary.monthProfit >= 0 ? '+' : ''}
                    {formatSilver(monthSummary.monthProfit)}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear((y) => y - 1);
                    } else {
                      setCurrentMonth((m) => m - 1);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Mes anterior"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentYear(today.getFullYear());
                    setCurrentMonth(today.getMonth());
                    setSelectedDateStr(todayStr);
                  }}
                  className="px-2.5 py-1 text-xs text-amber-400 hover:bg-slate-800 rounded font-semibold transition-colors cursor-pointer"
                >
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear((y) => y + 1);
                    } else {
                      setCurrentMonth((m) => m + 1);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Mes siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Cabecera de días de la semana (Lunes a Domingo) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div className="text-amber-400/80">Sáb</div>
              <div className="text-amber-400/80">Dom</div>
            </div>

            {/* Celdas de días */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((dayObj, idx) => {
                const isSelected = dayObj.dateStr === selectedDateStr;
                const isToday = dayObj.dateStr === todayStr;
                const dayLogs = logsByDate[dayObj.dateStr] || [];
                const dayProfit = dayLogs.reduce((acc, cur) => acc + (cur.netProfit || 0), 0);
                const hasLogs = dayLogs.length > 0;

                return (
                  <button
                    key={`${dayObj.dateStr}_${idx}`}
                    type="button"
                    onClick={() => setSelectedDateStr(dayObj.dateStr)}
                    className={`min-h-[72px] sm:min-h-[82px] p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-400/50'
                        : dayObj.isCurrentMonth
                        ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                        : 'border-slate-800/40 bg-slate-950/20 text-slate-600 hover:border-slate-800'
                    }`}
                  >
                    {/* Número del día */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-mono font-bold rounded px-1 ${
                          isToday
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : dayObj.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {dayObj.dayNumber}
                      </span>

                      {hasLogs && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded-full font-mono">
                          {dayLogs.length}
                        </span>
                      )}
                    </div>

                    {/* Indicador de ganancia o pérdida del día */}
                    {hasLogs ? (
                      <div className="mt-1">
                        <div
                          className={`text-[10px] sm:text-xs font-mono font-black truncate ${
                            dayProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {dayProfit >= 0 ? '+' : ''}
                          {Math.abs(dayProfit) >= 1000000
                            ? `${(dayProfit / 1000000).toFixed(1)}M`
                            : Math.abs(dayProfit) >= 1000
                            ? `${(dayProfit / 1000).toFixed(0)}k`
                            : dayProfit}
                        </div>

                        {/* Mini iconos de los primeros 2 items */}
                        <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                          {dayLogs.slice(0, 2).map((l) => (
                            <div
                              key={l.id}
                              className="w-4 h-4 rounded bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0"
                              title={`${l.itemName}: ${l.netProfit.toLocaleString()} plata`}
                            >
                              <ItemIcon
                                name={ALBION_ITEMS.find((i) => i.id === l.itemId)?.iconName || 'Wheat'}
                                size={12}
                              />
                            </div>
                          ))}
                          {dayLogs.length > 2 && (
                            <span className="text-[9px] text-slate-500 font-mono">
                              +{dayLogs.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-700 italic">Sin datos</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Lateral: Detalle del Día Seleccionado (1 columna) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                  Detalle de la Jornada
                </span>
                <h4 className="text-base font-bold text-slate-100 mt-0.5 capitalize">
                  {formatLongSpanishDate(selectedDateStr)}
                </h4>
                {selectedDateStr === todayStr && (
                  <span className="inline-block mt-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    Día Actual
                  </span>
                )}
              </div>

              {/* Resumen del Día Seleccionado */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Ganancia Neta:</div>
                  <div
                    className={`text-sm sm:text-base font-mono tabular-nums font-bold ${
                      selectedDaySummary.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {selectedDaySummary.profit >= 0 ? '+' : ''}
                    {formatSilver(selectedDaySummary.profit)}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">Foco Usado:</div>
                  <div className="text-sm sm:text-base font-mono tabular-nums font-bold text-amber-400">
                    {selectedDaySummary.focus.toLocaleString()} pts
                  </div>
                </div>
              </div>

              {/* Lista de Registros del Día */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>Cosechas del Día:</span>
                  <span className="text-slate-500 font-mono tabular-nums text-[11px]">
                    {selectedDaySummary.count} {selectedDaySummary.count === 1 ? 'registro' : 'registros'}
                  </span>
                </div>

                {selectedDayLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {selectedDayLogs.map((log) => {
                      const itemDef = ALBION_ITEMS.find((i) => i.id === log.itemId);
                      const cityDef = CITIES.find((c) => c.id === log.cityId);
                      return (
                        <div
                          key={log.id}
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <ItemIcon name={itemDef?.iconName || 'Wheat'} size={20} />
                            <div>
                              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                <span>{log.itemName}</span>
                                <AlbionItemBadge tier={log.tier} size="xs" />
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono tabular-nums">
                                <span style={{ color: cityDef?.color }}>{cityDef?.name}</span>
                                <span>• {log.plotsCount} parcelas</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono tabular-nums">
                            <div
                              className={`font-bold ${
                                log.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {log.netProfit >= 0 ? '+' : ''}
                              {formatSilver(log.netProfit)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {log.usedFocus ? `${log.silverPerFocus} S/Foc` : 'Sin foco'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500">
                    No registraste cosechas en esta fecha.
                  </div>
                )}
              </div>
            </div>

            {/* Botón para registrar cosecha en la fecha seleccionada */}
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() =>
                  onNavigateToLoggerWithPreset({
                    cityId: currentCityId,
                    targetDate: selectedDateStr,
                  })
                }
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
              >
                <Plus size={15} />
                Registrar Cosecha en esta Fecha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: TEMPORIZADORES DE 22 HORAS (ALARMAS DE ISLA)   */}
      {/* ======================================================== */}
      {subTab === 'timers' && (
        <div className="space-y-4">
          {/* Header con botón para nueva alarma */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <TimerIcon size={18} className="text-amber-400" />
                Temporizadores de Ciclo de Maduración (22 Horas)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                En Albion Online con cuenta Premium, los cultivos y crías de animales tardan exactamente 22 horas en madurar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTimer(!showAddTimer)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus size={15} />
              {showAddTimer ? 'Cancelar' : 'Nuevo Temporizador'}
            </button>
          </div>

          {/* Formulario para agregar temporizador */}
          {showAddTimer && (
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 space-y-4">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Configurar Alarma de Maduración
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre / Identificador:</label>
                  <input
                    type="text"
                    value={newTimerName}
                    onChange={(e) => setNewTimerName(e.target.value)}
                    placeholder="Ej. Isla Principal Trigo"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ciudad / Isla:</label>
                  <select
                    value={newTimerCity}
                    onChange={(e) => setNewTimerCity(e.target.value as CityId)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  >
                    {CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cultivo o Animal:</label>
                  <select
                    value={newTimerItem}
                    onChange={(e) => setNewTimerItem(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  >
                    {ALBION_ITEMS.map((item) => (
                      <option key={item.id} value={item.id}>
                        T{item.tier} - {item.nameEs}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Número de Parcelas:</label>
                  <NumericInput
                    value={newTimerPlots}
                    onChange={(val) => setNewTimerPlots(Math.max(1, Math.min(30, val)))}
                    min={1}
                    max={30}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* Presets de Horas */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Duración:</span>
                  <button
                    type="button"
                    onClick={() => setNewTimerHours(22)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      newTimerHours === 22
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    22h (Premium estándar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTimerHours(44)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      newTimerHours === 44
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    44h (Crías sin foco)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCreateTimer}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow"
                >
                  <Sparkles size={14} />
                  Activar Temporizador
                </button>
              </div>
            </div>
          )}

          {/* Lista de Temporizadores Activos */}
          {timers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timers.map((timer) => {
                const itemDef = ALBION_ITEMS.find((i) => i.id === timer.itemId);
                const cityDef = CITIES.find((c) => c.id === timer.cityId);
                const timeInfo = formatTimeRemaining(timer);
                const targetDate = new Date(timer.targetTime);

                return (
                  <div
                    key={timer.id}
                    className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                      timeInfo.isReady
                        ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                        : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Cabecera del Timer */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <ItemIcon name={itemDef?.iconName || 'Wheat'} size={24} />
                          <div>
                            <h4 className="font-bold text-sm text-slate-100">{timer.name}</h4>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span style={{ color: cityDef?.color }}>● {cityDef?.name}</span>
                              <span>• {timer.plotsCount} parcelas</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteTimer(timer.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title="Eliminar temporizador"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Contador en Tiempo Real */}
                      <div className="my-3 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Estado:</span>
                          <span
                            className={`font-mono font-bold ${
                              timeInfo.isReady ? 'text-emerald-400 flex items-center gap-1' : 'text-amber-400'
                            }`}
                          >
                            {timeInfo.isReady && <Sparkles size={13} className="animate-spin" />}
                            {timeInfo.text}
                          </span>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full transition-all duration-1000 ${
                              timeInfo.isReady
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : 'bg-gradient-to-r from-amber-600 to-amber-400'
                            }`}
                            style={{ width: `${timeInfo.percent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 font-mono">
                          <span>Sembrado: {new Date(timer.plantedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span>Listo: {targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800 mt-2">
                      {timeInfo.isReady ? (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToLoggerWithPreset({
                              cityId: timer.cityId,
                              itemId: timer.itemId,
                              plotsCount: timer.plotsCount,
                              targetDate: getLocalDateString(new Date(timer.targetTime)),
                            })
                          }
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                        >
                          <Sparkles size={14} />
                          Cosechar & Registrar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToLoggerWithPreset({
                              cityId: timer.cityId,
                              itemId: timer.itemId,
                              plotsCount: timer.plotsCount,
                              targetDate: todayStr,
                            })
                          }
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          Registrar Cosecha
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRestartTimer(timer.id, timer.durationHours)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg text-xs transition-colors cursor-pointer"
                        title="Reiniciar ciclo de 22h tras volver a sembrar"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <TimerIcon size={24} />
              </div>
              <h4 className="font-bold text-slate-200">No tienes alarmas de cultivo activas</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Crea una alarma al terminar de sembrar en tus parcelas. Te avisará automáticamente cuando se cumplan las 22 horas para que no pierdas ni un minuto de producción.
              </p>
              <button
                type="button"
                onClick={() => setShowAddTimer(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                <Plus size={15} /> Crear Primer Temporizador
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: CHECKLIST Y RUTINA DIARIA DE ISLAS             */}
      {/* ======================================================== */}
      {subTab === 'checklist' && (
        <DailyTodoList
          checklist={checklist}
          onSaveChecklist={handleSaveChecklist}
          currentCityId={currentCityId}
          onNavigateToLoggerWithPreset={onNavigateToLoggerWithPreset}
          onNavigateToCalendar={() => setSubTab('timers')}
        />
      )}
    </div>
  );
};
