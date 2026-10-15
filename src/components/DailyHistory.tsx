import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyLogEntry, CategoryType, CityId } from '../types';
import { CITIES, ALBION_ITEMS } from '../data/items';
import { ItemIcon } from './ItemIcon';
import {
  History,
  TrendingUp,
  TrendingDown,
  Trash2,
  Download,
  Upload,
  Calendar,
  Filter,
  Zap,
  Wheat,
  Sprout,
  Egg,
  Beef,
  AlertTriangle,
  Check,
  X,
  Award,
  FileText,
  Database,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CsvExportModal } from './CsvExportModal';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface Props {
  logs: DailyLogEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onLoadSampleData: () => void;
  onImportLogs?: (importedLogs: DailyLogEntry[]) => void;
  onOpenBackupModal?: () => void;
}

export const DailyHistory: React.FC<Props> = ({
  logs,
  onDeleteEntry,
  onClearAll,
  onLoadSampleData,
  onImportLogs,
  onOpenBackupModal,
}) => {
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lista de personajes únicos presentes en los registros
  const charactersInLogs = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => {
      if (l.characterId && l.characterName) {
        map.set(l.characterId, l.characterName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  // Desglose de ganancias por personaje (Alts Breakdown)
  const characterBreakdown = useMemo(() => {
    const stats: Record<string, { name: string; totalProfit: number; harvestsCount: number }> = {};
    logs.forEach((l) => {
      const charId = l.characterId || 'unassigned';
      const charName = l.characterName || 'Sin Personaje Asignado';
      if (!stats[charId]) {
        stats[charId] = { name: charName, totalProfit: 0, harvestsCount: 0 };
      }
      stats[charId].totalProfit += l.netProfit || 0;
      stats[charId].harvestsCount += 1;
    });
    return Object.entries(stats).map(([id, data]) => ({ id, ...data }));
  }, [logs]);

  // Estados de confirmación dentro de la app (seguros para iframe)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);

  // Referencia para selector de archivo JSON y feedback de importación
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const importTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (importTimeoutRef.current) {
        clearTimeout(importTimeoutRef.current);
      }
    };
  }, []);

  // Filtrado de logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedCityFilter !== 'all' && log.cityId !== selectedCityFilter) return false;
      if (selectedCategoryFilter !== 'all' && log.category !== selectedCategoryFilter) return false;
      if (selectedCharacterFilter !== 'all') {
        if (selectedCharacterFilter === 'unassigned') {
          if (log.characterId) return false;
        } else if (log.characterId !== selectedCharacterFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (log.itemName || '').toLowerCase().includes(query);
        const matchesNotes = (log.notes || '').toLowerCase().includes(query);
        if (!matchesName && !matchesNotes) return false;
      }
      return true;
    });
  }, [logs, selectedCityFilter, selectedCategoryFilter, selectedCharacterFilter, searchQuery]);

  // Paginación defensiva (20 registros por página)
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reiniciar a página 1 si cambian los filtros o la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCityFilter, selectedCategoryFilter, selectedCharacterFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Totales acumulados
  const summary = useMemo(() => {
    let totalProfit = 0;
    let totalRevenue = 0;
    let totalCosts = 0;
    let totalFocusSpent = 0;
    let totalFocusProfit = 0;

    filteredLogs.forEach((log) => {
      totalProfit += log.netProfit || 0;
      totalRevenue += log.netRevenue || 0;
      totalCosts += log.totalCosts || 0;
      if (log.usedFocus && log.focusPointsSpent && log.focusPointsSpent > 0) {
        totalFocusSpent += log.focusPointsSpent;
        totalFocusProfit += log.netProfit || 0;
      }
    });

    const avgSilverPerFocus =
      totalFocusSpent > 0 ? Number((totalFocusProfit / totalFocusSpent).toFixed(1)) : 0;

    return {
      count: filteredLogs.length,
      totalProfit,
      totalRevenue,
      totalCosts,
      avgSilverPerFocus,
      isPositive: totalProfit >= 0,
    };
  }, [filteredLogs]);

  // Exportar Copia de Seguridad completa en JSON
  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const backupData = {
      app: 'Albion Farming Profit Tracker',
      version: 1,
      exportDate: new Date().toISOString(),
      logsCount: logs.length,
      logs,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `albion_farm_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Importar Copia de Seguridad JSON
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        const importedList = Array.isArray(parsed)
          ? parsed
          : (parsed?.payload?.logs || parsed?.logs);

        if (!Array.isArray(importedList) || importedList.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'El archivo JSON no contiene registros de cosechas válidos.',
          });
          return;
        }

        const validEntries: DailyLogEntry[] = importedList.filter(
          (item: unknown): item is DailyLogEntry =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'itemId' in item &&
            'dateStr' in item
        );

        if (validEntries.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'No se encontraron registros compatibles con el formato de la aplicación.',
          });
          return;
        }

        if (onImportLogs) {
          // Fusionar sin duplicar por ID, preservando el historial existente
          const existingIds = new Set(logs.map((l) => l.id));
          const newEntries = validEntries.filter((v) => !existingIds.has(v.id));
          const merged = [...newEntries, ...logs];
          onImportLogs(merged);
          setImportStatus({
            type: 'success',
            message: `¡Copia de seguridad importada! Se cargaron ${validEntries.length} registros (${newEntries.length} nuevos agregados a tu historial).`,
          });
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Error al procesar el archivo JSON. Asegúrate de seleccionar un archivo válido.',
        });
      } finally {
        if (e.target) e.target.value = '';
        if (importTimeoutRef.current) {
          clearTimeout(importTimeoutRef.current);
        }
        importTimeoutRef.current = setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const getCityName = (cityId: CityId) => {
    const found = CITIES.find((c) => c.id === cityId);
    return found ? found.name : cityId;
  };

  const getCategoryBadge = (cat: CategoryType) => {
    switch (cat) {
      case 'crop':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            <Wheat size={12} /> Cultivo
          </span>
        );
      case 'herb':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
            <Sprout size={12} /> Hierba
          </span>
        );
      case 'animal_produce':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
            <Egg size={12} /> Huevos/Leche
          </span>
        );
      case 'animal_meat':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
            <Beef size={12} /> Matanza
          </span>
        );
      case 'distillate':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            Destilado
          </span>
        );
      case 'special_ingredient':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
            Ingrediente Especial
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="daily-history-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="text-amber-400" size={24} />
            Historial de Cosechas & Balance Acumulado
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico persistente guardado en tu navegador para auditar tu rendimiento a lo largo del tiempo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Input oculto para carga de archivo JSON */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={handleFileSelected}
          />

          {logs.length > 0 && (
            <>
              <button
                type="button"
                id="btn-export-csv"
                onClick={() => setIsCsvModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 transition-colors cursor-pointer shadow-sm"
                title="Abrir exportador profesional a CSV / Excel con delimitador y filtros"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" /> Exportar CSV / Excel
              </button>

              <button
                type="button"
                id="btn-export-json"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Crear copia rápida de cosechas en formato JSON"
              >
                <FileText size={14} /> JSON Cosechas
              </button>
            </>
          )}

          {onOpenBackupModal && (
            <button
              type="button"
              id="btn-full-backup-modal"
              onClick={onOpenBackupModal}
              className="flex items-center gap-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-500/40 transition-colors cursor-pointer shadow-sm"
              title="Abrir gestor completo de exportación y restauración (Cosechas, Precios, Alts y Maestría)"
            >
              <Database size={14} className="text-emerald-400" /> Respaldo Completo v2
            </button>
          )}

          <button
            type="button"
            id="btn-import-json"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Restaurar cosechas desde un archivo JSON previo"
          >
            <Upload size={14} /> Restaurar JSON
          </button>

          {logs.length > 0 && (
            <button
              type="button"
              id="btn-clear-all-trigger"
              onClick={() => setShowClearAllConfirm(true)}
              className="flex items-center gap-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-rose-900/70 transition-colors cursor-pointer"
              title="Limpiar todo el historial"
            >
              <Trash2 size={14} /> Borrar Todo
            </button>
          )}
        </div>
      </div>

      {/* Banner de Feedback de Importación */}
      {importStatus && (
        <div
          className={`mb-5 p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            importStatus.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {importStatus.type === 'success' ? (
              <Check size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportStatus(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modal/Banner de Confirmación de Borrado Total (Seguro para iframes) */}
      {showClearAllConfirm && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/90 border border-rose-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-rose-200 text-xs">
            <AlertTriangle size={20} className="text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block text-sm">¿Confirmar eliminación de todo el historial?</span>
              Se borrarán permanentemente las {logs.length} cosechas registradas.
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                setShowClearAllConfirm(false);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Sí, borrar todo
            </button>
            <button
              type="button"
              onClick={() => setShowClearAllConfirm(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas de Resumen Acumulado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Ganancia Neta Total:</div>
          <div
            className={`text-xl font-black font-mono tabular-nums mt-1 ${
              summary.isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.isPositive ? '+' : ''}
            {formatSilver(summary.totalProfit)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
            {summary.count} registros filtrados
          </div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Ingresos Netos:</div>
          <div className="text-xl font-black font-mono tabular-nums text-slate-100 mt-1">
            {formatSilver(summary.totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Venta libre de impuestos</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Costos Totales:</div>
          <div className="text-xl font-black font-mono tabular-nums text-amber-400 mt-1">
            -{formatSilver(summary.totalCosts)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recompra + Comida</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Plata / Foco Promedio:</div>
          <div className="text-xl font-black font-mono tabular-nums text-amber-300 mt-1">
            {summary.avgSilverPerFocus}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Eficiencia de foco invertido</div>
        </div>
      </div>

      {/* Desglose de Ganancias por Personaje (Alts Breakdown) */}
      {characterBreakdown.length > 0 && (
        <div className="mb-5 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>👤</span> Desglose por Personaje (Alts):
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {characterBreakdown.length} perfil(es) con cosechas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {characterBreakdown.map((char) => {
              const isSelected = selectedCharacterFilter === char.id;
              const isPositive = char.totalProfit >= 0;
              return (
                <button
                  type="button"
                  key={char.id}
                  onClick={() => setSelectedCharacterFilter(isSelected ? 'all' : char.id)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 truncate">{char.name}</span>
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {char.harvestsCount} reg.
                    </span>
                  </div>
                  <div
                    className={`text-xs font-black font-mono tabular-nums mt-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {formatSilver(char.totalProfit)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between mb-5">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <Filter size={14} /> Filtros:
          </span>

          {/* Filtro Personaje / Alt */}
          <select
            value={selectedCharacterFilter}
            onChange={(e) => setSelectedCharacterFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los Personajes</option>
            {charactersInLogs.map((char) => (
              <option key={char.id} value={char.id}>
                👤 {char.name}
              </option>
            ))}
            <option value="unassigned">Sin Personaje Asignado</option>
          </select>

          {/* Filtro Ciudad */}
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las Islas</option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Filtro Categoría */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las Categorías</option>
            <option value="crop">🌾 Cultivos</option>
            <option value="herb">🌿 Hierbas</option>
            <option value="animal_produce">🥚 Huevos & Leche</option>
            <option value="animal_meat">🥩 Matanza (Carne)</option>
          </select>
        </div>

        {/* Buscador */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Buscar por cultivo, nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Lista de Registros */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
          <p className="text-slate-400 text-sm font-medium">
            {logs.length === 0
              ? 'Aún no tienes cosechas registradas.'
              : 'No hay cosechas que coincidan con los filtros seleccionados.'}
          </p>
          {logs.length === 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onLoadSampleData}
                className="inline-flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Upload size={14} /> Cargar datos de prueba de ejemplo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                <Database size={14} /> Restaurar Copia de Seguridad JSON
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedLogs.map((log) => {
            const itemDef = ALBION_ITEMS.find((i) => i.id === log.itemId);
            const isProfit = log.netProfit >= 0;
            const isPendingDelete = pendingDeleteId === log.id;

            return (
              <div
                key={log.id}
                className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all duration-150"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Columna izquierda: Icono, Nombre, Ciudad y badges */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                      <ItemIcon name={itemDef?.iconName || 'Package'} size={22} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{log.itemName}</span>
                        <AlbionItemBadge tier={log.tier} size="xs" />
                        {getCategoryBadge(log.category)}
                        <span className="text-xs text-slate-400 font-mono">
                          📍 {getCityName(log.cityId)}
                        </span>
                        {log.characterName && (
                          <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            👤 {log.characterName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono tabular-nums">
                        <span>📅 {log.dateStr}</span>
                        <span>• {log.plotsCount} parcelas ({log.slotsCount} slots)</span>
                        {log.usedFocus && (
                          <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                            <Zap size={12} className="fill-amber-400" />
                            {log.silverPerFocus} Silv/Foco
                          </span>
                        )}
                      </div>

                      {/* Excedente de semillas en cosecha */}
                      {log.surplusSeedsCount && log.surplusSeedsCount > 0 ? (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 inline-flex font-mono tabular-nums">
                          <Award size={12} />
                          +{log.surplusSeedsCount} semillas excedentes ({log.surplusSeedsRevenue ? `+${formatSilver(log.surplusSeedsRevenue)}` : 'guardadas'})
                        </div>
                      ) : null}

                      {log.notes && (
                        <p className="text-xs text-slate-400 italic mt-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/60 inline-block">
                          Nota: {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Columna derecha: Desglose numérico, Ganancia y botón de borrado seguro */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800/60">
                    <div className="text-xs font-mono tabular-nums space-y-0.5 text-right">
                      <div className="text-slate-400">
                        Cosechado: <strong className="text-slate-200">{log.harvestedAmount}</strong> @ {formatSilver(log.productUnitPrice)}
                      </div>
                      <div className="text-slate-400">
                        Recompradas: <strong className="text-rose-400">{log.reboughtSeedsOrBabies}</strong> (-{formatSilver(log.seedsRebuyCost)})
                      </div>
                      {log.foodCost > 0 && (
                        <div className="text-amber-400">
                          Comida: -{formatSilver(log.foodCost)}
                        </div>
                      )}
                    </div>

                    {/* Badge de Beneficio Neto */}
                    <div className="text-right">
                      <div
                        className={`text-lg font-black font-mono tabular-nums ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}
                        {formatSilver(log.netProfit)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {formatSilver(log.profitPerSlot)} / slot
                      </div>
                    </div>

                    {/* Confirmación inline para eliminar este registro específico */}
                    {isPendingDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/80 p-1 rounded-lg border border-rose-700">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteEntry(log.id);
                            setPendingDeleteId(null);
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="text-slate-400 hover:text-slate-200 p-1 rounded cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(log.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                        title="Eliminar este registro"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Barra de Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">
                Mostrando <strong className="text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> a{' '}
                <strong className="text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)}</strong> de{' '}
                <strong className="text-amber-400">{filteredLogs.length}</strong> registros
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Anterior</span>
                </button>

                <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Exportador a CSV / Excel */}
      <CsvExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        logs={logs}
        filteredLogs={filteredLogs}
        currentCityFilter={selectedCityFilter}
        currentCategoryFilter={selectedCategoryFilter}
      />
    </div>
  );
};
