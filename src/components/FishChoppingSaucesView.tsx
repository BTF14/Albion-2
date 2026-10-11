import React, { useState } from 'react';
import {
  Fish,
  Waves,
  Sparkles,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  Scale,
  CookingPot,
  Calculator,
  RotateCcw,
  Check,
  AlertCircle,
  Truck,
  Flame,
} from 'lucide-react';
import { useFishingSaucesEconomy } from '../hooks/useFishingSaucesEconomy';
import { NumericInput } from './NumericInput';
import { formatSilver } from '../utils/albionColors';
import { AlbionDataQuickButton } from './AlbionDataQuickButton';

interface Props {
  onNavigateToValueAdded?: () => void;
  onNavigateToTransport?: () => void;
  onOpenAdpModal?: (itemId: string, targetType?: 'product' | 'seed_or_baby') => void;
}

export const FishChoppingSaucesView: React.FC<Props> = ({
  onNavigateToValueAdded,
  onNavigateToTransport,
  onOpenAdpModal,
}) => {
  const {
    config,
    updateConfig,
    resetToDefaults,
    syncPricesToWorkshop,
    result,
    currentTierInfo,
    fishTiers,
  } = useFishingSaucesEconomy();

  // Estados de ciclo de vida del botón "Dar Resultado"
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [syncedFeedback, setSyncedFeedback] = useState<boolean>(false);

  const handleConfigChange = (changes: Parameters<typeof updateConfig>[0]) => {
    updateConfig(changes);
    if (hasCalculated) {
      setIsStale(true);
    }
  };

  const handleCalculate = () => {
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  const handleSyncToWorkshop = () => {
    syncPricesToWorkshop();
    setSyncedFeedback(true);
    setTimeout(() => setSyncedFeedback(false), 2500);
  };

  const QUANTITY_PRESETS = [10, 50, 100, 250, 500, 1000];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Fish size={22} />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                Taller de Pesca, Fileteado y Salsas de Comida
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Módulo de Arbitraje Oficial de Albion Online. Compara con precisión si te conviene vender tu pesca entera cruda,
              filetearla en <strong>Pescado Picado</strong> (Chopped Fish) o craftear <strong>Salsas de Pescado (.1, .2, .3)</strong> con algas para encantar comidas en Caerleon con +15% de retorno.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800/80 px-4 py-2.5 rounded-xl self-start md:self-auto">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.hasPremium}
                onChange={(e) => handleConfigChange({ hasPremium: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span>Tasa Premium (4% + 2.5%)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Parámetros y Selección de Pescado */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Fish size={16} className="text-sky-400" />
              <span>1. Pescado Capturado o Comprado</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                resetToDefaults();
                if (hasCalculated) setIsStale(true);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Restablecer valores sugeridos por defecto"
            >
              Valores sugeridos
            </button>
          </div>

          {/* Selector de Tier */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Tier del Pescado
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {fishTiers.map((f) => {
                const isSelected = f.tier === config.fishTier;
                return (
                  <button
                    key={f.tier}
                    type="button"
                    onClick={() =>
                      handleConfigChange({
                        fishTier: f.tier,
                        fishMarketPriceSilver: f.estimatedMarketPriceSilver,
                      })
                    }
                    className={`py-2 px-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    T{f.tier}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-sky-400 font-medium">
                Especie: <strong>{currentTierInfo.nameEs}</strong>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Rinde {currentTierInfo.choppedFishYield} u. picado/pez
              </span>
            </div>
          </div>

          {/* Cantidad y Precios */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400">
                  Cantidad de Peces
                </label>
                <div className="flex items-center gap-1">
                  {QUANTITY_PRESETS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleConfigChange({ fishQuantity: q })}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition cursor-pointer ${
                        config.fishQuantity === q
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <NumericInput
                value={config.fishQuantity}
                onChange={(val) => handleConfigChange({ fishQuantity: val })}
                min={1}
                step={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400">
                  Precio Pescado Entero Crudo (🪙/u):
                </label>
                {onOpenAdpModal && currentTierInfo.itemId && (
                  <AlbionDataQuickButton
                    itemId={currentTierInfo.itemId}
                    onOpenModal={(id) => onOpenAdpModal(id, 'product')}
                    label="ADP"
                    className="text-[10px] px-1.5 py-0.2"
                  />
                )}
              </div>
              <NumericInput
                value={config.fishMarketPriceSilver}
                onChange={(val) => handleConfigChange({ fishMarketPriceSilver: val })}
                min={0}
                step={50}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Subasta e Insumos */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-400" />
                <span>Precios de Mercado de Subasta</span>
              </span>
              <button
                type="button"
                onClick={handleSyncToWorkshop}
                className={`text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                  syncedFeedback
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800'
                }`}
                title="Sincronizar estos precios con el taller de cocina y comparador de encantamiento"
              >
                {syncedFeedback ? (
                  <>
                    <Check size={10} />
                    <span>¡Sincronizado!</span>
                  </>
                ) : (
                  <span>Guardar a Taller</span>
                )}
              </button>
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400">
                  Pescado Picado (Chopped Fish) / u:
                </label>
                {onOpenAdpModal && (
                  <AlbionDataQuickButton
                    itemId="T1_FISH_CHOPPED"
                    onOpenModal={(id) => onOpenAdpModal(id, 'product')}
                    label="ADP"
                    className="text-[10px] px-1.5 py-0.2"
                  />
                )}
              </div>
              <NumericInput
                value={config.choppedFishMarketPriceSilver}
                onChange={(val) => handleConfigChange({ choppedFishMarketPriceSilver: val })}
                min={0}
                step={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400">
                  Alga Marina (Seaweed) / u:
                </label>
                {onOpenAdpModal && (
                  <AlbionDataQuickButton
                    itemId="T1_SEAWEED"
                    onOpenModal={(id) => onOpenAdpModal(id, 'product')}
                    label="ADP"
                    className="text-[10px] px-1.5 py-0.2"
                  />
                )}
              </div>
              <NumericInput
                value={config.seaweedMarketPriceSilver}
                onChange={(val) => handleConfigChange({ seaweedMarketPriceSilver: val })}
                min={0}
                step={20}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            {/* Salsas de Pescado */}
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Precio de Venta en Mercado por Salsa (🪙/u):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-emerald-400 font-bold">
                      Salsa .1
                    </label>
                    {onOpenAdpModal && (
                      <AlbionDataQuickButton
                        itemId="T1_FISHSAUCE_LEVEL1"
                        onOpenModal={(id) => onOpenAdpModal(id, 'product')}
                        label="ADP"
                        className="text-[9px] px-1 py-0"
                      />
                    )}
                  </div>
                  <NumericInput
                    value={config.basicSaucePriceSilver}
                    onChange={(val) => handleConfigChange({ basicSaucePriceSilver: val })}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-sky-400 font-bold">
                      Salsa .2
                    </label>
                    {onOpenAdpModal && (
                      <AlbionDataQuickButton
                        itemId="T1_FISHSAUCE_LEVEL2"
                        onOpenModal={(id) => onOpenAdpModal(id, 'product')}
                        label="ADP"
                        className="text-[9px] px-1 py-0"
                      />
                    )}
                  </div>
                  <NumericInput
                    value={config.fancySaucePriceSilver}
                    onChange={(val) => handleConfigChange({ fancySaucePriceSilver: val })}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-purple-400 font-bold">
                      Salsa .3
                    </label>
                    {onOpenAdpModal && (
                      <AlbionDataQuickButton
                        itemId="T1_FISHSAUCE_LEVEL3"
                        onOpenModal={(id) => onOpenAdpModal(id, 'product')}
                        label="ADP"
                        className="text-[9px] px-1 py-0"
                      />
                    )}
                  </div>
                  <NumericInput
                    value={config.specialSaucePriceSilver}
                    onChange={(val) => handleConfigChange({ specialSaucePriceSilver: val })}
                    min={0}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Tasa de Nutrición */}
            <div className="pt-2">
              <label className="block text-[11px] text-slate-400 mb-1">
                Tasa de Estación de Cocina (Plata por 100 Nutrición):
              </label>
              <NumericInput
                value={config.nutritionFeePer100 ?? 250}
                onChange={(val) => handleConfigChange({ nutritionFeePer100: val })}
                min={0}
                step={50}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                0 si crafteas en tu isla personal; 200-350 en tiendas públicas de ciudad.
              </span>
            </div>
          </div>
        </div>

        {/* Columna 2 & 3: Comparativa de Arbitraje y Veredicto */}
        <div className="lg:col-span-2 space-y-5">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-sky-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Arbitraje de Pesca & Salsas
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para procesar la rentabilidad neta de vender {currentTierInfo.nameEs} ({config.fishQuantity} u.) entero vs picar vs craftear salsas (.1, .2, .3) sin interferencias previas.
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
                id="btn-calculate-fishing-sauces-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-sky-600 to-amber-600 hover:from-sky-500 hover:to-amber-500 text-white ring-2 ring-sky-400/40 shadow-sky-500/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Arbitraje'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            /* Estado de Espera: Mensaje claro para presionar Dar Resultado */
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-bold text-slate-100">
                  {currentTierInfo.nameEs} ({config.fishQuantity} u.) Listo para Calcular
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ajusta tus precios de pescado entero, picado, algas y cotizaciones de salsas a la izquierda. Presiona el botón{' '}
                  <strong className="text-sky-400">"Dar Resultado / Calcular Arbitraje"</strong> para procesar la comparativa financiera lado a lado.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCalculate}
                className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer mt-1"
              >
                <Calculator size={18} />
                <span>Calcular Resultados Ahora</span>
              </button>
            </div>
          ) : (
            /* Resultados Calculados */
            <>
              {/* Tarjeta de Veredicto Estratégico */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Veredicto del Analizador
                    </span>
                    <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                      <span>{result.verdictTitleEs}</span>
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      {result.verdictDescriptionEs}
                    </p>
                  </div>

                  <div className="text-right shrink-0 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Ingreso Neto Máximo</span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      +{formatSilver(result.bestActionNetRevenue)} 🪙
                    </span>
                  </div>
                </div>
              </div>

              {/* Comparativa Triple Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Opción 1: Vender Entero */}
                <div className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${result.bestAction === 'SELL_RAW_FISH' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Fish size={14} className="text-sky-400" />
                      <span>Venta Cruda Entera</span>
                    </span>
                    {result.bestAction === 'SELL_RAW_FISH' && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Bruto ({config.fishQuantity} u.):</span>
                      <span className="font-mono text-slate-300">{formatSilver(result.rawFishGrossRevenue)} 🪙</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Impuestos ({config.hasPremium ? '6.5%' : '10.5%'}):</span>
                      <span className="font-mono text-slate-400">-{formatSilver(result.rawFishGrossRevenue - result.rawFishNetRevenue)} 🪙</span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                      <span>Ingreso Neto:</span>
                      <span className="font-mono text-sky-400">{formatSilver(result.rawFishNetRevenue)} 🪙</span>
                    </div>
                  </div>
                </div>

                {/* Opción 2: Filetear (Chopped Fish) */}
                <div className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${result.bestAction === 'CHOP_AND_SELL' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Layers size={14} className="text-amber-400" />
                      <span>Filetear Picado</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {result.totalChoppedFishYield} u.
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Bruto Picado:</span>
                      <span className="font-mono text-slate-300">{formatSilver(result.choppedFishGrossRevenue)} 🪙</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Dif. vs Entero:</span>
                      <span className={`font-mono font-bold ${result.choppedProfitVsRawFish >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {result.choppedProfitVsRawFish >= 0 ? '+' : ''}{formatSilver(result.choppedProfitVsRawFish)} 🪙
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-200 font-bold pt-1 border-t border-slate-800">
                      <span>Ingreso Neto:</span>
                      <span className="font-mono text-amber-400">{formatSilver(result.choppedFishNetRevenue)} 🪙</span>
                    </div>
                  </div>
                </div>

                {/* Opción 3: Mejor Salsa */}
                <div className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${result.bestAction.startsWith('CRAFT_') ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <CookingPot size={14} className="text-purple-400" />
                      <span>Crafteo de Salsas</span>
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">.1 / .2 / .3</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {result.saucesAnalysis.map((s) => (
                      <div key={s.recipe.id} className="flex justify-between items-center text-[11px] bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-300">{s.recipe.nameEs}:</span>
                        <span className={`font-mono font-bold ${s.netProfitVsRawFish >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.netProfitVsRawFish >= 0 ? '+' : ''}{formatSilver(s.netProfitVsRawFish)} 🪙
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desglose Detallado de Recetas de Salsas */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Análisis Detallado por Receta de Salsa de Cocina</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    {onNavigateToTransport && (
                      <button
                        type="button"
                        onClick={onNavigateToTransport}
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-semibold"
                        title="Calcular transporte a Caerleon para vender o craftear con +15% RRR"
                      >
                        <Truck size={12} />
                        <span>Transporte</span>
                      </button>
                    )}
                    {onNavigateToValueAdded && (
                      <button
                        type="button"
                        onClick={onNavigateToValueAdded}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <span>Ir a Cocina & Alquimia</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.saucesAnalysis.map((s) => (
                    <div
                      key={s.recipe.id}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-xs shadow-inner"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                        <span className="font-bold text-slate-100">{s.recipe.nameEs}</span>
                        <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-sky-300 border border-slate-800">
                          {s.totalSaucesOutput} u. ({s.possibleBatches} lotes)
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Insumos usados:</span>
                          <span className="font-mono text-slate-300">
                            {s.choppedFishUsed} picado + {s.possibleBatches * s.recipe.seaweedRequired} algas
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Coste algas:</span>
                          <span className="font-mono text-slate-300">-{formatSilver(s.extraSeaweedCost)} 🪙</span>
                        </div>

                        {s.stationFeeSilver > 0 && (
                          <div className="flex justify-between">
                            <span>Tasa estación cocina:</span>
                            <span className="font-mono text-slate-400">-{formatSilver(s.stationFeeSilver)} 🪙</span>
                          </div>
                        )}

                        {s.leftoverChoppedFish > 0 && (
                          <div className="flex justify-between text-amber-400/90 bg-amber-500/5 px-1.5 py-0.5 rounded">
                            <span>Picado sobrante ({s.leftoverChoppedFish} u.):</span>
                            <span className="font-mono font-bold">+{formatSilver(s.leftoverChoppedFishNetValue)} 🪙</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                          <span>Coste crafteo u. vs Mercado:</span>
                          <span className="font-mono text-[11px]">
                            {s.craftCostPerUnit} 🪙 / {s.marketPricePerUnit} 🪙
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span>Umbral Alga (Break-Even):</span>
                          <span className="font-mono text-sky-300 font-semibold">
                            ≤ {formatSilver(s.seaweedBreakEvenPrice)} 🪙/u
                          </span>
                        </div>

                        <div className="flex justify-between font-bold text-slate-100 pt-1.5 border-t border-slate-800">
                          <span>Ingreso Neto Total:</span>
                          <span className="font-mono text-emerald-400 text-sm">
                            +{formatSilver(s.totalNetWithLeftover)} 🪙
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Ganancia vs Entero:</span>
                          <span
                            className={`font-mono font-bold ${
                              s.netProfitVsRawFish >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {s.netProfitVsRawFish >= 0 ? '+' : ''}{formatSilver(s.netProfitVsRawFish)} 🪙 (ROI {s.roiPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tarjeta de Bono de Caerleon */}
                <div className="bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-500/30 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                      <CookingPot size={18} />
                    </span>
                    <div>
                      <span className="font-bold text-purple-300 block">
                        Bono Estratégico de Caerleon (+15% RRR en Cocina)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Al cocinar tus comidas encantadas en Caerleon con estas salsas, obtienes una tasa de retorno de recursos del <strong>24.8%</strong> (o hasta <strong>47.9%</strong> con foco). Las salsas devueltas aumentan aún más tu rentabilidad final.
                      </p>
                    </div>
                  </div>
                  {onNavigateToValueAdded && (
                    <button
                      type="button"
                      onClick={onNavigateToValueAdded}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm transition"
                    >
                      Cocinar en Caerleon
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
