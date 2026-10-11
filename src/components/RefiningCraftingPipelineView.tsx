import React from 'react';
import {
  Hammer,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  MapPin,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Package,
} from 'lucide-react';
import { CityId } from '../types';
import { RefiningToCraftingPipelineResult, CraftingOpportunityFromRefining } from '../domain/use-cases/calculateRefiningToCraftingPipeline';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface RefiningCraftingPipelineViewProps {
  pipeline: RefiningToCraftingPipelineResult;
  currentCityId: CityId;
  onNavigateToCrafting?: (recipeId?: string, tier?: number) => void;
  onSelectCity?: (cityId: CityId) => void;
  onOpenAdpModal?: (itemId: string, targetType?: 'product' | 'seed_or_baby') => void;
}

export const RefiningCraftingPipelineView: React.FC<RefiningCraftingPipelineViewProps> = ({
  pipeline,
  currentCityId,
  onNavigateToCrafting,
  onSelectCity,
  onOpenAdpModal,
}) => {
  const {
    refinedResourceType,
    tier,
    enchantment,
    refinedUnitsAvailable,
    refinedUnitMarketPrice,
    rawRefinedTotalNetSale,
    opportunities,
    topOpportunity,
  } = pipeline;

  const resourceLabelMap: Record<string, string> = {
    ore: 'Barras / Lingotes de Metal',
    wood: 'Tablas de Madera',
    hide: 'Cueros Curtidos',
    fiber: 'Telas Tejidas',
    stone: 'Bloques de Piedra',
  };

  const resourceLabel = resourceLabelMap[refinedResourceType] || 'Recurso Refinado';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumen Maestro de la Cadena */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                <Hammer size={22} />
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  Cadena de Producción: Refinado ➔ Crafteo de Equipo & Diarios
                </h3>
                <p className="text-xs text-slate-400">
                  Lote disponible: <strong className="text-emerald-400 font-mono">{refinedUnitsAvailable.toLocaleString()} uds</strong> de {resourceLabel} T{tier}{enchantment > 0 ? `.${enchantment}` : ''}.
                </p>
              </div>
            </div>
          </div>

          {/* Comparativa Directa: Vender Crudo vs Forjar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Opción A: Venta Directa en Mercado</span>
              <div className="text-lg font-mono font-bold text-slate-200 tabular-nums mt-0.5">
                {formatSilver(rawRefinedTotalNetSale)} 🪙
              </div>
              <span className="text-[10px] text-slate-500 tabular-nums">
                Vendiendo el material crudo ({formatSilver(refinedUnitMarketPrice)} 🪙/ud)
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/40 relative">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block flex items-center justify-between">
                Opción B: Fabricar Piezas
                {topOpportunity && topOpportunity.isCraftingMoreProfitable && (
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded text-[9px] font-black border border-emerald-500/30">
                    RECOMENDADO
                  </span>
                )}
              </span>
              <div className="text-lg font-mono font-bold text-emerald-300 tabular-nums mt-0.5">
                {topOpportunity ? formatSilver(topOpportunity.netCraftRevenue + topOpportunity.journalsValueContribution - topOpportunity.totalSecondaryMaterialsCost - topOpportunity.stationNutritionalFee) : 0} 🪙
              </div>
              {topOpportunity && (
                <span className="text-[10px] font-bold text-emerald-400 tabular-nums flex items-center gap-1">
                  {topOpportunity.advantageOverRawSale >= 0 ? '+' : ''}
                  {formatSilver(topOpportunity.advantageOverRawSale)} 🪙 vs vender en crudo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recomendación Destacada */}
        {topOpportunity && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <span>Mejor Oportunidad: <strong className="text-amber-300">{topOpportunity.recipe.nameEs}</strong></span>
                  <AlbionItemBadge tier={topOpportunity.tier} />
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Con tus <strong>{refinedUnitsAvailable.toLocaleString()} {resourceLabel}</strong> puedes fabricar exactamente <strong className="text-emerald-300">{topOpportunity.craftableItemCount.toLocaleString()} piezas</strong> y llenar <strong className="text-cyan-300">{topOpportunity.journalsFilledCount} diarios</strong> de {topOpportunity.journalNameEs}.
                </p>
              </div>
            </div>

            {onNavigateToCrafting && (
              <button
                type="button"
                onClick={() => onNavigateToCrafting(topOpportunity.recipe.id, topOpportunity.tier)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                Configurar en Crafteo
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Catálogo de Oportunidades de Crafteo Sincronizadas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Package size={16} className="text-emerald-400" />
            Recetas de Equipo Fabricables con este Lote ({opportunities.length})
          </h4>
          <span className="text-xs text-slate-400">
            Ordenado de mayor a menor ventaja sobre la venta del material crudo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map((opp) => {
            const isTop = topOpportunity?.recipe.id === opp.recipe.id;
            const hasAdvantage = opp.advantageOverRawSale > 0;

            return (
              <div
                key={opp.recipe.id}
                className={`bg-slate-900 border rounded-xl p-5 space-y-4 shadow-lg transition-all ${
                  isTop
                    ? 'border-emerald-500/50 bg-emerald-950/10 shadow-emerald-500/5'
                    : hasAdvantage
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/60 opacity-80'
                }`}
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-slate-100 text-sm">{opp.recipe.nameEs}</h5>
                      <AlbionItemBadge tier={opp.tier} />
                      {isTop && (
                        <span className="text-[10px] font-black px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          TOP RENTABILIDAD
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Requiere {opp.resourceRequirementPerItem} uds de {resourceLabel} por pieza
                    </span>
                  </div>

                  {/* Ciudad Óptima de Crafteo */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Ciudad con Bono:</span>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="font-bold text-xs text-slate-200">{opp.optimalCityName}</span>
                      {opp.stationCityBonusActive ? (
                        <span className="text-emerald-400" title="Ciudad actual tiene bono">
                          <CheckCircle2 size={12} />
                        </span>
                      ) : (
                        onSelectCity && (
                          <button
                            type="button"
                            onClick={() => onSelectCity(opp.stationCityId)}
                            className="text-[10px] text-amber-400 hover:underline font-bold"
                            title="Cambiar a esta ciudad para bono de crafteo"
                          >
                            [Ir]
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Métricas de Producción & Diarios */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Piezas Fabricables:</span>
                    <span className="text-base font-black font-mono tabular-nums text-cyan-300">
                      {opp.craftableItemCount.toLocaleString()} uds
                    </span>
                    {opp.leftoverRefinedResource > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        (Sobran {opp.leftoverRefinedResource} uds)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Diarios Llenados:</span>
                    <span className="text-base font-black font-mono tabular-nums text-amber-400 flex items-center gap-1">
                      <BookOpen size={14} />
                      {opp.journalsFilledCount} libros
                    </span>
                    <span className="text-[10px] text-slate-500 tabular-nums block">
                      +{formatSilver(opp.journalsValueContribution)} 🪙 en diarios
                    </span>
                  </div>
                </div>

                {/* Materiales Secundarios si los requiere */}
                {opp.secondaryMaterialsNeeded.length > 0 && (
                  <div className="text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-slate-400 block font-medium">Materiales Adicionales Requeridos:</span>
                    {opp.secondaryMaterialsNeeded.map((sec) => (
                      <div key={sec.materialId} className="flex items-center justify-between text-slate-300">
                        <span>• {sec.nameEs}:</span>
                        <span className="font-mono text-slate-200 tabular-nums">
                          <strong>{sec.totalAmountNeeded.toLocaleString()} uds</strong> (~{formatSilver(sec.totalEstimatedCost)} 🪙)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comparación Económica */}
                <div className="space-y-1.5 pt-1 text-xs border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Venta Estimada de Piezas ({opp.craftableItemCount} uds):</span>
                    <span className="font-mono text-slate-200 tabular-nums">{formatSilver(opp.netCraftRevenue)} 🪙</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Aporte de Diarios Llenos:</span>
                    <span className="font-mono text-cyan-300 tabular-nums">+{formatSilver(opp.journalsValueContribution)} 🪙</span>
                  </div>

                  {opp.totalSecondaryMaterialsCost > 0 && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Coste de Materiales Secundarios:</span>
                      <span className="font-mono text-rose-400 tabular-nums">-{formatSilver(opp.totalSecondaryMaterialsCost)} 🪙</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between font-bold pt-2 border-t border-slate-800">
                    <span className="text-slate-200">Diferencia vs Vender en Crudo:</span>
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        hasAdvantage ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {opp.advantageOverRawSale >= 0 ? '+' : ''}
                      {formatSilver(opp.advantageOverRawSale)} 🪙
                    </span>
                  </div>
                </div>

                {/* Botón de Acción Directa */}
                {onNavigateToCrafting && (
                  <button
                    type="button"
                    onClick={() => onNavigateToCrafting(opp.recipe.id, opp.tier)}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Ver en Calculadora de Crafteo</span>
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
