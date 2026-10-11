export type EventCategory =
  | 'mists'
  | 'roads'
  | 'dungeons'
  | 'hellgates'
  | 'faction'
  | 'gathering'
  | 'farming'
  | 'crafting'
  | 'pvp'
  | 'general';

export type AlbionServerRegion = 'americas' | 'europe' | 'asia';

export interface AlbionServerConfig {
  id: AlbionServerRegion;
  name: string;
  location: string;
  maintenanceHourUtc: number; // 10 para Americas y Europa, 23 para Asia
  label: string;
}

export const ALBION_SERVERS: Record<AlbionServerRegion, AlbionServerConfig> = {
  americas: {
    id: 'americas',
    name: 'Albion América',
    location: 'Washington D.C. (EE.UU.)',
    maintenanceHourUtc: 10,
    label: '🌎 América (10:00 UTC)',
  },
  europe: {
    id: 'europe',
    name: 'Albion Europa',
    location: 'Ámsterdam (Países Bajos)',
    maintenanceHourUtc: 10,
    label: '🌍 Europa (10:00 UTC)',
  },
  asia: {
    id: 'asia',
    name: 'Albion Asia',
    location: 'Singapur',
    maintenanceHourUtc: 23,
    label: '🌏 Asia (23:00 UTC)',
  },
};

export type ProductionBonusCategory =
  | 'cooking'
  | 'alchemy'
  | 'refining'
  | 'weapons'
  | 'armor'
  | 'accessories'
  | 'mounts'
  | 'custom';

export interface DailyEventItem {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  bonusText: string;
  badgeLabel: string;
  icon?: string;
}

export interface DailyProductionBonusItem {
  id: string;
  name: string;
  category: ProductionBonusCategory;
  bonusPercent: number; // 10 o 20
  affectedSkill: string;
  description: string;
  icon?: string;
  itemLines?: string[]; // ej. ['Espadas', 'Mazas'] o ['Placas']
}

export interface ServerResetTimeInfo {
  currentUtcString: string;
  secondsUntilReset: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  formattedCountdown: string; // ej. "20 h 45 m"
  formattedCountdownDetailed: string; // ej. "20 h 45 m 12 s"
  isMaintenanceWindow: boolean;
  currentCycleDateUtc: string; // YYYY-MM-DD
}

export interface DailyEventsState {
  currentEvent: DailyEventItem;
  activeBonuses: DailyProductionBonusItem[];
  timeInfo: ServerResetTimeInfo;
  customBonusName?: string;
  customBonusPercent?: number;
}
