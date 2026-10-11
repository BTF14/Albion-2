import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AlbionItem, CityId, PriceMemory, DestinyMasteryProfile } from '../types';
import { ALBION_ITEMS, CITIES } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { NumericInput } from './NumericInput';
import { loadMasteryProfile, calculateFocusCost } from '../utils/destinyBoard';
import { calculateHarvestEconomy } from '../domain/use-cases/calculateHarvestEconomy';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import {
  Calculator,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Zap,
  Trophy,
  ArrowUpDown,
  Utensils,
  ArrowRight,
  Save,
  RotateCcw,
  Check,
  MapPin,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export interface SimulatorRow {
  item: AlbionItem;
  hasBonus: boolean;
  prices: { seedPrice: number; productPrice: number };
  yieldPerSlot: number;
  totalHarvest: number;
  expectedRebought: number;
  expectedSurplusSeeds: number;
  expectedSeedCost: number;
  foodCost: number;
  productGross: number;
  surplusNet: number;
  netRev: number;
  netProfit: number;
  profitPerSlot: number;
  isProfit: boolean;
  focusCostPerSlot: number;
  totalFocusNeeded: number;
  fitsInDailyFocus: boolean;
  silverPerFocus: number;
  slotsPer10k: number;
}

interface Props {
  selectedCityId: CityId;
  onSelectCity?: (city: CityId) => void;
  defaultPlots: number;
  defaultTaxRate?: number;
  priceMemory: PriceMemory;
  initialItemId?: string;
  onUpdatePrices?: (
    itemId: string,
    prices: { lastSeedPrice?: number; lastProductPrice?: number; lastFoodPrice?: number }
  ) => void;
  onNavigateToLoggerWithPreset?: (preset: {
    cityId: CityId;
    itemId?: string;
    plotsCount?: number;
    targetDate?: string;
  }) => void;
}

export const QuickSimulator: React.FC<Props> = ({
  selectedCityId,
  onSelectCity,
  defaultPlots,
  defaultTaxRate = 6.5,
  priceMemory,
  initialItemId,
  onUpdatePrices,
  onNavigateToLoggerWithPreset,
}) => {
  const [activeCategory, setActiveCategory] = useState<'crop' | 'herb' | 'animal'>('crop');
  const [simPlots, setSimPlots] = useState<number>(defaultPlots);
  const [simTaxRate, setSimTaxRate] = useState<number>(defaultTaxRate); // Impuesto de orden de venta
  const [useFocusSimulation, setUseFocusSimulation] = useState<boolean>(true);
  const [livestockFeedCost, setLivestockFeedCost] = useState<number>(0); // 0 = comida propia
  const [sortBy, setSortBy] = useState<'profit' | 'profitPerSlot' | 'silverPerFocus' | 'tier'>('profit');
  const [highlightedItemId, setHighlightedItemId] = useState<string | undefined>(initialItemId);

  // Sincronizar selección inicial externa (por ej. desde Analytics)
  useEffect(() => {
    if (initialItemId) {
      const item = ALBION_ITEMS.find((i) => i.id === initialItemId);
      if (item) {
        if (item.category === 'crop') setActiveCategory('crop');
        else if (item.category === 'herb') setActiveCategory('herb');
        else setActiveCategory('animal');
        setHighlightedItemId(item.id);
      }
    }
  }, [initialItemId]);

  // Perfil de maestría de la Tabla del Destino sincronizado en tiempo real
  const [masteryProfile, setMasteryProfile] = useState<DestinyMasteryProfile>(() => loadMasteryProfile());

  useEffect(() => {
    const handleMasteryUpdate = () => {
      setMasteryProfile(loadMasteryProfile());
    };
    window.addEventListener('albion_mastery_updated', handleMasteryUpdate);
    window.addEventListener('storage', handleMasteryUpdate);
    return () => {
      window.removeEventListener('albion_mastery_updated', handleMasteryUpdate);
      window.removeEventListener('storage', handleMasteryUpdate);
    };
  }, []);

  // Precios editables para simulación
  const [customPrices, setCustomPrices] = useState<{
    [itemId: string]: { seedPrice: number; productPrice: number };
  }>({});

  const [savedPricesFeedback, setSavedPricesFeedback] = useState<boolean>(false);
  const savedFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedFeedbackTimeoutRef.current) {
        clearTimeout(savedFeedbackTimeoutRef.current);
      }
    };
  }, []);

  const currentCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];

  const filteredItems = useMemo(() => {
    if (activeCategory === 'crop') return ALBION_ITEMS.filter((i) => i.category === 'crop');
    if (activeCategory === 'herb') return ALBION_ITEMS.filter((i) => i.category === 'herb');
    return ALBION_ITEMS.filter((i) => i.category === 'animal_produce' || i.category === 'animal_meat');
  }, [activeCategory]);

  const getPrice = (itemId: string, defaultSeed: number, defaultProduct: number) => {
    const custom = customPrices[itemId];
    const mem = priceMemory[itemId];
    return {
      seedPrice: custom?.seedPrice ?? mem?.lastSeedPrice ?? defaultSeed,
      productPrice: custom?.productPrice ?? mem?.lastProductPrice ?? defaultProduct,
    };
  };

  const handlePriceChange = (itemId: string, field: 'seedPrice' | 'productPrice', value: number) => {
    setCustomPrices((prev) => ({
      ...prev,
      [itemId]: {
        seedPrice: field === 'seedPrice' ? value : prev[itemId]?.seedPrice ?? 2500,
        productPrice: field === 'productPrice' ? value : prev[itemId]?.productPrice ?? 350,
      },
    }));
  };

  const handleResetPrices = () => {
    setCustomPrices({});
  };

  const handleSaveAllPricesToMemory = () => {
    if (!onUpdatePrices) return;
    Object.entries(customPrices).forEach(([itemId, p]: [string, { seedPrice: number; productPrice: number }]) => {
      onUpdatePrices(itemId, {
        lastSeedPrice: p.seedPrice,
        lastProductPrice: p.productPrice,
      });
    });
    setSavedPricesFeedback(true);
    if (savedFeedbackTimeoutRef.current) {
      clearTimeout(savedFeedbackTimeoutRef.current);
    }
    savedFeedbackTimeoutRef.current = setTimeout(() => setSavedPricesFeedback(false), 2000);
  };

  const simSlots = Math.max(1, simPlots) * 9;

  const [calculatedRows, setCalculatedRows] = useState<SimulatorRow[] | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Marcar como desactualizado si los parámetros de simulación cambian
  useEffect(() => {
    if (calculatedRows) {
      setIsStale(true);
    }
  }, [
    filteredItems,
    selectedCityId,
    simPlots,
    simTaxRate,
    useFocusSimulation,
    livestockFeedCost,
    customPrices,
    priceMemory,
    masteryProfile,
    sortBy,
  ]);

  const handleTriggerCalculation = () => {
    const rows = filteredItems.map((item) => {
      const hasBonus =
        (selectedCityId === 'brecilien' && item.category === 'crop') ||
        item.bonusCityIds.includes(selectedCityId);

      // Precios por defecto estimados
      const defaultSeed =
        item.category === 'animal_produce'
          ? 0
          : item.category === 'animal_meat'
          ? 3000 + item.tier * 1000
          : 2000 + item.tier * 400;
      const defaultProd = 300 + item.tier * 60;

      const prices = getPrice(item.id, defaultSeed, defaultProd);

      // Costo de foco según la Tabla del Destino real del jugador
      const focusCostData = calculateFocusCost(item.id, masteryProfile);
      const focusCostPerSlot = focusCostData.focusCostPerSlot;
      const totalFocusNeeded = useFocusSimulation ? focusCostPerSlot * simSlots : 0;
      const fitsInDailyFocus = totalFocusNeeded <= 10000;

      // Estimación de retorno de semillas/crías CON foco
      const returnRatePercentWithFocus = item.defaultSeedReturnWithFocus;
      const rawReturnedWithFocus =
        item.category === 'animal_produce'
          ? simSlots
          : (simSlots * returnRatePercentWithFocus) / 100;
      const expectedReboughtWithFocus = Math.max(0, simSlots - Math.min(simSlots, rawReturnedWithFocus));
      const expectedSurplusSeedsWithFocus = Math.max(0, rawReturnedWithFocus - simSlots);
      const expectedSeedCostWithFocus = Math.round(expectedReboughtWithFocus * prices.seedPrice);

      // Estimación de retorno de semillas/crías SIN foco
      const returnRatePercentWithoutFocus = item.defaultSeedReturnWithoutFocus;
      const rawReturnedWithoutFocus =
        item.category === 'animal_produce'
          ? simSlots
          : (simSlots * returnRatePercentWithoutFocus) / 100;
      const expectedReboughtWithoutFocus = Math.max(0, simSlots - Math.min(simSlots, rawReturnedWithoutFocus));
      const expectedSeedCostWithoutFocus = Math.round(expectedReboughtWithoutFocus * prices.seedPrice);

      // Variables activas según el toggle useFocusSimulation
      const expectedRebought = useFocusSimulation ? expectedReboughtWithFocus : expectedReboughtWithoutFocus;
      const expectedSurplusSeeds = useFocusSimulation ? expectedSurplusSeedsWithFocus : 0;

      // Rendimiento: base por casilla con bono de ciudad si aplica (+10% en ciudades reales, +15% en Brecilien)
      const bonusMultiplier =
        selectedCityId === 'brecilien' && item.category === 'crop'
          ? 1.15
          : hasBonus
          ? 1.10
          : 1.0;
      const yieldPerSlot = item.defaultYieldPerSlot * bonusMultiplier;
      const totalHarvest = Math.round(simSlots * yieldPerSlot);
      const isLivestock = item.category === 'animal_produce' || item.category === 'animal_meat';

      // Delegación pura al Caso de Uso de Dominio (Clean Architecture)
      const econ = calculateHarvestEconomy({
        category: item.category,
        tier: item.tier,
        plotsCount: simPlots,
        slotsCount: simSlots,
        returnedSeeds: Math.max(0, simSlots - expectedRebought + expectedSurplusSeeds),
        reboughtSeeds: expectedRebought,
        seedUnitPrice: prices.seedPrice,
        surplusSeeds: expectedSurplusSeeds,
        monetizeSurplus: true,
        harvestedAmount: totalHarvest,
        productUnitPrice: prices.productPrice,
        requiresFood: isLivestock,
        foodUnits: isLivestock ? simSlots * 10 : 0,
        foodUnitPrice: livestockFeedCost,
        usesOwnCropForFood: false,
        butcherFee: 0,
        usedFocus: useFocusSimulation,
        focusPointsSpent: totalFocusNeeded,
        taxPercent: simTaxRate,
      });

      const netRev = econ.netRevenue;
      const netProfit = econ.netProfit;
      const profitPerSlot = econ.profitPerSlot;
      const isProfit = econ.isProfitable;
      const expectedSeedCost = econ.seedsCost;
      const foodCost = econ.foodCost;
      const productGross = econ.productGross;
      const surplusNet = econ.surplusNet;

      // Beneficio neto teórico SIN foco para medir el delta de Plata / Foco
      const econWithoutFocus = calculateHarvestEconomy({
        category: item.category,
        tier: item.tier,
        plotsCount: simPlots,
        slotsCount: simSlots,
        returnedSeeds: Math.max(0, simSlots - expectedReboughtWithoutFocus),
        reboughtSeeds: expectedReboughtWithoutFocus,
        seedUnitPrice: prices.seedPrice,
        surplusSeeds: 0,
        monetizeSurplus: false,
        harvestedAmount: totalHarvest,
        productUnitPrice: prices.productPrice,
        requiresFood: isLivestock,
        foodUnits: isLivestock ? simSlots * 10 : 0,
        foodUnitPrice: livestockFeedCost,
        usesOwnCropForFood: false,
        butcherFee: 0,
        usedFocus: false,
        focusPointsSpent: 0,
        taxPercent: simTaxRate,
      });

      let focusProfitDelta = Math.max(0, netProfit - econWithoutFocus.netProfit);
      if (item.category === 'animal_produce' && useFocusSimulation) {
        // En animales de producción continua, el foco otorga crías extra (offspring) o producción adicional
        focusProfitDelta = Math.round(simSlots * prices.productPrice * 3);
      }
      const silverPerFocus =
        totalFocusNeeded > 0 ? Number((focusProfitDelta / totalFocusNeeded).toFixed(1)) : 0;

      // Capacidad con 10k de foco
      const slotsPer10k = Math.floor(10000 / Math.max(1, focusCostPerSlot));

      return {
        item,
        hasBonus,
        prices,
        yieldPerSlot,
        totalHarvest,
        expectedRebought,
        expectedSurplusSeeds,
        expectedSeedCost,
        foodCost,
        productGross,
        surplusNet,
        netRev,
        netProfit,
        profitPerSlot,
        isProfit,
        focusCostPerSlot,
        totalFocusNeeded,
        fitsInDailyFocus,
        silverPerFocus,
        slotsPer10k,
      };
    });

    // Ordenar según selección
    rows.sort((a, b) => {
      if (sortBy === 'profit') return b.netProfit - a.netProfit;
      if (sortBy === 'profitPerSlot') return b.profitPerSlot - a.profitPerSlot;
      if (sortBy === 'silverPerFocus') return b.silverPerFocus - a.silverPerFocus;
      return a.item.tier - b.item.tier;
    });

    setCalculatedRows(rows);
    setIsStale(false);
  };

  const handleClearCalculation = () => {
    setCalculatedRows(null);
    setIsStale(false);
  };

  const topPerformer = calculatedRows && calculatedRows.length > 0 ? calculatedRows[0] : null;

  return (
    <div id="quick-simulator-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header y controles de simulación */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="text-amber-400" size={24} />
            Simulador de Rentabilidad Preventivo
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajusta precios de mercado, calcula el retorno con la Maestría real de tu Tabla del Destino y compara qué
            cultivar en{' '}
            <strong className="text-amber-400">{currentCity.name}</strong> antes de sembrar.
          </p>
        </div>

        {/* Configuración rápida: Isla/Ciudad, Parcelas y Foco */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
          {/* Selector de Ciudad Rápido */}
          {onSelectCity && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-amber-400" />
              <span className="text-slate-400 font-medium">Isla en:</span>
              <select
                id="sim-city-select"
                value={selectedCityId}
                onChange={(e) => onSelectCity(e.target.value as CityId)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parcelas */}
          <div className="flex items-center border-l border-slate-800 pl-3">
            <span className="text-slate-400 mr-1.5 font-medium">Parcelas:</span>
            <NumericInput
              id="sim-plots"
              min={1}
              max={30}
              value={simPlots}
              onChange={(val) => setSimPlots(val)}
              className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-slate-100 font-bold"
            />
            <span className="text-slate-500 ml-1">({simSlots} slots)</span>
          </div>

          {/* Foco */}
          <label className="flex items-center gap-1.5 cursor-pointer border-l border-slate-800 pl-3">
            <input
              type="checkbox"
              id="sim-focus-toggle"
              checked={useFocusSimulation}
              onChange={(e) => setUseFocusSimulation(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-amber-500 bg-slate-900 cursor-pointer"
            />
            <Zap size={13} className={useFocusSimulation ? 'text-amber-400 fill-amber-400' : 'text-slate-500'} />
            <span className="text-slate-300 font-medium">Con Foco</span>
          </label>

          {/* Selector de Impuesto / Premium */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span className="text-slate-400">Impuesto:</span>
            <select
              value={simTaxRate}
              onChange={(e) => setSimTaxRate(Number(e.target.value))}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 font-mono cursor-pointer"
            >
              <option value={6.5}>Premium (6.5%)</option>
              <option value={10.5}>Sin Premium (10.5%)</option>
              <option value={4}>Directa Prem (4%)</option>
              <option value={8}>Directa Sin Prem (8%)</option>
            </select>
          </div>

          {/* Comida Ganado */}
          {activeCategory === 'animal' && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
              <Utensils size={13} className="text-amber-400" />
              <span className="text-slate-400">Comida:</span>
              <select
                value={livestockFeedCost}
                onChange={(e) => setLivestockFeedCost(Number(e.target.value))}
                className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 font-mono cursor-pointer"
              >
                <option value={0}>Propia (0🪙)</option>
                <option value={300}>Comprada (300🪙/u)</option>
                <option value={380}>Comprada (380🪙/u)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de categorías y herramientas de ordenamiento / gestión de precios */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('crop')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeCategory === 'crop'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🌾 Cultivos
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('herb')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeCategory === 'herb'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-1 ring-purple-400/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🌿 Hierbas
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('animal')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              activeCategory === 'animal'
                ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-1 ring-sky-400/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🐑 Ganadería (Huevos, Leche y Carne)
          </button>
        </div>

        {/* Controles de ordenamiento y sincronización de precios */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={13} className="text-slate-400" />
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'profit' | 'profitPerSlot' | 'silverPerFocus' | 'tier')}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-1 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="profit">Mayor Beneficio Neto</option>
              <option value="profitPerSlot">Mayor Plata / Slot</option>
              {useFocusSimulation && <option value="silverPerFocus">Mayor Plata / Foco (⚡)</option>}
              <option value="tier">Nivel (Tier)</option>
            </select>
          </div>

          {Object.keys(customPrices).length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSaveAllPricesToMemory}
                className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer"
                title="Guardar estos precios en tu memoria para usarlos en el Registro Diario"
              >
                {savedPricesFeedback ? <Check size={12} /> : <Save size={12} />}
                {savedPricesFeedback ? 'Guardado' : 'Recordar Precios'}
              </button>
              <button
                type="button"
                onClick={handleResetPrices}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer"
                title="Restablecer precios guardados en memoria"
              >
                <RotateCcw size={12} /> Restablecer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE ACCIÓN: BOTÓN DAR RESULTADOS / SIMULAR MANUALMENTE */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Calculator size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Simulación de Mercado Agrícola</span>
              {isStale && calculatedRows && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  <AlertCircle size={11} /> Filtros/Precios modificados
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {calculatedRows
                ? isStale
                  ? 'Has cambiado parcelas, ciudad o precios. Presiona "Recalcular" para refrescar el ranking.'
                  : `Simulación calculada para ${filteredItems.length} rubros con tus parámetros actuales.`
                : 'Ajusta tu ciudad, parcelas y foco arriba, y presiona "Dar Resultados" para calcular la rentabilidad.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {calculatedRows && (
            <button
              type="button"
              onClick={handleClearCalculation}
              className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Limpiar resultados"
            >
              <RotateCcw size={14} />
              <span>Limpiar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTriggerCalculation}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              !calculatedRows || isStale
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Calculator size={15} />
            <span>{calculatedRows ? (isStale ? 'Recalcular Resultados' : 'Recalcular Simulación') : 'Dar Resultados de Simulación'}</span>
          </button>
        </div>
      </div>

      {/* ESTADO VACÍO PREVIO AL CÁLCULO */}
      {!calculatedRows && (
        <div className="bg-slate-950/60 border border-slate-800 border-dashed rounded-xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <Calculator size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-200 mb-1">
            Simulador Listo para Procesar
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Presiona el botón <strong className="text-amber-400 font-semibold">"Dar Resultados de Simulación"</strong> para proyectar la rentabilidad, retorno de semillas con o sin foco y plata por slot según tus precios manuales.
          </p>
          <button
            type="button"
            onClick={handleTriggerCalculation}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Calculator size={15} />
            <span>Dar Resultados de Simulación</span>
          </button>
        </div>
      )}

      {/* RESULTADOS DE SIMULACIÓN (Solo visibles tras presionar botón) */}
      {calculatedRows && (
        <>

      {/* Banner de máxima recomendación con acción de 1 clic */}
      {topPerformer && topPerformer.isProfit && (
        <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Opción Más Rentable en {currentCity.name}
                </span>
                {topPerformer.hasBonus && (
                  <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.2 rounded text-[10px] border border-emerald-500/30">
                    Bono Ciudad Activo ({selectedCityId === 'brecilien' && topPerformer.item.category === 'crop' ? '+15%' : '+10%'})
                  </span>
                )}
              </div>
              <div className="font-bold text-slate-100 text-sm mt-0.5 flex items-center gap-2">
                {topPerformer.item.nameEs}
                <AlbionItemBadge tier={topPerformer.item.tier} size="xs" /> —
                <span className="text-emerald-400 font-mono tabular-nums">+{formatSilver(topPerformer.netProfit)} netos</span>
                <span className="text-slate-400 font-normal text-xs font-mono tabular-nums">
                  ({formatSilver(topPerformer.profitPerSlot)} / slot)
                </span>
              </div>
              {useFocusSimulation && (
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono tabular-nums">
                  <span>
                    ⚡ Costo: <strong>{topPerformer.focusCostPerSlot} foco/slot</strong> (Total: {topPerformer.totalFocusNeeded.toLocaleString()} pts)
                  </span>
                  <span>•</span>
                  <span className="text-amber-300 font-bold">
                    Retorno: {topPerformer.silverPerFocus} Plata / Foco
                  </span>
                </div>
              )}
            </div>
          </div>

          {onNavigateToLoggerWithPreset && (
            <button
              type="button"
              onClick={() =>
                onNavigateToLoggerWithPreset({
                  cityId: selectedCityId,
                  itemId: topPerformer.item.id,
                  plotsCount: simPlots,
                })
              }
              className="self-end sm:self-auto flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-lg shadow-md transition-colors cursor-pointer text-xs shrink-0"
            >
              Sembrar en Diario <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Tabla comparativa interactiva */}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] bg-slate-950">
              <th className="p-3">Producto / Tier</th>
              <th className="p-3">Bono Ciudad</th>
              <th className="p-3">Precio Semilla (🪙)</th>
              <th className="p-3">Precio Venta (🪙)</th>
              {useFocusSimulation && (
                <>
                  <th className="p-3 text-center">Foco / Slot (⚡)</th>
                  <th className="p-3 text-right">Plata / Foco</th>
                </>
              )}
              <th className="p-3 text-right">Rendimiento Est.</th>
              <th className="p-3 text-right">Costo Semilla / Comida</th>
              <th className="p-3 text-right font-bold text-slate-200">Beneficio Neto Est.</th>
              <th className="p-3 text-right">Plata / Slot</th>
              {onNavigateToLoggerWithPreset && <th className="p-3 text-center">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {calculatedRows.map((row, index) => {
              const isTop = index === 0 && row.isProfit;

              return (
                <tr
                  key={row.item.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.item.id === highlightedItemId
                      ? 'bg-amber-500/15 ring-1 ring-amber-500/40'
                      : isTop
                      ? 'bg-amber-500/5'
                      : ''
                  }`}
                >
                  {/* Nombre e icono */}
                  <td className="p-3 font-sans">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                        <ItemIcon name={row.item.iconName} size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          {row.item.nameEs}
                          <AlbionItemBadge tier={row.item.tier} size="xs" />
                          {row.item.id === highlightedItemId && (
                            <span className="text-[10px] font-black text-amber-300 bg-amber-900/60 px-1.5 py-0.2 rounded border border-amber-600 animate-pulse">
                              OBJETIVO ANALYTICS
                            </span>
                          )}
                          {isTop && row.item.id !== highlightedItemId && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 px-1 rounded border border-amber-700/50">
                              #1 TOP
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {row.item.nameEn}
                          {row.item.favoriteFoodNameEs && (
                            <span className="text-amber-400/90 ml-1.5 font-medium">· Comida fav: {row.item.favoriteFoodNameEs}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Bono Ciudad */}
                  <td className="p-3 font-sans">
                    {row.hasBonus ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                        <Sparkles size={11} /> {selectedCityId === 'brecilien' && row.item.category === 'crop' ? '+15%' : '+10%'}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Precio Semilla editable */}
                  <td className="p-3">
                    <NumericInput
                      id={`sim-seed-${row.item.id}`}
                      min={0}
                      value={row.prices.seedPrice}
                      onChange={(val) => handlePriceChange(row.item.id, 'seedPrice', val)}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                    />
                  </td>

                  {/* Precio Venta editable */}
                  <td className="p-3">
                    <NumericInput
                      id={`sim-prod-${row.item.id}`}
                      min={0}
                      value={row.prices.productPrice}
                      onChange={(val) => handlePriceChange(row.item.id, 'productPrice', val)}
                      className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                  </td>

                  {/* Métricas de Foco si useFocusSimulation está activo */}
                  {useFocusSimulation && (
                    <>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded ${
                            row.focusCostPerSlot <= 200
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                          title={`Requiere ${row.totalFocusNeeded.toLocaleString()} puntos de foco para los ${simSlots} slots`}
                        >
                          <Zap size={11} className="text-amber-400 fill-amber-400" />
                          {row.focusCostPerSlot}
                        </span>
                        {!row.fitsInDailyFocus && (
                          <span
                            className="block text-[10px] text-rose-400 font-sans mt-0.5"
                            title="Supera los 10,000 puntos de foco regenerados al día"
                          >
                            Excede 10k
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            row.silverPerFocus >= 35
                              ? 'text-emerald-400 bg-emerald-950/60'
                              : row.silverPerFocus >= 20
                              ? 'text-amber-300 bg-amber-950/60'
                              : 'text-slate-400'
                          }`}
                        >
                          {row.silverPerFocus} 🪙
                        </span>
                      </td>
                    </>
                  )}

                  {/* Rendimiento */}
                  <td className="p-3 text-right text-slate-300 tabular-nums">
                    {row.totalHarvest.toLocaleString()} u
                    <span className="text-[10px] text-slate-500 block">
                      (~{row.yieldPerSlot.toFixed(1)}/slot)
                    </span>
                  </td>

                  {/* Costo Semillas / Comida */}
                  <td className="p-3 text-right text-rose-400 tabular-nums">
                    -{formatSilver(row.expectedSeedCost + row.foodCost)}
                    {row.expectedSurplusSeeds > 0 && (
                      <span className="text-[10px] text-emerald-400 block">
                        (+{row.expectedSurplusSeeds.toFixed(0)} semillas extra)
                      </span>
                    )}
                  </td>

                  {/* Profit Neto */}
                  <td className="p-3 text-right tabular-nums">
                    <span
                      className={`font-black text-sm ${
                        row.isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {row.isProfit ? '+' : ''}
                      {formatSilver(row.netProfit)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {row.isProfit ? 'Ganancia' : 'Pérdida'}
                    </span>
                  </td>

                  {/* Por Slot */}
                  <td className="p-3 text-right tabular-nums">
                    <span
                      className={`font-bold ${
                        row.isProfit ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {formatSilver(row.profitPerSlot)}
                    </span>
                  </td>

                  {/* Botón Acción Sembrar */}
                  {onNavigateToLoggerWithPreset && (
                    <td className="p-3 text-center font-sans">
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateToLoggerWithPreset({
                            cityId: selectedCityId,
                            itemId: row.item.id,
                            plotsCount: simPlots,
                          })
                        }
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold px-2 py-1 rounded transition-colors cursor-pointer text-[11px]"
                        title="Cargar esta configuración en el Registro Diario"
                      >
                        Sembrar <ArrowRight size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
};
