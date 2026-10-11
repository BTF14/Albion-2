import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DailyLogEntry } from '../types';
import { CITIES } from '../data/items';
import { exportHistoryToCsv } from '../domain/use-cases/exportHistoryToCsv';
import {
  FileSpreadsheet,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Settings2,
  FileText,
} from 'lucide-react';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DailyLogEntry[];
  filteredLogs: DailyLogEntry[];
  currentCityFilter: string;
  currentCategoryFilter: string;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  logs,
  filteredLogs,
  currentCityFilter,
  currentCategoryFilter,
}) => {
  const [scope, setScope] = useState<'filtered' | 'all'>(
    filteredLogs.length !== logs.length ? 'filtered' : 'all'
  );
  const [delimiter, setDelimiter] = useState<';' | ','>(';');
  const [includeSummary, setIncludeSummary] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Limpieza defensiva de timers al desmontar o al cerrar
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Soporte accesible para cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const cityName = useMemo(() => {
    if (currentCityFilter === 'all') return 'Todas las ciudades';
    return CITIES.find((c) => c.id === currentCityFilter)?.name || currentCityFilter;
  }, [currentCityFilter]);

  const categoryName = useMemo(() => {
    if (currentCategoryFilter === 'all') return 'Todas las categorías';
    if (currentCategoryFilter === 'crop') return 'Cultivos agrícolas';
    if (currentCategoryFilter === 'herb') return 'Hierbas de alquimia';
    if (currentCategoryFilter === 'animal_produce') return 'Productos de granja';
    if (currentCategoryFilter === 'animal_meat') return 'Carne y ganadería';
    return currentCategoryFilter;
  }, [currentCategoryFilter]);

  const targetLogs = scope === 'filtered' ? filteredLogs : logs;

  // Generar resultado de exportación
  const exportResult = useMemo(() => {
    return exportHistoryToCsv(targetLogs, {
      delimiter,
      includeSummary,
      exportFilteredOnly: scope === 'filtered',
      filterMeta: {
        cityName,
        categoryName,
        totalEntriesCount: targetLogs.length,
      },
    });
  }, [targetLogs, delimiter, includeSummary, scope, cityName, categoryName]);

  // Vista previa de las primeras líneas
  const previewLines = useMemo(() => {
    return exportResult.csvString
      .replace(/^\uFEFF/, '') // Quitar BOM para la vista previa
      .split('\r\n')
      .slice(0, 4)
      .join('\n');
  }, [exportResult.csvString]);

  const handleDownload = () => {
    if (targetLogs.length === 0) return;

    const blob = new Blob([exportResult.csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportResult.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div
      id="csv-export-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-export-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="csv-export-modal-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2
                id="csv-export-modal-title"
                className="text-base font-black text-slate-100 flex items-center gap-2"
              >
                <span>Exportar Historial a CSV / Excel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  .CSV Nativo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Descarga compatible con Microsoft Excel, Google Sheets y LibreOffice.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-csv-modal"
            onClick={onClose}
            aria-label="Cerrar modal de exportación"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Selector de Alcance */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Filter size={14} className="text-amber-400" />
              <span>Alcance de los Registros:</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-csv-scope-filtered"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scope === 'filtered'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Filtros Actuales</span>
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-900">
                    {filteredLogs.length}
                  </span>
                </div>
                <span className="text-[11px] opacity-80 block truncate">
                  {cityName} • {categoryName}
                </span>
              </button>

              <button
                type="button"
                id="btn-csv-scope-all"
                onClick={() => setScope('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Historial Completo</span>
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-900">
                    {logs.length}
                  </span>
                </div>
                <span className="text-[11px] opacity-80 block truncate">
                  Todas las cosechas registradas
                </span>
              </button>
            </div>
          </div>

          {/* Formato / Delimitador */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Settings2 size={14} className="text-emerald-400" />
              <span>Separador de Columnas (Delimitador):</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-csv-delim-semicolon"
                onClick={() => setDelimiter(';')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  delimiter === ';'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold text-xs block">Punto y coma ( ; )</span>
                <span className="text-[10px] opacity-80 block">
                  Recomendado para Excel en Español
                </span>
              </button>

              <button
                type="button"
                id="btn-csv-delim-comma"
                onClick={() => setDelimiter(',')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  delimiter === ','
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold text-xs block">Coma estándar ( , )</span>
                <span className="text-[10px] opacity-80 block">
                  Google Sheets / LibreOffice / Inglés
                </span>
              </button>
            </div>
          </div>

          {/* Opciones Adicionales */}
          <div className="space-y-2 pt-1">
            <label
              htmlFor="chk-csv-summary"
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <input
                type="checkbox"
                id="chk-csv-summary"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-200 block">
                  Incluir Fila de Totales y Balance Acumulado al final
                </span>
                <span className="text-slate-400 text-[11px]">
                  Agrega una fila con sumatoria de cosechas, costos de semillas, impuestos, ganancia neta y plata/foco.
                </span>
              </div>
            </label>
          </div>

          {/* Blindaje de Seguridad Cloudflare */}
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200/90">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-emerald-300">
                Blindaje Anti-Inyección de Fórmulas (CSV Injection Defense)
              </span>
              <span className="opacity-90 text-[11px] leading-relaxed">
                Todas las celdas de texto con caracteres ejecutables (=, +, -, @) se sanitizan automáticamente para proteger tu equipo al abrir el archivo en Excel o Google Sheets.
              </span>
            </div>
          </div>

          {/* Vista Previa */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <FileText size={12} />
              <span>Vista previa de estructura (primeras columnas):</span>
            </span>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
              {previewLines}
            </div>
          </div>
        </div>

        {/* Footer Modal con Botón de Descarga */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Total a exportar: </span>
            <span className="font-mono font-bold text-slate-200">
              {targetLogs.length} {targetLogs.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-cancel-csv"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="btn-download-csv"
              onClick={handleDownload}
              disabled={targetLogs.length === 0}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : targetLogs.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>¡Descarga Iniciada!</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Descargar .CSV</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
