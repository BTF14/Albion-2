export type EnchantmentTier = 0 | 1 | 2 | 3 | 4;

export type ShardType = 'rune' | 'soul' | 'relic' | 'avalonian';

export interface EnchantmentRequirement {
  fromLevel: number;
  toLevel: number;
  shardType: ShardType;
  shardNameEs: string;
  shardsRequiredPerItem: number; // Ej: Un arma de 1 mano requiere 96 runas para .1; 2 manos requiere 192 runas; armadura/pecho 192; cabeza/botas 96; offhand 48
}

export interface EnchantingSlotRequirements {
  slotId: 'one_hand_weapon' | 'two_hand_weapon' | 'chest' | 'head' | 'shoes' | 'offhand' | 'cape';
  slotNameEs: string;
  runesRequired: number;       // Para subir de .0 a .1
  soulsRequired: number;       // Para subir de .1 a .2
  relicsRequired: number;      // Para subir de .2 a .3
  avalonianRequired: number;   // Para subir de .3 a .4
}

export interface EnchantingCalculationInput {
  slotId: 'one_hand_weapon' | 'two_hand_weapon' | 'chest' | 'head' | 'shoes' | 'offhand' | 'cape';
  tier: number; // T4, T5, T6, T7, T8
  currentEnchantment: 0 | 1 | 2 | 3;
  targetEnchantment: 1 | 2 | 3 | 4;
  batchCount: number;
  hasPremium: boolean;
  // Precios manuales
  baseItemPrice: number;            // Precio de compra o valor actual del ítem en su encantamiento base
  targetItemMarketPrice: number;    // Precio de venta en mercado del ítem ya encantado al nivel objetivo
  shardUnitPrice: number;           // Precio de la Runa, Alma, Reliquia o Fragmento Avaloniano correspondiente
}

export interface EnchantingCalculationResult {
  tier: number;
  slotName: string;
  fromEnchantment: number;
  toEnchantment: number;
  batchCount: number;
  shardType: ShardType;
  shardNameEs: string;
  shardsPerItem: number;
  totalShardsRequired: number;
  totalShardCost: number;
  totalBaseItemCost: number;
  totalEnchantingCost: number;       // Coste base del ítem + coste de esencias/runas
  costPerEnchantedUnit: number;
  directBuyMarketCost: number;       // Cuánto costaría comprar el ítem ya encantado en el mercado
  silverSavedVsDirectBuy: number;    // Ahorro neto en plata por pieza al encantarlo uno mismo
  // Si se va a revender en el mercado
  grossSellRevenue: number;
  marketTaxPercent: number;
  netSellRevenue: number;
  netProfit: number;
  profitPerUnit: number;
  roiPercent: number;
  isProfitableToResell: boolean;
  isCheaperToCraftThanBuy: boolean;
  recommendations: string[];
}
