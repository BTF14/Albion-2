import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ButcherAnimalId,
  BUTCHER_ANIMALS,
  ButcherCalculationResult,
} from '../domain/models/butcher';
import { calculateButcherEconomy } from '../domain/use-cases/calculateButcherEconomy';
import { usePriceMemory } from './usePriceMemory';
import { CityId } from '../types';

const STORAGE_KEY_BUTCHER_CONFIG = 'albion_butcher_config_v1';
const STORAGE_KEY_BUTCHER_PRICES = 'albion_butcher_prices_v1';

export interface StoredButcherConfig {
  animalId: ButcherAnimalId;
  animalsCount: number;
  slaughterLocation: 'city' | 'island';
  cityId: CityId;
  useFocus: boolean;
  hasPremium: boolean;
  stationTaxPer100Nutrition: number;
}

const DEFAULT_CONFIG: StoredButcherConfig = {
  animalId: 'animal_cow',
  animalsCount: 9,
  slaughterLocation: 'city',
  cityId: 'martlock',
  useFocus: false,
  hasPremium: true,
  stationTaxPer100Nutrition: 350,
};

function sanitizeConfig(raw: unknown): StoredButcherConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;
  const safeObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }

  const validAnimals: ButcherAnimalId[] = [
    'animal_chicken',
    'animal_goat',
    'animal_goose',
    'animal_sheep',
    'animal_pig',
    'animal_cow',
  ];
  const animalId: ButcherAnimalId = validAnimals.includes(safeObj.animalId as ButcherAnimalId)
    ? (safeObj.animalId as ButcherAnimalId)
    : 'animal_cow';

  const animalsCount = Math.max(1, Math.min(1000, Number(safeObj.animalsCount) || 9));
  const slaughterLocation = safeObj.slaughterLocation === 'island' ? 'island' : 'city';
  const cityId = typeof safeObj.cityId === 'string' ? (safeObj.cityId as CityId) : 'martlock';
  const useFocus = Boolean(safeObj.useFocus);
  const hasPremium = safeObj.hasPremium !== false;
  const stationTaxPer100Nutrition = Math.max(0, Math.min(2000, Number(safeObj.stationTaxPer100Nutrition) || 350));

  return {
    animalId,
    animalsCount,
    slaughterLocation,
    cityId,
    useFocus,
    hasPremium,
    stationTaxPer100Nutrition,
  };
}

export function useButcherEconomy(initialCityId?: CityId) {
  const { priceMemory, recipePrices, updateCraftPrice } = usePriceMemory();

  const [config, setConfig] = useState<StoredButcherConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BUTCHER_CONFIG);
      if (raw) return sanitizeConfig(JSON.parse(raw));
    } catch {}
    return { ...DEFAULT_CONFIG, cityId: initialCityId || 'martlock' };
  });

  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_BUTCHER_PRICES);
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
      'meat_beef': 520,
      'animal_cow_live': 85000,
      'produce_milk_cow': 380,
    };
  });

  // Sincronización multi-pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_BUTCHER_CONFIG && e.newValue) {
        try {
          setConfig(sanitizeConfig(JSON.parse(e.newValue)));
        } catch {}
      } else if (e.key === STORAGE_KEY_BUTCHER_PRICES && e.newValue) {
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
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateConfig = useCallback((partial: Partial<StoredButcherConfig>) => {
    setConfig((prev) => {
      const next = sanitizeConfig({ ...prev, ...partial });
      try {
        localStorage.setItem(STORAGE_KEY_BUTCHER_CONFIG, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updatePrice = useCallback((itemKey: string, price: number) => {
    if (itemKey === '__proto__' || itemKey === 'constructor' || itemKey === 'prototype') return;
    const safe = Math.max(0, Math.floor(Number(price) || 0));
    setCustomPrices((prev) => {
      const updated = { ...prev, [itemKey]: safe };
      try {
        localStorage.setItem(STORAGE_KEY_BUTCHER_PRICES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    updateCraftPrice(itemKey, safe);
  }, [updateCraftPrice]);

  const selectedAnimal = useMemo(() => {
    return BUTCHER_ANIMALS.find((a) => a.id === config.animalId) || BUTCHER_ANIMALS[5];
  }, [config.animalId]);

  // Precios manuales resueltos
  const meatPriceKey = selectedAnimal.meatItemId;
  const livePriceKey = `${selectedAnimal.id}_live`;
  const dairyPriceKey = selectedAnimal.produceItemId || '';

  const rawMeatPrice = customPrices[meatPriceKey] ?? priceMemory[meatPriceKey]?.lastProductPrice ?? 520;
  const liveAnimalPrice = customPrices[livePriceKey] ?? 85000;
  const dairyProducePrice = dairyPriceKey ? (customPrices[dairyPriceKey] ?? priceMemory[dairyPriceKey]?.lastProductPrice ?? 380) : 0;

  const result: ButcherCalculationResult = useMemo(() => {
    return calculateButcherEconomy({
      animalId: config.animalId,
      animalsCount: config.animalsCount,
      slaughterLocation: config.slaughterLocation,
      cityId: config.cityId,
      useFocus: config.useFocus,
      hasPremium: config.hasPremium,
      stationTaxPer100Nutrition: config.stationTaxPer100Nutrition,
      rawMeatMarketPrice: rawMeatPrice,
      liveAnimalMarketPrice: liveAnimalPrice,
      dairyProduceMarketPrice: dairyProducePrice,
    });
  }, [config, rawMeatPrice, liveAnimalPrice, dairyProducePrice]);

  return {
    config,
    updateConfig,
    animals: BUTCHER_ANIMALS,
    selectedAnimal,
    rawMeatPrice,
    liveAnimalPrice,
    dairyProducePrice,
    updatePrice,
    meatPriceKey,
    livePriceKey,
    dairyPriceKey,
    result,
  };
}
