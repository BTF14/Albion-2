/**
 * Modelo de Dominio: Carnicería y Matadero de Animales (Butcher & Meat Yield)
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Reglas de Albion Online:
 * - Base de carne cruda: 20 unidades por animal adulto faenado.
 * - Cerdos (T7): No producen leche ni huevos, se crían exclusivamente para sacrificio o reventa.
 * - Bonos de Ciudad Real en Carnicería:
 *   - Fort Sterling: Carne de Pollo Cruda (T3)
 *   - Bridgewatch: Carne de Cabra Cruda (T4)
 *   - Lymhurst: Carne de Ganso Cruda (T5)
 *   - Martlock: Carne de Res Cruda (T8)
 *   - Thetford: Carne de Cerdo Cruda (T7)
 *   - Caerleon: Bono general de cocina y carnicería (+15% RRR)
 * - RRR Oficial:
 *   - Isla personal: 0% RRR base.
 *   - Ciudad Real sin bono: 15.2% sin foco / 43.5% con foco.
 *   - Ciudad Real con bono de matanza: 24.8% sin foco / 47.9% con foco.
 */

import { CityId } from '../../types';

export type ButcherAnimalId =
  | 'animal_chicken'
  | 'animal_goat'
  | 'animal_goose'
  | 'animal_sheep'
  | 'animal_pig'
  | 'animal_cow';

export interface ButcherAnimalMetadata {
  id: ButcherAnimalId;
  nameEs: string;
  nameEn: string;
  tier: number;
  meatItemId: string;
  meatNameEs: string;
  produceItemId?: string; // Huevos o Leche (undefined para cerdos)
  produceNameEs?: string;
  dailyProduceAmount: number; // e.g. ~9-18 huevos o leche al día
  favoriteFoodNameEs: string;
  bonusCityId: CityId;
  baseMeatYield: number; // 20 unidades oficiales
}

export const BUTCHER_ANIMALS: ButcherAnimalMetadata[] = [
  {
    id: 'animal_chicken',
    nameEs: 'Pollo Adulto',
    nameEn: 'T3 Chicken',
    tier: 3,
    meatItemId: 'meat_chicken',
    meatNameEs: 'Carne de Pollo Cruda',
    produceItemId: 'produce_egg_chicken',
    produceNameEs: 'Huevos de Gallina',
    dailyProduceAmount: 12,
    favoriteFoodNameEs: 'Trigo (T4)',
    bonusCityId: 'fort_sterling',
    baseMeatYield: 20,
  },
  {
    id: 'animal_goat',
    nameEs: 'Cabra Adulta',
    nameEn: 'T4 Goat',
    tier: 4,
    meatItemId: 'meat_goat',
    meatNameEs: 'Carne de Cabra Cruda',
    produceItemId: 'produce_milk_goat',
    produceNameEs: 'Leche de Cabra',
    dailyProduceAmount: 12,
    favoriteFoodNameEs: 'Nabos (T5)',
    bonusCityId: 'bridgewatch',
    baseMeatYield: 20,
  },
  {
    id: 'animal_goose',
    nameEs: 'Ganso Adulto',
    nameEn: 'T5 Goose',
    tier: 5,
    meatItemId: 'meat_goose',
    meatNameEs: 'Carne de Ganso Cruda',
    produceItemId: 'produce_egg_goose',
    produceNameEs: 'Huevos de Ganso',
    dailyProduceAmount: 12,
    favoriteFoodNameEs: 'Coles (T6)',
    bonusCityId: 'lymhurst',
    baseMeatYield: 20,
  },
  {
    id: 'animal_sheep',
    nameEs: 'Oveja Adulta',
    nameEn: 'T6 Sheep',
    tier: 6,
    meatItemId: 'meat_mutton',
    meatNameEs: 'Carne de Cordero Cruda',
    produceItemId: 'produce_milk_sheep',
    produceNameEs: 'Leche de Oveja',
    dailyProduceAmount: 12,
    favoriteFoodNameEs: 'Patatas (T7)',
    bonusCityId: 'fort_sterling',
    baseMeatYield: 20,
  },
  {
    id: 'animal_pig',
    nameEs: 'Cerdo Adulto',
    nameEn: 'T7 Pig',
    tier: 7,
    meatItemId: 'meat_pork',
    meatNameEs: 'Carne de Cerdo Cruda',
    produceItemId: undefined,
    produceNameEs: undefined,
    dailyProduceAmount: 0, // No produce leche/huevos
    favoriteFoodNameEs: 'Maíz (T8)',
    bonusCityId: 'thetford',
    baseMeatYield: 20,
  },
  {
    id: 'animal_cow',
    nameEs: 'Vaca / Ganado Adulto',
    nameEn: 'T8 Cow',
    tier: 8,
    meatItemId: 'meat_beef',
    meatNameEs: 'Carne de Res Cruda',
    produceItemId: 'produce_milk_cow',
    produceNameEs: 'Leche de Vaca',
    dailyProduceAmount: 12,
    favoriteFoodNameEs: 'Calabazas (T8)',
    bonusCityId: 'martlock',
    baseMeatYield: 20,
  },
];

export interface ButcherCalculationInput {
  animalId: ButcherAnimalId;
  animalsCount: number;
  slaughterLocation: 'city' | 'island';
  cityId: CityId;
  useFocus: boolean;
  hasPremium: boolean;
  stationTaxPer100Nutrition: number;
  // Precios manuales del usuario
  liveAnimalMarketPrice: number;
  rawMeatMarketPrice: number;
  dairyProduceMarketPrice: number;
}

export interface ButcherCalculationResult {
  animal: ButcherAnimalMetadata;
  animalsCount: number;
  slaughterLocation: 'city' | 'island';
  cityId: CityId;
  hasCityBonus: boolean;
  rrrPercent: number;

  // Faenado de Carne
  baseMeatTotal: number;
  bonusMeatFromRrr: number;
  totalMeatYield: number;
  grossMeatRevenue: number;
  marketTaxRate: number; // 4% o 8%
  marketSetupFeeRate: number; // 2.5%
  marketTaxesAmount: number;
  stationNutritionSilverFee: number;
  netMeatRevenue: number;

  // Alternativa A: Vender el animal vivo en subasta
  liveAnimalGrossRevenue: number;
  liveAnimalNetRevenue: number;

  // Alternativa B: Mantener vivo produciendo leche/huevos (ciclo 22h)
  dairyProduceUnitsPerCycle: number;
  dairyProduceGrossRevenue: number;
  dairyProduceNetRevenue: number;

  // Balance Comparativo y Veredicto Estratégico
  meatProfitVsLiveSale: number;
  meatProfitVsDailyProduce: number;
  recommendedAction: 'SLAUGHTER_IN_CITY' | 'KEEP_FOR_PRODUCE' | 'SELL_ALIVE_ON_MARKET';
  verdictMessage: string;
}
