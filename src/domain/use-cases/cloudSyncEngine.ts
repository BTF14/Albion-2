/**
 * Caso de Uso Puro: Motor de Sincronización en la Nube (Cloud Sync Engine)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Regla Inviolable: Función 100% pura y testeable, sin React, DOM ni llamadas de red directas.
 */

import { CloudSyncConfig, CloudSyncPayload, CloudSyncStatusReport, CloudSyncState } from '../models/cloudSync';
import { AlbionFullBackupData } from '../models/backup';
import { mergeBackupPayload } from './backupManager';

/**
 * Empaqueta el estado local de respaldo para ser transmitido a la nube
 */
export function prepareCloudSyncPayload(
  backupData: AlbionFullBackupData,
  deviceId: string
): CloudSyncPayload {
  const now = Date.now();
  return {
    version: 2,
    deviceId: deviceId || 'browser_client',
    timestamp: now,
    data: backupData,
  };
}

/**
 * Valida un payload recibido de la nube garantizando protección contra Prototype Pollution
 */
export function validateCloudPayload(raw: unknown): { isValid: boolean; payload?: CloudSyncPayload; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, error: 'El paquete de sincronización recibido no es un objeto válido.' };
  }

  const obj = raw as Record<string, unknown>;
  if (obj.version !== 2 || !obj.data || typeof obj.data !== 'object') {
    return { isValid: false, error: 'Versión o formato de datos en la nube incompatible.' };
  }

  // Descartar claves de ataque
  if ('__proto__' in obj || 'constructor' in obj || 'prototype' in obj) {
    return { isValid: false, error: 'Paquete de nube rechazado por violar políticas de seguridad (Prototype Pollution).' };
  }

  const cloudPayload = obj as unknown as CloudSyncPayload;
  return { isValid: true, payload: cloudPayload };
}

/**
 * Evalúa si el paquete remoto es más reciente que el estado local o si requiere fusión
 */
export function resolveCloudSyncMerge(
  localData: AlbionFullBackupData['payload'],
  remotePayload: CloudSyncPayload,
  localLastSyncTimestamp: number
): { shouldUpdate: boolean; mergedPayload: AlbionFullBackupData['payload']; reason: string } {
  const remoteTime = remotePayload.timestamp || 0;
  
  if (remoteTime <= localLastSyncTimestamp) {
    return {
      shouldUpdate: false,
      mergedPayload: localData,
      reason: 'Los datos locales ya están al día o son más recientes que la nube.',
    };
  }

  // Fusión defensiva no destructiva: combina novedades remotas sin perder registros locales
  const merged = mergeBackupPayload(localData, remotePayload.data.payload, 'merge');

  return {
    shouldUpdate: true,
    mergedPayload: merged,
    reason: `Datos remotos del ${new Date(remoteTime).toLocaleString()} fusionados exitosamente.`,
  };
}

/**
 * Genera un reporte legible del estado actual de la sincronización en la nube
 */
export function generateCloudSyncStatusReport(
  config: CloudSyncConfig,
  state: CloudSyncState,
  isOnline: boolean,
  errorMessage?: string
): CloudSyncStatusReport {
  let providerName = 'Modo Local-First (Sin Nube)';
  if (config.enabled) {
    switch (config.provider) {
      case 'firebase':
        providerName = 'Firebase Firestore';
        break;
      case 'supabase':
        providerName = 'Supabase Cloud';
        break;
      case 'rest_endpoint':
        providerName = 'API REST Personalizada';
        break;
      case 'manual_cloud':
        providerName = 'Nube Manual';
        break;
    }
  }

  let lastSyncFormatted = 'Nunca';
  if (config.lastSyncedTimestamp && Number.isFinite(config.lastSyncedTimestamp)) {
    const diffMin = Math.round((Date.now() - config.lastSyncedTimestamp) / 60000);
    if (diffMin < 1) lastSyncFormatted = 'Hace unos segundos';
    else if (diffMin < 60) lastSyncFormatted = `Hace ${diffMin} min`;
    else lastSyncFormatted = new Date(config.lastSyncedTimestamp).toLocaleString();
  }

  return {
    state,
    lastSyncFormatted,
    pendingChangesCount: 0,
    providerName,
    isOnline,
    errorMessage,
  };
}
