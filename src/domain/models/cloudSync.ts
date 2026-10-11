/**
 * Modelo de Dominio: Sincronización en la Nube & Persistencia Multidispositivo (Cloud Sync)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Principios Arquitectónicos:
 * 1. Local-First: La aplicación siempre funciona offline a 0ms de latencia en localStorage/IndexedDB.
 * 2. Cloud Sync Asíncrono: Cuando hay conexión o el usuario lo solicita, sincroniza con la nube.
 * 3. Proveedor Pluggable: Soporta Firebase Firestore, Supabase o Endpoint REST genérico.
 * 4. Resolución de Conflictos: Last-Write-Wins (LWW) defensivo con fusión no destructiva.
 */

import { AlbionFullBackupData } from './backup';

export type CloudSyncProvider = 'firebase' | 'supabase' | 'rest_endpoint' | 'manual_cloud';

export type CloudSyncState = 'local_only' | 'syncing' | 'synced' | 'offline' | 'error';

export interface CloudSyncConfig {
  enabled: boolean;
  provider: CloudSyncProvider;
  endpointUrl?: string; // Para Supabase / REST
  apiKey?: string;
  projectId?: string; // Para Firebase
  userId?: string; // ID único del jugador o correo
  autoSyncIntervalMinutes: number; // Ej. 15 minutos (0 = solo manual)
  lastSyncedTimestamp?: number;
  lastSyncedIso?: string;
  deviceId: string;
}

export interface CloudSyncPayload {
  version: 2;
  deviceId: string;
  timestamp: number;
  data: AlbionFullBackupData;
  checksum?: string;
}

export interface CloudSyncStatusReport {
  state: CloudSyncState;
  lastSyncFormatted: string;
  pendingChangesCount: number;
  providerName: string;
  isOnline: boolean;
  errorMessage?: string;
}
