/**
 * Modelos de Dominio: Logística de Almacén y Capacidad de Cofres de Isla en Albion Online
 * Arquitectura Gentleman Programming (Clean Architecture)
 */

import { TransportMount } from './transport';

export interface WarehouseStoredItem {
  id: string;
  nameEs: string;
  category: 'crop' | 'herb' | 'meat' | 'refined_resource' | 'food' | 'potion' | 'mount' | 'other';
  quantity: number;
  weightKgPerUnit: number;
  estimatedUnitPrice: number;
}

export interface ChestCapacityDefinition {
  type: 'novice_chest' | 'adept_chest' | 'expert_chest' | 'master_chest';
  nameEs: string;
  slotCapacity: number;
  maxWeightKg: number;
}

export const OFFICIAL_ISLAND_CHESTS: ChestCapacityDefinition[] = [
  { type: 'novice_chest', nameEs: 'Cofre de Madera (T2)', slotCapacity: 16, maxWeightKg: 1000 },
  { type: 'adept_chest', nameEs: 'Cofre de Novato (T4)', slotCapacity: 32, maxWeightKg: 2500 },
  { type: 'expert_chest', nameEs: 'Cofre de Experto (T5)', slotCapacity: 48, maxWeightKg: 5000 },
  { type: 'master_chest', nameEs: 'Cofre Maestro (T6+)', slotCapacity: 64, maxWeightKg: 10000 },
];

export interface WarehouseLogisticsReport {
  timestamp: number;
  itemsCount: number;
  totalWeightKg: number;
  totalVolumeSlots: number;
  totalEstimatedSilverValue: number;

  // Montura y viajes
  selectedMount: TransportMount;
  effectiveMountCapacityKg: number; // capacidad neta con bolsa y pie
  tripsRequired: number;
  remainingOverheadKg: number;
  canCarryInOneTrip: boolean;

  // Recomendación de cofres
  recommendedChestCount: number;
  recommendedChestType: ChestCapacityDefinition;
  logisticsAdvice: string;
}
