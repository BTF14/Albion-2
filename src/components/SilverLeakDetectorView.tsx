import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  Building2,
} from 'lucide-react';
import { useSilverAudit } from '../hooks/useSilverAudit';
import { CityId } from '../types';
import { formatSilver } from '../utils/albionColors';

interface Props {
  currentCityId: CityId;
  stationTax?: number;
  hasPremium?: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export const SilverLeakDetectorView: React.FC<Props> = ({
  currentCityId,
  stationTax = 450,
  hasPremium = true,
  onNavigateToTab,
}) => {
  const { auditReport, recheckAudit } = useSilverAudit(currentCityId, stationTax, hasPremium);

  // Ciclo de cálculo oficial con botón "Dar Resultado"
  const [hasCalculated, setHasCalculated] = React.useState<boolean>(false);
  const [isStale, setIsStale] = React.useState<boolean>(false);

  const handleAudit = () => {
    recheckAudit();
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50';
    if (score >= 60) return 'text-amber-400 bg-amber-950/80 border-amber-500/50';
    return 'text-rose-400 bg-rose-950/80 border-rose-500/50';
  };

  return (
    <div id="silver-leak-detector-container" className="space-y-6">
      {/* Header Principal con Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-rose-950 flex items-center justify-center text-white shadow-md border border-rose-500/30">
              <ShieldAlert size={26} className="text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Detector de Fugas de Plata & Auditor de Tasas</span>
                <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                  {currentCityId.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Auditoría en tiempo real de tus precios manuales, pérdidas silenciosas por semillas caras y tasas abusivas de taller.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border text-center font-mono ${hasCalculated ? getScoreBadgeColor(auditReport.healthScore) : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
              <div className="text-[10px] uppercase font-bold tracking-wider">Salud Financiera</div>
              <div className="text-2xl font-black">{hasCalculated ? `${auditReport.healthScore}/100` : '--/100'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Control de Cálculo Oficial "Dar Resultado" */}
      <div className="bg-slate-900 border border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {hasCalculated ? (isStale ? 'Parámetros Modificados' : 'Auditoría Financiera Completada') : 'Listo para Auditar'}
            </div>
            <div className="text-[11px] text-slate-400">
              {hasCalculated
                ? isStale
                  ? 'Cambiaste parámetros de ciudad o tasas. Presiona el botón para re-escanear.'
                  : 'Escaneo completo de costes ocultos, RRR y precios de mercado finalizado.'
                : 'Presiona "Dar Resultado" para auditar fugas de plata y pérdidas silenciosas.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasCalculated && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Limpiar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAudit}
            className={`w-full sm:w-auto px-5 py-2.5 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !hasCalculated
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-rose-950/50'
                : isStale
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>
              {!hasCalculated
                ? 'Dar Resultado / Auditar Fugas de Plata'
                : isStale
                ? 'Re-escanear Fugas Ahora'
                : 'Auditoría Actualizada ✓'}
            </span>
          </button>
        </div>
      </div>

      {!hasCalculated ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-200">Listo para Auditar la Salud Financiera en {currentCityId.toUpperCase()}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Presiona el botón <strong className="text-amber-400">"Dar Resultado / Auditar Fugas de Plata"</strong> para evaluar tus precios manuales, pérdidas silenciosas por resiembras y tasas abusivas de talleres.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAudit}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={16} />
            <span>Ejecutar Auditoría Financiera Ahora</span>
          </button>
        </div>
      ) : (
        <>

      {/* Resumen de Fugas Detectadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Fugas Críticas Activas:</span>
          <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
            {auditReport.criticalLeaksCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Generan pérdidas inmediatas de plata</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Advertencias / Oportunidades:</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            {auditReport.warningLeaksCount}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Márgenes estrechos o bonos omitidos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Pérdida Diaria Estimada:</span>
          <span className="text-2xl font-black text-rose-400 font-mono mt-1 block tabular-nums">
            {formatSilver(auditReport.totalEstimatedDailySilverLoss)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Plata recuperable corrigiendo fugas</span>
        </div>
      </div>

      {/* Lista Granular de Hallazgos y Sugerencias de Pivote */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>Diagnósticos y Recomendaciones de Acción</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {auditReport.leaks.length}
          </span>
        </h3>

        {auditReport.leaks.length === 0 ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-8 text-center space-y-2">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-emerald-200">¡Economía 100% Protegida!</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No se detectaron fugas de plata, recetas con ROI negativo ni estaciones con tasas abusivas con tus precios actuales.
            </p>
          </div>
        ) : (
          auditReport.leaks.map((leak) => (
            <div
              key={leak.id}
              className={`p-4 rounded-xl border space-y-3 shadow-md ${
                leak.severity === 'critical'
                  ? 'bg-rose-950/40 border-rose-500/60'
                  : leak.severity === 'warning'
                  ? 'bg-amber-950/40 border-amber-500/60'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  {leak.severity === 'critical' ? (
                    <AlertCircle size={18} className="text-rose-400 shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                  )}
                  <h4 className="text-sm font-bold text-white">{leak.title}</h4>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] font-bold text-rose-300 font-mono bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">
                    -{formatSilver(leak.estimatedSilverLostPerDay)} /día
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold bg-slate-950 px-2 py-0.5 rounded">
                    {leak.affectedActivity}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {leak.description}
              </p>

              {/* Recomendación de Corrección & Pivote */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-emerald-300 flex items-start gap-1.5">
                  <Sparkles size={14} className="shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <strong>Solución recomendada:</strong> {leak.recommendedFix}
                  </div>
                </div>

                {leak.pivotAlternativeName && (
                  <div className="text-[11px] text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded border border-amber-800/80 shrink-0">
                    Pivote sugerido: <strong>{leak.pivotAlternativeName}</strong> (+{formatSilver(leak.pivotEstimatedGainPerDay || 0)} /día)
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}
    </div>
  );
};
