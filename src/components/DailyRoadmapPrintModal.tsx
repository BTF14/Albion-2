import React from 'react';
import {
  Printer,
  X,
  Calendar,
  CheckSquare,
  Zap,
  Wheat,
  Download,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DailyLogEntry, DailyChecklistItem, CityId } from '../types';
import { formatSilver } from '../utils/albionColors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: DailyLogEntry[];
  checklist: DailyChecklistItem[];
  activeCharacterName?: string;
  activeCharacterFocus?: number;
  currentCityName?: string;
}

export const DailyRoadmapPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  logs,
  checklist,
  activeCharacterName = 'Principal',
  activeCharacterFocus = 10000,
  currentCityName = 'Martlock',
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendingTasks = checklist.filter((t) => (t.isCustomTask ? !t.completed : !(t.harvested && t.replanted)));
  const totalNetProfitToday = logs.reduce((sum, l) => sum + (l.netProfit || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                Hoja de Ruta Diaria (Itinerario Imprimible / PDF)
              </h2>
              <p className="text-xs text-slate-400">
                Resumen ejecutivo de tu jornada para consultar en una segunda pantalla o imprimir en PDF.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <Printer size={14} />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Documento Imprimible */}
        <div className="p-6 sm:p-8 space-y-6 bg-slate-950 text-slate-100 print:bg-white print:text-black print:p-0">
          {/* Encabezado del Informe */}
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                Albion Online • Farming & Economy Roadmap
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 capitalize mt-0.5">
                {todayStr}
              </h1>
              <div className="text-xs text-slate-400 mt-1">
                Personaje: <strong className="text-slate-200">{activeCharacterName}</strong> • Ciudad Base: <strong className="text-slate-200">{currentCityName}</strong>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-right sm:self-auto">
              <span className="text-[10px] text-slate-400 block">Balance Neto del Día</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                +{formatSilver(totalNetProfitToday)} 🪙
              </span>
            </div>
          </div>

          {/* Estado de Foco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Zap size={14} />
                <span>Gestión de Puntos de Foco</span>
              </span>
              <div className="text-sm font-mono font-bold text-slate-200">
                {activeCharacterFocus.toLocaleString()} / 30.000 Puntos
              </div>
              <p className="text-[11px] text-slate-400">
                Regeneración: +10.000 puntos/día (~416 foco por hora con Premium). No dejar superar 28.000 para evitar pérdidas.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                <Clock size={14} />
                <span>Ciclo de Cosechas (22 Horas)</span>
              </span>
              <div className="text-sm font-mono font-bold text-slate-200">
                {logs.length} Registro(s) de Cosecha
              </div>
              <p className="text-[11px] text-slate-400">
                Tiempos de maduración regulados a 22h con Premium.
              </p>
            </div>
          </div>

          {/* Tareas Pendientes del Día */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckSquare size={14} className="text-amber-400" />
              <span>Itinerario de Tareas Pendientes ({pendingTasks.length})</span>
            </h3>

            {pendingTasks.length === 0 ? (
              <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 text-center">
                ✨ ¡Todas las tareas del itinerario están completadas por hoy!
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 border border-slate-600 rounded shrink-0"></span>
                      <div>
                        <span className="font-bold text-slate-200">{task.title}</span>
                        {task.notes && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{task.notes}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {task.cityId.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumen de Cosechas Registradas */}
          {logs.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wheat size={14} className="text-emerald-400" />
                <span>Cosechas Realizadas Hoy ({logs.length})</span>
              </h3>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-2.5">Cultivo / Producto</th>
                      <th className="p-2.5 text-center">Parcelas</th>
                      <th className="p-2.5 text-center">Cosechado</th>
                      <th className="p-2.5 text-right">Beneficio Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log.id} className="bg-slate-950/60">
                        <td className="p-2.5 font-bold text-slate-200">{log.itemName}</td>
                        <td className="p-2.5 text-center font-mono text-slate-400">{log.plotsCount}</td>
                        <td className="p-2.5 text-center font-mono text-slate-400">{log.harvestedAmount} u.</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                          +{formatSilver(log.netProfit)} 🪙
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pie del documento */}
          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Albion Farm & Economy Tracker • Local-First Architecture</span>
            <span>Generado: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
