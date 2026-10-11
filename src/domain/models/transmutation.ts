/**
 * Modelos de Dominio: Transmutación Oficial de Recursos y Artefactos en Albion Online
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inquebrantable de Albion:
 * - La transmutación de recursos se realiza en las estaciones de refinado (Fundición, Curtiduría, Telar, Aserradero, Cantera).
 * - Se paga una tarifa fija en Plata directamente al sistema (no nutrición ni tasas del dueño).
 * - Permite dos tipos de transmutación:
 *   1. Transmutación de Encantamiento: .0 -> .1, .1 -> .2, .2 -> .3, .3 -> .4 (mismo tier).
 *   2. Transmutación de Tier: T4 -> T5, T5 -> T6, T6 -> T7, T7 -> T8 (mismo nivel de encantamiento).
 * - En el Fundidor de Artefactos (Artefact Foundry):
 *   Transmutación de 5 Runas -> 1 Alma, y 5 Almas -> 1 Reliquia.
 */

export type TransmutationResourceType =
  | 'bar'
  | 'leather'
  | 'cloth'
  | 'wood'
  | 'stone'
  | 'ore_raw'
  | 'hide_raw'
  | 'fiber_raw'
  | 'wood_raw'
  | 'stone_raw';
export type TransmutationMode = 'enchantment' | 'tier' | 'artefact_shard';
export type ShardTransmutationType = 'rune_to_soul' | 'soul_to_relic';

export interface TransmutationResourceItem {
  id: TransmutationResourceType;
  nameEs: string;
  nameEn: string;
  stationNameEs: string;
  iconName: string;
  isRaw?: boolean;
}

export const TRANSMUTATION_RESOURCES: TransmutationResourceItem[] = [
  // Recursos Refinados
  { id: 'bar', nameEs: 'Lingote de Metal (Refinado)', nameEn: 'Metal Bar', stationNameEs: 'Fundición (Smelter)', iconName: 'Shield', isRaw: false },
  { id: 'leather', nameEs: 'Cuero Curtido (Refinado)', nameEn: 'Refined Leather', stationNameEs: 'Curtiduría (Tanner)', iconName: 'Beef', isRaw: false },
  { id: 'cloth', nameEs: 'Tela Refinada (Refinada)', nameEn: 'Refined Cloth', stationNameEs: 'Telar (Loom)', iconName: 'Sprout', isRaw: false },
  { id: 'wood', nameEs: 'Tablas de Madera (Refinada)', nameEn: 'Wood Planks', stationNameEs: 'Aserradero (Lumbermill)', iconName: 'Wheat', isRaw: false },
  { id: 'stone', nameEs: 'Bloque de Piedra (Refinado)', nameEn: 'Stone Block', stationNameEs: 'Cantera (Stonemason)', iconName: 'Building2', isRaw: false },
  
  // Recursos Brutos (Recolectados)
  { id: 'ore_raw', nameEs: 'Mineral de Hierro (Bruto)', nameEn: 'Raw Ore', stationNameEs: 'Fundición (Smelter)', iconName: 'Shield', isRaw: true },
  { id: 'hide_raw', nameEs: 'Piel de Animal (Bruto)', nameEn: 'Raw Hide', stationNameEs: 'Curtiduría (Tanner)', iconName: 'Beef', isRaw: true },
  { id: 'fiber_raw', nameEs: 'Fibra de Lino/Algodón (Bruto)', nameEn: 'Raw Fiber', stationNameEs: 'Telar (Loom)', iconName: 'Sprout', isRaw: true },
  { id: 'wood_raw', nameEs: 'Tronco de Madera (Bruto)', nameEn: 'Raw Wood', stationNameEs: 'Aserradero (Lumbermill)', iconName: 'Wheat', isRaw: true },
  { id: 'stone_raw', nameEs: 'Piedra en Bruto', nameEn: 'Raw Stone', stationNameEs: 'Cantera (Stonemason)', iconName: 'Building2', isRaw: true },
];

/**
 * Tabla oficial de costes de plata para Transmutación de Encantamiento (por unidad)
 * [Tier][Target Enchantment]
 */
export const ENCHANTMENT_TRANSMUTATION_SILVER_COST: Record<number, Record<number, number>> = {
  4: { 1: 1500, 2: 3000, 3: 6000, 4: 24012 },
  5: { 1: 2000, 2: 4000, 3: 8000, 4: 32014 },
  6: { 1: 3000, 2: 6000, 3: 19800, 4: 79234 },
  7: { 1: 4800, 2: 15126, 3: 49916, 4: 199673 },
  8: { 1: 14401, 2: 45378, 3: 149748, 4: 748755 },
};

/**
 * Tabla oficial de costes de plata para Transmutación de Tier (por unidad)
 * [Target Tier][Enchantment Level]
 */
export const TIER_TRANSMUTATION_SILVER_COST: Record<number, Record<number, number>> = {
  5: { 0: 781, 1: 1563, 2: 3125, 3: 6252, 4: 25011 },
  6: { 0: 1250, 1: 2500, 2: 5000, 3: 16500, 4: 66050 },
  7: { 0: 2500, 1: 5000, 2: 15755, 3: 51997, 4: 208002 },
  8: { 0: 5000, 1: 15000, 2: 47270, 3: 155980, 4: 779948 },
};

/**
 * Costes oficiales en plata del Fundidor de Artefactos por transmutación (5 a 1)
 */
export const SHARD_TRANSMUTATION_SILVER_COST: Record<number, Record<ShardTransmutationType, number>> = {
  4: { rune_to_soul: 400, soul_to_relic: 1200 },
  5: { rune_to_soul: 800, soul_to_relic: 2400 },
  6: { rune_to_soul: 1600, soul_to_relic: 4800 },
  7: { rune_to_soul: 3200, soul_to_relic: 9600 },
  8: { rune_to_soul: 6400, soul_to_relic: 19200 },
};

export interface TransmutationCalculationInput {
  mode: TransmutationMode;
  resourceType: TransmutationResourceType;
  sourceTier: number;
  sourceEnchantment: number;
  targetTier: number;
  targetEnchantment: number;
  shardType?: ShardTransmutationType;
  batchCount: number;
  sourceItemUnitPrice: number;
  targetItemMarketSellPrice: number;
  hasPremium: boolean;
}

export interface TransmutationCalculationResult {
  mode: TransmutationMode;
  resourceType: TransmutationResourceType;
  sourceTier: number;
  sourceEnchantment: number;
  targetTier: number;
  targetEnchantment: number;
  batchCount: number;

  // Costes y plata requerida
  sourceMaterialCostPerUnit: number;
  totalSourceMaterialCost: number;
  transmutationSilverFeePerUnit: number;
  totalTransmutationSilverFee: number;
  totalInvestment: number; // material + transmutación

  // Venta en mercado
  targetMarketPrice: number;
  grossRevenue: number;
  marketTaxRate: number; // 4% o 8%
  setupOrderFeeRate: number; // 2.5%
  marketFeesTotal: number;
  netRevenue: number;

  // Rentabilidad & Arbitraje
  netProfit: number;
  profitPerUnit: number;
  roiPercent: number;
  breakEvenSellPrice: number;

  // Veredicto Estratégico
  isProfitable: boolean;
  arbitrageVerdict: 'PROFITABLE_TRANSMUTATION' | 'BUY_DIRECT_CHEAPER' | 'SELL_BASE_BETTER';
  verdictMessage: string;
}
