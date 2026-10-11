import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TransmutationMode,
  TransmutationResourceType,
  ShardTransmutationType,
  TransmutationCalculationResult,
  TRANSMUTATION_RESOURCES,
} from '../domain/models/transmutation';
import { calculateResourceTransmutation } from '../domain/use-cases/calculateResourceTransmutation';
import { usePriceMemory } from './usePriceMemory';

const STORAGE_KEY_TRANSMUTATION_CONFIG = 'albion_transmutation_config_v1';
const STORAGE_KEY_TRANSMUTATION_PRICES = 'albion_transmutation_prices_v1';

export interface StoredTransmutationConfig {
  mode: TransmutationMode;
  resourceType: TransmutationResourceType;
  sourceTier: number;
  sourceEnchantment: number;
  targetTier: number;
  targetEnchantment: number;
  shardType: ShardTransmutationType;
  batchCount: number;
  hasPremium: boolean;
}

const DEFAULT_CONFIG: StoredTransmutationConfig = {
  mode: 'enchantment',
  resourceType: 'bar',
  sourceTier: 5,
  sourceEnchantment: 0,
  targetTier: 5,
  targetEnchantment: 1,
  shardType: 'rune_to_soul',
  batchCount: 10,
  hasPremium: true,
};

function sanitizeConfig(raw: unknown): StoredTransmutationConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;
  const safeObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }
  const mode: TransmutationMode = safeObj.mode === 'tier' || safeObj.mode === 'artefact_shard'
    ? safeObj.mode
    : 'enchantment';
  const validResourceTypes = ['bar', 'leather', 'cloth', 'wood', 'stone', 'ore_raw', 'hide_raw', 'fiber_raw', 'wood_raw', 'stone_raw'];
  const resourceType: TransmutationResourceType = validResourceTypes.includes(String(safeObj.resourceType))
    ? (safeObj.resourceType as TransmutationResourceType)
    : 'bar';

  const sTier = Math.max(4, Math.min(8, Number(safeObj.sourceTier) || 5));
  const sEnc = Math.max(0, Math.min(4, Number(safeObj.sourceEnchantment) || 0));
  const tTier = Math.max(4, Math.min(8, Number(safeObj.targetTier) || sTier));
  const tEnc = Math.max(0, Math.min(4, Number(safeObj.targetEnchantment) || (sEnc + 1)));

  const shardType: ShardTransmutationType = safeObj.shardType === 'soul_to_relic' ? 'soul_to_relic' : 'rune_to_soul';
  const batchCount = Math.max(1, Math.min(100000, Number(safeObj.batchCount) || 10));

  return {
    mode,
    resourceType,
    sourceTier: sTier,
    sourceEnchantment: sEnc,
    targetTier: tTier,
    targetEnchantment: tEnc,
    shardType,
    batchCount,
    hasPremium: safeObj.hasPremium !== false,
  };
}

export function useTransmutationCalculator() {
  const { recipePrices, updateCraftPrice } = usePriceMemory();

  const [config, setConfig] = useState<StoredTransmutationConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TRANSMUTATION_CONFIG);
      if (raw) return sanitizeConfig(JSON.parse(raw));
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TRANSMUTATION_PRICES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const clean: Record<string, number> = {};
          for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
            if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && Number.isFinite(v)) {
              clean[k] = Math.max(0, Math.floor(Number(v)));
            }
          }
          return clean;
        }
      }
    } catch {}
    return {
      'trans_bar_t5_e0': 1800,
      'trans_bar_t5_e1': 4200,
    };
  });

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_TRANSMUTATION_CONFIG && e.newValue) {
        try {
          setConfig(sanitizeConfig(JSON.parse(e.newValue)));
        } catch {}
      } else if (e.key === STORAGE_KEY_TRANSMUTATION_PRICES && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            const clean: Record<string, number> = {};
            for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
              if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && Number.isFinite(v)) {
                clean[k] = Math.max(0, Math.floor(Number(v)));
              }
            }
            setCustomPrices(clean);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateConfig = useCallback((partial: Partial<StoredTransmutationConfig>) => {
    setConfig((prev) => {
      const next = sanitizeConfig({ ...prev, ...partial });
      try {
        localStorage.setItem(STORAGE_KEY_TRANSMUTATION_CONFIG, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const sourceItemKey = useMemo(() => {
    if (config.mode === 'artefact_shard') {
      return `shard_${config.shardType === 'rune_to_soul' ? 'rune' : 'soul'}_t${config.sourceTier}`;
    }
    return `trans_${config.resourceType}_t${config.sourceTier}_e${config.sourceEnchantment}`;
  }, [config.mode, config.shardType, config.resourceType, config.sourceTier, config.sourceEnchantment]);

  const targetItemKey = useMemo(() => {
    if (config.mode === 'artefact_shard') {
      return `shard_${config.shardType === 'rune_to_soul' ? 'soul' : 'relic'}_t${config.sourceTier}`;
    }
    const finalTier = config.mode === 'tier' ? config.targetTier : config.sourceTier;
    const finalEnc = config.mode === 'enchantment' ? config.targetEnchantment : config.sourceEnchantment;
    return `trans_${config.resourceType}_t${finalTier}_e${finalEnc}`;
  }, [config.mode, config.shardType, config.resourceType, config.sourceTier, config.targetTier, config.sourceEnchantment, config.targetEnchantment]);

  const currentSourcePrice = customPrices[sourceItemKey] ?? recipePrices[sourceItemKey] ?? 1800;
  const currentTargetPrice = customPrices[targetItemKey] ?? recipePrices[targetItemKey] ?? 4200;

  const updateItemPrice = useCallback((key: string, price: number) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
    const safePrice = Math.max(0, Math.floor(Number(price) || 0));
    setCustomPrices((prev) => {
      const updated = { ...prev, [key]: safePrice };
      try {
        localStorage.setItem(STORAGE_KEY_TRANSMUTATION_PRICES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    updateCraftPrice(key, safePrice);
  }, [updateCraftPrice]);

  const result: TransmutationCalculationResult = useMemo(() => {
    return calculateResourceTransmutation({
      mode: config.mode,
      resourceType: config.resourceType,
      sourceTier: config.sourceTier,
      sourceEnchantment: config.sourceEnchantment,
      targetTier: config.targetTier,
      targetEnchantment: config.targetEnchantment,
      shardType: config.shardType,
      batchCount: config.batchCount,
      sourceItemUnitPrice: currentSourcePrice,
      targetItemMarketSellPrice: currentTargetPrice,
      hasPremium: config.hasPremium,
    });
  }, [config, currentSourcePrice, currentTargetPrice]);

  return {
    config,
    updateConfig,
    availableResources: TRANSMUTATION_RESOURCES,
    sourceItemKey,
    targetItemKey,
    currentSourcePrice,
    currentTargetPrice,
    updateItemPrice,
    result,
  };
}
