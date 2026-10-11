import { useState, useMemo, useCallback, useEffect } from 'react';
import { CityId } from '../types';
import {
  BlackMarketOrderType,
  BlackMarketSimulationResult,
} from '../domain/models/blackMarket';
import { calculateBlackMarketThreshold } from '../domain/use-cases/calculateBlackMarketThreshold';
import {
  CraftEquipmentRecipe,
} from '../domain/models/equipmentCrafting';
import { CRAFT_EQUIPMENT_RECIPES } from '../data/equipmentRecipes';
import { usePriceMemory } from './usePriceMemory';
import { useDailyEvents } from './useDailyEvents';
import { useCraftingSalesLedger } from './useCraftingSalesLedger';

const STORAGE_KEY_BM_CONFIG = 'albion_black_market_simulator_config_v1';

// Precios base estimados de referencia si el usuario no ha registrado aún precio manual
const DEFAULT_MATERIAL_PRICES: Record<string, number> = {
  bar_metal: 1800,
  leather: 1900,
  cloth: 1750,
  wood: 1600,
  stone: 1200,
};

const VALID_CITIES: CityId[] = [
  'martlock',
  'thetford',
  'fort_sterling',
  'lymhurst',
  'bridgewatch',
  'caerleon',
  'brecilien',
];

interface SavedBlackMarketConfig {
  selectedRecipeId: string;
  tier: number;
  enchantment: number;
  craftingCity: CityId;
  orderType: BlackMarketOrderType;
  targetRoiPercentage: number;
  batchQuantity: number;
  useFocus: boolean;
  stationFeePer100Nutrition: number;
  hasPremium: boolean;
  customBlackMarketPrice?: number;
}

const DEFAULT_BM_CONFIG: SavedBlackMarketConfig = {
  selectedRecipeId: 'sword_broadsword',
  tier: 5,
  enchantment: 0,
  craftingCity: 'martlock',
  orderType: 'instant_buy_order',
  targetRoiPercentage: 25,
  batchQuantity: 10,
  useFocus: false,
  stationFeePer100Nutrition: 350,
  hasPremium: true,
};

function sanitizeBlackMarketConfig(raw: unknown): SavedBlackMarketConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_BM_CONFIG;

  const input = raw as Record<string, unknown>;
  const safeObj: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(input)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }

  const recipeId = typeof safeObj.selectedRecipeId === 'string' ? safeObj.selectedRecipeId : 'sword_broadsword';
  const validRecipe = CRAFT_EQUIPMENT_RECIPES.find((r) => r.id === recipeId) || CRAFT_EQUIPMENT_RECIPES[0];

  const parsedTier = Number(safeObj.tier);
  const tier = Number.isFinite(parsedTier) ? Math.max(4, Math.min(8, parsedTier)) : validRecipe.tier;

  const parsedEnchantment = Number(safeObj.enchantment);
  const enchantment = Number.isFinite(parsedEnchantment) ? Math.max(0, Math.min(4, parsedEnchantment)) : 0;

  const city = (typeof safeObj.craftingCity === 'string' && VALID_CITIES.includes(safeObj.craftingCity as CityId))
    ? (safeObj.craftingCity as CityId)
    : 'martlock';

  const orderType: BlackMarketOrderType = safeObj.orderType === 'custom_sell_order'
    ? 'custom_sell_order'
    : 'instant_buy_order';

  const targetRoi = Number(safeObj.targetRoiPercentage);
  const targetRoiPercentage = Number.isFinite(targetRoi) ? Math.max(0, Math.min(1000, targetRoi)) : 25;

  const batchQty = Number(safeObj.batchQuantity);
  const batchQuantity = Number.isFinite(batchQty) ? Math.max(1, Math.min(100000, Math.floor(batchQty))) : 10;

  const stationFee = Number(safeObj.stationFeePer100Nutrition);
  const stationFeePer100Nutrition = Number.isFinite(stationFee) ? Math.max(0, Math.min(10000, stationFee)) : 350;

  let customBlackMarketPrice: number | undefined;
  if (safeObj.customBlackMarketPrice !== undefined) {
    const p = Number(safeObj.customBlackMarketPrice);
    if (Number.isFinite(p) && p >= 0) {
      customBlackMarketPrice = Math.floor(p);
    }
  }

  return {
    selectedRecipeId: validRecipe.id,
    tier,
    enchantment,
    craftingCity: city,
    orderType,
    targetRoiPercentage,
    batchQuantity,
    useFocus: Boolean(safeObj.useFocus),
    stationFeePer100Nutrition,
    hasPremium: safeObj.hasPremium !== false,
    customBlackMarketPrice,
  };
}

export function useBlackMarketSimulator() {
  const { recipePrices, updateCraftPrice } = usePriceMemory();
  const { activeBonuses } = useDailyEvents();
  const { addRecord } = useCraftingSalesLedger();

  // Bono activo de evento diario si aplica crafteo de equipo (+10% o +20% RRR)
  const dailyCraftingBonusPercent = useMemo(() => {
    const craftingBonus = activeBonuses.find(
      (b) => b.id.includes('crafting') || b.id.includes('refining')
    );
    return craftingBonus ? craftingBonus.bonusPercent : 0;
  }, [activeBonuses]);

  // Cargar estado inicial persistente defensivo
  const [config, setConfig] = useState<SavedBlackMarketConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BM_CONFIG);
      if (raw) {
        return sanitizeBlackMarketConfig(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Error loading black market config', e);
    }
    return DEFAULT_BM_CONFIG;
  });

  // Sincronización multi-pestaña
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_BM_CONFIG && e.newValue) {
        try {
          setConfig(sanitizeBlackMarketConfig(JSON.parse(e.newValue)));
        } catch {
          // Ignorar JSON corrupto en eventos externos
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Guardar configuración en localStorage
  const updateConfig = useCallback((partial: Partial<SavedBlackMarketConfig>) => {
    setConfig((prev) => {
      const next = sanitizeBlackMarketConfig({ ...prev, ...partial });
      try {
        localStorage.setItem(STORAGE_KEY_BM_CONFIG, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving black market config', e);
      }
      return next;
    });
  }, []);

  // Receta seleccionada del catálogo oficial
  const selectedRecipe: CraftEquipmentRecipe = useMemo(() => {
    const found = CRAFT_EQUIPMENT_RECIPES.find((r) => r.id === config.selectedRecipeId);
    return found || CRAFT_EQUIPMENT_RECIPES[0];
  }, [config.selectedRecipeId]);

  // Mapa de costes de materiales con memoria de precios manuales
  const materialUnitCosts = useMemo(() => {
    const costs: Record<string, number> = {};
    for (const mat of selectedRecipe.materials) {
      const key = `mat_${mat.materialId}_t${config.tier}`;
      costs[mat.materialId] = recipePrices[key] || DEFAULT_MATERIAL_PRICES[mat.materialId] || 1500;
    }
    return costs;
  }, [selectedRecipe, config.tier, recipePrices]);

  // Actualizar precio de un material de la receta
  const updateMaterialPrice = useCallback(
    (materialId: string, price: number) => {
      const key = `mat_${materialId}_t${config.tier}`;
      updateCraftPrice(key, Math.max(0, Math.floor(price)));
    },
    [config.tier, updateCraftPrice]
  );

  // Clave del precio del ítem en mercado negro
  const bmPriceKey = useMemo(() => {
    return `bm_${selectedRecipe.id}_t${config.tier}_e${config.enchantment}`;
  }, [selectedRecipe.id, config.tier, config.enchantment]);

  // Precio actual del Mercado Negro (prioriza el manual configurado o el de memoria)
  const currentBlackMarketPrice = useMemo(() => {
    if (config.customBlackMarketPrice !== undefined && config.customBlackMarketPrice > 0) {
      return config.customBlackMarketPrice;
    }
    return recipePrices[bmPriceKey] || Math.round((selectedRecipe.itemValue || 200) * 80);
  }, [config.customBlackMarketPrice, recipePrices, bmPriceKey, selectedRecipe.itemValue]);

  // Actualizar precio de mercado negro
  const setBlackMarketPrice = useCallback(
    (newPrice: number) => {
      const val = Math.max(0, Math.floor(newPrice));
      updateConfig({ customBlackMarketPrice: val });
      updateCraftPrice(bmPriceKey, val);
    },
    [bmPriceKey, updateCraftPrice, updateConfig]
  );

  // Cálculo puro mediante el caso de uso
  const simulationResult: BlackMarketSimulationResult = useMemo(() => {
    const emptyJournalKey = `journal_${selectedRecipe.associatedLabourer}_empty_t${config.tier}`;
    const fullJournalKey = `journal_${selectedRecipe.associatedLabourer}_full_t${config.tier}`;

    const emptyJournalPrice = recipePrices[emptyJournalKey] || 2500;
    const fullJournalValue = recipePrices[fullJournalKey] || 12500;

    return calculateBlackMarketThreshold({
      recipe: selectedRecipe,
      tier: config.tier,
      enchantment: config.enchantment,
      craftingCity: config.craftingCity,
      orderType: config.orderType,
      currentBlackMarketPrice,
      targetRoiPercentage: config.targetRoiPercentage,
      batchQuantity: config.batchQuantity,
      useFocus: config.useFocus,
      stationFeePer100Nutrition: config.stationFeePer100Nutrition,
      craftingBonusPercent: dailyCraftingBonusPercent,
      hasPremium: config.hasPremium,
      materialUnitCosts,
      emptyJournalPrice,
      fullJournalValue,
    });
  }, [
    selectedRecipe,
    config.tier,
    config.enchantment,
    config.craftingCity,
    config.orderType,
    currentBlackMarketPrice,
    config.targetRoiPercentage,
    config.batchQuantity,
    config.useFocus,
    config.stationFeePer100Nutrition,
    dailyCraftingBonusPercent,
    config.hasPremium,
    materialUnitCosts,
    recipePrices,
  ]);

  // Registrar venta completada directamente al Libro Mayor (CraftingSalesLedger)
  const logSaleToLedger = useCallback(() => {
    const totalMarketFees = simulationResult.marketTaxesPerUnit * config.batchQuantity;
    const grossRevenue = simulationResult.currentBlackMarketPrice * config.batchQuantity;
    const netRevenue = grossRevenue - totalMarketFees;
    const isDirect = config.orderType === 'instant_buy_order';

    addRecord({
      itemId: selectedRecipe.id,
      itemName: `${selectedRecipe.nameEs} T${config.tier}${config.enchantment > 0 ? '.' + config.enchantment : ''}`,
      tier: config.tier,
      enchantment: config.enchantment,
      quality: 'normal',
      batchCount: config.batchQuantity,
      productionCostTotal: simulationResult.totalBatchCraftingCost,
      unitProductionCost: simulationResult.netCraftingCostPerUnit,
      destination: 'black_market',
      destinationCityName: 'Caerleon (Mercado Negro)',
      unitSalePrice: simulationResult.currentBlackMarketPrice,
      grossRevenue,
      marketTaxPercent: isDirect ? 0 : (config.hasPremium ? 4 : 8),
      setupFeePercent: isDirect ? 0 : 2.5,
      totalMarketFees,
      netRevenue,
      netProfit: simulationResult.totalBatchNetProfit,
      profitPerUnit: simulationResult.netProfitPerUnit,
      roiPercent: simulationResult.actualRoiPercentage,
      notes: `Venta simulada a orden ${isDirect ? 'de compra directa (0% impuestos)' : 'de venta'} en Caerleon con ${simulationResult.actualRoiPercentage.toFixed(1)}% ROI.`,
    });
  }, [addRecord, selectedRecipe, config, simulationResult]);

  return {
    config,
    updateConfig,
    allRecipes: CRAFT_EQUIPMENT_RECIPES,
    selectedRecipe,
    materialUnitCosts,
    updateMaterialPrice,
    currentBlackMarketPrice,
    setBlackMarketPrice,
    simulationResult,
    logSaleToLedger,
  };
}
