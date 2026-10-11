import React, { useState, useEffect } from 'react';
import {
  Beef,
  Flame,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Zap,
  MapPin,
  Building2,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Coins,
  Calculator,
} from 'lucide-react';
import { useButcherEconomy } from '../hooks/useButcherEconomy';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import { CityId } from '../types';
import { CITIES } from '../data/items';
import { ButcherAnimalId } from '../domain/models/butcher';

interface Props {
  currentCityId?: CityId;
  onOpenAdpModal?: (itemId: string, targetType: 'product' | 'seed_or_baby') => void;
  onNavigateToTab?: (tab: string) => void;
  targetAnimalId?: string | null;
  targetAnimalCount?: number | null;
  onClearTarget?: () => void;
}

export const ButcherCalculatorView: React.FC<Props> = ({
  currentCityId,
  onOpenAdpModal,
  onNavigateToTab,
  targetAnimalId,
  targetAnimalCount,
  onClearTarget,
}) => {
  const {
    config,
    updateConfig,
    animals,
    selectedAnimal,
    rawMeatPrice,
    liveAnimalPrice,
    dairyProducePrice,
    updatePrice,
    meatPriceKey,
    livePriceKey,
    dairyPriceKey,
    result,
  } = useButcherEconomy(currentCityId);

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Sincronización si se navega desde el Registro Diario de Cosecha
  useEffect(() => {
    if (targetAnimalId) {
      const match = animals.find((a) => a.id === targetAnimalId);
      if (match) {
        updateConfig({
          animalId: match.id as ButcherAnimalId,
          animalsCount: targetAnimalCount && targetAnimalCount > 0 ? targetAnimalCount : config.animalsCount,
        });
        setHasCalculated(true);
        setIsStale(false);
      }
      onClearTarget?.();
    }
  }, [targetAnimalId, targetAnimalCount, animals, onClearTarget, updateConfig, config.animalsCount]);

  const handleConfigChange = (changes: Parameters<typeof updateConfig>[0]) => {
    updateConfig(changes);
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

  const cityInfo = CITIES.find((c) => c.id === config.cityId) || CITIES[0];

  return (
    <div id="butcher-calculator-container" className="space-y-6">
      {/* Header Principal */}
      <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 to-amber-950 flex items-center justify-center text-white shadow-md border border-rose-500/30">
              <Beef size={26} className="text-rose-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Carnicería & Matadero de Animales</span>
                <span className="text-xs bg-rose-900/80 text-rose-200 border border-rose-700/60 font-semibold px-2 py-0.5 rounded-full">
                  Tier 3 a Tier 8
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculadora de rendimiento de carne cruda vs venta del animal vivo en subasta o extracción diaria de leche y huevos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
            <MapPin size={14} style={{ color: cityInfo.color }} />
            <span className="text-slate-400 font-medium">Ciudad de Matanza:</span>
            <select
              value={config.cityId}
              onChange={(e) => handleConfigChange({ cityId: e.target.value as CityId })}
              className="bg-transparent font-bold text-slate-100 cursor-pointer focus:outline-none"
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selector de Animal de Granja */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
          Seleccionar Animal para Sacrificio:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {animals.map((an) => {
            const isSelected = an.id === config.animalId;
            const isCityBonus = an.bonusCityId === config.cityId;
            return (
              <button
                key={an.id}
                type="button"
                onClick={() => handleConfigChange({ animalId: an.id })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-rose-950/70 border-rose-500/80 text-white shadow-md ring-1 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-slate-200 truncate">{an.nameEs}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                    T{an.tier}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">{an.meatNameEs}</div>
                {isCityBonus && (
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    Bono en {config.cityId.toUpperCase()}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Panel Central: Parámetros y Veredicto */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parámetros de Entrada (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Parámetros de Faenado</span>
              <span className="text-xs text-amber-400 font-mono">20 u. carne base/animal</span>
            </h3>

            {/* Cantidad de Animales */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Cantidad de Animales Adultos:
              </label>
              <div className="flex items-center gap-2">
                <NumericInput
                  value={config.animalsCount}
                  onChange={(val) => handleConfigChange({ animalsCount: Math.max(1, val) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  placeholder="9"
                />
                <button
                  type="button"
                  onClick={() => handleConfigChange({ animalsCount: 9 })}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-xs font-bold shrink-0"
                  title="1 Parcela de Pastizal (9 casillas)"
                >
                  1 Parcela (9)
                </button>
              </div>
            </div>

            {/* Ubicación de Faenado */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Ubicación del Sacrificio:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleConfigChange({ slaughterLocation: 'city' })}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    config.slaughterLocation === 'city'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🏙️ Ciudad Real ({result.rrrPercent}% RRR)
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange({ slaughterLocation: 'island' })}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    config.slaughterLocation === 'island'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🏝️ Isla Privada ({config.useFocus ? '37.1%' : '0%'} RRR)
                </button>
              </div>
            </div>

            {/* Tasa de Nutrición y Foco */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Tasa Taller (Plata / 100 Nutrición):
                </label>
                <NumericInput
                  value={config.stationTaxPer100Nutrition}
                  onChange={(val) => handleConfigChange({ stationTaxPer100Nutrition: Math.max(0, val) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  placeholder="350"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Puntos de Foco:
                </label>
                <button
                  type="button"
                  onClick={() => handleConfigChange({ useFocus: !config.useFocus })}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    config.useFocus
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Zap size={14} className={config.useFocus ? 'fill-slate-950' : ''} />
                  <span>{config.useFocus ? 'Con Foco (+Retorno)' : 'Sin Foco (Base)'}</span>
                </button>
              </div>
            </div>

            {/* Precios Manuales de Mercado */}
            <div className="border-t border-slate-800 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Precios Manuales de Mercado
              </h4>

              {/* Precio Carne Cruda */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">
                    Venta de {selectedAnimal.meatNameEs} (🪙/u):
                  </label>
                  {onOpenAdpModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAdpModal(selectedAnimal.meatItemId, 'product')}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      [ADP]
                    </button>
                  )}
                </div>
                <NumericInput
                  value={rawMeatPrice}
                  onChange={(val) => handlePriceChange(meatPriceKey, val)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  placeholder="520"
                />
              </div>

              {/* Precio Animal Vivo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">
                    Venta de {selectedAnimal.nameEs} Vivo en Subasta (🪙/u):
                  </label>
                  {onOpenAdpModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAdpModal(selectedAnimal.id, 'product')}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      [ADP]
                    </button>
                  )}
                </div>
                <NumericInput
                  value={liveAnimalPrice}
                  onChange={(val) => handlePriceChange(livePriceKey, val)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                  placeholder="85000"
                />
              </div>

              {/* Precio Leche / Huevos (si aplica) */}
              {selectedAnimal.produceItemId && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">
                      Venta de {selectedAnimal.produceNameEs} (🪙/u):
                    </label>
                    {onOpenAdpModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAdpModal(selectedAnimal.produceItemId!, 'product')}
                        className="text-[10px] text-amber-400 hover:underline font-bold"
                      >
                        [ADP]
                      </button>
                    )}
                  </div>
                  <NumericInput
                    value={dairyProducePrice}
                    onChange={(val) => handlePriceChange(dairyPriceKey, val)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                    placeholder="380"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparativa Triple y Veredicto Estratégico (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-rose-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Cálculo de Matanza
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para procesar la rentabilidad neta de faenar {selectedAnimal.nameEs} ({config.animalsCount} u.) vs vender vivo en subasta sin interferencias previas.
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
                id="btn-calculate-butcher-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white ring-2 ring-rose-400/40 shadow-rose-500/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Matanza'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-slate-100">
                  Faenado de {selectedAnimal.nameEs} ({config.animalsCount} u.) Listo para Calcular
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ajusta tus precios de carne y del animal vivo en la izquierda. Presiona el botón{' '}
                  <strong className="text-rose-400">"Dar Resultado / Calcular Matanza"</strong> para procesar la comparativa financiera entre faenar en carnicería vs subasta o producción diaria.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCalculate}
                className="py-3 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer mt-1"
              >
                <Calculator size={18} />
                <span>Calcular Resultados Ahora</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tarjeta de Veredicto Principal */}
              <div
                className={`p-5 rounded-xl border shadow-lg space-y-3 ${
                  result.recommendedAction === 'SLAUGHTER_IN_CITY'
                    ? 'bg-rose-950/40 border-rose-500/80 text-white'
                    : result.recommendedAction === 'KEEP_FOR_PRODUCE'
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-white'
                    : 'bg-amber-950/40 border-amber-500/80 text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-amber-400" />
                    <h3 className="font-black text-sm uppercase tracking-wide">
                      Veredicto Estratégico de la Granja
                    </h3>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full font-mono bg-slate-950 border border-slate-800">
                    {result.recommendedAction === 'SLAUGHTER_IN_CITY'
                      ? '🥩 SACRIFICAR EN CARNICERÍA'
                      : result.recommendedAction === 'KEEP_FOR_PRODUCE'
                      ? '🥛 MANTENER VIVO (LECHE/HUEVOS)'
                      : '🏷️ VENDER VIVO EN MERCADO'}
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {result.verdictMessage}
                </p>
              </div>

              {/* Comparación Lado a Lado de las 3 Opciones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Opción 1: Sacrificar */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Beef size={14} />
                      <span>Carne Faenada</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{result.rrrPercent}% RRR</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Carne Total Extraída:</span>
                    <span className="text-lg font-black text-white font-mono">
                      {result.totalMeatYield.toLocaleString()} u.
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      ({result.baseMeatTotal} base + {result.bonusMeatFromRrr} devuelta)
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Ingreso Neto Final:</span>
                    <span className="text-base font-black text-rose-400 font-mono tabular-nums">
                      {formatSilver(result.netMeatRevenue)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Tras tasas ({formatSilver(result.stationNutritionSilverFee)}) e impuestos
                    </span>
                  </div>
                </div>

                {/* Opción 2: Vender Vivo */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Coins size={14} />
                      <span>Venta Vivo</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{config.animalsCount} animales</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cotización en Subasta:</span>
                    <span className="text-lg font-black text-white font-mono">
                      {formatSilver(liveAnimalPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Por animal adulto</span>
                  </div>
                  <div className="pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Ingreso Neto Subasta:</span>
                    <span className="text-base font-black text-amber-400 font-mono tabular-nums">
                      {formatSilver(result.liveAnimalNetRevenue)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Diferencia vs carne: {result.meatProfitVsLiveSale >= 0 ? '+' : ''}{formatSilver(-result.meatProfitVsLiveSale)}
                    </span>
                  </div>
                </div>

                {/* Opción 3: Mantener Vivo (Leche/Huevos) */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      <span>Leche / Huevos</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Ciclo 22h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Producción por Día:</span>
                    <span className="text-lg font-black text-white font-mono">
                      {result.dairyProduceUnitsPerCycle.toLocaleString()} u.
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedAnimal.produceNameEs || 'Sin producción diaria'}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block">Neto por Ciclo (22h):</span>
                    <span className="text-base font-black text-emerald-400 font-mono tabular-nums">
                      {formatSilver(result.dairyProduceNetRevenue)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {formatSilver(result.dairyProduceNetRevenue * 7)} proyectado a 7 días
                    </span>
                  </div>
                </div>
              </div>

              {/* Enlaces y Acciones Rápidas */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  💡 La carne cruda se utiliza directamente en la preparación de comidas (.0, .1, .2, .3) en la cocina.
                </div>

                {onNavigateToTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('value_added')}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Cocinar con esta Carne</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
