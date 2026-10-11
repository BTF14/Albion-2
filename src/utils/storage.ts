import { DailyLogEntry, PriceMemory, CityId, IslandTimer, DailyChecklistItem, PriceCacheStatus } from '../types';
import { CharacterProfile, PlayerIsland } from '../domain/models/character';
import { AlbionFullBackupData, ImportMode } from '../domain/models/backup';
import { validateBackupFile, mergeBackupPayload } from '../domain/use-cases/backupManager';
import { loadMasteryProfile, saveMasteryProfile } from './destinyBoard';
import { PersistedLabourerConfig } from '../domain/models/labourers';
import { BlackMarketItemRecord } from '../domain/models/craftingSalesLedger';
import { StoredGuildIslandConfig } from '../domain/models/guildIsland';
import { RedZoneTransportInput } from '../domain/models/redZoneTransport';

const STORAGE_KEYS = {
  DAILY_LOGS: 'albion_farm_daily_logs_v1',
  PRICE_MEMORY: 'albion_farm_price_memory_v1',
  RECIPE_PRICES: 'albion_farm_recipe_prices_v1',
  SETTINGS: 'albion_farm_settings_v1',
  TIMERS: 'albion_farm_timers_v1',
  CHECKLIST: 'albion_farm_checklist_v1',
  WORKSHOP_PRICES: 'albion_farm_workshop_prices_v1',
  CHARACTERS: 'albion_farm_characters_v1',
  ACTIVE_CHARACTER_ID: 'albion_farm_active_char_id_v1',
  DAILY_EVENTS: 'albion_daily_events_config_v2',
  LABOURERS_CONFIG: 'albion_farm_labourers_config_v1',
  GUILD_ISLAND_CONFIG: 'albion_guild_island_config_v1',
  RED_ZONE_TRANSPORT_CONFIG: 'albion_red_zone_transport_config_v1',
};

// Disparador defensivo de eventos seguro para SSR y tests sin DOM
function safeDispatchEvent(eventName: string): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    try {
      window.dispatchEvent(new Event(eventName));
    } catch {
      // Ignorar si el entorno no admite Event constructor
    }
  }
}

// Tiempo de vida de la caché de precios en LocalStorage (6 horas exactas)
export const PRICE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas = 21,600,000 ms

/**
 * Calcula el estado de frescura y vigencia TTL de un precio en caché
 */
export function getPriceCacheStatus(
  updatedAt?: number,
  ttlMs: number = PRICE_CACHE_TTL_MS
): PriceCacheStatus {
  if (!updatedAt || typeof updatedAt !== 'number' || isNaN(updatedAt)) {
    return {
      isExpired: true,
      ageMs: Infinity,
      remainingMs: 0,
      formattedAge: 'Sin registro',
      formattedRemaining: 'Expirado (>6h)',
    };
  }

  const now = Date.now();
  const ageMs = Math.max(0, now - updatedAt);
  const remainingMs = Math.max(0, ttlMs - ageMs);
  const isExpired = ageMs >= ttlMs;

  // Formato legible de antigüedad
  let formattedAge = '';
  if (ageMs < 60 * 1000) {
    formattedAge = 'Hace unos segundos';
  } else if (ageMs < 60 * 60 * 1000) {
    const mins = Math.floor(ageMs / (60 * 1000));
    formattedAge = `Hace ${mins} min`;
  } else if (ageMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(ageMs / (60 * 60 * 1000));
    const mins = Math.floor((ageMs % (60 * 60 * 1000)) / (60 * 1000));
    formattedAge = mins > 0 ? `Hace ${hours}h ${mins}m` : `Hace ${hours}h`;
  } else {
    const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    formattedAge = `Hace ${days}d`;
  }

  // Formato legible de tiempo restante
  let formattedRemaining = '';
  if (isExpired) {
    formattedRemaining = 'Expirado (>6h)';
  } else if (remainingMs < 60 * 1000) {
    formattedRemaining = '< 1 min';
  } else if (remainingMs < 60 * 60 * 1000) {
    const mins = Math.ceil(remainingMs / (60 * 1000));
    formattedRemaining = `${mins} min`;
  } else {
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const mins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    formattedRemaining = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  return {
    isExpired,
    ageMs,
    remainingMs,
    formattedAge,
    formattedRemaining,
  };
}

export interface AppSettings {
  defaultCityId: CityId;
  defaultPlotsCount: number;
  defaultTaxRate: number; // e.g. 4 for premium direct, 8 for setup+tax, or 10.5
  currencySymbol: string;
  customNutritionTax?: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultCityId: 'martlock',
  defaultPlotsCount: 5,
  defaultTaxRate: 8,
  currencySymbol: 'Silver',
};

export function loadLogs(): DailyLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS) || localStorage.getItem('albion_farm_logs');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: unknown) => {
      const entry = (item && typeof item === 'object' ? item : {}) as Partial<DailyLogEntry>;
      return {
        ...(entry as DailyLogEntry),
        plotsCount: Number(entry.plotsCount) || 1,
        slotsCount: Number(entry.slotsCount) || (Number(entry.plotsCount) || 1) * 9,
        returnedSeedsOrBabies: Number(entry.returnedSeedsOrBabies) || 0,
        reboughtSeedsOrBabies: Number(entry.reboughtSeedsOrBabies) || 0,
        seedOrBabyUnitPrice: Number(entry.seedOrBabyUnitPrice) || 0,
        harvestedAmount: Number(entry.harvestedAmount) || 0,
        productUnitPrice: Number(entry.productUnitPrice) || 0,
        seedsRebuyCost: Number(entry.seedsRebuyCost) || 0,
        foodCost: Number(entry.foodCost) || 0,
        totalCosts: Number(entry.totalCosts) || 0,
        grossRevenue: Number(entry.grossRevenue) || 0,
        marketTaxAmount: Number(entry.marketTaxAmount) || 0,
        netRevenue: Number(entry.netRevenue) || 0,
        netProfit: Number(entry.netProfit) || 0,
        profitPerSlot: Number(entry.profitPerSlot) || 0,
        silverPerFocus: Number(entry.silverPerFocus) || 0,
      };
    });
  } catch (e) {
    console.error('Error loading logs from localStorage', e);
    return [];
  }
}

export function saveLogs(logs: DailyLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('albion_storage_sync'));
    }
  } catch (e) {
    console.error('Error saving logs to localStorage', e);
  }
}

export function addLogEntry(entry: DailyLogEntry): DailyLogEntry[] {
  const current = loadLogs();
  const updated = [entry, ...current];
  saveLogs(updated);
  return updated;
}

export function deleteLogEntry(id: string): DailyLogEntry[] {
  const current = loadLogs();
  const updated = current.filter((item) => item.id !== id);
  saveLogs(updated);
  return updated;
}

/**
 * Carga la memoria de precios desde LocalStorage filtrando por TTL (6 horas por defecto).
 * Permite obtener precios vigentes o incluir expirados según el parámetro.
 */
export function loadPriceMemory(options?: {
  includeExpired?: boolean;
  maxAgeMs?: number;
}): PriceMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRICE_MEMORY) || localStorage.getItem('albion_farm_price_memory');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const maxAge = options?.maxAgeMs ?? PRICE_CACHE_TTL_MS;
    const includeExpired = options?.includeExpired ?? false;
    const now = Date.now();
    const result: PriceMemory = {};
    let hasLegacyEntries = false;

    const parsedObj = parsed as Record<string, unknown>;
    Object.entries(parsedObj).forEach(([itemId, rawVal]) => {
      if (itemId === '__proto__' || itemId === 'constructor' || itemId === 'prototype') return;
      if (!rawVal || typeof rawVal !== 'object') return;
      const val = rawVal as Record<string, unknown>;

      const updatedAt = typeof val.updatedAt === 'number' && Number.isFinite(val.updatedAt) ? val.updatedAt : undefined;

      // Migración amigable para registros antiguos sin updatedAt:
      if (updatedAt === undefined) {
        hasLegacyEntries = true;
        val.updatedAt = now;
      }

      const isExpired = (now - ((val.updatedAt as number) || now)) > maxAge;

      if (includeExpired || !isExpired) {
        const safeSeed = typeof val.lastSeedPrice === 'number' && Number.isFinite(val.lastSeedPrice) && val.lastSeedPrice >= 0 ? Math.floor(val.lastSeedPrice) : undefined;
        const safeProduct = typeof val.lastProductPrice === 'number' && Number.isFinite(val.lastProductPrice) && val.lastProductPrice >= 0 ? Math.floor(val.lastProductPrice) : undefined;
        const safeFood = typeof val.lastFoodPrice === 'number' && Number.isFinite(val.lastFoodPrice) && val.lastFoodPrice >= 0 ? Math.floor(val.lastFoodPrice) : undefined;

        result[itemId] = {
          lastSeedPrice: safeSeed,
          lastProductPrice: safeProduct,
          lastFoodPrice: safeFood,
          updatedAt: val.updatedAt as number,
        };
      }
    });

    if (hasLegacyEntries) {
      try {
        localStorage.setItem(STORAGE_KEYS.PRICE_MEMORY, JSON.stringify(parsed));
      } catch {
        // Fallback silencioso
      }
    }

    return result;
  } catch (e) {
    console.error('Error loading price memory', e);
    return {};
  }
}

/**
 * Guarda o actualiza precios en la caché de LocalStorage con timestamp para validación de TTL
 */
export function updatePriceMemory(
  itemId: string,
  prices: { lastSeedPrice?: number; lastProductPrice?: number; lastFoodPrice?: number }
): void {
  if (itemId === '__proto__' || itemId === 'constructor' || itemId === 'prototype') return;
  try {
    const current = loadPriceMemory({ includeExpired: true });
    const sanitizePrice = (p: number | undefined) =>
      typeof p === 'number' && Number.isFinite(p) && p >= 0 ? Math.floor(p) : undefined;

    current[itemId] = {
      ...current[itemId],
      lastSeedPrice: prices.lastSeedPrice !== undefined ? sanitizePrice(prices.lastSeedPrice) : current[itemId]?.lastSeedPrice,
      lastProductPrice: prices.lastProductPrice !== undefined ? sanitizePrice(prices.lastProductPrice) : current[itemId]?.lastProductPrice,
      lastFoodPrice: prices.lastFoodPrice !== undefined ? sanitizePrice(prices.lastFoodPrice) : current[itemId]?.lastFoodPrice,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.PRICE_MEMORY, JSON.stringify(current));
    safeDispatchEvent('albion_storage_sync');
  } catch (e) {
    console.error('Error saving price memory', e);
  }
}

/**
 * Carga los precios de recetas terminadas considerando el TTL de 6 horas
 */
export function loadRecipePrices(options?: {
  includeExpired?: boolean;
  maxAgeMs?: number;
}): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPE_PRICES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const maxAge = options?.maxAgeMs ?? PRICE_CACHE_TTL_MS;
    const includeExpired = options?.includeExpired ?? false;
    const now = Date.now();
    const result: Record<string, number> = {};
    let needsResave = false;

    const parsedObj = parsed as Record<string, unknown>;
    Object.entries(parsedObj).forEach(([recipeKey, entry]) => {
      if (recipeKey === '__proto__' || recipeKey === 'constructor' || recipeKey === 'prototype') return;
      if (typeof entry === 'number' && Number.isFinite(entry) && entry >= 0) {
        needsResave = true;
        parsedObj[recipeKey] = { price: Math.floor(entry), updatedAt: now };
        result[recipeKey] = Math.floor(entry);
      } else if (entry && typeof entry === 'object') {
        const entryObj = entry as Record<string, unknown>;
        if (typeof entryObj.price === 'number' && Number.isFinite(entryObj.price) && entryObj.price >= 0) {
          const updatedAt = typeof entryObj.updatedAt === 'number' && Number.isFinite(entryObj.updatedAt) ? entryObj.updatedAt : now;
          const isExpired = (now - updatedAt) > maxAge;
          if (includeExpired || !isExpired) {
            result[recipeKey] = Math.floor(entryObj.price);
          }
        }
      }
    });

    if (needsResave) {
      try {
        localStorage.setItem(STORAGE_KEYS.RECIPE_PRICES, JSON.stringify(parsed));
      } catch {
        // Fallback silencioso
      }
    }

    return result;
  } catch (e) {
    console.error('Error loading recipe prices', e);
    return {};
  }
}

/**
 * Actualiza el precio de venta de una receta en LocalStorage con timestamp para TTL de 6 horas
 */
export function updateRecipePrice(recipeId: string, sellPrice: number): void {
  if (recipeId === '__proto__' || recipeId === 'constructor' || recipeId === 'prototype') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECIPE_PRICES);
    let parsed: Record<string, { price: number; updatedAt: number }> = {};
    if (raw) {
      try {
        const json = JSON.parse(raw);
        if (json && typeof json === 'object') {
          for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
            if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && v && typeof v === 'object') {
              const entry = v as Record<string, unknown>;
              parsed[k] = {
                price: Number.isFinite(entry.price) ? Math.max(0, Math.floor(Number(entry.price))) : 0,
                updatedAt: Number.isFinite(entry.updatedAt) ? Number(entry.updatedAt) : Date.now(),
              };
            }
          }
        }
      } catch {
        parsed = {};
      }
    }
    const safePrice = Number.isFinite(sellPrice) && sellPrice >= 0 ? Math.floor(sellPrice) : 0;
    parsed[recipeId] = {
      price: safePrice,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.RECIPE_PRICES, JSON.stringify(parsed));
    safeDispatchEvent('albion_storage_sync');
  } catch (e) {
    console.error('Error saving recipe price', e);
  }
}

/**
 * Limpia todas las entradas de precios expiradas (> 6 horas) en LocalStorage
 */
export function clearExpiredPrices(ttlMs: number = PRICE_CACHE_TTL_MS): {
  clearedItemsCount: number;
  clearedRecipesCount: number;
} {
  let clearedItemsCount = 0;
  let clearedRecipesCount = 0;
  const now = Date.now();

  try {
    const rawMemory = localStorage.getItem(STORAGE_KEYS.PRICE_MEMORY);
    if (rawMemory) {
      const parsed = JSON.parse(rawMemory);
      if (parsed && typeof parsed === 'object') {
        const cleaned: PriceMemory = {};
        Object.entries(parsed as Record<string, PriceMemory[string]>).forEach(([key, val]) => {
          const updatedAt = typeof val?.updatedAt === 'number' ? val.updatedAt : 0;
          if (now - updatedAt <= ttlMs) {
            cleaned[key] = val;
          } else {
            clearedItemsCount++;
          }
        });
        localStorage.setItem(STORAGE_KEYS.PRICE_MEMORY, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.error('Error clearing expired price memory', e);
  }

  try {
    const rawRecipes = localStorage.getItem(STORAGE_KEYS.RECIPE_PRICES);
    if (rawRecipes) {
      const parsed = JSON.parse(rawRecipes);
      if (parsed && typeof parsed === 'object') {
        const cleaned: Record<string, { price: number; updatedAt: number }> = {};
        Object.entries(parsed as Record<string, { price?: number; updatedAt?: number } | number>).forEach(([key, val]) => {
          const updatedAt =
            typeof val === 'object' && val !== null && typeof val.updatedAt === 'number'
              ? val.updatedAt
              : typeof val === 'number'
              ? now
              : 0;
          const price =
            typeof val === 'object' && val !== null && typeof val.price === 'number'
              ? val.price
              : typeof val === 'number'
              ? val
              : 0;
          if (now - updatedAt <= ttlMs) {
            cleaned[key] = { price, updatedAt };
          } else {
            clearedRecipesCount++;
          }
        });
        localStorage.setItem(STORAGE_KEYS.RECIPE_PRICES, JSON.stringify(cleaned));
      }
    }
  } catch (e) {
    console.error('Error clearing expired recipe prices', e);
  }

  safeDispatchEvent('albion_storage_sync');
  return { clearedItemsCount, clearedRecipesCount };
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;

    const safeObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      safeObj[k] = v;
    }

    const city = typeof safeObj.defaultCityId === 'string' ? (safeObj.defaultCityId as CityId) : DEFAULT_SETTINGS.defaultCityId;
    const plots = Number(safeObj.defaultPlotsCount);
    const tax = Number(safeObj.defaultTaxRate);
    const curr = typeof safeObj.currencySymbol === 'string' && safeObj.currencySymbol.trim().length > 0
      ? safeObj.currencySymbol.trim().slice(0, 15)
      : DEFAULT_SETTINGS.currencySymbol;

    return {
      defaultCityId: city,
      defaultPlotsCount: Number.isFinite(plots) ? Math.max(1, Math.min(100, Math.floor(plots))) : DEFAULT_SETTINGS.defaultPlotsCount,
      defaultTaxRate: Number.isFinite(tax) ? Math.max(0, Math.min(50, tax)) : DEFAULT_SETTINGS.defaultTaxRate,
      currencySymbol: curr,
    };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('albion_storage_sync'));
    }
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function loadTimers(): IslandTimer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error loading timers from localStorage', e);
    return [];
  }
}

export function saveTimers(timers: IslandTimer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMERS, JSON.stringify(timers));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('albion_storage_sync'));
    }
  } catch (e) {
    console.error('Error saving timers to localStorage', e);
  }
}

export const DEFAULT_CHECKLIST: DailyChecklistItem[] = [
  {
    id: 'island_default_1',
    title: 'Isla Principal',
    cityId: 'martlock',
    itemId: 'crop_wheat',
    plotsCount: 5,
    harvested: false,
    replanted: false,
    usedFocus: true,
    category: 'island',
    priority: 'high',
    notes: 'Trigo T4 en Martlock (+10% bono de rendimiento).',
  },
  {
    id: 'island_default_2',
    title: 'Isla Secundaria (Cría de Animales)',
    cityId: 'martlock',
    itemId: 'animal_prod_chicken',
    plotsCount: 3,
    harvested: false,
    replanted: false,
    usedFocus: false,
    category: 'island',
    priority: 'normal',
    notes: 'Recolectar huevos y alimentar gallinas con excedentes de grano.',
  },
  {
    id: 'task_default_1',
    title: 'Comprar alimento (Zanahorias) en Mercado de Martlock',
    cityId: 'martlock',
    plotsCount: 0,
    harvested: false,
    replanted: false,
    usedFocus: false,
    category: 'market',
    isCustomTask: true,
    completed: false,
    priority: 'normal',
    notes: 'Verificar precio más bajo o dejar orden de compra activa.',
  },
  {
    id: 'task_default_2',
    title: 'Transportar cerdo faenado a Caerleon (Bono Carnicería +18%)',
    cityId: 'caerleon',
    plotsCount: 0,
    harvested: false,
    replanted: false,
    usedFocus: false,
    category: 'transport',
    isCustomTask: true,
    completed: false,
    priority: 'high',
    notes: 'Llevar buey blindado o jabalí por zona roja con cuidado.',
  },
  {
    id: 'task_audit_recipes_all',
    title: 'Revisión & Auditoría de Recetas de Cocina y Alquimia (100% Actualizadas)',
    cityId: 'caerleon',
    plotsCount: 0,
    harvested: false,
    replanted: false,
    usedFocus: false,
    category: 'crafting',
    isCustomTask: true,
    completed: false,
    priority: 'high',
    notes: '2ª Revisión integral completada: licores destilados (patatas, maíz, calabazas), 4 ingredientes en pasteles, tortillas T3-T7, guisos con pan y 22 pociones canónicas.',
  },
];

export function loadChecklist(): DailyChecklistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
    if (!raw) return DEFAULT_CHECKLIST;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CHECKLIST;
  } catch (e) {
    console.error('Error loading checklist from localStorage', e);
    return DEFAULT_CHECKLIST;
  }
}

export function saveChecklist(items: DailyChecklistItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(items));
    safeDispatchEvent('albion_storage_sync');
  } catch (e) {
    console.error('Error saving checklist to localStorage', e);
  }
}

export interface WorkshopPricesSettings {
  sauceSource: 'crafted' | 'market';
  choppedFishPrice: number;
  seaweedPrice: number;
  arcaneEssencePrice: number;
  marketSaucePrices: Record<1 | 2 | 3, number>;
  marketExtractPrices: Record<1 | 2 | 3, number>;
}

export const DEFAULT_WORKSHOP_PRICES: WorkshopPricesSettings = {
  sauceSource: 'market',
  choppedFishPrice: 140,
  seaweedPrice: 380,
  arcaneEssencePrice: 1250,
  marketSaucePrices: {
    1: 1200,
    2: 3600,
    3: 11000,
  },
  marketExtractPrices: {
    1: 1400,
    2: 4200,
    3: 12500,
  },
};

export function loadWorkshopPrices(): WorkshopPricesSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKSHOP_PRICES);
    if (!raw) return DEFAULT_WORKSHOP_PRICES;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_WORKSHOP_PRICES;

    const safeNum = (val: unknown, fallback: number) => {
      const num = Number(val);
      return Number.isFinite(num) && num >= 0 ? Math.floor(num) : fallback;
    };

    return {
      sauceSource: parsed.sauceSource === 'crafted' ? 'crafted' : 'market',
      choppedFishPrice: safeNum(parsed.choppedFishPrice, DEFAULT_WORKSHOP_PRICES.choppedFishPrice),
      seaweedPrice: safeNum(parsed.seaweedPrice, DEFAULT_WORKSHOP_PRICES.seaweedPrice),
      arcaneEssencePrice: safeNum(parsed.arcaneEssencePrice, DEFAULT_WORKSHOP_PRICES.arcaneEssencePrice),
      marketSaucePrices: {
        1: safeNum(parsed.marketSaucePrices?.[1], DEFAULT_WORKSHOP_PRICES.marketSaucePrices[1]),
        2: safeNum(parsed.marketSaucePrices?.[2], DEFAULT_WORKSHOP_PRICES.marketSaucePrices[2]),
        3: safeNum(parsed.marketSaucePrices?.[3], DEFAULT_WORKSHOP_PRICES.marketSaucePrices[3]),
      },
      marketExtractPrices: {
        1: safeNum(parsed.marketExtractPrices?.[1], DEFAULT_WORKSHOP_PRICES.marketExtractPrices[1]),
        2: safeNum(parsed.marketExtractPrices?.[2], DEFAULT_WORKSHOP_PRICES.marketExtractPrices[2]),
        3: safeNum(parsed.marketExtractPrices?.[3], DEFAULT_WORKSHOP_PRICES.marketExtractPrices[3]),
      },
    };
  } catch (e) {
    console.error('Error loading workshop prices from localStorage', e);
    return DEFAULT_WORKSHOP_PRICES;
  }
}

export function saveWorkshopPrices(settings: WorkshopPricesSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKSHOP_PRICES, JSON.stringify(settings));
    safeDispatchEvent('albion_storage_sync');
  } catch (e) {
    console.error('Error saving workshop prices to localStorage', e);
  }
}

// ==================== MULTI-PERSONAJE Y MULTI-ISLA (ALTS) ====================

export const DEFAULT_CHARACTERS: CharacterProfile[] = [
  {
    id: 'char_main_default',
    name: 'Personaje Principal',
    isMain: true,
    avatarColor: '#f59e0b', // Amber
    hasPremium: true,
    currentFocus: 10000,
    lastFocusUpdatedAt: Date.now(),
    islands: [
      {
        id: 'island_default_1',
        name: 'Isla Principal',
        cityId: 'martlock',
        level: 6,
        plotsCount: 5,
        herbPlotsCount: 0,
        pasturePlotsCount: 0,
        notes: 'Isla inicial de agricultura',
        createdAt: Date.now(),
      },
    ],
    roleNotes: 'Agricultura & Ganadería General',
    createdAt: Date.now(),
  },
];

/**
 * Carga los personajes guardados o genera el principal por defecto
 */
export function loadCharacters(): CharacterProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARACTERS);
    if (!raw) return DEFAULT_CHARACTERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CHARACTERS;
    return parsed.map((item: unknown) => {
      const char = (item && typeof item === 'object' ? item : {}) as Partial<CharacterProfile>;
      return {
        id: String(char.id || `char_${Date.now()}`),
        name: String(char.name || 'Personaje'),
        isMain: Boolean(char.isMain),
        avatarColor: String(char.avatarColor || '#f59e0b'),
        hasPremium: char.hasPremium !== undefined ? Boolean(char.hasPremium) : true,
        currentFocus: typeof char.currentFocus === 'number' ? Math.min(30000, Math.max(0, char.currentFocus)) : 10000,
        lastFocusUpdatedAt: Number(char.lastFocusUpdatedAt) || Date.now(),
        islands: Array.isArray(char.islands)
          ? char.islands.map((isl: unknown) => {
              const islandObj = (isl && typeof isl === 'object' ? isl : {}) as Partial<PlayerIsland>;
              return {
                id: String(islandObj.id || `isl_${Date.now()}`),
                name: String(islandObj.name || 'Isla'),
                cityId: (islandObj.cityId || 'martlock') as CityId,
                level: Number(islandObj.level) || 6,
                plotsCount: Number(islandObj.plotsCount) || 5,
                herbPlotsCount: Number(islandObj.herbPlotsCount) || 0,
                pasturePlotsCount: Number(islandObj.pasturePlotsCount) || 0,
                notes: islandObj.notes ? String(islandObj.notes) : undefined,
                createdAt: Number(islandObj.createdAt) || Date.now(),
              };
            })
          : [],
        masteryProfile: char.masteryProfile,
        roleNotes: char.roleNotes ? String(char.roleNotes) : undefined,
        createdAt: Number(char.createdAt) || Date.now(),
      };
    });
  } catch (e) {
    console.error('Error loading characters from localStorage', e);
    return DEFAULT_CHARACTERS;
  }
}

/**
 * Guarda los personajes en localStorage y emite evento reactivo
 */
export function saveCharacters(characters: CharacterProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHARACTERS, JSON.stringify(characters));
    safeDispatchEvent('albion_characters_updated');
    safeDispatchEvent('albion_storage_sync');
  } catch (e) {
    console.error('Error saving characters to localStorage', e);
  }
}

/**
 * Obtiene el ID del personaje activo actual
 */
export function getActiveCharacterId(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_CHARACTER_ID);
    if (raw) return raw;
    const chars = loadCharacters();
    return chars[0]?.id || DEFAULT_CHARACTERS[0].id;
  } catch {
    return DEFAULT_CHARACTERS[0].id;
  }
}

/**
 * Establece el personaje activo actual
 */
export function setActiveCharacterId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CHARACTER_ID, id);
    safeDispatchEvent('albion_active_character_changed');
    safeDispatchEvent('albion_storage_sync');
  } catch (e) {
    console.error('Error saving active character id to localStorage', e);
  }
}

/**
 * Genera el paquete completo de respaldo oficial con todos los datos del usuario.
 */
export function createFullBackupData(options?: { activeCityId?: CityId; notes?: string }): AlbionFullBackupData {
  const logs = loadLogs();
  const priceMemory = loadPriceMemory({ includeExpired: true });
  const recipePrices = loadRecipePrices({ includeExpired: true });
  const settings = loadSettings();
  const timers = loadTimers();
  const checklist = loadChecklist();
  const workshopPrices = loadWorkshopPrices();
  const characters = loadCharacters();
  const activeCharacterId = getActiveCharacterId();
  const destinyMastery = loadMasteryProfile();

  let dailyEventsConfig: Record<string, unknown> | undefined;
  try {
    const rawEvents = localStorage.getItem(STORAGE_KEYS.DAILY_EVENTS);
    if (rawEvents) {
      dailyEventsConfig = JSON.parse(rawEvents);
    }
  } catch {
    // Ignorar si no existe
  }

  let labourersConfig: PersistedLabourerConfig | undefined;
  try {
    const rawLabourers = localStorage.getItem(STORAGE_KEYS.LABOURERS_CONFIG);
    if (rawLabourers) {
      labourersConfig = JSON.parse(rawLabourers) as PersistedLabourerConfig;
    }
  } catch {
    // Ignorar si no existe
  }

  let craftingSalesLedger: BlackMarketItemRecord[] | undefined;
  try {
    const rawLedger = localStorage.getItem('albion_crafting_sales_ledger_v1');
    if (rawLedger) {
      craftingSalesLedger = JSON.parse(rawLedger) as BlackMarketItemRecord[];
    }
  } catch {
    // Ignorar si no existe
  }

  let guildIslandConfig: StoredGuildIslandConfig | undefined;
  try {
    const rawGuild = localStorage.getItem(STORAGE_KEYS.GUILD_ISLAND_CONFIG);
    if (rawGuild) {
      guildIslandConfig = JSON.parse(rawGuild) as StoredGuildIslandConfig;
    }
  } catch {
    // Ignorar si no existe
  }

  let redZoneTransportConfig: RedZoneTransportInput | undefined;
  try {
    const rawRedZone = localStorage.getItem(STORAGE_KEYS.RED_ZONE_TRANSPORT_CONFIG);
    if (rawRedZone) {
      redZoneTransportConfig = JSON.parse(rawRedZone) as RedZoneTransportInput;
    }
  } catch {
    // Ignorar si no existe
  }

  let fishingSaucesConfig: Record<string, unknown> | undefined;
  try {
    const raw = localStorage.getItem('albion_fishing_sauces_config_v1');
    if (raw) fishingSaucesConfig = JSON.parse(raw);
  } catch {}

  let butcherConfig: Record<string, unknown> | undefined;
  let butcherPrices: Record<string, number> | undefined;
  try {
    const rawC = localStorage.getItem('albion_butcher_config_v1');
    if (rawC) butcherConfig = JSON.parse(rawC);
    const rawP = localStorage.getItem('albion_butcher_prices_v1');
    if (rawP) butcherPrices = JSON.parse(rawP);
  } catch {}

  let transmutationConfig: Record<string, unknown> | undefined;
  let transmutationPrices: Record<string, number> | undefined;
  try {
    const rawC = localStorage.getItem('albion_transmutation_config_v1');
    if (rawC) transmutationConfig = JSON.parse(rawC);
    const rawP = localStorage.getItem('albion_transmutation_prices_v1');
    if (rawP) transmutationPrices = JSON.parse(rawP);
  } catch {}

  let warehouseStoredItems: Record<string, unknown>[] | undefined;
  let warehouseMountId: string | undefined;
  try {
    const rawI = localStorage.getItem('albion_warehouse_stored_items_v1');
    if (rawI) warehouseStoredItems = JSON.parse(rawI);
    const rawM = localStorage.getItem('albion_warehouse_mount_id_v1');
    if (rawM) warehouseMountId = rawM;
  } catch {}

  let blackMarketConfig: Record<string, unknown> | undefined;
  try {
    const raw = localStorage.getItem('albion_black_market_simulator_config_v1');
    if (raw) blackMarketConfig = JSON.parse(raw);
  } catch {}

  const now = new Date();

  return {
    app: 'Albion Farming Profit Tracker',
    schemaVersion: 2,
    exportDateIso: now.toISOString(),
    exportTimestamp: now.getTime(),
    metadata: {
      totalLogsCount: logs.length,
      totalPriceEntriesCount: Object.keys(priceMemory).length,
      totalCharactersCount: characters.length,
      totalChecklistItemsCount: checklist.length,
      totalSalesLedgerCount: Array.isArray(craftingSalesLedger) ? craftingSalesLedger.length : 0,
      activeCityId: options?.activeCityId,
      notes: options?.notes || 'Copia de seguridad completa generada por el usuario',
    },
    payload: {
      logs,
      priceMemory,
      recipePrices,
      settings,
      timers,
      checklist,
      workshopPrices,
      characters,
      activeCharacterId,
      destinyMastery,
      dailyEventsConfig,
      labourersConfig,
      craftingSalesLedger,
      guildIslandConfig,
      redZoneTransportConfig,
      fishingSaucesConfig,
      butcherConfig,
      butcherPrices,
      transmutationConfig,
      transmutationPrices,
      warehouseStoredItems,
      warehouseMountId,
      blackMarketConfig,
    },
  };
}

/**
 * Descarga directamente un archivo JSON con la copia de seguridad completa
 */
export function triggerDownloadBackupJSON(backupData: AlbionFullBackupData): void {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `albion_farm_backup_completo_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Restaura los datos de un respaldo completo (merge o replace) y despacha todos los eventos de sincronización
 */
export function restoreFullBackupData(
  importedBackup: AlbionFullBackupData,
  mode: ImportMode = 'merge'
): { success: boolean; error?: string; logsCount: number; pricesCount: number } {
  try {
    const currentBackup = createFullBackupData();
    const importedPayload = (importedBackup && typeof importedBackup === 'object' && 'payload' in importedBackup && importedBackup.payload && typeof importedBackup.payload === 'object')
      ? importedBackup.payload
      : (importedBackup as any);
    const merged = mergeBackupPayload(currentBackup.payload, importedPayload, mode);

    // 1. Guardar Logs
    if (merged.logs) {
      saveLogs(merged.logs);
    }

    // 2. Guardar Memoria de Precios
    if (merged.priceMemory) {
      localStorage.setItem(STORAGE_KEYS.PRICE_MEMORY, JSON.stringify(merged.priceMemory));
    }

    // 3. Guardar Precios de Recetas
    if (merged.recipePrices) {
      localStorage.setItem(STORAGE_KEYS.RECIPE_PRICES, JSON.stringify(merged.recipePrices));
    }

    // 4. Guardar Configuración
    if (merged.settings) {
      saveSettings(merged.settings);
    }

    // 5. Guardar Tareas y Rutinas
    if (merged.checklist) {
      saveChecklist(merged.checklist);
    }

    // 6. Guardar Precios de Taller
    if (merged.workshopPrices) {
      saveWorkshopPrices(merged.workshopPrices);
    }

    // 7. Guardar Personajes e Islas
    if (merged.characters && merged.characters.length > 0) {
      saveCharacters(merged.characters);
      if (merged.activeCharacterId) {
        setActiveCharacterId(merged.activeCharacterId);
      }
    }

    // 8. Guardar Perfil de Maestría
    if (merged.destinyMastery) {
      saveMasteryProfile(merged.destinyMastery);
    }

    // 9. Eventos diarios si existen
    if (merged.dailyEventsConfig) {
      localStorage.setItem(STORAGE_KEYS.DAILY_EVENTS, JSON.stringify(merged.dailyEventsConfig));
    }

    // 10. Configuración de trabajadores (Labourers) si existe
    if (merged.labourersConfig) {
      localStorage.setItem(STORAGE_KEYS.LABOURERS_CONFIG, JSON.stringify(merged.labourersConfig));
    }

    // 11. Libro Mayor de Ventas y Caerleon si existe
    if (merged.craftingSalesLedger) {
      localStorage.setItem('albion_crafting_sales_ledger_v1', JSON.stringify(merged.craftingSalesLedger));
      safeDispatchEvent('albion_sales_ledger_updated');
    }

    // 12. Configuración de Isla de Gremio y Guild Hall si existe
    if (merged.guildIslandConfig) {
      localStorage.setItem(STORAGE_KEYS.GUILD_ISLAND_CONFIG, JSON.stringify(merged.guildIslandConfig));
    }

    // 13. Configuración de Envíos por Zona Roja y Gankers si existe
    if (merged.redZoneTransportConfig) {
      localStorage.setItem(STORAGE_KEYS.RED_ZONE_TRANSPORT_CONFIG, JSON.stringify(merged.redZoneTransportConfig));
    }

    // 14. Configuración de Pesca y Salsas si existe
    if (merged.fishingSaucesConfig) {
      localStorage.setItem('albion_fishing_sauces_config_v1', JSON.stringify(merged.fishingSaucesConfig));
    }

    // 15. Carnicería & Matadero si existe
    if (merged.butcherConfig) {
      localStorage.setItem('albion_butcher_config_v1', JSON.stringify(merged.butcherConfig));
    }
    if (merged.butcherPrices) {
      localStorage.setItem('albion_butcher_prices_v1', JSON.stringify(merged.butcherPrices));
    }

    // 16. Transmutación si existe
    if (merged.transmutationConfig) {
      localStorage.setItem('albion_transmutation_config_v1', JSON.stringify(merged.transmutationConfig));
    }
    if (merged.transmutationPrices) {
      localStorage.setItem('albion_transmutation_prices_v1', JSON.stringify(merged.transmutationPrices));
    }

    // 17. Almacén y Cubicaje de Carga si existe
    if (merged.warehouseStoredItems) {
      localStorage.setItem('albion_warehouse_stored_items_v1', JSON.stringify(merged.warehouseStoredItems));
    }
    if (merged.warehouseMountId) {
      localStorage.setItem('albion_warehouse_mount_id_v1', merged.warehouseMountId);
    }

    // 18. Simulador de Mercado Negro si existe
    if (merged.blackMarketConfig) {
      localStorage.setItem('albion_black_market_simulator_config_v1', JSON.stringify(merged.blackMarketConfig));
    }

    // Notificar eventos de sincronización en cascada
    safeDispatchEvent('albion_storage_sync');
    safeDispatchEvent('albion_characters_updated');
    safeDispatchEvent('albion_active_character_changed');
    safeDispatchEvent('albion_mastery_updated');
    safeDispatchEvent('albion_backup_restored');

    return {
      success: true,
      logsCount: merged.logs.length,
      pricesCount: Object.keys(merged.priceMemory).length,
    };
  } catch (e) {
    console.error('Error restaurando respaldo', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Error desconocido al guardar en LocalStorage.',
      logsCount: 0,
      pricesCount: 0,
    };
  }
}

export interface StorageUsageReport {
  bytesUsed: number;
  formattedBytes: string;
  estimatedLimitBytes: number;
  percentageUsed: number;
  isNearQuota: boolean;
  entriesCount: {
    logs: number;
    prices: number;
    recipes: number;
    characters: number;
    checklist: number;
    ledger: number;
    warehouse: number;
  };
}

/**
 * Inspecciona el uso real de almacenamiento en LocalStorage (UTF-16)
 * Proporciona telemetría defensiva para prevenir excepciones de cuota excedida.
 */
export function getStorageUsageReport(): StorageUsageReport {
  let bytesUsed = 0;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          bytesUsed += (key.length + val.length) * 2; // Caracteres UTF-16 = 2 bytes
        }
      }
    } catch {
      // Fallback si el acceso a localStorage está restringido
    }
  }

  const estimatedLimitBytes = 5 * 1024 * 1024; // 5 MB límite típico de navegador
  const percentageUsed = Math.min(100, Number(((bytesUsed / estimatedLimitBytes) * 100).toFixed(1)));
  const isNearQuota = percentageUsed >= 75;

  let formattedBytes = `${(bytesUsed / 1024).toFixed(1)} KB`;
  if (bytesUsed >= 1024 * 1024) {
    formattedBytes = `${(bytesUsed / (1024 * 1024)).toFixed(2)} MB`;
  }

  const logs = loadLogs().length;
  const prices = Object.keys(loadPriceMemory({ includeExpired: true })).length;
  const recipes = Object.keys(loadRecipePrices()).length;
  const characters = loadCharacters().length;
  const checklist = loadChecklist().length;

  let ledger = 0;
  try {
    const rawLedger = localStorage.getItem('albion_crafting_sales_ledger_v1');
    if (rawLedger) ledger = JSON.parse(rawLedger)?.length || 0;
  } catch {}

  let warehouse = 0;
  try {
    const rawWh = localStorage.getItem('albion_warehouse_stored_items_v1');
    if (rawWh) warehouse = JSON.parse(rawWh)?.length || 0;
  } catch {}

  return {
    bytesUsed,
    formattedBytes,
    estimatedLimitBytes,
    percentageUsed,
    isNearQuota,
    entriesCount: {
      logs,
      prices,
      recipes,
      characters,
      checklist,
      ledger,
      warehouse,
    },
  };
}


