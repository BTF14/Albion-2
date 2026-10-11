/**
 * Modelos de Dominio: Portafolio de Foco Multi-Personaje en Albion Online
 * Arquitectura Gentleman Programming (Clean Architecture)
 */

import { CharacterProfile } from './character';

export interface AltFocusItemSummary {
  character: CharacterProfile;
  currentFocus: number;
  maxFocus: number; // 30,000
  focusPercentage: number;
  hoursUntilFull: number;
  isNearingCap: boolean; // >= 28,000
  isAtCap: boolean; // == 30,000
  dailyRegenRate: number; // 10,000 con premium / 0 sin premium
  hourlyRegenRate: number; // ~416.6
  primarySpecialization: string;
  recommendedActivity: string;
  recommendedCity: string;
  estimatedDailySilverYield: number; // plata estimada con el gasto de 10k foco
}

export interface FocusPortfolioReport {
  timestamp: number;
  totalAltsCount: number;
  totalAvailableFocus: number;
  totalCapacityFocus: number; // altsCount * 30,000
  totalDailyFocusRegen: number; // altsCount * 10,000 con premium
  totalEstimatedDailySilverYield: number; // suma de ganancias de todos los personajes
  altsAtRiskOfCap: number; // cuántos alts están >= 28,000
  altSummaries: AltFocusItemSummary[];
  strategicEmpireVerdict: string;
}
