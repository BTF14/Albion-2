import { useState, useMemo, useEffect } from 'react';
import { CityId } from '../types';
import {
  RefiningCalculationInput,
  RefiningCalculationMode,
  RefiningCalculationResult,
  RefiningResourceType,
} from '../domain/models/refining';
import { calculateRefiningEconomy, CITY_REFINING_BONUSES, getAlbionRefiningItemIds } from '../domain/use-cases/calculateRefiningEconomy';
import { calculateRefiningToCraftingPipeline, RefiningToCraftingPipelineResult } from '../domain/use-cases/calculateRefiningToCraftingPipeline';

const REFINING_CONFIG_KEY = 'albion_refining_config_v1';
const REFINING_PRICES_KEY = 'albion_refining_prices_v1';

export interface StoredRefiningConfig {
  resourceType: RefiningResourceType;
  tier: number;
  enchantment: number;
  batchCount: number;
  calculationMode: RefiningCalculationMode;
  useFocus: boolean;
  hasPremium: boolean;
  stationTaxPer100Nutrition: number;
  refinerMasteryLevel: number;
  resourceSpecLevel: number;
  otherTiersAverageSpec: number;
}

const DEFAULT_REFINING_CONFIG: StoredRefiningConfig = {
  resourceType: 'ore',
  tier: 4,
  enchantment: 0,
  batchCount: 100,
  calculationMode: 'single_batch',
  useFocus: false,
  hasPremium: true,
  stationTaxPer100Nutrition: 750,
  refinerMasteryLevel: 0,
  resourceSpecLevel: 0,
  otherTiersAverageSpec: 0,
};

const DEFAULT_REFINING_PRICES: Record<string, number> = {
  'raw_ore_4_0': 65,
  'prev_bar_3_0': 110,
  'refined_bar_4_0': 235,
};

const VALID_RESOURCE_TYPES: RefiningResourceType[] = ['ore', 'wood', 'hide', 'fiber', 'stone'];

function sanitizeRefiningConfig(raw: unknown): StoredRefiningConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_REFINING_CONFIG;

  const input = raw as Record<string, unknown>;
  const safeObj: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(input)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }

  const resType = typeof safeObj.resourceType === 'string' && VALID_RESOURCE_TYPES.includes(safeObj.resourceType as RefiningResourceType)
    ? (safeObj.resourceType as RefiningResourceType)
    : 'ore';

  const parsedTier = Number(safeObj.tier);
  const tier = Number.isFinite(parsedTier) ? Math.max(2, Math.min(8, Math.floor(parsedTier))) : 4;

  const parsedEnchantment = Number(safeObj.enchantment);
  const enchantment = Number.isFinite(parsedEnchantment) ? Math.max(0, Math.min(4, Math.floor(parsedEnchantment))) : 0;

  const parsedBatch = Number(safeObj.batchCount);
  const batchCount = Number.isFinite(parsedBatch) ? Math.max(1, Math.min(1000000, Math.floor(parsedBatch))) : 100;

  const calculationMode: RefiningCalculationMode = safeObj.calculationMode === 'cascade_full'
    ? 'cascade_full'
    : 'single_batch';

  const parsedTax = Number(safeObj.stationTaxPer100Nutrition);
  const stationTaxPer100Nutrition = Number.isFinite(parsedTax) ? Math.max(0, Math.min(10000, parsedTax)) : 750;

  const parsedMastery = Number(safeObj.refinerMasteryLevel);
  const refinerMasteryLevel = Number.isFinite(parsedMastery) ? Math.max(0, Math.min(100, Math.floor(parsedMastery))) : 0;

  const parsedSpec = Number(safeObj.resourceSpecLevel);
  const resourceSpecLevel = Number.isFinite(parsedSpec) ? Math.max(0, Math.min(100, Math.floor(parsedSpec))) : 0;

  const parsedOtherSpec = Number(safeObj.otherTiersAverageSpec);
  const otherTiersAverageSpec = Number.isFinite(parsedOtherSpec) ? Math.max(0, Math.min(100, Math.floor(parsedOtherSpec))) : 0;

  return {
    resourceType: resType,
    tier,
    enchantment,
    batchCount,
    calculationMode,
    useFocus: Boolean(safeObj.useFocus),
    hasPremium: safeObj.hasPremium !== false,
    stationTaxPer100Nutrition,
    refinerMasteryLevel,
    resourceSpecLevel,
    otherTiersAverageSpec,
  };
}

function sanitizeRefiningPrices(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return DEFAULT_REFINING_PRICES;

  const input = raw as Record<string, unknown>;
  const cleanPrices: Record<string, number> = { ...DEFAULT_REFINING_PRICES };

  for (const [k, v] of Object.entries(input)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    const num = Number(v);
    if (Number.isFinite(num) && num >= 0) {
      cleanPrices[k] = Math.floor(num);
    }
  }

  return cleanPrices;
}

export function useRefiningCalculator(cityId: CityId, dailyProductionBonusRRR: number = 0) {
  const [config, setConfig] = useState<StoredRefiningConfig>(() => {
    try {
      const raw = localStorage.getItem(REFINING_CONFIG_KEY);
      if (raw) {
        return sanitizeRefiningConfig(JSON.parse(raw));
      }
    } catch {
      // Ignorar error de parsing
    }
    return DEFAULT_REFINING_CONFIG;
  });

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(REFINING_PRICES_KEY);
      if (raw) return sanitizeRefiningPrices(JSON.parse(raw));
    } catch {}
    return DEFAULT_REFINING_PRICES;
  });

  // Sincronización multi-pestaña
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === REFINING_CONFIG_KEY && e.newValue) {
        try {
          setConfig(sanitizeRefiningConfig(JSON.parse(e.newValue)));
        } catch {}
      } else if (e.key === REFINING_PRICES_KEY && e.newValue) {
        try {
          setPrices(sanitizeRefiningPrices(JSON.parse(e.newValue)));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(REFINING_CONFIG_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(REFINING_PRICES_KEY, JSON.stringify(prices));
    } catch {}
  }, [prices]);

  const updateConfig = (partial: Partial<StoredRefiningConfig>) => {
    setConfig((prev) => sanitizeRefiningConfig({ ...prev, ...partial }));
  };

  const updatePrice = (key: string, price: number) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
    setPrices((prev) => ({ ...prev, [key]: Math.max(0, Math.round(Number(price) || 0)) }));
  };

  const rawKey = `raw_${config.resourceType}_${config.tier}_${config.enchantment}`;
  const prevKey = `prev_${config.resourceType}_${Math.max(2, config.tier - 1)}_0`;
  const finishedKey = `refined_${config.resourceType}_${config.tier}_${config.enchantment}`;

  const currentRawPrice = prices[rawKey] ?? (config.tier === 4 ? 65 : config.tier === 5 ? 180 : 450);
  const currentPrevPrice = prices[prevKey] ?? (config.tier > 2 ? 110 : 0);
  const currentFinishedPrice = prices[finishedKey] ?? (config.tier === 4 ? 240 : config.tier === 5 ? 650 : 1800);

  const albionItemIds = useMemo(() => {
    return getAlbionRefiningItemIds(config.resourceType, config.tier, config.enchantment);
  }, [config.resourceType, config.tier, config.enchantment]);

  const calculationResult: RefiningCalculationResult = useMemo(() => {
    const input: RefiningCalculationInput = {
      resourceType: config.resourceType,
      tier: config.tier,
      enchantment: config.enchantment,
      batchCount: config.batchCount,
      cityId,
      calculationMode: config.calculationMode,
      hasDailyEventBonus: dailyProductionBonusRRR > 0,
      dailyEventBonusPercent: dailyProductionBonusRRR,
      useFocus: config.useFocus,
      hasPremium: config.hasPremium,
      stationTaxPer100Nutrition: config.stationTaxPer100Nutrition,
      rawMaterialPrice: currentRawPrice,
      previousTierRefinedPrice: currentPrevPrice,
      finishedRefinedSellPrice: currentFinishedPrice,
      refinerMasteryLevel: config.refinerMasteryLevel,
      resourceSpecLevel: config.resourceSpecLevel,
      otherTiersAverageSpec: config.otherTiersAverageSpec,
    };

    return calculateRefiningEconomy(input);
  }, [config, cityId, dailyProductionBonusRRR, currentRawPrice, currentPrevPrice, currentFinishedPrice]);

  const pipelineResult: RefiningToCraftingPipelineResult = useMemo(() => {
    // Si está en cascada, usamos la cantidad total producida en cascada; si no, la del lote
    const producedUnits = config.calculationMode === 'cascade_full'
      ? calculationResult.cascadeTotalUnitsProduced
      : calculationResult.totalUnitsProduced;

    return calculateRefiningToCraftingPipeline({
      resourceType: config.resourceType,
      tier: config.tier,
      enchantment: config.enchantment,
      refinedUnitsAvailable: producedUnits,
      currentRefinedUnitPrice: currentFinishedPrice,
      currentCityId: cityId,
      hasPremium: config.hasPremium,
      useFocus: config.useFocus,
      manualPrices: prices,
    });
  }, [
    config.resourceType,
    config.tier,
    config.enchantment,
    config.calculationMode,
    config.hasPremium,
    config.useFocus,
    calculationResult.cascadeTotalUnitsProduced,
    calculationResult.totalUnitsProduced,
    currentFinishedPrice,
    cityId,
    prices,
  ]);

  return {
    config,
    updateConfig,
    prices,
    updatePrice,
    rawKey,
    prevKey,
    finishedKey,
    albionItemIds,
    currentRawPrice,
    currentPrevPrice,
    currentFinishedPrice,
    calculationResult,
    pipelineResult,
    cityBonus: CITY_REFINING_BONUSES[cityId],
  };
}
