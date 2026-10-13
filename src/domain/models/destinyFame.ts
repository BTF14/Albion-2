/**
 * Modelos de Dominio: Calculadora de Fama & Tomos de la Perspicacia para la Tabla del Destino
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

export type DestinyMasteryCategory =
  | 'farming'
  | 'refining'
  | 'crafting'
  | 'combat';

export interface DestinyFameInput {
  category: DestinyMasteryCategory;
  currentLevel: number; // 1..100
  targetLevel: number; // 1..100
  tomeMarketPrice: number; // Precio manual en plata del Tomo de Perspicacia
}

export interface DestinyFameResult {
  currentLevel: number;
  targetLevel: number;
  fameRequiredTotal: number;
  tomesRequired: number; // Cada Tomo de Perspicacia otorga 10,000 de fama
  totalSilverCost: number;
  focusEfficiencyGainedFCE: number; // Puntos de FCE adicionales obtenidos
  advice: string;
}
