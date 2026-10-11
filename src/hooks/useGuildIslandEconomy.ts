import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StoredGuildIslandConfig,
  GuildIslandEconomicResult,
  GUILD_ISLAND_LEVELS,
  GUILD_HALL_TIERS,
} from '../domain/models/guildIsland';
import { calculateGuildIslandEconomy } from '../domain/use-cases/calculateGuildIslandEconomy';
import { LABOURER_CATALOG } from '../domain/use-cases/calculateLabourerEconomy';
import { CityId } from '../types';

const STORAGE_KEY = 'albion_guild_island_config_v1';

export const DEFAULT_GUILD_ISLAND_CONFIG: StoredGuildIslandConfig = {
  islandCityId: 'martlock',
  islandLevel: 6, // Nivel 6 máximo para simular ciudadela
  guildHallTier: 8, // Casa Gremial T8 (15 trabajadores)
  labourerType: 'blacksmith', // Herreros por defecto
  labourerTier: 8,
  journalTier: 7, // T7 para asegurar 125% o 150% de retorno óptimo
  activeLabourersCount: 15,
  bedTier: 8,
  tableTier: 8,
  hasGeneralistTrophies: true,
  hasSpecialistTrophies: true,
  hasSharkTrophy: false,
  simulationScope: 'hall_only',
  additionalHousesCount: 0,
  // Precios manuales
  filledJournalPrice: 28500,
  emptyJournalResellPrice: 4200,
  estimatedReturnSilverValue: 46000,
  // Precios de materiales para construcción
  stoneBlockUnitPrice: 1450,
  roughWoodUnitPrice: 150,
  roughStoneUnitPrice: 150,
  bedUnitPrice: 12000,
  tableUnitPrice: 24000,
  trophySetCost: 45000,
  contractCostPerLabourer: 1000,
  alreadyOwnsIsland: false,
  includeGuildCreationCost: false,
};

function sanitizeConfig(raw: unknown): StoredGuildIslandConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_GUILD_ISLAND_CONFIG;
  }
  const obj = raw as Record<string, unknown>;
  const clean: Partial<StoredGuildIslandConfig> = {};

  Object.entries(obj).forEach(([key, val]) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return;
    if (typeof val === 'number' && Number.isFinite(val)) {
      clean[key as keyof StoredGuildIslandConfig] = val as never;
    } else if (typeof val === 'string' || typeof val === 'boolean') {
      clean[key as keyof StoredGuildIslandConfig] = val as never;
    }
  });

  return {
    ...DEFAULT_GUILD_ISLAND_CONFIG,
    ...clean,
    alreadyOwnsIsland: typeof clean.alreadyOwnsIsland === 'boolean' ? clean.alreadyOwnsIsland : false,
    includeGuildCreationCost: typeof clean.includeGuildCreationCost === 'boolean' ? clean.includeGuildCreationCost : false,
    islandLevel: Math.max(1, Math.min(6, Number(clean.islandLevel) || DEFAULT_GUILD_ISLAND_CONFIG.islandLevel)),
    guildHallTier: Math.max(2, Math.min(8, Number(clean.guildHallTier) || DEFAULT_GUILD_ISLAND_CONFIG.guildHallTier)),
    labourerTier: Math.max(2, Math.min(8, Number(clean.labourerTier) || DEFAULT_GUILD_ISLAND_CONFIG.labourerTier)),
    journalTier: Math.max(2, Math.min(8, Number(clean.journalTier) || DEFAULT_GUILD_ISLAND_CONFIG.journalTier)),
    activeLabourersCount: Math.max(1, Math.min(15, Number(clean.activeLabourersCount) || 15)),
  };
}

export function useGuildIslandEconomy(initialCityId?: CityId) {
  const [config, setConfig] = useState<StoredGuildIslandConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitized = sanitizeConfig(parsed);
        if (initialCityId) sanitized.islandCityId = initialCityId;
        return sanitized;
      }
    } catch (e) {
      console.warn('Error loading guild island config from localStorage', e);
    }
    return {
      ...DEFAULT_GUILD_ISLAND_CONFIG,
      islandCityId: initialCityId || DEFAULT_GUILD_ISLAND_CONFIG.islandCityId,
    };
  });

  // Guardar en LocalStorage ante cualquier cambio
  const updateConfig = useCallback((changes: Partial<StoredGuildIslandConfig>) => {
    setConfig((prev) => {
      const next = sanitizeConfig({ ...prev, ...changes });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event('albion_storage_sync'));
      } catch (e) {
        console.warn('Error saving guild island config to localStorage', e);
      }
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_GUILD_ISLAND_CONFIG);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_GUILD_ISLAND_CONFIG));
      window.dispatchEvent(new Event('albion_storage_sync'));
    } catch {}
  }, []);

  // Sincronización entre pestañas
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setConfig(sanitizeConfig(parsed));
        }
      } catch {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('albion_storage_sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('albion_storage_sync', handleSync);
    };
  }, []);

  // Cálculo financiero puro
  const result: GuildIslandEconomicResult = useMemo(() => {
    return calculateGuildIslandEconomy(config);
  }, [config]);

  const currentIslandLevelInfo = useMemo(() => {
    return GUILD_ISLAND_LEVELS.find((l) => l.level === config.islandLevel) || GUILD_ISLAND_LEVELS[5];
  }, [config.islandLevel]);

  const currentGuildHallInfo = useMemo(() => {
    return GUILD_HALL_TIERS.find((h) => h.tier === config.guildHallTier) || GUILD_HALL_TIERS[6];
  }, [config.guildHallTier]);

  const currentLabourerDef = useMemo(() => {
    return LABOURER_CATALOG.find((l) => l.id === config.labourerType) || LABOURER_CATALOG[0];
  }, [config.labourerType]);

  return {
    config,
    updateConfig,
    resetToDefaults,
    result,
    islandLevels: GUILD_ISLAND_LEVELS,
    guildHallTiers: GUILD_HALL_TIERS,
    labourersCatalog: LABOURER_CATALOG,
    currentIslandLevelInfo,
    currentGuildHallInfo,
    currentLabourerDef,
  };
}
