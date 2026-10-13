/**
 * Modelos de Dominio: Metas Financieras, Hitos de Albion y Presupuesto de Siembra Masiva
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

export type GoalCategory = 'premium' | 'mount' | 'guild' | 'gear' | 'custom';

export interface FinancialGoal {
  id: string;
  title: string;
  targetSilver: number;
  category: GoalCategory;
  icon: string;
  notes?: string;
  createdAt: number;
  isCustom?: boolean;
}

export interface GoalProgressAnalysis {
  goalId: string;
  title: string;
  targetSilver: number;
  category: GoalCategory;
  icon: string;
  currentProgressSilver: number;
  percentage: number; // 0 - 100
  remainingSilver: number; // >= 0
  dailySilverVelocity: number; // Plata neta ganada por día históricamente
  daysRemaining: number | null; // null si velocidad <= 0
  isCompleted: boolean;
  statusMessage: string;
}

export interface CanonicalGoalDef {
  id: string;
  title: string;
  targetSilver: number;
  category: GoalCategory;
  icon: string;
  description: string;
}

export const CANONICAL_ALBION_GOALS: CanonicalGoalDef[] = [
  {
    id: 'goal_premium_30d',
    title: '👑 Suscripción Premium (30 Días)',
    targetSilver: 25000000,
    category: 'premium',
    icon: 'Crown',
    description: 'Permite mantener tu bono Premium (10k foco diario, 50% fama y rendimiento) con plata del juego.',
  },
  {
    id: 'goal_transport_mammoth',
    title: '🐘 Mamut de Transporte Oficial',
    targetSilver: 190000000,
    category: 'mount',
    icon: 'Truck',
    description: 'La montura definitiva de comercio en Albion Online con capacidad de carga masiva para mover imperios.',
  },
  {
    id: 'goal_guild_island_lvl6',
    title: '🏰 Isla de Gremio Nivel 6 (Máxima)',
    targetSilver: 31750000,
    category: 'guild',
    icon: 'Castle',
    description: 'Coste oficial post-Wild Blood para desbloquear los 14 solares estándar de construcción gremial.',
  },
  {
    id: 'goal_guild_hall_t8',
    title: '🏠 Casa Gremial (Guild Hall T8)',
    targetSilver: 16500000,
    category: 'guild',
    icon: 'Building2',
    description: 'Construcción y equipamiento completo con 15 camas T8 y mesas para trabajadores gremiales.',
  },
  {
    id: 'goal_master_combat_set_83',
    title: '⚔️ Set de Combate 8.3 Maestro',
    targetSilver: 45000000,
    category: 'gear',
    icon: 'Shield',
    description: 'Arma y armadura obra maestra T8.3 para ZvZ, GvG o contenido de alto riesgo en Zona Negra.',
  },
];

export interface SeedBudgetInput {
  itemId: string;
  tier: number;
  plotsCount: number;
  slotsPerPlot: number; // Habitualmente 9 por parcela
  currentSeedsInStock: number;
  seedUnitPriceManual: number;
  expectedProductPriceManual: number;
  hasPremium: boolean;
}

export interface SeedBudgetResult {
  itemId: string;
  tier: number;
  totalSlots: number;
  seedsNeeded: number;
  currentSeedsInStock: number;
  seedsToBuy: number;
  totalSeedCost: number;
  estimatedHarvestUnits: number;
  estimatedGrossRevenue: number;
  estimatedNetRevenue: number;
  estimatedNetProfit: number;
  roiPercent: number;
}
