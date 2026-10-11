import { useState, useMemo, useEffect } from 'react';
import {
  EnchantingCalculationInput,
  EnchantingCalculationResult,
  EnchantingSlotRequirements,
} from '../domain/models/enchanting';
import {
  calculateEnchantingEconomy,
  ENCHANTING_SLOT_REQUIREMENTS,
} from '../domain/use-cases/calculateEnchantingEconomy';

const ENCHANTING_CONFIG_KEY = 'albion_enchanting_config_v1';
const ENCHANTING_PRICES_KEY = 'albion_enchanting_prices_v1';

export interface StoredEnchantingConfig {
  slotId: 'one_hand_weapon' | 'two_hand_weapon' | 'chest' | 'head' | 'shoes' | 'offhand' | 'cape';
  tier: number;
  currentEnchantment: 0 | 1 | 2 | 3;
  targetEnchantment: 1 | 2 | 3 | 4;
  batchCount: number;
  hasPremium: boolean;
}

const DEFAULT_ENCHANTING_CONFIG: StoredEnchantingConfig = {
  slotId: 'one_hand_weapon',
  tier: 5,
  currentEnchantment: 0,
  targetEnchantment: 1,
  batchCount: 1,
  hasPremium: true,
};

const DEFAULT_ENCHANTING_PRICES: Record<string, number> = {
  'base_item_5_0': 18000,
  'target_item_5_1': 38000,
  'shard_rune_5': 140,
};

const VALID_SLOT_IDS = ['one_hand_weapon', 'two_hand_weapon', 'chest', 'head', 'shoes', 'offhand', 'cape'];

function sanitizeEnchantingConfig(raw: unknown): StoredEnchantingConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_ENCHANTING_CONFIG;

  const input = raw as Record<string, unknown>;
  const safeObj: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(input)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }

  const slotId = typeof safeObj.slotId === 'string' && VALID_SLOT_IDS.includes(safeObj.slotId)
    ? (safeObj.slotId as StoredEnchantingConfig['slotId'])
    : 'one_hand_weapon';

  const parsedTier = Number(safeObj.tier);
  const tier = Number.isFinite(parsedTier) ? Math.max(4, Math.min(8, Math.floor(parsedTier))) : 5;

  const parsedCurrent = Number(safeObj.currentEnchantment);
  const currentEnchantment = ([0, 1, 2, 3].includes(parsedCurrent) ? parsedCurrent : 0) as 0 | 1 | 2 | 3;

  const parsedTarget = Number(safeObj.targetEnchantment);
  let targetEnchantment = ([1, 2, 3, 4].includes(parsedTarget) ? parsedTarget : 1) as 1 | 2 | 3 | 4;
  if (targetEnchantment <= currentEnchantment) {
    targetEnchantment = Math.min(4, currentEnchantment + 1) as 1 | 2 | 3 | 4;
  }

  const parsedBatch = Number(safeObj.batchCount);
  const batchCount = Number.isFinite(parsedBatch) ? Math.max(1, Math.min(100000, Math.floor(parsedBatch))) : 1;

  return {
    slotId,
    tier,
    currentEnchantment,
    targetEnchantment,
    batchCount,
    hasPremium: safeObj.hasPremium !== false,
  };
}

function sanitizeEnchantingPrices(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return DEFAULT_ENCHANTING_PRICES;

  const input = raw as Record<string, unknown>;
  const cleanPrices: Record<string, number> = { ...DEFAULT_ENCHANTING_PRICES };

  for (const [k, v] of Object.entries(input)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    const num = Number(v);
    if (Number.isFinite(num) && num >= 0) {
      cleanPrices[k] = Math.floor(num);
    }
  }

  return cleanPrices;
}

export function useEnchantingCalculator() {
  const [config, setConfig] = useState<StoredEnchantingConfig>(() => {
    try {
      const raw = localStorage.getItem(ENCHANTING_CONFIG_KEY);
      if (raw) {
        return sanitizeEnchantingConfig(JSON.parse(raw));
      }
    } catch {}
    return DEFAULT_ENCHANTING_CONFIG;
  });

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(ENCHANTING_PRICES_KEY);
      if (raw) return sanitizeEnchantingPrices(JSON.parse(raw));
    } catch {}
    return DEFAULT_ENCHANTING_PRICES;
  });

  // Sincronización multi-pestaña
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ENCHANTING_CONFIG_KEY && e.newValue) {
        try {
          setConfig(sanitizeEnchantingConfig(JSON.parse(e.newValue)));
        } catch {}
      } else if (e.key === ENCHANTING_PRICES_KEY && e.newValue) {
        try {
          setPrices(sanitizeEnchantingPrices(JSON.parse(e.newValue)));
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
      localStorage.setItem(ENCHANTING_CONFIG_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(ENCHANTING_PRICES_KEY, JSON.stringify(prices));
    } catch {}
  }, [prices]);

  const updateConfig = (partial: Partial<StoredEnchantingConfig>) => {
    setConfig((prev) => {
      const next = sanitizeEnchantingConfig({ ...prev, ...partial });
      // Asegurar que targetEnchantment sea mayor a currentEnchantment
      if (next.targetEnchantment <= next.currentEnchantment) {
        next.targetEnchantment = Math.min(4, next.currentEnchantment + 1) as 1 | 2 | 3 | 4;
      }
      return next;
    });
  };

  const updatePrice = (key: string, price: number) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
    setPrices((prev) => ({ ...prev, [key]: Math.max(0, price) }));
  };

  const slotRequirements: EnchantingSlotRequirements = ENCHANTING_SLOT_REQUIREMENTS[config.slotId] || ENCHANTING_SLOT_REQUIREMENTS.one_hand_weapon;

  const baseItemKey = `base_item_${config.slotId}_${config.tier}_${config.currentEnchantment}`;
  const targetItemKey = `target_item_${config.slotId}_${config.tier}_${config.targetEnchantment}`;
  
  const shardTypeName = config.targetEnchantment === 1 ? 'rune' : config.targetEnchantment === 2 ? 'soul' : config.targetEnchantment === 3 ? 'relic' : 'avalonian';
  const shardKey = `shard_${shardTypeName}_${config.tier}`;

  const currentBasePrice = prices[baseItemKey] ?? (config.tier === 4 ? 6000 : config.tier === 5 ? 18000 : 55000);
  const currentTargetPrice = prices[targetItemKey] ?? (config.tier === 4 ? 14000 : config.tier === 5 ? 38000 : 120000);
  const currentShardPrice = prices[shardKey] ?? (shardTypeName === 'rune' ? 140 : shardTypeName === 'soul' ? 450 : shardTypeName === 'relic' ? 1800 : 5200);

  const calculationResult: EnchantingCalculationResult = useMemo(() => {
    const input: EnchantingCalculationInput = {
      slotId: config.slotId,
      tier: config.tier,
      currentEnchantment: config.currentEnchantment,
      targetEnchantment: config.targetEnchantment,
      batchCount: config.batchCount,
      hasPremium: config.hasPremium,
      baseItemPrice: currentBasePrice,
      targetItemMarketPrice: currentTargetPrice,
      shardUnitPrice: currentShardPrice,
    };

    return calculateEnchantingEconomy(input);
  }, [config, currentBasePrice, currentTargetPrice, currentShardPrice]);

  return {
    config,
    updateConfig,
    prices,
    updatePrice,
    slotRequirements,
    baseItemKey,
    targetItemKey,
    shardKey,
    currentBasePrice,
    currentTargetPrice,
    currentShardPrice,
    calculationResult,
  };
}
