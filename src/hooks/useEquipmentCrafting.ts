import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CraftStationType,
  CraftEquipmentRecipe,
  CraftingBatchCalculationInput,
  CraftingBatchCalculationResult,
  ItemQuality,
} from '../domain/models/equipmentCrafting';
import { CRAFT_EQUIPMENT_RECIPES } from '../data/equipmentRecipes';
import { calculateEquipmentCraftingEconomy } from '../domain/use-cases/calculateEquipmentCraftingEconomy';
import { CityId } from '../types';

const STORAGE_KEY_EQUIPMENT_CRAFT_PREFERENCES = 'albion_equipment_craft_prefs_v1';
const STORAGE_KEY_EQUIPMENT_PRICES = 'albion_equipment_craft_prices_v1';

function parseSafeEquipmentPrices(rawJson: string | null): Record<string, number> {
  const defaultPrices: Record<string, number> = {
    bar_metal_t5: 1250,
    leather_t5: 980,
    cloth_t5: 890,
    planks_t5: 1100,
    empty_journal_t5: 4500,
    filled_journal_t5: 24000,
    sword_broadsword_t5: 36000,
  };
  if (!rawJson) return defaultPrices;
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return defaultPrices;
    const safe: Record<string, number> = { ...defaultPrices };
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (typeof v === 'number' && Number.isFinite(v)) {
        safe[k] = Math.max(0, Math.floor(v));
      }
    }
    return safe;
  } catch {
    return defaultPrices;
  }
}

export interface UseEquipmentCraftingState {
  station: CraftStationType;
  selectedRecipeId: string;
  tier: number;
  enchantment: number;
  quality: ItemQuality;
  batchCount: number;
  useFocus: boolean;
  hasPremium: boolean;
  stationTaxPer100Nutrition: number;
  hasCrafterSalad: boolean;
  saladType: 'none' | 'bean_t2' | 'turnip_t4' | 'potato_t6' | 'kraken_t6';
  crafterMasteryLevel: number;
  itemSpecLevel: number;
  otherSpecsAverageLevel: number;
  availableFocusPoints: number;
  journalStrategy: 'sell_filled' | 'use_labourers' | 'no_journals';
  labourerYieldPercent: number;
}

export function useEquipmentCrafting(
  cityId: CityId,
  dailyProductionBonusRRR?: number
) {
  // 1. Estado de Configuración del Crafteo
  const [config, setConfig] = useState<UseEquipmentCraftingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EQUIPMENT_CRAFT_PREFERENCES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          station: parsed.station || 'forge',
          selectedRecipeId: parsed.selectedRecipeId || 'sword_broadsword',
          tier: Number(parsed.tier) || 5,
          enchantment: Number(parsed.enchantment) || 0,
          quality: parsed.quality || 'normal',
          batchCount: Number(parsed.batchCount) || 10,
          useFocus: Boolean(parsed.useFocus),
          hasPremium: parsed.hasPremium !== false,
          stationTaxPer100Nutrition: Number(parsed.stationTaxPer100Nutrition) || 750,
          hasCrafterSalad: Boolean(parsed.hasCrafterSalad),
          saladType: parsed.saladType || 'none',
          crafterMasteryLevel: Number(parsed.crafterMasteryLevel) || 0,
          itemSpecLevel: Number(parsed.itemSpecLevel) || 0,
          otherSpecsAverageLevel: Number(parsed.otherSpecsAverageLevel) || 0,
          availableFocusPoints: Number(parsed.availableFocusPoints) || 10000,
          journalStrategy: parsed.journalStrategy || 'sell_filled',
          labourerYieldPercent: Number(parsed.labourerYieldPercent) || 125,
        };
      }
    } catch {
      // fallback
    }

    return {
      station: 'forge',
      selectedRecipeId: 'sword_broadsword',
      tier: 5,
      enchantment: 0,
      quality: 'normal',
      batchCount: 10,
      useFocus: false,
      hasPremium: true,
      stationTaxPer100Nutrition: 750,
      hasCrafterSalad: false,
      saladType: 'none',
      crafterMasteryLevel: 0,
      itemSpecLevel: 0,
      otherSpecsAverageLevel: 0,
      availableFocusPoints: 10000,
      journalStrategy: 'sell_filled',
      labourerYieldPercent: 125,
    };
  });

  // 2. Memoria de Precios Manuales de Materiales, Diarios e Ítems
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    return parseSafeEquipmentPrices(localStorage.getItem(STORAGE_KEY_EQUIPMENT_PRICES));
  });

  // Persistir configuración en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPMENT_CRAFT_PREFERENCES, JSON.stringify(config));
    } catch {
      // ignore storage quota errors
    }
  }, [config]);

  // Persistir precios manuales
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EQUIPMENT_PRICES, JSON.stringify(prices));
    } catch {
      // ignore
    }
  }, [prices]);

  // Sincronización entre pestañas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_EQUIPMENT_PRICES && e.newValue) {
        setPrices(parseSafeEquipmentPrices(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Recetas filtradas por la estación activa
  const stationRecipes = useMemo(() => {
    return CRAFT_EQUIPMENT_RECIPES.filter((r) => r.station === config.station);
  }, [config.station]);

  // Receta seleccionada actual
  const currentRecipe = useMemo(() => {
    const found = CRAFT_EQUIPMENT_RECIPES.find((r) => r.id === config.selectedRecipeId);
    if (found && found.station === config.station) {
      return found;
    }
    return stationRecipes[0] || CRAFT_EQUIPMENT_RECIPES[0];
  }, [config.selectedRecipeId, config.station, stationRecipes]);

  // Actualizador granular de configuración
  const updateConfig = useCallback((partial: Partial<UseEquipmentCraftingState>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // Actualizador de precios manuales
  const updatePrice = useCallback((key: string, value: number) => {
    setPrices((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  }, []);

  // Verificar si el ítem disfruta del bono de especialización de la ciudad actual
  const isCityBonusActive = useMemo(() => {
    // Ciudades y sus especialidades
    const slot = currentRecipe.slot;
    const recipeId = currentRecipe.id;

    if (cityId === 'martlock' && (recipeId.includes('axe') || recipeId.includes('shield') || slot === 'shoes')) {
      return true;
    }
    if (cityId === 'fort_sterling' && (recipeId.includes('plate_helmet') || slot === 'chest' && currentRecipe.station === 'mage')) {
      return true;
    }
    if (cityId === 'lymhurst' && (recipeId.includes('sword') || recipeId.includes('bow') || slot === 'chest' && currentRecipe.station === 'hunter')) {
      return true;
    }
    if (cityId === 'bridgewatch' && (recipeId.includes('crossbow') || recipeId.includes('dagger') || recipeId.includes('fire'))) {
      return true;
    }
    if (cityId === 'thetford' && (recipeId.includes('plate_armor') || recipeId.includes('leather_hood'))) {
      return true;
    }

    return false;
  }, [cityId, currentRecipe]);

  // Cálculo financiero puro (Clean Architecture Use-Case)
  const calculationResult: CraftingBatchCalculationResult = useMemo(() => {
    const tier = config.tier;
    const emptyJournalKey = `empty_journal_t${tier}`;
    const filledJournalKey = `filled_journal_t${tier}`;
    const finishedItemKey = `${currentRecipe.id}_t${tier}`;

    // Mapear precios de materiales requeridos
    const materialPrices: Record<string, number> = {};
    currentRecipe.materials.forEach((mat) => {
      const matKey = `${mat.materialId}_t${tier}`;
      materialPrices[mat.materialId] = prices[matKey] ?? (prices[mat.materialId] || 1000);
    });

    const finishedItemSellPrice = prices[finishedItemKey] || 35000;
    const emptyJournalBuyPrice = prices[emptyJournalKey] || 4500;
    const filledJournalSellPrice = prices[filledJournalKey] || 24000;

    const input: CraftingBatchCalculationInput = {
      recipe: currentRecipe,
      tier: config.tier,
      enchantment: config.enchantment,
      quality: config.quality,
      batchCount: config.batchCount,
      cityId,
      isCityCraftBonusActive: isCityBonusActive,
      hasDailyEventBonus: Boolean(dailyProductionBonusRRR && dailyProductionBonusRRR > 0),
      dailyEventBonusPercent: dailyProductionBonusRRR,
      useFocus: config.useFocus,
      hasPremium: config.hasPremium,
      stationTaxPer100Nutrition: config.stationTaxPer100Nutrition,
      hasCrafterSalad: config.hasCrafterSalad || config.saladType !== 'none',
      saladType: config.saladType,
      crafterMasteryLevel: config.crafterMasteryLevel,
      itemSpecLevel: config.itemSpecLevel,
      otherSpecsAverageLevel: config.otherSpecsAverageLevel,
      availableFocusPoints: config.availableFocusPoints,
      materialPrices,
      finishedItemSellPrice,
      emptyJournalBuyPrice,
      filledJournalSellPrice,
      journalStrategy: config.journalStrategy,
      labourerYieldPercent: config.labourerYieldPercent,
      labourerReturnedMaterialValue: filledJournalSellPrice * 1.15,
    };

    return calculateEquipmentCraftingEconomy(input);
  }, [config, prices, currentRecipe, cityId, isCityBonusActive, dailyProductionBonusRRR]);

  return {
    config,
    updateConfig,
    prices,
    updatePrice,
    stationRecipes,
    currentRecipe,
    isCityBonusActive,
    calculationResult,
  };
}
