/**
 * Custom Hook: useFishingSaucesEconomy
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Gestiona el estado reactivo, la persistencia en localStorage y la optimización
 * para el Taller de Pesca, Fileteado y Salsas de Comida.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FishingSaucesInput,
  FishingSaucesResult,
  OFFICIAL_FISH_TIERS,
} from '../domain/models/fishingSauces';
import { calculateFishingSaucesEconomy } from '../domain/use-cases/calculateFishingSaucesEconomy';
import { loadWorkshopPrices, saveWorkshopPrices } from '../utils/storage';

const STORAGE_KEY = 'albion_fishing_sauces_config_v1';

const DEFAULT_CONFIG: FishingSaucesInput = {
  fishTier: 4,
  fishQuantity: 100,
  fishMarketPriceSilver: 700,
  choppedFishMarketPriceSilver: 95,
  seaweedMarketPriceSilver: 450,
  basicSaucePriceSilver: 280,
  fancySaucePriceSilver: 950,
  specialSaucePriceSilver: 3200,
  hasPremium: true,
  nutritionFeePer100: 250,
};

export function useFishingSaucesEconomy() {
  const [config, setConfig] = useState<FishingSaucesInput>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
      // Si no existe configuración previa, sincronizar con precios de taller de cocina
      const workshop = loadWorkshopPrices();
      return {
        ...DEFAULT_CONFIG,
        choppedFishMarketPriceSilver: workshop.choppedFishPrice || DEFAULT_CONFIG.choppedFishMarketPriceSilver,
        seaweedMarketPriceSilver: workshop.seaweedPrice || DEFAULT_CONFIG.seaweedMarketPriceSilver,
        basicSaucePriceSilver: workshop.marketSaucePrices?.[1] || DEFAULT_CONFIG.basicSaucePriceSilver,
        fancySaucePriceSilver: workshop.marketSaucePrices?.[2] || DEFAULT_CONFIG.fancySaucePriceSilver,
        specialSaucePriceSilver: workshop.marketSaucePrices?.[3] || DEFAULT_CONFIG.specialSaucePriceSilver,
      };
    } catch {}
    return DEFAULT_CONFIG;
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  // Sincronización multi-pestaña / taller de cocina
  useEffect(() => {
    const handleSync = () => {
      try {
        const workshop = loadWorkshopPrices();
        setConfig((prev) => ({
          ...prev,
          choppedFishMarketPriceSilver: workshop.choppedFishPrice || prev.choppedFishMarketPriceSilver,
          seaweedMarketPriceSilver: workshop.seaweedPrice || prev.seaweedMarketPriceSilver,
          basicSaucePriceSilver: workshop.marketSaucePrices?.[1] || prev.basicSaucePriceSilver,
          fancySaucePriceSilver: workshop.marketSaucePrices?.[2] || prev.fancySaucePriceSilver,
          specialSaucePriceSilver: workshop.marketSaucePrices?.[3] || prev.specialSaucePriceSilver,
        }));
      } catch {}
    };

    window.addEventListener('albion_storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const updateConfig = useCallback((changes: Partial<FishingSaucesInput>) => {
    setConfig((prev) => ({ ...prev, ...changes }));
  }, []);

  const resetToDefaults = useCallback(() => {
    const tier = OFFICIAL_FISH_TIERS.find((f) => f.tier === config.fishTier) || OFFICIAL_FISH_TIERS[3];
    setConfig({
      ...DEFAULT_CONFIG,
      fishTier: tier.tier,
      fishMarketPriceSilver: tier.estimatedMarketPriceSilver,
    });
  }, [config.fishTier]);

  const syncPricesToWorkshop = useCallback(() => {
    try {
      const current = loadWorkshopPrices();
      saveWorkshopPrices({
        ...current,
        choppedFishPrice: config.choppedFishMarketPriceSilver,
        seaweedPrice: config.seaweedMarketPriceSilver,
        marketSaucePrices: {
          1: config.basicSaucePriceSilver,
          2: config.fancySaucePriceSilver,
          3: config.specialSaucePriceSilver,
        },
      });
    } catch {}
  }, [config]);

  const result: FishingSaucesResult = useMemo(() => {
    return calculateFishingSaucesEconomy(config);
  }, [config]);

  const currentTierInfo = useMemo(() => {
    return OFFICIAL_FISH_TIERS.find((f) => f.tier === config.fishTier) || OFFICIAL_FISH_TIERS[3];
  }, [config.fishTier]);

  return {
    config,
    updateConfig,
    resetToDefaults,
    syncPricesToWorkshop,
    result,
    currentTierInfo,
    fishTiers: OFFICIAL_FISH_TIERS,
  };
}
