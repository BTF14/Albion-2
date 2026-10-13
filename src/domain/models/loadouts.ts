/**
 * Modelos de Dominio: Calculadora de Sets, Re-Gear & Presupuesto de Bajas
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

export type LoadoutSlot =
  | 'main_hand'
  | 'off_hand'
  | 'head'
  | 'chest'
  | 'shoes'
  | 'cape'
  | 'mount'
  | 'food'
  | 'potion';

export type LoadoutCategory =
  | 'pvp_zvz'
  | 'pvp_smallscale'
  | 'transport'
  | 'pve_fame'
  | 'custom';

export interface LoadoutItem {
  slot: LoadoutSlot;
  name: string;
  tier: number;
  enchantment: number; // 0, 1, 2, 3, 4
  unitPrice: number;
  quantity: number; // Por defecto 1 (o más para comidas/pociones)
}

export interface LoadoutProfile {
  id: string;
  name: string;
  category: LoadoutCategory;
  items: Record<LoadoutSlot, LoadoutItem | null>;
  totalCost: number;
  notes?: string;
  createdAt: number;
}

export interface RegearBudgetAnalysis {
  loadout: LoadoutProfile;
  costPerDeath: number;
  budget3Deaths: number;
  budget5Deaths: number;
  budget10Deaths: number;
  mostExpensiveItem: LoadoutItem | null;
  itemsCount: number;
}
