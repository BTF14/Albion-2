import { DailyLogEntry, PriceMemory, IslandTimer, DailyChecklistItem, CityId } from '../../types';
import { AppSettings, WorkshopPricesSettings } from '../../utils/storage';
import { CharacterProfile } from './character';
import { DestinyMasteryProfile } from '../../types';
import { PersistedLabourerConfig } from './labourers';
import { BlackMarketItemRecord } from './craftingSalesLedger';
import { StoredGuildIslandConfig } from './guildIsland';
import { RedZoneTransportInput } from './redZoneTransport';
import { FinancialGoal } from './goals';

/**
 * Estructura oficial del archivo de Respaldo Completo de Datos (.json)
 * Permite exportar e importar de manera segura todo el estado de la aplicación.
 */
export interface AlbionFullBackupData {
  app: 'Albion Farming Profit Tracker';
  schemaVersion: 2; // v2 con soporte completo de alts, maestría, precios y tareas
  exportDateIso: string;
  exportTimestamp: number;
  metadata: {
    totalLogsCount: number;
    totalPriceEntriesCount: number;
    totalCharactersCount: number;
    totalChecklistItemsCount: number;
    totalSalesLedgerCount?: number;
    activeCityId?: CityId;
    notes?: string;
  };
  payload: {
    logs: DailyLogEntry[];
    priceMemory: PriceMemory;
    recipePrices?: Record<string, number>;
    settings?: AppSettings;
    timers?: IslandTimer[];
    checklist?: DailyChecklistItem[];
    workshopPrices?: WorkshopPricesSettings;
    characters?: CharacterProfile[];
    activeCharacterId?: string | null;
    destinyMastery?: DestinyMasteryProfile;
    dailyEventsConfig?: Record<string, unknown>;
    labourersConfig?: PersistedLabourerConfig;
    craftingSalesLedger?: BlackMarketItemRecord[];
    guildIslandConfig?: StoredGuildIslandConfig;
    redZoneTransportConfig?: RedZoneTransportInput;
    fishingSaucesConfig?: Record<string, unknown>;
    butcherConfig?: Record<string, unknown>;
    butcherPrices?: Record<string, number>;
    transmutationConfig?: Record<string, unknown>;
    transmutationPrices?: Record<string, number>;
    warehouseStoredItems?: Record<string, unknown>[];
    warehouseMountId?: string;
    blackMarketConfig?: Record<string, unknown>;
    financialGoals?: FinancialGoal[];
  };
}

/**
 * Opciones al importar un respaldo:
 * - merge: Combina los datos con los existentes sin borrar lo que ya tienes (agrega logs nuevos, une precios)
 * - replace: Reemplaza completamente los datos locales por los del archivo de respaldo
 */
export type ImportMode = 'merge' | 'replace';

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  version: number;
  summary: {
    logsCount: number;
    pricesCount: number;
    charactersCount: number;
    checklistCount: number;
    hasMastery: boolean;
  };
  data?: AlbionFullBackupData;
}
