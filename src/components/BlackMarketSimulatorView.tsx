import React, { useState } from 'react';
import {
  Skull,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  DollarSign,
  Package,
  Layers,
  Save,
  HelpCircle,
  Percent,
  Flame,
  RotateCcw,
  Calculator,
} from 'lucide-react';
import { useBlackMarketSimulator } from '../hooks/useBlackMarketSimulator';
import { NumericInput } from './NumericInput';
import { AlbionDataQuickButton } from './AlbionDataQuickButton';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import { CITIES } from '../data/items';
import { CityInfo, CityId } from '../types';
import { CraftEquipmentRecipe, CraftingMaterialRequirement } from '../domain/models/equipmentCrafting';

const CRAFTING_STATIONS = [
  { id: 'all', nameEs: 'Todas las Estaciones' },
  { id: 'forge', nameEs: 'Forja del Guerrero (Blacksmith)' },
  { id: 'hunter', nameEs: 'Cabaña del Cazador (Fletcher)' },
  { id: 'mage', nameEs: 'Torre del Mago (Imbuer)' },
  { id: 'toolmaker', nameEs: 'Taller de Hojalatero (Tinker)' },
];

interface BlackMarketSimulatorViewProps {
  onOpenAdpModal?: (itemId: string, targetType: 'product' | 'seed_or_baby') => void;
}

export const BlackMarketSimulatorView: React.FC<BlackMarketSimulatorViewProps> = ({
  onOpenAdpModal,
}) => {
  const {
    config,
    updateConfig,
    allRecipes,
    selectedRecipe,
    materialUnitCosts,
    updateMaterialPrice,
    currentBlackMarketPrice,
    setBlackMarketPrice,
    simulationResult,
    logSaleToLedger,
  } = useBlackMarketSimulator();

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleConfigChange = (newConfig: Parameters<typeof updateConfig>[0]) => {
    updateConfig(newConfig);
    if (hasCalculated) setIsStale(true);
  };

  const handleMaterialPriceChange = (id: string, val: number) => {
    updateMaterialPrice(id, val);
    if (hasCalculated) setIsStale(true);
  };

  const handleBlackMarketPriceChange = (val: number) => {
    setBlackMarketPrice(val);
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

  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<number>(0);
  const [showSavedFeedback, setShowSavedFeedback] = useState<boolean>(false);
  const feedbackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  // Filtrado de catálogo de recetas oficiales
  const filteredRecipes = allRecipes.filter((recipe: CraftEquipmentRecipe) => {
    if (selectedStation !== 'all' && recipe.station !== selectedStation) return false;
    if (selectedTierFilter > 0 && recipe.tier !== selectedTierFilter) return false;
    return true;
  });

  const handleLogSale = () => {
    logSaleToLedger();
    setShowSavedFeedback(true);
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => setShowSavedFeedback(false), 2800);
  };

  const getVerdictBadge = () => {
    switch (simulationResult.verdict) {
      case 'IMMEDIATE_PROFIT':
        return (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-4 flex items-start gap-3 shadow-md">
            <CheckCircle2 size={24} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-emerald-300 font-bold text-sm flex items-center gap-2">
                <span>VENTA INMEDIATA RECOMENDADA</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Rentable
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                {simulationResult.verdictMessage}
              </p>
            </div>
          </div>
        );
      case 'WAIT_ORDER_TICK':
        return (
          <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3 shadow-md">
            <Clock size={24} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-amber-300 font-bold text-sm flex items-center gap-2">
                <span>ESPERAR AUMENTO DE TICK EN EL MERCADO NEGRO</span>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  En Alza
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                {simulationResult.verdictMessage}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3 shadow-md">
            <AlertCircle size={24} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-rose-300 font-bold text-sm flex items-center gap-2">
                <span>ORDEN POR DEBAJO DEL COSTE DE PRODUCCIÓN</span>
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  No Vender
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                {simulationResult.verdictMessage}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div id="black-market-simulator-container" className="space-y-6">
      {/* Encabezado Principal de Caerleon */}
      <div
        id="bm-header-card"
        className="bg-slate-900 border border-red-900/40 rounded-xl p-5 shadow-lg relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center text-white shadow-md border border-red-500/30">
              <Skull size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Simulador de Órdenes del Mercado Negro</span>
                <span className="text-xs bg-red-900/80 text-red-200 border border-red-700/60 font-semibold px-2 py-0.5 rounded-full">
                  Caerleon
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cálculo de coste de crafteo en Ciudades Reales vs precio umbral y subida por tick en el Mercado Negro.
              </p>
            </div>
          </div>

          {/* Selector de Tipo de Orden oficial de Albion */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              id="bm-order-type-buy"
              onClick={() => updateConfig({ orderType: 'instant_buy_order' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.orderType === 'instant_buy_order'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              ⚡ Orden de Compra Directa (0% Impuestos)
            </button>
            <button
              type="button"
              id="bm-order-type-sell"
              onClick={() => updateConfig({ orderType: 'custom_sell_order' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                config.orderType === 'custom_sell_order'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📜 Orden de Venta Propia (Tasas +2.5%)
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Ítem y Filtros Rápidos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Layers size={14} className="text-amber-400" />
              Filtrar Estación:
            </span>
            {CRAFTING_STATIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStation(st.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedStation === st.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st.nameEs.split(' ')[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Tier:</span>
            {[0, 4, 5, 6, 7, 8].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTierFilter(t)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedTierFilter === t
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t === 0 ? 'Todos' : `T${t}`}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Receta / Ítem */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Seleccionar Equipo a Fabricar:
            </label>
            <select
              id="bm-select-recipe"
              value={config.selectedRecipeId}
              onChange={(e) => {
                const targetRecipe = allRecipes.find((r) => r.id === e.target.value);
                updateConfig({
                  selectedRecipeId: e.target.value,
                  tier: targetRecipe ? targetRecipe.tier : config.tier,
                });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-medium focus:outline-none focus:border-red-500"
            >
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((r: CraftEquipmentRecipe) => (
                  <option key={r.id} value={r.id}>
                    {r.nameEs} ({r.nameEn}) - Tier {r.tier}
                  </option>
                ))
              ) : (
                <option value={selectedRecipe.id}>
                  {selectedRecipe.nameEs} ({selectedRecipe.nameEn}) - Tier {selectedRecipe.tier}
                </option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Encantamiento:
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((enc) => (
                <button
                  key={enc}
                  type="button"
                  onClick={() => updateConfig({ enchantment: enc })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    config.enchantment === enc
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  .{enc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Central: Parámetros de Fabricación vs Oferta del Mercado Negro */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Entorno de Crafteo y Costes de Materiales (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-cyan-400" />
                <span>Entorno de Crafteo (Origen)</span>
              </div>
              <AlbionItemBadge tier={selectedRecipe.tier} enchantment={config.enchantment} />
            </h3>

            {/* Ciudad de Fabricación */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Ciudad donde fabricarás el equipo:
              </label>
              <select
                id="bm-select-city"
                value={config.craftingCity}
                onChange={(e) => updateConfig({ craftingCity: e.target.value as CityId })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-semibold focus:outline-none focus:border-cyan-500"
              >
                {CITIES.map((c: CityInfo) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.biome})
                  </option>
                ))}
              </select>
            </div>

            {/* Opciones de Foco y Tasa de Nutrición */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Puntos de Foco:
                </label>
                <button
                  type="button"
                  onClick={() => updateConfig({ useFocus: !config.useFocus })}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    config.useFocus
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Sparkles size={14} />
                  <span>{config.useFocus ? 'Con Foco' : 'Sin Foco'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tasa Taller (x100 Nutrición):
                </label>
                <NumericInput
                  id="bm-station-fee-input"
                  value={config.stationFeePer100Nutrition}
                  onChange={(val) => updateConfig({ stationFeePer100Nutrition: val })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  placeholder="350"
                />
              </div>
            </div>

            {/* Tamaño del Lote y ROI Objetivo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Cantidad del Lote:
                </label>
                <NumericInput
                  id="bm-batch-quantity-input"
                  value={config.batchQuantity}
                  onChange={(val) => updateConfig({ batchQuantity: Math.max(1, val) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  ROI Objetivo Deseado (%):
                </label>
                <div className="relative">
                  <NumericInput
                    id="bm-target-roi-input"
                    value={config.targetRoiPercentage}
                    onChange={(val) => updateConfig({ targetRoiPercentage: Math.max(0, val) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono pr-7"
                    placeholder="25"
                  />
                  <Percent size={12} className="absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Costes de Materiales Brutos */}
            <div className="border-t border-slate-800 pt-3 space-y-2">
              <span className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>Precios Manuales de Materiales:</span>
                <span className="text-[10px] text-slate-500 font-normal">Plata / Unidad</span>
              </span>

              {selectedRecipe.materials.map((mat: CraftingMaterialRequirement, idx: number) => {
                const currentCost = materialUnitCosts[mat.materialId] || 1500;
                return (
                  <div
                    key={`${mat.materialId}-${idx}`}
                    className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800"
                  >
                    <div className="text-xs">
                      <span className="font-semibold text-slate-200">{mat.nameEs}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">
                        (x{mat.amount} por pieza)
                      </span>
                    </div>

                    <div className="w-28">
                      <NumericInput
                        id={`bm-mat-cost-${mat.materialId}`}
                        value={currentCost}
                        onChange={(val) => updateMaterialPrice(mat.materialId, val)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono"
                        placeholder="1800"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Oferta del Mercado Negro, Umbrales y Veredicto (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-red-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-red-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Simulación del Mercado Negro
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para simular umbrales de equilibrio, margen ROI y veredicto de venta sin residuos de cálculos previos.
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
                id="btn-calculate-black-market-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white ring-2 ring-red-400/40 shadow-red-600/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-red-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Simular Pedidos'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Esperando Activación Manual
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Selecciona el equipo ({selectedRecipe.nameEs} T{config.tier}), introduce los costes de materiales y presiona el botón{' '}
                <strong className="text-red-300">"Dar Resultado / Simular Pedidos"</strong> para obtener el veredicto estratégico y umbrales de Caerleon.
              </p>
            </div>
          ) : (
            <>
          {/* Tarjeta de Entrada de Precio de la Orden del Mercado Negro */}
          <div className="bg-slate-900 border border-red-900/50 rounded-xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign size={16} className="text-red-400" />
                <span>Oferta de Compra Actual en Mercado Negro</span>
              </h3>
              {onOpenAdpModal && (
                <AlbionDataQuickButton
                  itemId={selectedRecipe.id}
                  targetType="product"
                  onOpenModal={onOpenAdpModal}
                  label="Ver ADP"
                />
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Precio unitario ofrecido por el Mercado Negro:
                </label>
                <p className="text-[11px] text-slate-500">
                  Introduce el valor que ves en la pantalla de Caerleon.
                </p>
              </div>

              <div className="w-full sm:w-48">
                <div className="relative">
                  <NumericInput
                    id="bm-current-price-input"
                    value={currentBlackMarketPrice}
                    onChange={(val) => setBlackMarketPrice(val)}
                    className="w-full bg-slate-900 border border-red-500/60 rounded-lg px-3 py-2 text-base font-bold text-amber-300 font-mono text-right"
                    placeholder="15000"
                  />
                  <span className="text-[10px] text-slate-500 absolute left-2.5 top-2.5 font-bold">
                    SILVER
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Veredicto Estratégico */}
          {getVerdictBadge()}

          {/* Comparativa de Umbrales Financieros */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Umbrales de Rentabilidad Calculados (Por Unidad)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Coste Neto de Crafteo */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Coste Neto Real Crafteo:
                </span>
                <span className="text-base font-bold text-slate-200 font-mono tabular-nums mt-0.5 block">
                  {formatSilver(simulationResult.netCraftingCostPerUnit)}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block tabular-nums">
                  RRR {simulationResult.rrrEffectivePercentage}% aplicado
                </span>
              </div>

              {/* Precio Umbral de Equilibrio (Break-Even) */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Precio Mínimo (Break-Even):
                </span>
                <span className="text-base font-bold text-amber-400 font-mono tabular-nums mt-0.5 block">
                  {formatSilver(simulationResult.breakEvenPrice)}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  0% ganancia / no pierdes
                </span>
              </div>

              {/* Precio Objetivo para ROI Deseado */}
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40">
                <span className="text-[11px] font-semibold text-emerald-400 block">
                  Precio Objetivo (+{config.targetRoiPercentage}% ROI):
                </span>
                <span className="text-base font-bold text-emerald-300 font-mono tabular-nums mt-0.5 block">
                  {formatSilver(simulationResult.targetRoiPrice)}
                </span>
                <span className="text-[10px] text-emerald-500/80 mt-1 block">
                  Meta para venta óptima
                </span>
              </div>
            </div>

            {/* Balance Final del Lote */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Inversión Lote</span>
                <span className="text-xs font-bold text-slate-300 font-mono tabular-nums">
                  {formatSilver(simulationResult.totalBatchCraftingCost)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Ingreso Bruto Lote</span>
                <span className="text-xs font-bold text-slate-300 font-mono tabular-nums">
                  {formatSilver(simulationResult.currentBlackMarketPrice * config.batchQuantity)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Beneficio Neto</span>
                <span
                  className={`text-xs font-black font-mono tabular-nums ${
                    simulationResult.totalBatchNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simulationResult.totalBatchNetProfit > 0 ? '+' : ''}
                  {formatSilver(simulationResult.totalBatchNetProfit)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">ROI Real</span>
                <span
                  className={`text-xs font-black font-mono tabular-nums ${
                    simulationResult.actualRoiPercentage >= config.targetRoiPercentage
                      ? 'text-emerald-400'
                      : simulationResult.actualRoiPercentage > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {simulationResult.actualRoiPercentage > 0 ? '+' : ''}
                  {simulationResult.actualRoiPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Botón de Acción Directa: Registrar en Libro Mayor */}
          <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400">
              ¿Completaste esta entrega en Caerleon? Regístrala directamente en tu historial contable.
            </div>

            <button
              type="button"
              id="bm-log-sale-btn"
              onClick={handleLogSale}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
            >
              <Save size={14} />
              <span>Registrar Venta en Libro Mayor</span>
            </button>
          </div>

          {showSavedFeedback && (
            <div className="bg-emerald-950 border border-emerald-500/60 text-emerald-200 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>¡Venta registrada con éxito en el Libro Mayor de Ventas y Caerleon!</span>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
