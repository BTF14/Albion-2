import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Fish,
  Flame,
  Award,
  Zap,
  Info,
  Layers,
  Building2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Coins,
  Receipt,
  Scale,
  Clock,
  Calculator,
} from 'lucide-react';
import { AlbionRecipe, EnchantmentLevel, StationLocation, PriceMemory, DestinyMasteryProfile } from '../types';
import { ItemIcon } from './ItemIcon';
import { NumericInput } from './NumericInput';
import {
  FOOD_ENCHANTMENT_CONFIG,
  POTION_ENCHANTMENT_CONFIG,
  FISH_SAUCE_RECIPES,
  ARCANE_EXTRACT_RECIPES,
  calculateFishSauceCraftCost,
  calculateArcaneExtractCraftCost,
  compareEnchantmentTiers,
  getSuggestedEnchantedPrice,
  EnchantmentComparisonResult,
} from '../utils/enchantments';
import {
  updateRecipePrice,
  loadWorkshopPrices,
  saveWorkshopPrices,
  WorkshopPricesSettings,
} from '../utils/storage';
import { calculateRecipeFocusCost } from '../utils/destinyBoard';
import { evaluateMarketVelocity } from '../utils/marketVelocity';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface EnchantmentComparatorProps {
  activeRecipe: AlbionRecipe;
  recipePrices: Record<string, number>;
  onUpdateRecipePrice: (key: string, price: number) => void;
  priceMemory: PriceMemory;
  batches: number;
  onBatchesChange: (batches: number) => void;
  stationLocation: StationLocation;
  onStationLocationChange: (loc: StationLocation) => void;
  useFocus: boolean;
  onUseFocusChange: (useFocus: boolean) => void;
  stationFeePer100Nutrition: number;
  onStationFeeChange: (fee: number) => void;
  hasPremium: boolean;
  onHasPremiumChange: (prem: boolean) => void;
  customRawPrices: Record<string, number>;
  onUpdateIngredientPrice: (id: string, price: number) => void;
  masteryProfile: DestinyMasteryProfile;
  onSelectEnchantmentInParent?: (level: EnchantmentLevel) => void;
}

export const EnchantmentComparator: React.FC<EnchantmentComparatorProps> = ({
  activeRecipe,
  recipePrices,
  onUpdateRecipePrice,
  priceMemory,
  batches,
  onBatchesChange,
  stationLocation,
  onStationLocationChange,
  useFocus,
  onUseFocusChange,
  stationFeePer100Nutrition,
  onStationFeeChange,
  hasPremium,
  onHasPremiumChange,
  customRawPrices,
  onUpdateIngredientPrice,
  masteryProfile,
  onSelectEnchantmentInParent,
}) => {
  // Configuración persistente del taller de salsas y extractos (LocalStorage)
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopPricesSettings>(() => loadWorkshopPrices());

  // Sincronización reactiva con cambios de precios en taller de pesca y salsas
  useEffect(() => {
    const handleSync = () => {
      setWorkshopSettings(loadWorkshopPrices());
    };
    window.addEventListener('albion_storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [showBaseIngredients, setShowBaseIngredients] = useState<boolean>(false);
  const [expandedTierBreakdown, setExpandedTierBreakdown] = useState<Record<EnchantmentLevel, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
  });

  // Guardar configuración en LocalStorage al modificar
  const updateWorkshopSetting = (updater: (prev: WorkshopPricesSettings) => WorkshopPricesSettings) => {
    setWorkshopSettings((prev) => {
      const next = updater(prev);
      saveWorkshopPrices(next);
      return next;
    });
  };

  const isCooking = activeRecipe.category === 'cooking';

  // Costes de crafteo propio de salsas
  const craftedSauceCost = useMemo(() => {
    return {
      1: calculateFishSauceCraftCost(1, workshopSettings.choppedFishPrice, workshopSettings.seaweedPrice),
      2: calculateFishSauceCraftCost(2, workshopSettings.choppedFishPrice, workshopSettings.seaweedPrice),
      3: calculateFishSauceCraftCost(3, workshopSettings.choppedFishPrice, workshopSettings.seaweedPrice),
    };
  }, [workshopSettings.choppedFishPrice, workshopSettings.seaweedPrice]);

  // Costes de crafteo propio de extractos
  const craftedExtractCost = useMemo(() => {
    return {
      1: calculateArcaneExtractCraftCost(1, workshopSettings.arcaneEssencePrice),
      2: calculateArcaneExtractCraftCost(2, workshopSettings.arcaneEssencePrice),
      3: calculateArcaneExtractCraftCost(3, workshopSettings.arcaneEssencePrice),
    };
  }, [workshopSettings.arcaneEssencePrice]);

  // Precios efectivos que se usarán en el cálculo de encantamiento
  const effectiveEnchantmentItemPrices = useMemo(() => {
    if (isCooking) {
      return workshopSettings.sauceSource === 'crafted'
        ? craftedSauceCost
        : workshopSettings.marketSaucePrices;
    } else {
      return workshopSettings.sauceSource === 'crafted'
        ? craftedExtractCost
        : workshopSettings.marketExtractPrices;
    }
  }, [
    isCooking,
    workshopSettings.sauceSource,
    craftedSauceCost,
    workshopSettings.marketSaucePrices,
    craftedExtractCost,
    workshopSettings.marketExtractPrices,
  ]);

  // Fórmulas oficiales de RRR en Albion Online
  const returnRatePercent = useMemo(() => {
    if (stationLocation === 'caerleon_city' || stationLocation === 'bonus_city') {
      return useFocus ? 47.9 : 24.8;
    } else if (stationLocation === 'non_bonus_city') {
      return useFocus ? 43.5 : 15.2;
    } else if (stationLocation === 'bonus_island') {
      return useFocus ? 39.9 : 13.0;
    } else {
      return useFocus ? 37.1 : 0.0;
    }
  }, [stationLocation, useFocus]);

  const returnRateWithoutFocus = useMemo(() => {
    if (stationLocation === 'caerleon_city' || stationLocation === 'bonus_city') return 24.8;
    if (stationLocation === 'non_bonus_city') return 15.2;
    if (stationLocation === 'bonus_island') return 13.0;
    return 0.0;
  }, [stationLocation]);

  const marketTaxRate = hasPremium ? 0.065 : 0.105;

  // Maestría y FCE de la receta sincronizada con la Tabla del Destino
  const focusCostPerBatch = useMemo(() => {
    const res = calculateRecipeFocusCost(activeRecipe, masteryProfile);
    return res.actualFocusCostPerBatch;
  }, [activeRecipe, masteryProfile]);

  // Precios de insumos base con jerarquía uniforme: customRawPrices -> priceMemory (lastProductPrice/sellPrice) -> default
  const rawPrices = useMemo(() => {
    const map: Record<string, number> = {};
    activeRecipe.ingredients.forEach((ing) => {
      if (customRawPrices[ing.itemId] !== undefined) {
        map[ing.itemId] = customRawPrices[ing.itemId];
      } else {
        const mem = priceMemory[ing.itemId];
        map[ing.itemId] =
          mem?.lastProductPrice && mem.lastProductPrice > 0
            ? mem.lastProductPrice
            : mem?.sellPrice && mem.sellPrice > 0
            ? mem.sellPrice
            : mem?.buyPrice && mem.buyPrice > 0
            ? mem.buyPrice
            : ing.defaultUnitPrice || 100;
      }
    });
    return map;
  }, [activeRecipe, customRawPrices, priceMemory]);

  // Precios de venta manuales guardados para cada nivel (.0, .1, .2, .3)
  const sellPrices = useMemo(() => {
    const getPriceForLevel = (lvl: EnchantmentLevel) => {
      const key = `${activeRecipe.id}_enc_${lvl}`;
      if (recipePrices[key] !== undefined) {
        return recipePrices[key];
      }
      return getSuggestedEnchantedPrice(activeRecipe.defaultSellPrice, activeRecipe.category, lvl);
    };

    return {
      0: getPriceForLevel(0),
      1: getPriceForLevel(1),
      2: getPriceForLevel(2),
      3: getPriceForLevel(3),
    } as Record<EnchantmentLevel, number>;
  }, [activeRecipe, recipePrices]);

  // Estado de cálculo manual (solo se muestran resultados al pulsar el botón)
  const [calculatedResult, setCalculatedResult] = useState<EnchantmentComparisonResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Marcar como desactualizado si los insumos o configuraciones cambian
  useEffect(() => {
    if (calculatedResult) {
      setIsStale(true);
    }
  }, [
    activeRecipe,
    batches,
    returnRatePercent,
    returnRateWithoutFocus,
    useFocus,
    focusCostPerBatch,
    stationFeePer100Nutrition,
    marketTaxRate,
    rawPrices,
    sellPrices,
    effectiveEnchantmentItemPrices,
  ]);

  const handleTriggerCalculation = () => {
    const res = compareEnchantmentTiers({
      recipe: activeRecipe,
      batches: Math.max(1, batches || 1),
      returnRatePercent,
      returnRateWithoutFocus,
      useFocus,
      focusCostPerBatch,
      stationFeePer100Nutrition,
      marketTaxRate,
      rawPrices,
      sellPrices,
      sauceOrExtractPrices: effectiveEnchantmentItemPrices,
    });
    setCalculatedResult(res);
    setIsStale(false);
  };

  const handleClearResult = () => {
    setCalculatedResult(null);
    setIsStale(false);
  };

  const handleUpdatePrice = (level: EnchantmentLevel, val: number) => {
    const key = `${activeRecipe.id}_enc_${level}`;
    onUpdateRecipePrice(key, val);
    updateRecipePrice(key, val);
  };

  const toggleTierBreakdown = (lvl: EnchantmentLevel) => {
    setExpandedTierBreakdown((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  return (
    <div className="space-y-6">
      {/* CABECERA EXPLICATIVA */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={22} />
            <h2 className="text-lg font-bold text-slate-100">
              Comparador Directo de Encantamientos: {activeRecipe.nameEs}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analiza simultáneamente las 4 variantes (.0 Plano, .1 Verde, .2 Azul, .3 Morado). Sincronizado en tiempo real con tus insumos, maestrías y precios manuales.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <span className="text-xs text-slate-400 font-medium">Ciudad Óptima:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Building2 size={13} />
            {isCooking ? 'Caerleon (+15% RRR Cocina)' : 'Brecilien (+15% RRR Alquimia)'}
          </span>
        </div>
      </div>

      {/* PARÁMETROS GENERALES DEL LOTE */}
      <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Layers size={15} className="text-amber-400" />
            Condiciones de Elaboración (Sincronizadas con la Calculadora):
          </span>
          <span className="text-[11px] text-amber-400 font-mono font-semibold">
            RRR Efectivo: {returnRatePercent}% {useFocus ? '(Con Foco)' : '(Sin Foco)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Lotes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Lotes a Elaborar:
            </label>
            <NumericInput
              value={batches}
              onChange={(v) => onBatchesChange(Math.max(1, v))}
              min={1}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              = {activeRecipe.outputAmount * batches} unidades finales
            </span>
          </div>

          {/* Ubicación de Estación */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Ubicación de Estación:
            </label>
            <select
              value={stationLocation}
              onChange={(e) => onStationLocationChange(e.target.value as StationLocation)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="bonus_city">{isCooking ? 'Caerleon (+15% Cocina)' : 'Brecilien (+15% Pociones)'}</option>
              <option value="non_bonus_city">Ciudad Real Común (Sin Bono)</option>
              <option value="bonus_island">Isla en Ciudad Bonificada</option>
              <option value="regular_island">Isla Común (0% RRR Base)</option>
            </select>
          </div>

          {/* Foco */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Uso de Foco:
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-700 p-0.5 bg-slate-950">
              <button
                type="button"
                onClick={() => onUseFocusChange(true)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  useFocus ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Con Foco
              </button>
              <button
                type="button"
                onClick={() => onUseFocusChange(false)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  !useFocus ? 'bg-slate-700 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sin Foco
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {useFocus ? `${focusCostPerBatch * batches} foco total` : '0 foco gastado'}
            </span>
          </div>

          {/* Tasa de Estación */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Tasa Taller / 100 Nutrición:
            </label>
            <NumericInput
              value={stationFeePer100Nutrition}
              onChange={(v) => onStationFeeChange(Math.max(0, v))}
              min={0}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Tasa habitual en ciudades
            </span>
          </div>

          {/* Impuesto Premium */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Impuesto Mercado:
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-700 p-0.5 bg-slate-950">
              <button
                type="button"
                onClick={() => onHasPremiumChange(true)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  hasPremium ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                6.5% Prem
              </button>
              <button
                type="button"
                onClick={() => onHasPremiumChange(false)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                  !hasPremium ? 'bg-rose-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                10.5% Sin
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {hasPremium ? 'Estado Premium Activo' : 'Sin Premium'}
            </span>
          </div>
        </div>
      </div>

      {/* TALLER DE SALSAS DE PESCADO O EXTRACTOS ARCANOS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            {isCooking ? <Fish size={16} className="text-sky-400" /> : <Sparkles size={16} className="text-purple-400" />}
            <span className="text-xs font-bold text-slate-200">
              {isCooking
                ? 'Taller de Salsas de Pescado: ¿Fabricar tú mismo vs. Comprar en Mercado?'
                : 'Taller de Extractos Arcanos: Coste de Esencias vs. Mercado'}
            </span>
          </div>

          {/* Selector de fuente de la salsa */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Calcular insumo de encantamiento usando:</span>
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => updateWorkshopSetting((p) => ({ ...p, sauceSource: 'crafted' }))}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  workshopSettings.sauceSource === 'crafted'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛠️ Crafteo Propio
              </button>
              <button
                type="button"
                onClick={() => updateWorkshopSetting((p) => ({ ...p, sauceSource: 'market' }))}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                  workshopSettings.sauceSource === 'market'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛒 Mercado Directo
              </button>
            </div>
          </div>
        </div>

        {/* Inputs de cotización de ingredientes para salsas o extractos */}
        {isCooking ? (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
            <div className="sm:col-span-2 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                Precios de Mercado de Insumos Pesqueros:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">🐟 Pescado Picado:</label>
                  <NumericInput
                    value={workshopSettings.choppedFishPrice}
                    onChange={(v) =>
                      updateWorkshopSetting((p) => ({ ...p, choppedFishPrice: Math.max(1, v) }))
                    }
                    min={1}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">🌿 Alga Marina:</label>
                  <NumericInput
                    value={workshopSettings.seaweedPrice}
                    onChange={(v) =>
                      updateWorkshopSetting((p) => ({ ...p, seaweedPrice: Math.max(1, v) }))
                    }
                    min={1}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Se guardan automáticamente en tu almacenamiento local.
              </span>
            </div>

            {/* Comparativa por tier de salsa (.1, .2, .3) */}
            {([1, 2, 3] as const).map((lvl) => {
              const recipeDef = FISH_SAUCE_RECIPES[lvl];
              const craftCost = craftedSauceCost[lvl];
              const marketPrice = workshopSettings.marketSaucePrices[lvl];
              const isCraftCheaper = craftCost < marketPrice;
              const diff = marketPrice - craftCost;

              return (
                <div
                  key={lvl}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    lvl === 1
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : lvl === 2
                      ? 'bg-sky-950/20 border-sky-800/40'
                      : 'bg-purple-950/20 border-purple-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        .{lvl} {recipeDef.nameEs}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {recipeDef.choppedFishNeeded} pescado + {recipeDef.seaweedNeeded} alga
                    </span>

                    <div className="mt-2 space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Crafteo propio:</span>
                        <span className="text-sky-300 font-bold">{craftCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Mercado:</span>
                        <NumericInput
                          value={marketPrice}
                          onChange={(v) =>
                            updateWorkshopSetting((p) => ({
                              ...p,
                              marketSaucePrices: { ...p.marketSaucePrices, [lvl]: Math.max(1, v) },
                            }))
                          }
                          min={1}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-right text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-800/80 text-[10px]">
                    {isCraftCheaper ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Ahorras {diff.toLocaleString()} crafteando
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Info size={11} />
                        Más barato comprar (+{(-diff).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                Precio de Esencia Arcana:
              </span>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">🔮 Esencia Arcana:</label>
                <NumericInput
                  value={workshopSettings.arcaneEssencePrice}
                  onChange={(v) =>
                    updateWorkshopSetting((p) => ({ ...p, arcaneEssencePrice: Math.max(1, v) }))
                  }
                  min={1}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                1 Esencia (.1), 3 Esencias (.2), 9 Esencias (.3)
              </span>
            </div>

            {/* Comparativa por tier de extracto (.1, .2, .3) */}
            {([1, 2, 3] as const).map((lvl) => {
              const recipeDef = ARCANE_EXTRACT_RECIPES[lvl];
              const craftCost = craftedExtractCost[lvl];
              const marketPrice = workshopSettings.marketExtractPrices[lvl];
              const isCraftCheaper = craftCost < marketPrice;
              const diff = marketPrice - craftCost;

              return (
                <div
                  key={lvl}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    lvl === 1
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : lvl === 2
                      ? 'bg-sky-950/20 border-sky-800/40'
                      : 'bg-purple-950/20 border-purple-800/40'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      .{lvl} {recipeDef.nameEs}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {recipeDef.arcaneEssenceNeeded} {recipeDef.arcaneEssenceNeeded === 1 ? 'esencia' : 'esencias'}
                    </span>

                    <div className="mt-2 space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Crafteo propio:</span>
                        <span className="text-purple-300 font-bold">{craftCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Mercado:</span>
                        <NumericInput
                          value={marketPrice}
                          onChange={(v) =>
                            updateWorkshopSetting((p) => ({
                              ...p,
                              marketExtractPrices: { ...p.marketExtractPrices, [lvl]: Math.max(1, v) },
                            }))
                          }
                          min={1}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-right text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-800/80 text-[10px]">
                    {isCraftCheaper ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Ahorras {diff.toLocaleString()} crafteando
                      </span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Info size={11} />
                        Más barato comprar (+{(-diff).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MATERIAS PRIMAS BASE DE LA RECETA (EXPANDIBLE & EDITABLE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBaseIngredients(!showBaseIngredients)}
          className="w-full p-3.5 bg-slate-900 hover:bg-slate-850 flex items-center justify-between text-xs font-bold text-slate-300 transition-all"
        >
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-amber-400" />
            <span>Precios de Insumos Base de la Receta ({activeRecipe.ingredients.length} materias primas):</span>
            <span className="text-[10px] font-normal text-slate-400">
              (Clic para ver y editar los precios unitarios de cada insumo)
            </span>
          </div>
          {showBaseIngredients ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showBaseIngredients && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRecipe.ingredients.map((ing) => {
              const currentUnitPrice = rawPrices[ing.itemId] ?? ing.defaultUnitPrice ?? 100;
              return (
                <div
                  key={ing.itemId}
                  className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1 rounded bg-slate-950 border border-slate-800 shrink-0">
                      <ItemIcon name={ing.nameEs} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{ing.nameEs}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ing.amount * batches} unids para {batches} lotes
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <NumericInput
                      value={currentUnitPrice}
                      onChange={(v) => onUpdateIngredientPrice(ing.itemId, Math.max(0, v))}
                      min={0}
                      className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right font-bold text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500">Ag</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BARRA DE ACCIÓN: BOTÓN CALCULAR / DAR RESULTADOS MANUALMENTE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Calculator size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Comparación de Encantamientos</span>
              {isStale && calculatedResult && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  <AlertCircle size={11} /> Datos modificados
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {calculatedResult
                ? isStale
                  ? 'Has modificado insumos o precios. Pulsa "Recalcular" para refrescar el análisis.'
                  : 'Comparación actualizada con tus precios e insumos actuales.'
                : 'Configura insumos y salsas arriba, y presiona "Dar Resultados" para calcular las 4 variantes (.0 a .3).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {calculatedResult && (
            <button
              type="button"
              onClick={handleClearResult}
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
              !calculatedResult || isStale
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Calculator size={15} />
            <span>{calculatedResult ? (isStale ? 'Recalcular Resultados' : 'Recalcular') : 'Dar Resultados de Encantamiento'}</span>
          </button>
        </div>
      </div>

      {/* ESTADO VACÍO PREVIO AL CÁLCULO */}
      {!calculatedResult && (
        <div className="bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
            <Calculator size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-200 mb-1">
            Resultados de Encantamiento en Espera
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">
            Presiona el botón <strong className="text-amber-400 font-semibold">"Dar Resultados de Encantamiento"</strong> para procesar la comparativa lado a lado (.0, .1, .2 y .3) con tus precios manuales de salsas y mercado.
          </p>
          <button
            type="button"
            onClick={handleTriggerCalculation}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Calculator size={15} />
            <span>Dar Resultados de Encantamiento</span>
          </button>
        </div>
      )}

      {/* RESULTADOS DE COMPARACIÓN (Solo visibles tras presionar botón) */}
      {calculatedResult && (
        <>
          {/* MATRIZ COMPARATIVA DE 4 COLUMNAS (.0 vs .1 vs .2 vs .3) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {([0, 1, 2, 3] as EnchantmentLevel[]).map((lvl) => {
              const item = calculatedResult.tiers[lvl];
              const isFlat = lvl === 0;
              const isExpanded = expandedTierBreakdown[lvl];
              const velocityInfo = evaluateMarketVelocity(activeRecipe, lvl, item.profitPerUnit, item.roiPercent);

          // Bordes y acentos visuales por nivel
          let borderColor = 'border-slate-800';
          let ringColor = '';
          let headerBg = 'bg-slate-800/60 text-slate-300';

          if (lvl === 1) {
            borderColor = 'border-emerald-800/60';
            headerBg = 'bg-emerald-950/60 text-emerald-300 border-b border-emerald-800/40';
          } else if (lvl === 2) {
            borderColor = 'border-sky-800/60';
            headerBg = 'bg-sky-950/60 text-sky-300 border-b border-sky-800/40';
          } else if (lvl === 3) {
            borderColor = 'border-purple-800/60';
            headerBg = 'bg-purple-950/60 text-purple-300 border-b border-purple-800/40';
          }

          if (item.isBestNetProfit) {
            ringColor = 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/10';
          }

          return (
            <div
              key={lvl}
              className={`bg-slate-900 rounded-2xl border ${borderColor} ${ringColor} flex flex-col justify-between overflow-hidden transition-all hover:border-slate-700`}
            >
              {/* Encabezado de la Tarjeta */}
              <div>
                <div className={`p-3.5 ${headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <AlbionItemBadge tier={activeRecipe.tier} enchantment={lvl} size="sm" />
                    <span className="font-bold text-sm tracking-wide">
                      {activeRecipe.nameEs} <span className="font-mono tabular-nums">.{lvl}</span>
                    </span>
                  </div>

                  {item.isBestNetProfit && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Award size={11} /> Top Plata
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* PRECIO DE VENTA MANUAL */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Precio Venta Manual (c/u):
                      </label>
                      <span className="text-[10px] text-slate-500">Mercado</span>
                    </div>
                    <div className="relative">
                      <NumericInput
                        value={item.sellUnitPrice}
                        onChange={(v) => handleUpdatePrice(lvl, Math.max(1, v))}
                        min={1}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-amber-300 font-mono tabular-nums focus:border-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-500 font-bold">
                        Plata
                      </span>
                    </div>
                  </div>

                  {/* BENEFICIO NETO TOTAL (NÚMERO PRINCIPAL) */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Beneficio Neto Lote ({item.totalUnitsProduced} unids):
                    </span>
                    <div
                      className={`text-lg font-black font-mono tabular-nums mt-0.5 ${
                        item.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.netProfit >= 0 ? '+' : ''}
                      {formatSilver(item.netProfit)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-2">
                      <span className="font-mono tabular-nums">{formatSilver(item.profitPerUnit)} /ud</span>
                      <span className="text-slate-600">•</span>
                      <span className={`font-mono tabular-nums ${item.roiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ROI {item.roiPercent}%
                      </span>
                    </div>
                  </div>

                  {/* COMPARATIVA DIRECTA VS PLANO (.0) */}
                  {!isFlat ? (
                    <div
                      className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
                        item.isProfitableVsFlat
                          ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                          : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          {item.isProfitableVsFlat ? (
                            <TrendingUp size={13} className="text-emerald-400" />
                          ) : (
                            <TrendingDown size={13} className="text-rose-400" />
                          )}
                          Diferencia vs .0:
                        </span>
                        <span className="font-mono tabular-nums">
                          {item.diffNetProfitVsFlat >= 0 ? '+' : ''}
                          {formatSilver(item.diffNetProfitVsFlat)}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80">
                        {item.isProfitableVsFlat
                          ? `Ganas un ${item.diffPercentVsFlat}% MÁS plata neta que vendiendo plano.`
                          : `Pierdes ${formatSilver(Math.abs(item.diffNetProfitVsFlat))} respecto a vender plano debido al coste de la salsa.`}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/50 text-slate-400 text-xs flex items-center justify-between">
                      <span className="text-[11px]">Punto de Referencia:</span>
                      <span className="font-mono text-slate-300 text-[11px] font-semibold">Base (.0 Plano)</span>
                    </div>
                  )}

                  {/* ROTACIÓN Y VELOCIDAD DE VENTA REAL */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock size={12} className="text-amber-400" /> Venta Estimada:
                      </span>
                      <span className="font-bold text-slate-200">
                        {velocityInfo.saleTimeEst}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Demanda ({velocityInfo.demandLabelEs}):</span>
                      <span className="text-slate-300 font-mono tabular-nums">{velocityInfo.dailyVolumeEst}</span>
                    </div>
                    {velocityInfo.velocityTrapWarning && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/50 leading-tight mt-1 flex items-start gap-1">
                        <AlertTriangle size={11} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>{velocityInfo.velocityTrapWarning}</span>
                      </div>
                    )}
                  </div>

                  {/* DESGLOSE ECONÓMICO RÁPIDO */}
                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Ingreso Neto (tras {hasPremium ? '6.5%' : '10.5%'}):</span>
                      <span className="font-mono tabular-nums font-medium">{formatSilver(item.netRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Insumos Base (con RRR):</span>
                      <span className="font-mono tabular-nums text-slate-300">-{formatSilver(item.baseIngredientsNetCost)}</span>
                    </div>

                    {lvl > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 truncate max-w-[140px]" title={item.enchantmentIngredientName}>
                          {item.enchantmentIngredientName}:
                        </span>
                        <span className="font-mono tabular-nums text-amber-300">-{formatSilver(item.enchantmentItemNetCost)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Tasa de Estación:</span>
                      <span className="font-mono tabular-nums text-slate-400">-{formatSilver(item.stationFee)}</span>
                    </div>

                    {/* RATIO DE FOCO */}
                    {useFocus && (
                      <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-800/80">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Zap size={12} className="text-amber-400" /> Plata / Foco:
                        </span>
                        <span
                          className={`font-mono tabular-nums font-bold ${
                            item.isBestSilverPerFocus ? 'text-amber-300' : 'text-slate-200'
                          }`}
                        >
                          {item.silverPerFocus} <span className="text-[9px] text-slate-500">Ag/Foc</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DETALLE COMPLETO DESPLEGABLE */}
                  <div className="border-t border-slate-800/80 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleTierBreakdown(lvl)}
                      className="w-full text-[10px] text-slate-400 hover:text-slate-200 flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-950 transition-all font-semibold"
                    >
                      <span className="flex items-center gap-1">
                        <Receipt size={11} />
                        {isExpanded ? 'Ocultar Desglose Exacto' : 'Ver Desglose y Fórmulas'}
                      </span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-[10px] font-mono tabular-nums text-slate-400">
                        <div className="flex justify-between">
                          <span>Ingreso Bruto:</span>
                          <span className="text-slate-200">{formatSilver(item.grossRevenue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Impuesto Mercado:</span>
                          <span className="text-rose-400">-{formatSilver(item.marketTax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Coste Insumos Base:</span>
                          <span className="text-slate-200">{formatSilver(item.baseIngredientsNetCost)}</span>
                        </div>
                        {item.enchantmentItemNetCost > 0 && (
                          <div className="flex justify-between">
                            <span>Coste Encantamiento:</span>
                            <span className="text-amber-400">+{formatSilver(item.enchantmentItemNetCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-300 font-bold">
                          <span>Inversión Neta Real:</span>
                          <span>{formatSilver(item.totalNetCost)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTÓN DE APLICAR ESTE NIVEL */}
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                {onSelectEnchantmentInParent && (
                  <button
                    type="button"
                    onClick={() => onSelectEnchantmentInParent(lvl)}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white hover:border-amber-500 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Cargar este nivel en Lote</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* VEREDICTO FINAL Y RECOMENDACIÓN INTELIGENTE */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
          calculatedResult.bestProfitLevel === 0
            ? 'bg-slate-900/90 border-slate-700 text-slate-200'
            : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border-amber-500/40 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              calculatedResult.bestProfitLevel === 0
                ? 'bg-slate-800 text-slate-300'
                : 'bg-amber-500 text-slate-950 font-bold shadow'
            }`}
          >
            {calculatedResult.bestProfitLevel === 0 ? <Info size={18} /> : <Award size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-black tracking-wider text-amber-400">
                Veredicto Económico Oficial:
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-800 border border-slate-700">
                Nivel Recomendado: .{calculatedResult.bestProfitLevel}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {calculatedResult.recommendationVerdict}
            </p>
          </div>
        </div>

        {useFocus && calculatedResult.bestFocusLevel !== undefined && (
          <div className="bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0 text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Mayor eficiencia de Foco:</span>
            <span className="text-xs font-bold text-amber-300 font-mono flex items-center justify-end gap-1 mt-0.5">
              <Zap size={12} /> Nivel .{calculatedResult.bestFocusLevel} (
              {calculatedResult.tiers[calculatedResult.bestFocusLevel].silverPerFocus} Plata/Foco)
            </span>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};
