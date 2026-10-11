import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlbionServerRegion,
  ALBION_SERVERS,
  DailyEventItem,
  DailyProductionBonusItem,
  ServerResetTimeInfo,
} from '../domain/models/dailyEvents';
import { calculateServerResetCountdown } from '../domain/use-cases/calculateServerResetCountdown';
import {
  OFFICIAL_DAILY_EVENTS,
  AVAILABLE_PRODUCTION_BONUSES,
  getDailyEventForCycle,
} from '../domain/use-cases/calculateDailyEventRotation';

const STORAGE_KEY_DAILY_EVENTS = 'albion_daily_events_config_v2';

interface SavedDailyEventsConfig {
  serverRegion: AlbionServerRegion;
  cycleDateUtc: string;
  selectedEventId: string;
  activeBonusIds: string[];
  customBonusName?: string;
  customBonusPercent?: number;
  isBannerCollapsed?: boolean;
}

function sanitizeDailyEventsConfig(raw: unknown): SavedDailyEventsConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const safeObj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    safeObj[k] = v;
  }
  const region = (safeObj.serverRegion === 'europe' || safeObj.serverRegion === 'asia' || safeObj.serverRegion === 'americas')
    ? (safeObj.serverRegion as AlbionServerRegion)
    : 'americas';
  const cycleDateUtc = typeof safeObj.cycleDateUtc === 'string' ? safeObj.cycleDateUtc : '';
  const selectedEventId = typeof safeObj.selectedEventId === 'string' ? safeObj.selectedEventId : 'event_cooking_fame';
  const activeBonusIds = Array.isArray(safeObj.activeBonusIds)
    ? safeObj.activeBonusIds.filter((id): id is string => typeof id === 'string')
    : ['bonus_cooking'];

  return {
    serverRegion: region,
    cycleDateUtc,
    selectedEventId,
    activeBonusIds,
    customBonusName: typeof safeObj.customBonusName === 'string' ? safeObj.customBonusName : undefined,
    customBonusPercent: Number.isFinite(safeObj.customBonusPercent) ? Number(safeObj.customBonusPercent) : undefined,
    isBannerCollapsed: Boolean(safeObj.isBannerCollapsed),
  };
}

export function useDailyEvents() {
  // Carga inicial persistente de configuración
  const [savedConfig, setSavedConfig] = useState<SavedDailyEventsConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DAILY_EVENTS);
      if (raw) {
        const sanitized = sanitizeDailyEventsConfig(JSON.parse(raw));
        if (sanitized) {
          const nowTime = calculateServerResetCountdown(sanitized.serverRegion || 'americas');
          if (sanitized.cycleDateUtc === nowTime.currentCycleDateUtc) {
            return sanitized;
          }
        }
      }
    } catch (e) {
      console.error('Error loading daily events config', e);
    }

    const currentCycle = calculateServerResetCountdown('americas').currentCycleDateUtc;
    const defaultEvent = getDailyEventForCycle(currentCycle);
    return {
      serverRegion: 'americas',
      cycleDateUtc: currentCycle,
      selectedEventId: defaultEvent.id,
      activeBonusIds: ['bonus_cooking'],
      isBannerCollapsed: false,
    };
  });

  // Sincronización multi-pestaña
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_DAILY_EVENTS && e.newValue) {
        try {
          const sanitized = sanitizeDailyEventsConfig(JSON.parse(e.newValue));
          if (sanitized) {
            setSavedConfig(sanitized);
            setTimeInfo(calculateServerResetCountdown(sanitized.serverRegion));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const [timeInfo, setTimeInfo] = useState<ServerResetTimeInfo>(() =>
    calculateServerResetCountdown(savedConfig.serverRegion)
  );

  // Temporizador en tiempo real: actualiza cada segundo para el segundero y cada minuto para el ciclo
  useEffect(() => {
    const timer = setInterval(() => {
      const nextTime = calculateServerResetCountdown(savedConfig.serverRegion);
      setTimeInfo(nextTime);

      // Si el ciclo cambió (nuevo día en Albion para esa región), actualizar ciclo
      if (nextTime.currentCycleDateUtc !== savedConfig.cycleDateUtc) {
        const newDefaultEvent = getDailyEventForCycle(nextTime.currentCycleDateUtc);
        const refreshedConfig: SavedDailyEventsConfig = {
          serverRegion: savedConfig.serverRegion,
          cycleDateUtc: nextTime.currentCycleDateUtc,
          selectedEventId: newDefaultEvent.id,
          activeBonusIds: ['bonus_cooking'],
          isBannerCollapsed: false,
        };
        setSavedConfig(refreshedConfig);
        try {
          localStorage.setItem(STORAGE_KEY_DAILY_EVENTS, JSON.stringify(refreshedConfig));
        } catch (e) {
          console.error('Error saving updated daily cycle config', e);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [savedConfig.cycleDateUtc, savedConfig.serverRegion]);

  // Guardar en localStorage cuando cambia la configuración
  const persistConfig = useCallback((newConfig: SavedDailyEventsConfig) => {
    setSavedConfig(newConfig);
    setTimeInfo(calculateServerResetCountdown(newConfig.serverRegion));
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_EVENTS, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Error persisting daily events config', e);
    }
  }, []);

  const setServerRegion = useCallback(
    (region: AlbionServerRegion) => {
      const nextTime = calculateServerResetCountdown(region);
      persistConfig({
        ...savedConfig,
        serverRegion: region,
        cycleDateUtc: nextTime.currentCycleDateUtc,
      });
    },
    [savedConfig, persistConfig]
  );

  // Evento temático actual
  const currentEvent: DailyEventItem = useMemo(() => {
    const found = OFFICIAL_DAILY_EVENTS.find((ev) => ev.id === savedConfig.selectedEventId);
    return found || getDailyEventForCycle(timeInfo.currentCycleDateUtc);
  }, [savedConfig.selectedEventId, timeInfo.currentCycleDateUtc]);

  // Lista de bonos de producción activos
  const activeBonuses: DailyProductionBonusItem[] = useMemo(() => {
    const list = AVAILABLE_PRODUCTION_BONUSES.filter((b) =>
      savedConfig.activeBonusIds.includes(b.id)
    );
    if (savedConfig.customBonusName && (savedConfig.customBonusPercent || 0) > 0) {
      list.push({
        id: 'custom_bonus',
        name: `+${savedConfig.customBonusPercent}% ${savedConfig.customBonusName}`,
        category: 'custom',
        bonusPercent: savedConfig.customBonusPercent || 10,
        affectedSkill: savedConfig.customBonusName,
        description: `Bono personalizado de +${savedConfig.customBonusPercent}% en ${savedConfig.customBonusName}`,
      });
    }
    return list;
  }, [savedConfig.activeBonusIds, savedConfig.customBonusName, savedConfig.customBonusPercent]);

  // Activar o desactivar bono
  const toggleBonus = useCallback(
    (bonusId: string) => {
      const exists = savedConfig.activeBonusIds.includes(bonusId);
      const nextIds = exists
        ? savedConfig.activeBonusIds.filter((id) => id !== bonusId)
        : [...savedConfig.activeBonusIds, bonusId];

      persistConfig({
        ...savedConfig,
        activeBonusIds: nextIds,
      });
    },
    [savedConfig, persistConfig]
  );

  // Cambiar evento temático seleccionado
  const selectEvent = useCallback(
    (eventId: string) => {
      persistConfig({
        ...savedConfig,
        selectedEventId: eventId,
      });
    },
    [savedConfig, persistConfig]
  );

  // Poner o quitar bono personalizado
  const setCustomBonus = useCallback(
    (name?: string, percent?: number) => {
      persistConfig({
        ...savedConfig,
        customBonusName: name,
        customBonusPercent: percent,
      });
    },
    [savedConfig, persistConfig]
  );

  // Colapsar / Expandir banner superior
  const toggleBannerCollapse = useCallback(() => {
    persistConfig({
      ...savedConfig,
      isBannerCollapsed: !savedConfig.isBannerCollapsed,
    });
  }, [savedConfig, persistConfig]);

  // Resumen de bonos específicos para Cocina, Alquimia y Crafteo de Equipo
  const cookingBonusPercent = useMemo(() => {
    const b20 = activeBonuses.find((b) => b.id === 'bonus_cooking_20');
    if (b20) return 20;
    const b10 = activeBonuses.find((b) => b.id === 'bonus_cooking');
    if (b10) return 10;
    return 0;
  }, [activeBonuses]);

  const alchemyBonusPercent = useMemo(() => {
    const b20 = activeBonuses.find((b) => b.id === 'bonus_alchemy_20');
    if (b20) return 20;
    const b10 = activeBonuses.find((b) => b.id === 'bonus_alchemy');
    if (b10) return 10;
    return 0;
  }, [activeBonuses]);

  const equipmentCraftingBonusPercent = useMemo(() => {
    // Si hay algún bono activo de armas, armaduras o accesorios
    const eqBonus = activeBonuses.find((b) =>
      b.category === 'weapons' || b.category === 'armor' || b.category === 'accessories'
    );
    if (eqBonus) return eqBonus.bonusPercent;
    // O si hay bono personalizado de crafteo
    const custom = activeBonuses.find((b) => b.category === 'custom');
    if (custom && (custom.affectedSkill.toLowerCase().includes('crafteo') || custom.affectedSkill.toLowerCase().includes('forja') || custom.affectedSkill.toLowerCase().includes('equipo'))) {
      return custom.bonusPercent;
    }
    return 0;
  }, [activeBonuses]);

  return {
    timeInfo,
    currentEvent,
    activeBonuses,
    availableEvents: OFFICIAL_DAILY_EVENTS,
    availableBonuses: AVAILABLE_PRODUCTION_BONUSES,
    isBannerCollapsed: Boolean(savedConfig.isBannerCollapsed),
    cookingBonusPercent,
    alchemyBonusPercent,
    equipmentCraftingBonusPercent,
    serverRegion: savedConfig.serverRegion,
    setServerRegion,
    toggleBonus,
    selectEvent,
    setCustomBonus,
    toggleBannerCollapse,
  };
}
