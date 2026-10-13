/**
 * Modelos de Dominio: Optimizador de Alimentación al Menor Coste (Least-Cost Feed Advisor)
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

export type FeedDietType = 'herbivore' | 'carnivore';

export interface FeedFoodItemDef {
  itemId: string;
  nameEs: string;
  tier: number;
  dietType: FeedDietType;
  defaultPrice: number;
}

export const OFFICIAL_HERBIVORE_CROPS: FeedFoodItemDef[] = [
  { itemId: 'crop_carrot', nameEs: 'Zanahoria', tier: 3, dietType: 'herbivore', defaultPrice: 380 },
  { itemId: 'crop_wheat', nameEs: 'Trigo', tier: 4, dietType: 'herbivore', defaultPrice: 420 },
  { itemId: 'crop_turnip', nameEs: 'Nabo', tier: 5, dietType: 'herbivore', defaultPrice: 460 },
  { itemId: 'crop_cabbage', nameEs: 'Col', tier: 5, dietType: 'herbivore', defaultPrice: 490 },
  { itemId: 'crop_potato', nameEs: 'Patata', tier: 6, dietType: 'herbivore', defaultPrice: 530 },
  { itemId: 'crop_corn', nameEs: 'Maíz', tier: 6, dietType: 'herbivore', defaultPrice: 560 },
  { itemId: 'crop_pumpkin', nameEs: 'Calabaza', tier: 7, dietType: 'herbivore', defaultPrice: 620 },
];

export const OFFICIAL_CARNIVORE_MEATS: FeedFoodItemDef[] = [
  { itemId: 'meat_chicken', nameEs: 'Pollo Crudo', tier: 3, dietType: 'carnivore', defaultPrice: 220 },
  { itemId: 'meat_goat', nameEs: 'Cabra Cruda', tier: 4, dietType: 'carnivore', defaultPrice: 260 },
  { itemId: 'meat_goose', nameEs: 'Ganso Crudo', tier: 5, dietType: 'carnivore', defaultPrice: 310 },
  { itemId: 'meat_sheep', nameEs: 'Oveja Cruda', tier: 6, dietType: 'carnivore', defaultPrice: 380 },
  { itemId: 'meat_pig', nameEs: 'Cerdo Crudo', tier: 7, dietType: 'carnivore', defaultPrice: 450 },
  { itemId: 'meat_cow', nameEs: 'Vaca Cruda', tier: 8, dietType: 'carnivore', defaultPrice: 540 },
];

export interface FeedOptionAnalysis {
  itemId: string;
  nameEs: string;
  tier: number;
  dietType: FeedDietType;
  unitPrice: number;
  costPer10Units: number; // Coste diario oficial por cada animal (10 unidades)
  isCheapest: boolean;
  savingsVsMostExpensivePercent: number;
}

export interface FeedAdvisorResult {
  dietType: FeedDietType;
  options: FeedOptionAnalysis[];
  cheapestOption: FeedOptionAnalysis | null;
  mostExpensiveOption: FeedOptionAnalysis | null;
  maxSavingsPercent: number;
  dailyFeedAdvice: string;
}
