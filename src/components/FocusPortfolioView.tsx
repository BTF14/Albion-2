import React from 'react';
import {
  Users,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  MapPin,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useFocusPortfolio } from '../hooks/useFocusPortfolio';
import { formatSilver } from '../utils/albionColors';

interface Props {
  onOpenCharacterModal?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const FocusPortfolioView: React.FC<Props> = ({
  onOpenCharacterModal,
  onNavigateToTab,
}) => {
  const { portfolioReport, refreshPortfolio } = useFocusPortfolio();

  return (
    <div id="focus-portfolio-container" className="space-y-6">
      {/* Header Principal del Imperio de Foco */}
      <div className="bg-slate-900 border border-amber-900/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-950 flex items-center justify-center text-slate-950 shadow-md border border-amber-400/40">
              <Zap size={26} className="fill-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Portafolio de Foco del Imperio (Multi-Alt)</span>
                <span className="text-xs bg-amber-900/80 text-amber-200 border border-amber-700/60 font-semibold px-2 py-0.5 rounded-full">
                  {portfolioReport.totalAltsCount} Personaje(s)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidación de regeneración diaria de 10.000 pts por alt, prevención de topes de 30k y asignación de roles óptimos.
              </p>
            </div>
          </div>

          {onOpenCharacterModal && (
            <button
              type="button"
              onClick={onOpenCharacterModal}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md self-start md:self-auto"
            >
              <Users size={14} />
              <span>Gestionar Personajes (Alts)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas Globales del Imperio */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Foco Total Disponible:</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1 flex items-baseline gap-1">
            <span>{portfolioReport.totalAvailableFocus.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-normal">/ {portfolioReport.totalCapacityFocus.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Suma de todos tus personajes</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Regeneración Diaria Total:</span>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
            +{portfolioReport.totalDailyFocusRegen.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">~{Math.round(portfolioReport.totalDailyFocusRegen / 24).toLocaleString()} foco / hora</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Ganancia Diaria Estimada:</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block tabular-nums">
            {formatSilver(portfolioReport.totalEstimatedDailySilverYield)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Plata neta / día gastando tu foco</span>
        </div>

        <div className={`p-4 rounded-xl shadow-md border ${
          portfolioReport.altsAtRiskOfCap > 0
            ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
            : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}>
          <span className="text-xs font-semibold text-slate-400 block">Alts en Riesgo de Tope:</span>
          <span className={`text-2xl font-black font-mono mt-1 block ${
            portfolioReport.altsAtRiskOfCap > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {portfolioReport.altsAtRiskOfCap}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {portfolioReport.altsAtRiskOfCap > 0 ? '¡Gasta foco antes de que llegue a 30k!' : 'Ninguno en peligro de desperdicio'}
          </span>
        </div>
      </div>

      {/* Veredicto Estratégico */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <Sparkles size={20} className="text-amber-400 shrink-0" />
        <p className="text-xs text-slate-300">
          <strong>Directiva Estratégica:</strong> {portfolioReport.strategicEmpireVerdict}
        </p>
      </div>

      {/* Lista Desglosada por Personaje (Alt) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Desglose Individual de Personajes & Asignación de Roles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolioReport.altSummaries.map((alt) => (
            <div
              key={alt.character.id}
              className={`bg-slate-900 border rounded-xl p-4 space-y-3 shadow-md relative overflow-hidden ${
                alt.isNearingCap ? 'border-rose-500/80' : 'border-slate-800'
              }`}
            >
              {/* Encabezado del Alt */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs shadow"
                    style={{ backgroundColor: alt.character.avatarColor || '#f59e0b' }}
                  >
                    {alt.character.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{alt.character.name}</span>
                      {alt.character.isMain && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-1.5 py-0.2 rounded">
                          Principal
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {alt.primarySpecialization}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono block tabular-nums">
                    +{formatSilver(alt.estimatedDailySilverYield)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">por 10k foco/día</span>
                </div>
              </div>

              {/* Barra de Progreso del Foco */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400 font-bold">
                    {alt.currentFocus.toLocaleString()} / 30.000 pts
                  </span>
                  <span className={alt.isNearingCap ? 'text-rose-400 font-black' : 'text-amber-400'}>
                    {alt.focusPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 border border-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      alt.isNearingCap ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${alt.focusPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>+{alt.hourlyRegenRate} foco/h</span>
                  <span>{alt.isAtCap ? '¡Tope alcanzado!' : `Lleno en ~${alt.hoursUntilFull} horas`}</span>
                </div>
              </div>

              {/* Recomendación de Actividad y Ciudad */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="text-slate-300 flex items-center justify-between">
                  <span className="text-slate-500">Actividad Recomendada:</span>
                  <span className="font-bold text-amber-300">{alt.recommendedActivity}</span>
                </div>
                <div className="text-slate-300 flex items-center justify-between">
                  <span className="text-slate-500">Ubicación Óptima:</span>
                  <span className="font-semibold text-cyan-300">{alt.recommendedCity}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
