/**
 * Modelo de Dominio: Taller de Pesca, Fileteado y Salsas de Comida (Fish Chopping & Sauces Workshop)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Mecánicas oficiales de Albion Online:
 * - Pescado Común (T1 a T8): Al filetearlo en una carnicería o cocina, rinde Chopped Fish (Pescado Picado).
 * - Rendimiento oficial de Pescado Picado según Tier:
 *   - T1: ~1 u. | T2: ~2 u. | T3: ~4 u. | T4: ~8 u. | T5: ~16 u. | T6: ~32 u. | T7: ~64 u. | T8: ~128 u.
 * - Algas Marinas (Seaweed): Se obtienen de la pesca o el mercado.
 * - Salsas de Pescado (Fish Sauces) para encantar comidas:
 *   - Salsa Básica (.1): 15 Pescado Picado + 1 Alga Marina.
 *   - Salsa Elegante (.2): 45 Pescado Picado + 3 Algas Marinas.
 *   - Salsa Especial (.3): 135 Pescado Picado + 9 Algas Marinas.
 * - Arbitraje: Comparar valor de venta de pescado entero crudo vs venta de pescado picado vs crafteo de salsas.
 */

export interface FishTierInfo {
  tier: number;
  nameEs: string;
  itemId: string;
  choppedFishYield: number; // Unidades de pescado picado obtenidas por pez
  estimatedMarketPriceSilver: number;
}

export const OFFICIAL_FISH_TIERS: FishTierInfo[] = [
  { tier: 1, nameEs: 'Arenque Común T1', itemId: 'T1_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 1, estimatedMarketPriceSilver: 60 },
  { tier: 2, nameEs: 'Trucha de Río T2', itemId: 'T2_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 2, estimatedMarketPriceSilver: 140 },
  { tier: 3, nameEs: 'Salmón de Lago T3', itemId: 'T3_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 4, estimatedMarketPriceSilver: 320 },
  { tier: 4, nameEs: 'Lucio Común T4', itemId: 'T4_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 8, estimatedMarketPriceSilver: 700 },
  { tier: 5, nameEs: 'Perca de Aguas Profundas T5', itemId: 'T5_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 16, estimatedMarketPriceSilver: 1550 },
  { tier: 6, nameEs: 'Pez Espada T6', itemId: 'T6_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 32, estimatedMarketPriceSilver: 3400 },
  { tier: 7, nameEs: 'Esturión del Cañón T7', itemId: 'T7_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 64, estimatedMarketPriceSilver: 7800 },
  { tier: 8, nameEs: 'Tiburón de Aguas Turbulentas T8', itemId: 'T8_FISH_FRESHWATER_RIVER_COMMON', choppedFishYield: 128, estimatedMarketPriceSilver: 17500 },
];

export interface FishSauceRecipe {
  id: 'sauce_basic' | 'sauce_fancy' | 'sauce_special';
  nameEs: string;
  itemId: string;
  enchantmentLevel: 1 | 2 | 3;
  choppedFishRequired: number;
  seaweedRequired: number;
  outputAmount: number; // 10 salsas por lote oficial
  defaultSellPriceSilver: number;
}

export const FISH_SAUCE_RECIPES: FishSauceRecipe[] = [
  {
    id: 'sauce_basic',
    nameEs: 'Salsa Básica de Pescado (.1)',
    itemId: 'T1_FISHSAUCE_LEVEL1',
    enchantmentLevel: 1,
    choppedFishRequired: 15,
    seaweedRequired: 1,
    outputAmount: 10,
    defaultSellPriceSilver: 280,
  },
  {
    id: 'sauce_fancy',
    nameEs: 'Salsa Elegante de Pescado (.2)',
    itemId: 'T1_FISHSAUCE_LEVEL2',
    enchantmentLevel: 2,
    choppedFishRequired: 45,
    seaweedRequired: 3,
    outputAmount: 10,
    defaultSellPriceSilver: 950,
  },
  {
    id: 'sauce_special',
    nameEs: 'Salsa Especial de Pescado (.3)',
    itemId: 'T1_FISHSAUCE_LEVEL3',
    enchantmentLevel: 3,
    choppedFishRequired: 135,
    seaweedRequired: 9,
    outputAmount: 10,
    defaultSellPriceSilver: 3200,
  },
];

export interface FishingSaucesInput {
  fishTier: number;
  fishQuantity: number;
  fishMarketPriceSilver: number;
  choppedFishMarketPriceSilver: number;
  seaweedMarketPriceSilver: number;
  basicSaucePriceSilver: number;
  fancySaucePriceSilver: number;
  specialSaucePriceSilver: number;
  hasPremium: boolean;
  nutritionFeePer100?: number;
}

export interface FishSauceAnalysisItem {
  recipe: FishSauceRecipe;
  possibleBatches: number;
  choppedFishUsed: number;
  leftoverChoppedFish: number;
  leftoverChoppedFishNetValue: number;
  totalSaucesOutput: number;
  extraSeaweedCost: number;
  stationFeeSilver: number;
  grossRevenue: number;
  netRevenue: number;
  totalNetWithLeftover: number;
  netProfitVsRawFish: number;
  craftCostPerUnit: number;
  marketPricePerUnit: number;
  marginPerUnit: number;
  seaweedBreakEvenPrice: number;
  roiPercent: number;
}

export interface FishingSaucesResult {
  fishTier: number;
  fishQuantity: number;
  totalChoppedFishYield: number;
  
  // Opción A: Venta de Pescado Entero
  rawFishGrossRevenue: number;
  rawFishNetRevenue: number;

  // Opción B: Filetear y Vender Pescado Picado
  choppedFishGrossRevenue: number;
  choppedFishNetRevenue: number;
  choppedProfitVsRawFish: number;

  // Opción C: Crafteo de Salsas
  saucesAnalysis: FishSauceAnalysisItem[];

  // Veredicto Estratégico
  bestAction: 'SELL_RAW_FISH' | 'CHOP_AND_SELL' | 'CRAFT_BASIC_SAUCE' | 'CRAFT_FANCY_SAUCE' | 'CRAFT_SPECIAL_SAUCE';
  bestActionNetRevenue: number;
  verdictTitleEs: string;
  verdictDescriptionEs: string;
}
