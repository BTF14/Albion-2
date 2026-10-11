import React, { useState } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  X,
  Shield,
  Wifi,
  WifiOff,
  Server,
  Key,
  Globe,
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCloudSync } from '../hooks/useCloudSync';
import { CloudSyncProvider } from '../domain/models/cloudSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { config, updateConfig, state, report, isOnline, syncNow } = useCloudSync();
  const [syncing, setSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setSyncing(true);
    setStatusMessage(null);
    const res = await syncNow();
    setStatusMessage(res.message);
    setSyncing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cloud size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  Sincronización en la Nube
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                  Multidispositivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mantén tus datos sincronizados entre tu PC, móvil y Vercel con arquitectura Local-First.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Tarjeta de Estado Actual */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                {isOnline ? (
                  <Wifi size={18} className="text-emerald-400" />
                ) : (
                  <WifiOff size={18} className="text-rose-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    {report.providerName}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      state === 'synced'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                        : state === 'syncing'
                        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800 animate-pulse'
                        : state === 'offline'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {state === 'synced' ? 'Sincronizado' : state === 'syncing' ? 'Sincronizando...' : state === 'offline' ? 'Offline' : 'Local-First'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Última sincronización: <strong className="text-slate-300">{report.lastSyncFormatted}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                syncing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 active:scale-95'
              }`}
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              <span>Sincronizar</span>
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Opciones de Configuración */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Activar Sincronización en la Nube
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Copia de seguridad en la nube para acceder desde tu móvil o desplegado en Vercel.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {config.enabled && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Proveedor de Nube
                  </label>
                  <select
                    value={config.provider}
                    onChange={(e) => updateConfig({ provider: e.target.value as CloudSyncProvider })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="manual_cloud">Nube Local / Snapshot Mirror (Por Defecto)</option>
                    <option value="firebase">Firebase Firestore (Google Cloud)</option>
                    <option value="supabase">Supabase Cloud (PostgreSQL)</option>
                    <option value="rest_endpoint">API REST Personalizada</option>
                  </select>
                </div>

                {config.provider === 'firebase' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Project ID de Firebase
                    </label>
                    <input
                      type="text"
                      placeholder="mi-proyecto-firebase"
                      value={config.projectId || ''}
                      onChange={(e) => updateConfig({ projectId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                )}

                {config.provider === 'supabase' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      URL del Proyecto Supabase
                    </label>
                    <input
                      type="text"
                      placeholder="https://xyz.supabase.co"
                      value={config.endpointUrl || ''}
                      onChange={(e) => updateConfig({ endpointUrl: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-300">Auto-sincronización en segundo plano:</span>
                  <select
                    value={config.autoSyncIntervalMinutes}
                    onChange={(e) => updateConfig({ autoSyncIntervalMinutes: Number(e.target.value) })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                  >
                    <option value={0}>Solo manual</option>
                    <option value={5}>Cada 5 minutos</option>
                    <option value={15}>Cada 15 minutos</option>
                    <option value={60}>Cada 1 hora</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Información de Despliegue en Vercel */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-200 font-bold">
              <span className="flex items-center gap-1.5">
                <Globe size={14} className="text-cyan-400" />
                <span>Despliegue en Vercel</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                vercel.json listo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              El repositorio incluye <strong className="text-slate-300 font-mono">vercel.json</strong> configurado con reescritura de rutas para SPA, compresión y caché de activos estáticos.
            </p>
            <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded border border-slate-800/80">
              ID de Dispositivo: {config.deviceId}
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
