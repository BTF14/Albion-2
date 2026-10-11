import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  Database,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  FileText,
  ShieldCheck,
  Wheat,
  Coins,
  Users,
  ListTodo,
  Sparkles,
  Info,
  HardDrive,
} from 'lucide-react';
import { useDataBackup } from '../hooks/useDataBackup';
import { CityId } from '../types';
import { ImportMode } from '../domain/models/backup';
import { getStorageUsageReport, StorageUsageReport } from '../utils/storage';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCityId?: CityId;
  totalLogsCount: number;
  totalPricesCount: number;
  totalCharactersCount: number;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  currentCityId,
  totalLogsCount,
  totalPricesCount,
  totalCharactersCount,
}) => {
  const {
    isExporting,
    isImporting,
    validationResult,
    importStatus,
    exportFullBackup,
    inspectBackupFile,
    applyRestore,
    clearStatus,
  } = useDataBackup(currentCityId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupNotes, setBackupNotes] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<ImportMode>('merge');
  const [showConfirmReplace, setShowConfirmReplace] = useState<boolean>(false);

  const storageReport = useMemo<StorageUsageReport>(() => {
    return getStorageUsageReport();
  }, [isOpen, importStatus]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      inspectBackupFile(file);
    }
    // Limpiar input para permitir seleccionar el mismo archivo si se desea reintentar
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleConfirmRestore = () => {
    if (selectedMode === 'replace' && !showConfirmReplace) {
      setShowConfirmReplace(true);
      return;
    }
    setShowConfirmReplace(false);
    applyRestore(selectedMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  Respaldo Completo de Datos
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  JSON v2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exporta y restaura todo tu historial de cosechas, cotizaciones manuales y personajes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearStatus();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Mensaje de Estado / Feedback */}
          {importStatus && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold">{importStatus.message}</p>
              </div>
            </div>
          )}

          {/* Resumen del Estado Local Actual & Salud de Almacenamiento */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-400" />
                <span>Datos Guardados & Salud de Memoria Local</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <HardDrive size={13} className="text-cyan-400" />
                <span>{storageReport.formattedBytes} / ~5.0 MB</span>
              </span>
            </div>

            {/* Barra de Progreso de Cuota de LocalStorage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Capacidad utilizada en este navegador:</span>
                <span className={`font-mono font-bold ${
                  storageReport.isNearQuota
                    ? 'text-rose-400'
                    : storageReport.percentageUsed > 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {storageReport.percentageUsed}% de cuota
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    storageReport.isNearQuota
                      ? 'bg-rose-500'
                      : storageReport.percentageUsed > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(2, storageReport.percentageUsed)}%` }}
                />
              </div>
              {storageReport.isNearQuota && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-950/60 p-2 rounded border border-rose-800/80">
                  <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                  <span>
                    ¡Atención! Tu almacenamiento local supera el 75%. Te recomendamos exportar un respaldo JSON y limpiar registros históricos antiguos.
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1">
              <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Cosechas</span>
                <span className="font-mono text-xs font-bold text-amber-400">{storageReport.entriesCount.logs}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Precios</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{storageReport.entriesCount.prices}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Alts</span>
                <span className="font-mono text-xs font-bold text-sky-400">{storageReport.entriesCount.characters}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Recetas</span>
                <span className="font-mono text-xs font-bold text-purple-400">{storageReport.entriesCount.recipes}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Ledger</span>
                <span className="font-mono text-xs font-bold text-indigo-400">{storageReport.entriesCount.ledger}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/80 p-2 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Almacén</span>
                <span className="font-mono text-xs font-bold text-cyan-400">{storageReport.entriesCount.warehouse}</span>
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: EXPORTAR RESPALDO */}
          <div className="border border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-950/30 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Download size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">1. Descargar Copia de Seguridad (.json)</h3>
                <p className="text-xs text-slate-400">
                  Crea un archivo con todas tus cosechas, precios de mercado guardados, rutinas y personajes.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs text-slate-400 block">Nota opcional para el respaldo (ej. "Precios Caerleon + Alts Martlock"):</label>
              <input
                type="text"
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder="Escribe una nota para identificar este respaldo..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => exportFullBackup(backupNotes)}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/50 disabled:opacity-50"
            >
              <Download size={16} />
              <span>{isExporting ? 'Generando archivo JSON...' : 'Descargar Archivo de Respaldo Completo (.json)'}</span>
            </button>
          </div>

          {/* SECCIÓN 2: IMPORTAR Y RESTAURAR */}
          <div className="border border-slate-800 rounded-xl p-4 sm:p-5 bg-slate-950/30 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Upload size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">2. Restaurar Copia de Seguridad</h3>
                <p className="text-xs text-slate-400">
                  Selecciona un archivo .json exportado previamente para restaurar tu información.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 text-center transition-all cursor-pointer group"
            >
              <Upload size={22} className="mx-auto text-slate-500 group-hover:text-amber-400 mb-1 transition-colors" />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white block">
                Haz clic para seleccionar tu archivo de respaldo (.json)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Compatible con respaldos completos v2 y archivos de cosechas v1
              </span>
            </button>

            {/* Inspección Previa del Archivo Seleccionado */}
            {validationResult && validationResult.isValid && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <FileCheck2 size={16} />
                    <span>Archivo de Respaldo Válido (Versión {validationResult.version})</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {validationResult.data?.exportDateIso
                      ? new Date(validationResult.data.exportDateIso).toLocaleString()
                      : 'Fecha no disponible'}
                  </span>
                </div>

                {validationResult.warning && (
                  <p className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg">
                    ⚠️ {validationResult.warning}
                  </p>
                )}

                {/* Resumen del Contenido del Archivo */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Cosechas</span>
                    <span className="font-mono font-bold text-amber-400">
                      {validationResult.summary.logsCount}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Precios</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {validationResult.summary.pricesCount}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Alts / Personajes</span>
                    <span className="font-mono font-bold text-sky-400">
                      {validationResult.summary.charactersCount}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Ventas Ledger</span>
                    <span className="font-mono font-bold text-red-400">
                      {validationResult.data?.payload?.craftingSalesLedger?.length || 0}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Maestría Destino</span>
                    <span className="font-mono font-bold text-purple-400">
                      {validationResult.summary.hasMastery ? 'Incluida' : 'No'}
                    </span>
                  </div>
                </div>

                {validationResult.data?.metadata?.notes && (
                  <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800">
                    "{validationResult.data.metadata.notes}"
                  </p>
                )}

                {/* Selector de Modo de Restauración */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Elige cómo deseas aplicar los datos del respaldo:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMode('merge');
                        setShowConfirmReplace(false);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedMode === 'merge'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block text-slate-200 flex items-center gap-1.5">
                        <RefreshCw size={12} className="text-amber-400" />
                        <span>Combinar y Fusionar (Recomendado)</span>
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1 leading-relaxed">
                        Agrega los registros y personajes nuevos sin eliminar los que ya tienes guardados en tu navegador.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMode('replace')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedMode === 'replace'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block text-slate-200 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-rose-400" />
                        <span>Reemplazo Total</span>
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1 leading-relaxed">
                        Sobreescribe todos los datos actuales con el contenido exacto de este archivo de respaldo.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirmación adicional para Reemplazo Total */}
                {selectedMode === 'replace' && showConfirmReplace && (
                  <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-200 text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-rose-400" />
                      <span>¿Estás seguro de sobreescribir todos tus datos locales?</span>
                    </p>
                    <p className="text-[11px] text-rose-300">
                      Esta acción reemplazará permanentemente tus cosechas y precios actuales por los del archivo.
                    </p>
                  </div>
                )}

                {/* Botón de Acción Final */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => clearStatus()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 px-3 rounded-xl cursor-pointer"
                  >
                    Cancelar Selección
                  </button>
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleConfirmRestore}
                    className={`text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
                      selectedMode === 'replace'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/50'
                    }`}
                  >
                    <Upload size={14} />
                    <span>
                      {isImporting
                        ? 'Restaurando datos...'
                        : selectedMode === 'replace' && showConfirmReplace
                        ? 'Confirmar Reemplazo Total'
                        : selectedMode === 'replace'
                        ? 'Proceder a Reemplazar'
                        : 'Restaurar y Fusionar Datos'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Info size={13} className="text-slate-500" />
            <span>Tus datos siempre permanecen 100% privados en tu navegador.</span>
          </span>
          <button
            type="button"
            onClick={() => {
              clearStatus();
              onClose();
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
