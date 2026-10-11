import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  HelpCircle,
  RotateCcw,
  Zap,
  Calculator,
} from 'lucide-react';
import { useTransmutationCalculator } from '../hooks/useTransmutationCalculator';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import { TransmutationMode, ShardTransmutationType } from '../domain/models/transmutation';

interface Props {
  onOpenAdpModal?: (itemId: string, targetType: 'product' | 'seed_or_baby') => void;
}

export const TransmutationFoundryView: React.FC<Props> = ({ onOpenAdpModal }) => {
  const {
    config,
    updateConfig,
    availableResources,
    sourceItemKey,
    targetItemKey,
    currentSourcePrice,
    currentTargetPrice,
    updateItemPrice,
    result,
  } = useTransmutationCalculator();

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleConfigChange = (changes: Parameters<typeof updateConfig>[0]) => {
    updateConfig(changes);
    if (hasCalculated) setIsStale(true);
  };

  const handlePriceChange = (key: string, val: number) => {
    updateItemPrice(key, val);
    if (hasCalculated) setIsStale(true);
  };

  const handleCalculate = () => {
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  const selectedRes = availableResources.find((r) => r.id === config.resourceType) || availableResources[0];

  return (
    <div id="transmutation-foundry-container" className="space-y-6">
      {/* Header Principal */}
      <div className="bg-slate-900 border border-purple-900/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-950 flex items-center justify-center text-white shadow-md border border-purple-500/30">
              <Sparkles size={26} className="text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Taller de Transmutación & Arbitraje</span>
                <span className="text-xs bg-purple-900/80 text-purple-200 border border-purple-700/60 font-semibold px-2 py-0.5 rounded-full">
                  Refinado & Artefactos
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cálculo de coste de plata oficial vs compra directa en mercado para los 5 recursos refinados y esquirlas.
              </p>
            </div>
          </div>

          {/* Selector de Modo de Transmutación */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleConfigChange({ mode: 'enchantment' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.mode === 'enchantment'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              ✨ Encantamiento (.0 ➜ .1, .2, .3, .4)
            </button>
            <button
              type="button"
              onClick={() => handleConfigChange({ mode: 'tier' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.mode === 'tier'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🔺 Subida de Tier (T4 ➜ T5, T6, etc.)
            </button>
            <button
              type="button"
              onClick={() => handleConfigChange({ mode: 'artefact_shard' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.mode === 'artefact_shard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🔮 Fundidor (Runas ➜ Almas ➜ Reliquias)
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Recurso (Refinado o Bruto) */}
      {config.mode !== 'artefact_shard' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Seleccionar Recurso a Transmutar:
            </label>
            <div className="text-xs text-purple-400 font-semibold">
              Refinados & Brutos Recolectados
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {availableResources.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => handleConfigChange({ resourceType: res.id })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  config.resourceType === res.id
                    ? 'bg-purple-950/70 border-purple-500/80 text-white shadow-md ring-1 ring-purple-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-slate-200 truncate">{res.nameEs.replace(/\s*\(.*?\)\s*/g, '')}</span>
                  {res.isRaw ? (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Bruto</span>
                  ) : (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Refinado</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{res.stationNameEs.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configuración de Transmutación y Comparador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parámetros de Entrada (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Parámetros de Origen & Destino</span>
              <span className="text-[11px] text-purple-400 font-semibold">{selectedRes.stationNameEs}</span>
            </h3>

            {/* MODO ENCANTAMIENTO */}
            {config.mode === 'enchantment' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tier del Material:</label>
                    <select
                      value={config.sourceTier}
                      onChange={(e) => handleConfigChange({ sourceTier: Number(e.target.value), targetTier: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                    >
                      {[4, 5, 6, 7, 8].map((t) => (
                        <option key={t} value={t}>Tier {t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Encantamiento Inicial:</label>
                    <select
                      value={config.sourceEnchantment}
                      onChange={(e) => {
                        const sEnc = Number(e.target.value);
                        handleConfigChange({ sourceEnchantment: sEnc, targetEnchantment: Math.min(4, sEnc + 1) });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                    >
                      {[0, 1, 2, 3].map((enc) => (
                        <option key={enc} value={enc}>.{enc} Plano / Actual</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Encantamiento Objetivo:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((enc) => (
                      <button
                        key={enc}
                        type="button"
                        disabled={enc <= config.sourceEnchantment}
                        onClick={() => handleConfigChange({ targetEnchantment: enc })}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.targetEnchantment === enc
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : enc <= config.sourceEnchantment
                            ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800 text-slate-600'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        .{enc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODO TIER */}
            {config.mode === 'tier' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tier Inicial:</label>
                    <select
                      value={config.sourceTier}
                      onChange={(e) => {
                        const sTier = Number(e.target.value);
                        handleConfigChange({ sourceTier: sTier, targetTier: Math.min(8, sTier + 1) });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                    >
                      {[4, 5, 6, 7].map((t) => (
                        <option key={t} value={t}>Tier {t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tier Objetivo:</label>
                    <select
                      value={config.targetTier}
                      onChange={(e) => handleConfigChange({ targetTier: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                    >
                      {[5, 6, 7, 8].filter((t) => t > config.sourceTier).map((t) => (
                        <option key={t} value={t}>Tier {t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nivel de Encantamiento Preservado:</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((enc) => (
                      <button
                        key={enc}
                        type="button"
                        onClick={() => handleConfigChange({ sourceEnchantment: enc, targetEnchantment: enc })}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          config.sourceEnchantment === enc
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        .{enc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODO FUNDIDOR DE ARTEFACTOS */}
            {config.mode === 'artefact_shard' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tier de Esquirla:</label>
                  <select
                    value={config.sourceTier}
                    onChange={(e) => handleConfigChange({ sourceTier: Number(e.target.value), targetTier: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                  >
                    {[4, 5, 6, 7, 8].map((t) => (
                      <option key={t} value={t}>Tier {t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Conversión en Fundidor:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfigChange({ shardType: 'rune_to_soul' })}
                      className={`p-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        config.shardType === 'rune_to_soul'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      5 Runas ➜ 1 Alma
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfigChange({ shardType: 'soul_to_relic' })}
                      className={`p-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        config.shardType === 'soul_to_relic'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      5 Almas ➜ 1 Reliquia
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tamaño del Lote */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Cantidad de Unidades:</label>
              <NumericInput
                value={config.batchCount}
                onChange={(val) => handleConfigChange({ batchCount: Math.max(1, val) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                placeholder="10"
              />
            </div>

            {/* Precios Manuales */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Precio unitario de compra del material inicial (Mercado):
                </label>
                <NumericInput
                  value={currentSourcePrice}
                  onChange={(val) => handlePriceChange(sourceItemKey, val)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono text-right"
                  placeholder="1800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Precio unitario de venta del material objetivo (Mercado):
                </label>
                <NumericInput
                  value={currentTargetPrice}
                  onChange={(val) => handlePriceChange(targetItemKey, val)}
                  className="w-full bg-slate-950 border border-purple-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono text-right"
                  placeholder="4500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Veredicto & Desglose Financiero (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-purple-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Cálculo de Transmutación
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para procesar el arbitraje exacto contra la tasa oficial del juego sin interferencias de cálculos anteriores.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasCalculated && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Limpiar cálculo de pantalla"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}

              <button
                type="button"
                id="btn-calculate-transmutation-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-2 ring-purple-400/40 shadow-purple-500/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Transmutación'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-slate-100">
                  Transmutación de {selectedRes.nameEs} ({config.batchCount} u.) Lista para Calcular
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configura el modo, tiers y precios manuales de mercado en la izquierda. Presiona el botón{' '}
                  <strong className="text-purple-400">"Dar Resultado / Calcular Transmutación"</strong> para proyectar la rentabilidad neta y break-even.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCalculate}
                className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer mt-1"
              >
                <Calculator size={18} />
                <span>Calcular Resultados Ahora</span>
              </button>
            </div>
          ) : (
            <>
              {/* Badge de Veredicto */}
              {result.isProfitable ? (
                <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 flex items-start gap-3 shadow-md">
                  <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-emerald-300 font-bold text-sm flex items-center gap-2">
                      <span>¡TRANSMUTACIÓN RENTABLE DETECTADA!</span>
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        +{result.roiPercent}% ROI
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      {result.verdictMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3 shadow-md">
                  <AlertCircle size={24} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-rose-300 font-bold text-sm flex items-center gap-2">
                      <span>ARBITRAJE NO RENTABLE</span>
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Pérdida
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                      {result.verdictMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Desglose de Costes */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Estructura de Inversión vs Retorno
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block">Coste Base Material:</span>
                    <span className="text-base font-bold text-slate-200 font-mono tabular-nums mt-0.5 block">
                      {formatSilver(result.totalSourceMaterialCost)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {formatSilver(result.sourceMaterialCostPerUnit)} /u.
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-purple-900/40">
                    <span className="text-[11px] font-semibold text-purple-300 block">Tasa Sistema Transmutación:</span>
                    <span className="text-base font-bold text-purple-300 font-mono tabular-nums mt-0.5 block">
                      {formatSilver(result.totalTransmutationSilverFee)}
                    </span>
                    <span className="text-[10px] text-purple-400/80 block">
                      {formatSilver(result.transmutationSilverFeePerUnit)} /u. fija oficial
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 block">Inversión Total:</span>
                    <span className="text-base font-bold text-slate-200 font-mono tabular-nums mt-0.5 block">
                      {formatSilver(result.totalInvestment)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Break-Even: {formatSilver(result.breakEvenSellPrice)} /u.
                    </span>
                  </div>
                </div>

                {/* Balance Final */}
                <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Ingreso Bruto</span>
                    <span className="text-xs font-bold text-slate-300 font-mono tabular-nums">
                      {formatSilver(result.grossRevenue)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Tasas Subasta (6.5%)</span>
                    <span className="text-xs font-bold text-slate-400 font-mono tabular-nums">
                      -{formatSilver(result.marketFeesTotal)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Beneficio Neto</span>
                    <span
                      className={`text-xs font-black font-mono tabular-nums ${
                        result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {result.netProfit > 0 ? '+' : ''}
                      {formatSilver(result.netProfit)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Beneficio / Unidad</span>
                    <span
                      className={`text-xs font-black font-mono tabular-nums ${
                        result.profitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {result.profitPerUnit > 0 ? '+' : ''}
                      {formatSilver(result.profitPerUnit)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
