/**
 * Custom Hook: useCloudSync
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Gestiona el estado de sincronización en la nube, auto-sincronización periódica
 * y conectividad offline/online sin bloquear la experiencia local-first.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CloudSyncConfig,
  CloudSyncState,
  CloudSyncStatusReport,
} from '../domain/models/cloudSync';
import {
  prepareCloudSyncPayload,
  validateCloudPayload,
  resolveCloudSyncMerge,
  generateCloudSyncStatusReport,
} from '../domain/use-cases/cloudSyncEngine';
import { createFullBackupData, restoreFullBackupData } from '../utils/storage';

const STORAGE_KEY = 'albion_cloud_sync_config_v1';

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('albion_device_id_v1');
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('albion_device_id_v1', id);
    }
    return id;
  } catch {
    return 'fallback_device_id';
  }
}

const DEFAULT_CONFIG: CloudSyncConfig = {
  enabled: false,
  provider: 'manual_cloud',
  autoSyncIntervalMinutes: 15,
  deviceId: getOrCreateDeviceId(),
};

export function useCloudSync() {
  const [config, setConfig] = useState<CloudSyncConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          deviceId: getOrCreateDeviceId(),
        };
      }
    } catch {}
    return DEFAULT_CONFIG;
  });

  const [state, setState] = useState<CloudSyncState>(() => (config.enabled ? 'synced' : 'local_only'));
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Escucha de conectividad online/offline del navegador
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Guardar configuración en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }, [config]);

  // Actualizar configuración
  const updateConfig = useCallback((changes: Partial<CloudSyncConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...changes };
      if (updated.enabled && state === 'local_only') {
        setState('synced');
      } else if (!updated.enabled) {
        setState('local_only');
      }
      return updated;
    });
  }, [state]);

  // Ejecutar sincronización (Manual o Automática)
  const syncNow = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isOnline) {
      setState('offline');
      return { success: false, message: 'Sin conexión a internet. Los datos se mantienen a salvo en almacenamiento local.' };
    }

    setState('syncing');
    setLastError(undefined);

    try {
      const localBackup = createFullBackupData();
      const payload = prepareCloudSyncPayload(localBackup, config.deviceId);

      // Simular latencia de red controlada (250ms)
      await new Promise((res) => setTimeout(res, 250));

      // Guardar snapshot de sincronización en la nube simulada / local-mirror
      try {
        localStorage.setItem('albion_cloud_last_snapshot_v1', JSON.stringify(payload));
      } catch {}

      const now = Date.now();
      setConfig((prev) => ({
        ...prev,
        lastSyncedTimestamp: now,
        lastSyncedIso: new Date(now).toISOString(),
      }));

      setState('synced');
      return { success: true, message: 'Sincronización en la nube completada con éxito.' };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error inesperado durante la sincronización.';
      setLastError(errMsg);
      setState('error');
      return { success: false, message: errMsg };
    }
  }, [isOnline, config.deviceId]);

  // Auto-sincronización periódica si está habilitada
  useEffect(() => {
    if (!config.enabled || config.autoSyncIntervalMinutes <= 0 || !isOnline) {
      return;
    }

    const intervalMs = config.autoSyncIntervalMinutes * 60 * 1000;
    const intervalId = setInterval(() => {
      syncNow();
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [config.enabled, config.autoSyncIntervalMinutes, isOnline, syncNow]);

  const report: CloudSyncStatusReport = generateCloudSyncStatusReport(config, state, isOnline, lastError);

  return {
    config,
    updateConfig,
    state,
    report,
    isOnline,
    syncNow,
  };
}
