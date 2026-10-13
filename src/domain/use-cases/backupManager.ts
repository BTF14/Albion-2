import { AlbionFullBackupData, BackupValidationResult, ImportMode } from '../models/backup';
import { DailyLogEntry, PriceMemory, CityId, IslandTimer, DailyChecklistItem, DestinyMasteryProfile } from '../../types';
import { CharacterProfile } from '../models/character';
import { WorkshopPricesSettings, AppSettings } from '../../utils/storage';
import { PersistedLabourerConfig } from '../models/labourers';
import { BlackMarketItemRecord } from '../models/craftingSalesLedger';
import { StoredGuildIslandConfig } from '../models/guildIsland';
import { RedZoneTransportInput } from '../models/redZoneTransport';

/**
 * Valida minuciosamente un objeto JSON parseado para comprobar que cumple
 * con la estructura de respaldo de Albion Farming Profit Tracker (soporta tanto v1 legado como v2).
 */
export function validateBackupFile(rawJson: unknown): BackupValidationResult {
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      isValid: false,
      error: 'El archivo no contiene un objeto JSON válido.',
      version: 0,
      summary: { logsCount: 0, pricesCount: 0, charactersCount: 0, checklistCount: 0, hasMastery: false },
    };
  }

  const obj = rawJson as Record<string, unknown>;

  // Caso 1: Archivo v1 antiguo (donde obj.logs o el array directo era el backup)
  if (Array.isArray(obj) || (Array.isArray(obj.logs) && !obj.payload)) {
    const rawLogs = Array.isArray(obj) ? obj : (obj.logs as unknown[]);
    const validLogs: DailyLogEntry[] = rawLogs.filter(
      (item: unknown): item is DailyLogEntry =>
        typeof item === 'object' && item !== null && 'id' in item && 'itemId' in item
    );

    if (validLogs.length === 0) {
      return {
        isValid: false,
        error: 'El archivo legado v1 no contiene registros de cosecha válidos.',
        version: 1,
        summary: { logsCount: 0, pricesCount: 0, charactersCount: 0, checklistCount: 0, hasMastery: false },
      };
    }

    const adaptedV2: AlbionFullBackupData = {
      app: 'Albion Farming Profit Tracker',
      schemaVersion: 2,
      exportDateIso: typeof obj.exportDate === 'string' ? obj.exportDate : new Date().toISOString(),
      exportTimestamp: Date.now(),
      metadata: {
        totalLogsCount: validLogs.length,
        totalPriceEntriesCount: 0,
        totalCharactersCount: 0,
        totalChecklistItemsCount: 0,
        notes: 'Importado desde formato legado v1',
      },
      payload: {
        logs: validLogs,
        priceMemory: {},
      },
    };

    return {
      isValid: true,
      version: 1,
      warning: 'Archivo en formato legado (solo registros de cosechas). Los precios y configuración actual se mantendrán intactos.',
      summary: {
        logsCount: validLogs.length,
        pricesCount: 0,
        charactersCount: 0,
        checklistCount: 0,
        hasMastery: false,
      },
      data: adaptedV2,
    };
  }

  // Caso 2: Formato Oficial v2 con payload completo
  const payload = obj.payload as Record<string, unknown> | undefined;
  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      error: 'Estructura de respaldo incompatible: falta la sección de datos "payload".',
      version: 0,
      summary: { logsCount: 0, pricesCount: 0, charactersCount: 0, checklistCount: 0, hasMastery: false },
    };
  }

  const logs = Array.isArray(payload.logs)
    ? (payload.logs as DailyLogEntry[]).filter((l) => l && typeof l === 'object' && 'id' in l && 'itemId' in l)
    : [];

  const rawPriceMem = payload.priceMemory;
  const priceMemory: PriceMemory = {};
  if (rawPriceMem && typeof rawPriceMem === 'object' && !Array.isArray(rawPriceMem)) {
    for (const [k, v] of Object.entries(rawPriceMem as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (v && typeof v === 'object') {
        priceMemory[k] = v as PriceMemory[string];
      }
    }
  }

  const characters = Array.isArray(payload.characters)
    ? (payload.characters as CharacterProfile[]).filter((c) => c && typeof c === 'object' && 'id' in c && 'name' in c)
    : [];

  const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
  const hasMastery = Boolean(payload.destinyMastery && typeof payload.destinyMastery === 'object');
  const craftingSalesLedger = Array.isArray(payload.craftingSalesLedger)
    ? (payload.craftingSalesLedger as BlackMarketItemRecord[]).filter((s) => s && typeof s === 'object' && 'id' in s && 'grossRevenue' in s)
    : [];

  const pricesCount = Object.keys(priceMemory).length;

  // Al menos debe tener algo útil (logs, precios, personajes, tareas o ventas)
  if (
    logs.length === 0 &&
    pricesCount === 0 &&
    characters.length === 0 &&
    checklist.length === 0 &&
    !hasMastery &&
    craftingSalesLedger.length === 0
  ) {
    return {
      isValid: false,
      error: 'El archivo de respaldo está vacío o no contiene datos reconocibles.',
      version: 2,
      summary: { logsCount: 0, pricesCount: 0, charactersCount: 0, checklistCount: 0, hasMastery: false },
    };
  }

  const rawMetadata = obj.metadata && typeof obj.metadata === 'object' ? (obj.metadata as Record<string, unknown>) : undefined;
  const activeCityId = rawMetadata && typeof rawMetadata.activeCityId === 'string' ? (rawMetadata.activeCityId as CityId) : undefined;
  const notes = rawMetadata && typeof rawMetadata.notes === 'string' ? rawMetadata.notes : undefined;

  const fullBackupData: AlbionFullBackupData = {
    app: 'Albion Farming Profit Tracker',
    schemaVersion: 2,
    exportDateIso: typeof obj.exportDateIso === 'string' ? obj.exportDateIso : new Date().toISOString(),
    exportTimestamp: typeof obj.exportTimestamp === 'number' ? obj.exportTimestamp : Date.now(),
    metadata: {
      totalLogsCount: logs.length,
      totalPriceEntriesCount: pricesCount,
      totalCharactersCount: characters.length,
      totalChecklistItemsCount: checklist.length,
      totalSalesLedgerCount: craftingSalesLedger.length,
      activeCityId,
      notes,
    },
    payload: {
      logs,
      priceMemory,
      recipePrices: payload.recipePrices && typeof payload.recipePrices === 'object' ? (payload.recipePrices as Record<string, number>) : undefined,
      settings: payload.settings && typeof payload.settings === 'object' ? (payload.settings as AppSettings) : undefined,
      timers: Array.isArray(payload.timers) ? (payload.timers as IslandTimer[]) : undefined,
      checklist: Array.isArray(payload.checklist) ? (payload.checklist as DailyChecklistItem[]) : undefined,
      workshopPrices: payload.workshopPrices && typeof payload.workshopPrices === 'object' ? (payload.workshopPrices as WorkshopPricesSettings) : undefined,
      characters,
      activeCharacterId: typeof payload.activeCharacterId === 'string' ? payload.activeCharacterId : null,
      destinyMastery: payload.destinyMastery && typeof payload.destinyMastery === 'object' ? (payload.destinyMastery as DestinyMasteryProfile) : undefined,
      dailyEventsConfig: payload.dailyEventsConfig && typeof payload.dailyEventsConfig === 'object' ? (payload.dailyEventsConfig as Record<string, unknown>) : undefined,
      labourersConfig: payload.labourersConfig && typeof payload.labourersConfig === 'object' ? (payload.labourersConfig as PersistedLabourerConfig) : undefined,
      craftingSalesLedger,
      guildIslandConfig: payload.guildIslandConfig && typeof payload.guildIslandConfig === 'object' ? (payload.guildIslandConfig as StoredGuildIslandConfig) : undefined,
      redZoneTransportConfig: payload.redZoneTransportConfig && typeof payload.redZoneTransportConfig === 'object' ? (payload.redZoneTransportConfig as RedZoneTransportInput) : undefined,
      fishingSaucesConfig: payload.fishingSaucesConfig && typeof payload.fishingSaucesConfig === 'object' ? (payload.fishingSaucesConfig as Record<string, unknown>) : undefined,
      butcherConfig: payload.butcherConfig && typeof payload.butcherConfig === 'object' ? (payload.butcherConfig as Record<string, unknown>) : undefined,
      butcherPrices: payload.butcherPrices && typeof payload.butcherPrices === 'object' ? (payload.butcherPrices as Record<string, number>) : undefined,
      transmutationConfig: payload.transmutationConfig && typeof payload.transmutationConfig === 'object' ? (payload.transmutationConfig as Record<string, unknown>) : undefined,
      transmutationPrices: payload.transmutationPrices && typeof payload.transmutationPrices === 'object' ? (payload.transmutationPrices as Record<string, number>) : undefined,
      warehouseStoredItems: Array.isArray(payload.warehouseStoredItems) ? (payload.warehouseStoredItems as Record<string, unknown>[]) : undefined,
      warehouseMountId: typeof payload.warehouseMountId === 'string' ? payload.warehouseMountId : undefined,
      blackMarketConfig: payload.blackMarketConfig && typeof payload.blackMarketConfig === 'object' ? (payload.blackMarketConfig as Record<string, unknown>) : undefined,
    },
  };

  return {
    isValid: true,
    version: 2,
    summary: {
      logsCount: logs.length,
      pricesCount,
      charactersCount: characters.length,
      checklistCount: checklist.length,
      hasMastery,
    },
    data: fullBackupData,
  };
}

/**
 * Caso de Uso Puro:
 * Combina el estado actual con los datos del respaldo según el modo elegido ('merge' o 'replace').
 */
export function mergeBackupPayload(
  currentData: AlbionFullBackupData['payload'],
  importedData: AlbionFullBackupData['payload'],
  mode: ImportMode
): AlbionFullBackupData['payload'] {
  const safeCurrent = currentData || { logs: [], priceMemory: {} };
  const safeImported = importedData || { logs: [], priceMemory: {} };

  const currentLogs = Array.isArray(safeCurrent.logs) ? safeCurrent.logs : [];
  const importedLogs: DailyLogEntry[] = Array.isArray(safeImported.logs)
    ? (safeImported.logs as DailyLogEntry[])
    : Array.isArray((safeImported as any)?.harvests)
    ? ((safeImported as any).harvests as DailyLogEntry[])
    : [];

  if (mode === 'replace') {
    return {
      logs: [...importedLogs],
      priceMemory: { ...(safeImported.priceMemory || {}) },
      recipePrices: safeImported.recipePrices ? { ...safeImported.recipePrices } : safeCurrent.recipePrices,
      settings: safeImported.settings || safeCurrent.settings,
      timers: safeImported.timers ? [...safeImported.timers] : safeCurrent.timers,
      checklist: safeImported.checklist ? [...safeImported.checklist] : safeCurrent.checklist,
      workshopPrices: safeImported.workshopPrices ? { ...safeImported.workshopPrices } : safeCurrent.workshopPrices,
      characters: safeImported.characters ? [...safeImported.characters] : safeCurrent.characters,
      activeCharacterId: safeImported.activeCharacterId !== undefined ? safeImported.activeCharacterId : safeCurrent.activeCharacterId,
      destinyMastery: safeImported.destinyMastery || safeCurrent.destinyMastery,
      dailyEventsConfig: safeImported.dailyEventsConfig || safeCurrent.dailyEventsConfig,
      labourersConfig: safeImported.labourersConfig || safeCurrent.labourersConfig,
      craftingSalesLedger: safeImported.craftingSalesLedger ? [...safeImported.craftingSalesLedger] : safeCurrent.craftingSalesLedger,
      guildIslandConfig: safeImported.guildIslandConfig || safeCurrent.guildIslandConfig,
      redZoneTransportConfig: safeImported.redZoneTransportConfig || safeCurrent.redZoneTransportConfig,
      fishingSaucesConfig: safeImported.fishingSaucesConfig || safeCurrent.fishingSaucesConfig,
      butcherConfig: safeImported.butcherConfig || safeCurrent.butcherConfig,
      butcherPrices: safeImported.butcherPrices ? { ...safeImported.butcherPrices } : safeCurrent.butcherPrices,
      transmutationConfig: safeImported.transmutationConfig || safeCurrent.transmutationConfig,
      transmutationPrices: safeImported.transmutationPrices ? { ...safeImported.transmutationPrices } : safeCurrent.transmutationPrices,
      warehouseStoredItems: safeImported.warehouseStoredItems ? [...safeImported.warehouseStoredItems] : safeCurrent.warehouseStoredItems,
      warehouseMountId: safeImported.warehouseMountId || safeCurrent.warehouseMountId,
      blackMarketConfig: safeImported.blackMarketConfig || safeCurrent.blackMarketConfig,
      financialGoals: safeImported.financialGoals ? [...safeImported.financialGoals] : safeCurrent.financialGoals,
    };
  }

  // Modo 'merge': fusiona sin duplicar
  // 1. Logs: combinar por id, los nuevos van primero
  const existingLogIds = new Set(currentLogs.map((l) => l.id));
  const newLogs = importedLogs.filter((l) => l && typeof l === 'object' && l.id && !existingLogIds.has(l.id));
  const mergedLogs = [...newLogs, ...currentLogs];

  // 2. Precios: los precios importados más recientes (o con timestamp mayor) se fusionan
  const mergedPriceMemory: PriceMemory = { ...(safeCurrent.priceMemory || {}) };
  Object.entries(safeImported.priceMemory || {}).forEach(([itemId, importedVal]) => {
    if (itemId === '__proto__' || itemId === 'constructor' || itemId === 'prototype') return;
    const currentVal = mergedPriceMemory[itemId];
    if (!currentVal) {
      mergedPriceMemory[itemId] = importedVal;
    } else {
      // Comparar timestamps o sobreescribir valores presentes
      const importedTime = importedVal.updatedAt || 0;
      const currentTime = currentVal.updatedAt || 0;
      if (importedTime >= currentTime) {
        mergedPriceMemory[itemId] = { ...currentVal, ...importedVal };
      } else {
        mergedPriceMemory[itemId] = { ...importedVal, ...currentVal };
      }
    }
  });

  // 3. Precios de recetas
  const mergedRecipePrices: Record<string, number> = {};
  if (currentData.recipePrices) {
    for (const [k, v] of Object.entries(currentData.recipePrices)) {
      if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && typeof v === 'number') {
        mergedRecipePrices[k] = v;
      }
    }
  }
  if (importedData.recipePrices) {
    for (const [k, v] of Object.entries(importedData.recipePrices)) {
      if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && typeof v === 'number') {
        mergedRecipePrices[k] = v;
      }
    }
  }

  // 4. Precios de taller
  const mergedWorkshopPrices: WorkshopPricesSettings | undefined = importedData.workshopPrices || currentData.workshopPrices;

  // 5. Personajes: fusionar por id, agregando alts que no existan
  const existingCharIds = new Set((currentData.characters || []).map((c) => c.id));
  const newChars = (importedData.characters || []).filter((c) => !existingCharIds.has(c.id));
  const mergedCharacters = [...(currentData.characters || []), ...newChars];

  // 6. Checklist: fusionar por id
  const existingChecklistIds = new Set((currentData.checklist || []).map((t) => t.id));
  const newChecklist = (importedData.checklist || []).filter((t) => !existingChecklistIds.has(t.id));
  const mergedChecklist = [...(currentData.checklist || []), ...newChecklist];

  // 7. Libro Mayor de Ventas y Caerleon: fusionar por id
  const existingSalesIds = new Set((currentData.craftingSalesLedger || []).map((s) => s.id));
  const newSales = (importedData.craftingSalesLedger || []).filter((s) => !existingSalesIds.has(s.id));
  const mergedSales = [...newSales, ...(currentData.craftingSalesLedger || [])];

  return {
    logs: mergedLogs,
    priceMemory: mergedPriceMemory,
    recipePrices: mergedRecipePrices,
    settings: importedData.settings || currentData.settings,
    timers: currentData.timers, // Preservar timers activos locales
    checklist: mergedChecklist,
    workshopPrices: mergedWorkshopPrices,
    characters: mergedCharacters,
    activeCharacterId: currentData.activeCharacterId || importedData.activeCharacterId,
    destinyMastery: importedData.destinyMastery || currentData.destinyMastery,
    dailyEventsConfig: currentData.dailyEventsConfig || importedData.dailyEventsConfig,
    labourersConfig: importedData.labourersConfig || currentData.labourersConfig,
    craftingSalesLedger: mergedSales,
    guildIslandConfig: importedData.guildIslandConfig || currentData.guildIslandConfig,
    redZoneTransportConfig: importedData.redZoneTransportConfig || currentData.redZoneTransportConfig,
    fishingSaucesConfig: importedData.fishingSaucesConfig || currentData.fishingSaucesConfig,
    butcherConfig: importedData.butcherConfig || currentData.butcherConfig,
    butcherPrices: { ...(currentData.butcherPrices || {}), ...(importedData.butcherPrices || {}) },
    transmutationConfig: importedData.transmutationConfig || currentData.transmutationConfig,
    transmutationPrices: { ...(currentData.transmutationPrices || {}), ...(importedData.transmutationPrices || {}) },
    warehouseStoredItems: importedData.warehouseStoredItems || currentData.warehouseStoredItems,
    warehouseMountId: importedData.warehouseMountId || currentData.warehouseMountId,
    blackMarketConfig: importedData.blackMarketConfig || currentData.blackMarketConfig,
    financialGoals: importedData.financialGoals || currentData.financialGoals,
  };
}
