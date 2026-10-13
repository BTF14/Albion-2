/**
 * Caso de Uso Puro: Calculadora de Fama & Tomos de la Perspicacia para la Tabla del Destino
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

import { DestinyFameInput, DestinyFameResult, DestinyMasteryCategory } from '../models/destinyFame';

const CATEGORY_TOTAL_FAME_AT_100: Record<DestinyMasteryCategory, number> = {
  farming: 2500000,
  refining: 5200000,
  crafting: 5200000,
  combat: 16971000,
};

/**
 * Calcula la fama acumulada requerida para alcanzar el nivel L (1 a 100).
 * La curva de progresión en Albion Online es exponencial (exponente ~2.3).
 */
export function getCumulativeFameAtLevel(category: DestinyMasteryCategory, level: number): number {
  const boundedLevel = Math.max(1, Math.min(100, level));
  if (boundedLevel === 1) return 0;

  const totalAt100 = CATEGORY_TOTAL_FAME_AT_100[category] || 5200000;
  // Curva normalizada: (level / 100) ^ 2.3 * total
  const factor = Math.pow((boundedLevel - 1) / 99, 2.3);
  return Math.round(factor * totalAt100);
}

export function calculateDestinyFameTomes(input: DestinyFameInput): DestinyFameResult {
  const current = Math.max(1, Math.min(100, Math.round(input.currentLevel)));
  const target = Math.max(1, Math.min(100, Math.round(input.targetLevel)));
  const tomePrice = Math.max(0, Number.isFinite(input.tomeMarketPrice) ? input.tomeMarketPrice : 24000);

  if (target <= current) {
    return {
      currentLevel: current,
      targetLevel: target,
      fameRequiredTotal: 0,
      tomesRequired: 0,
      totalSilverCost: 0,
      focusEfficiencyGainedFCE: 0,
      advice: 'El nivel objetivo debe ser superior al nivel actual.',
    };
  }

  const fameAtCurrent = getCumulativeFameAtLevel(input.category, current);
  const fameAtTarget = getCumulativeFameAtLevel(input.category, target);
  const fameRequiredTotal = Math.max(0, fameAtTarget - fameAtCurrent);

  // Cada Tomo de Perspicacia otorga 10,000 puntos de fama
  const tomesRequired = Math.ceil(fameRequiredTotal / 10000);
  const totalSilverCost = tomesRequired * tomePrice;

  // En Albion cada nivel de especialización otorga +2 FCE específicos y +0.2 FCE generales
  const levelsDiff = target - current;
  const focusEfficiencyGainedFCE = levelsDiff * 2;

  const advice = `Para subir de nivel ${current} a ${target} en ${input.category}, necesitas ${fameRequiredTotal.toLocaleString()} de fama (~${tomesRequired.toLocaleString()} tomos de 10k), ganando +${focusEfficiencyGainedFCE} FCE.`;

  return {
    currentLevel: current,
    targetLevel: target,
    fameRequiredTotal,
    tomesRequired,
    totalSilverCost,
    focusEfficiencyGainedFCE,
    advice,
  };
}
