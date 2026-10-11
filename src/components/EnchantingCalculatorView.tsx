import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Layers,
  Coins,
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  RotateCcw,
  Calculator,
} from 'lucide-react';
import { useEnchantingCalculator } from '../hooks/useEnchantingCalculator';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface EnchantingCalculatorViewProps {
  onOpenAdpModal?: (itemId: string, targetType?: 'product' | 'seed_or_baby') => void;
}

const EQUIPMENT_SLOTS = [
  { id: 'one_hand_weapon', nameEs: 'Arma de 1 Mano (Espadas, Hachas, Mazas)', runes: 96, icon: '⚔️' },
  { id: 'two_hand_weapon', nameEs: 'Arma de 2 Manos (Arcos, Bastones, Lanzas)', runes: 192, icon: '🏹' },
  { id: 'chest', nameEs: 'Armadura / Pecho (Placas, Cuero, Tela)', runes: 192, icon: '🛡️' },
  { id: 'head', nameEs: 'Casco / Capucha', runes: 96, icon: '🪖' },
  { id: 'shoes', nameEs: 'Botas / Zapatos', runes: 96, icon: '👢' },
  { id: 'offhand', nameEs: 'Mano Secundaria (Offhand / Escudo / Libro)', runes: 48, icon: '📖' },
  { id: 'cape', nameEs: 'Capa Común o de Facción', runes: 96, icon: '🧣' },
];

export const EnchantingCalculatorView: React.FC<EnchantingCalculatorViewProps> = ({
  onOpenAdpModal,
}) => {
  const {
    config,
    updateConfig,
    baseItemKey,
    targetItemKey,
    shardKey,
    currentBasePrice,
    currentTargetPrice,
    currentShardPrice,
    updatePrice,
    calculationResult,
  } = useEnchantingCalculator();

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleConfigChange = (newConfig: Parameters<typeof updateConfig>[0]) => {
    updateConfig(newConfig);
    if (hasCalculated) setIsStale(true);
  };

  const handlePriceChange = (key: string, val: number) => {
    updatePrice(key, val);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
              Taller de Encantamiento y Fusión de Equipo
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Runas • Almas • Reliquias • Avalonianos
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Calcula si te conviene encantar piezas en el Taller de Reparaciones (.0 a .1, .2, .3, .4) o comprarlas directamente en el mercado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA 1: SELECTOR DE PIEZA Y ENCANTO */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers size={16} className="text-purple-400" />
            1. Tipo de Ranura y Niveles
          </h3>

          {/* Ranura del Ítem */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium block">Ranura del Ítem:</label>
            <select
              value={config.slotId}
              onChange={(e) => updateConfig({ slotId: e.target.value as 'one_hand_weapon' | 'two_hand_weapon' | 'chest' | 'head' | 'shoes' | 'offhand' | 'cape' })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {EQUIPMENT_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.icon} {slot.nameEs} ({slot.runes} runas)
                </option>
              ))}
            </select>
          </div>

          {/* Tier y Niveles */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Tier:</label>
              <select
                value={config.tier}
                onChange={(e) => updateConfig({ tier: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {[4, 5, 6, 7, 8].map((t) => (
                  <option key={t} value={t}>T{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Desde:</label>
              <select
                value={config.currentEnchantment}
                onChange={(e) => updateConfig({ currentEnchantment: Number(e.target.value) as 0 | 1 | 2 | 3 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value={0}>.0 Plano</option>
                <option value={1}>.1 Poco Común</option>
                <option value={2}>.2 Raro</option>
                <option value={3}>.3 Excepcional</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-purple-300 font-semibold block mb-1">Hasta:</label>
              <select
                value={config.targetEnchantment}
                onChange={(e) => updateConfig({ targetEnchantment: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                className="w-full bg-slate-950 border border-purple-500/40 rounded-lg px-2.5 py-1.5 text-xs font-bold text-purple-300 focus:outline-none focus:border-purple-500"
              >
                {[1, 2, 3, 4].filter((lvl) => lvl > config.currentEnchantment).map((lvl) => (
                  <option key={lvl} value={lvl}>.{lvl} Objetivo</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cantidad de piezas a encantar */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="text-slate-400">Cantidad a Encantar:</span>
              <span className="font-mono font-bold text-purple-300">{config.batchCount} piezas</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={config.batchCount}
              onChange={(e) => updateConfig({ batchCount: Number(e.target.value) })}
              className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Precios Manuales de Entrada */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Precios de Mercado
              </h4>
              {onOpenAdpModal && (
                <button
                  type="button"
                  onClick={() => onOpenAdpModal(shardKey, 'product')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20"
                >
                  <TrendingUp size={11} />
                  Consultar ADP
                </button>
              )}
            </div>

            {/* Coste del Ítem Base */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block truncate">
                Precio de Compra/Base T{config.tier}.{config.currentEnchantment}:
              </label>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <NumericInput
                  min={0}
                  value={currentBasePrice}
                  onChange={(val) => updatePrice(baseItemKey, val)}
                  className="w-full bg-transparent font-mono font-bold text-slate-100 text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-500">🪙/ud</span>
              </div>
            </div>

            {/* Coste de Fragmentos / Runas / Almas */}
            <div className="space-y-1">
              <label className="text-[11px] text-purple-300 font-semibold block truncate">
                Precio de {calculationResult.shardNameEs}:
              </label>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <NumericInput
                  min={0}
                  value={currentShardPrice}
                  onChange={(val) => updatePrice(shardKey, val)}
                  className="w-full bg-transparent font-mono font-bold text-purple-300 text-sm focus:outline-none"
                />
                <span className="text-xs text-purple-400 font-mono">🪙/unidad</span>
              </div>
            </div>

            {/* Precio de Mercado del Ítem ya Encantado */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block truncate">
                Precio Mercado Ítem ya Encantado (T{config.tier}.{config.targetEnchantment}):
              </label>
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <NumericInput
                  min={0}
                  value={currentTargetPrice}
                  onChange={(val) => updatePrice(targetItemKey, val)}
                  className="w-full bg-transparent font-mono font-bold text-slate-100 text-sm focus:outline-none"
                />
                <span className="text-xs text-slate-500">🪙/ud</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNAS 2 & 3: CONTROL DE CÁLCULO Y RESULTADOS */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-purple-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Fusión y Encantamiento
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para comparar coste de fusión vs compra directa y calcular arbitraje de reventa sin residuos.
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
                id="btn-calculate-enchanting-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-2 ring-purple-400/40 shadow-purple-600/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Encantamiento'
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
              <h4 className="text-base font-bold text-slate-200">
                Esperando Activación Manual
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Selecciona la ranura, el nivel de encanto objetivo (.1, .2, .3, .4) y presiona el botón{' '}
                <strong className="text-purple-300">"Dar Resultado / Calcular Encantamiento"</strong> para comparar fusión propia vs compra en subasta.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* COLUMNA 2: COMPARACIÓN DE COSTE VS COMPRA DIRECTA */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Coins size={16} className="text-amber-400" />
            Coste de Fusión Propia
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{calculationResult.shardNameEs} Requeridas:</span>
              <span className="font-mono font-bold text-purple-300 tabular-nums">
                {calculationResult.shardsPerItem} / pieza ({calculationResult.totalShardsRequired} total)
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Coste Total en Esencias:</span>
              <span className="font-mono text-slate-200 tabular-nums">{formatSilver(calculationResult.totalShardCost)} 🪙</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Coste Base de la Pieza ({config.batchCount} uds):</span>
              <span className="font-mono text-slate-200 tabular-nums">{formatSilver(calculationResult.totalBaseItemCost)} 🪙</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex items-center justify-between font-bold text-slate-100">
              <span>Coste Final de la Pieza Encantada:</span>
              <span className="font-mono text-amber-400 tabular-nums">{formatSilver(calculationResult.costPerEnchantedUnit)} 🪙 / ud</span>
            </div>
          </div>

          {/* Comparativa Lado a Lado */}
          <div className="space-y-3">
            <div
              className={`p-4 rounded-xl border space-y-1 ${
                calculationResult.isCheaperToCraftThanBuy
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="text-xs text-slate-300 font-bold flex items-center justify-between">
                <span>¿Conviene Encantar tú mismo?</span>
                <span className="font-mono">
                  {calculationResult.isCheaperToCraftThanBuy ? '✅ SÍ (Ahorro)' : '❌ NO (Comprar directo)'}
                </span>
              </div>
              <div
                className={`text-xl font-mono font-black tabular-nums ${
                  calculationResult.isCheaperToCraftThanBuy ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {calculationResult.silverSavedVsDirectBuy >= 0 ? '+' : ''}
                {formatSilver(calculationResult.silverSavedVsDirectBuy)} 🪙
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {calculationResult.isCheaperToCraftThanBuy
                  ? `Ahorras ${formatSilver(calculationResult.silverSavedVsDirectBuy)} 🪙 por unidad frente a comprar la pieza ya encantada a .${config.targetEnchantment} en el mercado.`
                  : `Comprar directamente la pieza en el mercado te sale más barato que forjarla y encantarla con ${calculationResult.shardNameEs}.`}
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA 3: POTENCIAL DE REVENTA EN MERCADO */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <TrendingUp size={16} className="text-emerald-400" />
              Arbitraje y Reventa de Piezas Encantadas
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Venta Bruta en Mercado:</span>
                <span className="font-mono text-slate-200 tabular-nums">{formatSilver(calculationResult.grossSellRevenue)} 🪙</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Impuestos de Venta ({calculationResult.marketTaxPercent}% + 2.5% orden):</span>
                <span className="font-mono tabular-nums">
                  -{formatSilver(Math.round((calculationResult.grossSellRevenue * (calculationResult.marketTaxPercent + 2.5)) / 100))} 🪙
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Coste Total de Encantado:</span>
                <span className="font-mono text-rose-300 tabular-nums">-{formatSilver(calculationResult.totalEnchantingCost)} 🪙</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between font-bold text-slate-100">
                <span>Ingreso Neto de Venta:</span>
                <span className="font-mono text-cyan-300 tabular-nums">{formatSilver(calculationResult.netSellRevenue)} 🪙</span>
              </div>
            </div>

            {/* Tarjeta de Ganancia de Reventa */}
            <div
              className={`p-4 rounded-xl border space-y-1 ${
                calculationResult.isProfitableToResell
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <span className="text-xs text-slate-400 font-medium">Ganancia Neta de Reventa:</span>
              <div
                className={`text-2xl font-mono font-black tabular-nums ${
                  calculationResult.isProfitableToResell ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {calculationResult.netProfit >= 0 ? '+' : ''}
                {formatSilver(calculationResult.netProfit)} 🪙
              </div>
              <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                <span>Por unidad: <strong className="text-slate-200 font-mono tabular-nums">{formatSilver(calculationResult.profitPerUnit)} 🪙</strong></span>
                <span>ROI: <strong className="text-slate-200 font-mono tabular-nums">{calculationResult.roiPercent}%</strong></span>
              </div>
            </div>
          </div>

          {/* Recomendaciones Tácticas */}
          <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
            {calculationResult.recommendations.map((rec, i) => (
              <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800 leading-relaxed">
                {rec}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
</div>
</div>
  );
};
