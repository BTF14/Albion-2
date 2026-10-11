import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LabourerEconomicInput,
  LabourerEconomicResult,
  LABOURERS_CATALOG,
  HOUSES_TIER_INFO,
  calculateLabourerEconomy,
  PersistedLabourerConfig,
} from '../domain';

const STORAGE_KEY_LABOURERS_CONFIG = 'albion_farm_labourers_config_v1';

const DEFAULT_CONFIG: PersistedLabourerConfig = {
  labourerType: 'lumberjack',
  labourerTier: 5,
  journalTier: 5,
  houseTier: 5,
  labourersCount: 3,
  houseType: 'house',
  filledJournalPrice: 22000,
  emptyJournalResellPrice: 4500,
  estimatedReturnSilverValue: 24500,
  stoneBlockUnitPrice: 380,
  roughWoodUnitPrice: 35,
  roughStoneUnitPrice: 30,
  furnitureCostPerLabourer: 8000,
  contractCostPerLabourer: 1000,
};

function sanitizeLabourerConfig(raw: unknown): PersistedLabourerConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;
  const safeObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }
  return { ...DEFAULT_CONFIG, ...safeObj } as PersistedLabourerConfig;
}

export function useLabourersEconomy() {
  const loadConfigFromStorage = useCallback((): PersistedLabourerConfig => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LABOURERS_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeLabourerConfig(parsed);
      }
    } catch (e) {
      console.warn('Error loading labourers config:', e);
    }
    return DEFAULT_CONFIG;
  }, []);

  const [config, setConfig] = useState<PersistedLabourerConfig>(loadConfigFromStorage);

  // Escucha eventos de sincronización de almacenamiento o restauración de respaldos
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_LABOURERS_CONFIG && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setConfig(sanitizeLabourerConfig(parsed));
        } catch {
          // Ignorar fallo de parseo
        }
      }
    };

    const handleCustomSync = () => {
      setConfig(loadConfigFromStorage());
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('albion_storage_sync', handleCustomSync);
    window.addEventListener('albion_backup_restored', handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('albion_storage_sync', handleCustomSync);
      window.removeEventListener('albion_backup_restored', handleCustomSync);
    };
  }, [loadConfigFromStorage]);

  // Guardado automático en localStorage con emisión de evento de sincronización
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LABOURERS_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.warn('Error saving labourers config:', e);
    }
  }, [config]);

  // Selección de definición de trabajador e información de casa
  const labourerDef = useMemo(() => {
    return LABOURERS_CATALOG.find((l) => l.id === config.labourerType) || LABOURERS_CATALOG[0];
  }, [config.labourerType]);

  const houseTierInfo = useMemo(() => {
    return HOUSES_TIER_INFO.find((h) => h.tier === config.houseTier) || HOUSES_TIER_INFO[3];
  }, [config.houseTier]);

  // Cálculo de coste total de construcción de la casa
  const calculatedHouseCost = useMemo(() => {
    const blocksCost = houseTierInfo.stoneBlocksNeeded * Math.max(0, config.stoneBlockUnitPrice);
    const logsCost = houseTierInfo.roughLogsNeeded * Math.max(0, config.roughWoodUnitPrice);
    const stonesCost = houseTierInfo.roughStoneNeeded * Math.max(0, config.roughStoneUnitPrice);
    return blocksCost + logsCost + stonesCost;
  }, [houseTierInfo, config.stoneBlockUnitPrice, config.roughWoodUnitPrice, config.roughStoneUnitPrice]);

  // Coste total de mobiliario y contratos
  const totalFurnitureCost = useMemo(() => {
    return Math.max(0, config.furnitureCostPerLabourer) * config.labourersCount;
  }, [config.furnitureCostPerLabourer, config.labourersCount]);

  const totalContractCost = useMemo(() => {
    return Math.max(0, config.contractCostPerLabourer) * config.labourersCount;
  }, [config.contractCostPerLabourer, config.labourersCount]);

  // Cálculo de economía pura mediante caso de uso de dominio
  const economicResult: LabourerEconomicResult = useMemo(() => {
    const input: LabourerEconomicInput = {
      labourerType: config.labourerType,
      labourerTier: config.labourerTier,
      journalTier: config.journalTier,
      houseTier: config.houseTier,
      labourersCount: config.labourersCount,
      filledJournalPrice: config.filledJournalPrice,
      emptyJournalResellPrice: config.emptyJournalResellPrice,
      estimatedReturnSilverValue: config.estimatedReturnSilverValue,
      houseConstructionCost: calculatedHouseCost,
      furnitureCost: totalFurnitureCost,
      labourerHireContractCost: config.contractCostPerLabourer,
    };

    return calculateLabourerEconomy(input);
  }, [
    config.labourerType,
    config.labourerTier,
    config.journalTier,
    config.houseTier,
    config.labourersCount,
    config.filledJournalPrice,
    config.emptyJournalResellPrice,
    config.estimatedReturnSilverValue,
    calculatedHouseCost,
    totalFurnitureCost,
    config.contractCostPerLabourer,
  ]);

  const updateConfig = (partial: Partial<PersistedLabourerConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return {
    config,
    updateConfig,
    resetToDefaults,
    labourerDef,
    houseTierInfo,
    calculatedHouseCost,
    totalFurnitureCost,
    totalContractCost,
    economicResult,
    catalog: LABOURERS_CATALOG,
    houseTiers: HOUSES_TIER_INFO,
  };
}
