/**
 * Caso de Uso Puro: Cálculo y Optimización Económica de Carnicería (Slaughter & Meat Yield)
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inviolable: Función 100% pura y testeable, sin React ni DOM.
 */

import {
  ButcherCalculationInput,
  ButcherCalculationResult,
  BUTCHER_ANIMALS,
} from '../models/butcher';

export function calculateButcherEconomy(
  input: ButcherCalculationInput
): ButcherCalculationResult {
  const animal = BUTCHER_ANIMALS.find((a) => a.id === input.animalId) || BUTCHER_ANIMALS[0];
  const safeCount = Math.max(1, Math.floor(Number(input.animalsCount) || 1));
  const { slaughterLocation, cityId, useFocus, hasPremium } = input;

  const rawMeatPrice = Math.max(0, Math.floor(Number(input.rawMeatMarketPrice) || 0));
  const liveAnimalPrice = Math.max(0, Math.floor(Number(input.liveAnimalMarketPrice) || 0));
  const dairyProducePrice = Math.max(0, Math.floor(Number(input.dairyProduceMarketPrice) || 0));
  const stationTax = Math.max(0, Math.floor(Number(input.stationTaxPer100Nutrition) || 350));

  // 1. Determinar RRR (Resource Return Rate) oficial según ciudad y foco
  const hasCityBonus = (cityId === animal.bonusCityId) || (cityId === 'caerleon');
  let rrrPercent = 0;

  if (slaughterLocation === 'island') {
    rrrPercent = useFocus ? 37.1 : 0;
  } else {
    if (hasCityBonus) {
      rrrPercent = useFocus ? 47.9 : 24.8;
    } else {
      rrrPercent = useFocus ? 43.5 : 15.2;
    }
  }

  // 2. Rendimiento de Carne
  const baseMeatTotal = safeCount * animal.baseMeatYield;
  const bonusMeatFromRrr = Math.round(baseMeatTotal * (rrrPercent / 100));
  const totalMeatYield = baseMeatTotal + bonusMeatFromRrr;

  // 3. Impuestos de mercado (4% con Premium / 8% sin Premium + 2.5% de setup de orden)
  const marketTaxRate = hasPremium ? 0.04 : 0.08;
  const marketSetupFeeRate = 0.025;
  const totalFeeRate = marketTaxRate + marketSetupFeeRate;

  // 4. Tasas de la estación de carnicería (en ciudad)
  // Cada animal de tier T consume aproximadamente 2.2 * Tier unidades de nutrición
  const nutritionPerAnimal = animal.tier * 2.2;
  const totalNutritionConsumed = slaughterLocation === 'city' ? safeCount * nutritionPerAnimal : 0;
  const stationNutritionSilverFee = Math.round((stationTax / 100) * totalNutritionConsumed);

  // 5. Finanzas de la Carne Faenada
  const grossMeatRevenue = totalMeatYield * rawMeatPrice;
  const marketTaxesAmount = Math.round(grossMeatRevenue * totalFeeRate);
  const netMeatRevenue = grossMeatRevenue - marketTaxesAmount - stationNutritionSilverFee;

  // 6. Alternativa A: Vender el animal vivo en la subasta
  const liveAnimalGrossRevenue = safeCount * liveAnimalPrice;
  const liveAnimalNetRevenue = Math.round(liveAnimalGrossRevenue * (1 - totalFeeRate));

  // 7. Alternativa B: Mantener vivo produciendo leche/huevos (1 ciclo de 22h)
  const dairyProduceUnitsPerCycle = safeCount * animal.dailyProduceAmount;
  const dairyProduceGrossRevenue = dairyProduceUnitsPerCycle * dairyProducePrice;
  const dairyProduceNetRevenue = Math.round(dairyProduceGrossRevenue * (1 - totalFeeRate));

  // 8. Comparación y Veredicto Estratégico
  const meatProfitVsLiveSale = netMeatRevenue - liveAnimalNetRevenue;
  const meatProfitVsDailyProduce = netMeatRevenue - dairyProduceNetRevenue;

  let recommendedAction: 'SLAUGHTER_IN_CITY' | 'KEEP_FOR_PRODUCE' | 'SELL_ALIVE_ON_MARKET' = 'SLAUGHTER_IN_CITY';
  let verdictMessage = '';

  if (liveAnimalPrice > 0 && liveAnimalNetRevenue > netMeatRevenue) {
    recommendedAction = 'SELL_ALIVE_ON_MARKET';
    verdictMessage = `Vender Vivo Recomendado: El animal adulto cotiza alto en subasta (${liveAnimalPrice.toLocaleString()} 🪙). Venderlo vivo rinde +${(liveAnimalNetRevenue - netMeatRevenue).toLocaleString()} 🪙 netos más que faenarlo.`;
  } else if (animal.produceItemId && dairyProducePrice > 0 && dairyProduceNetRevenue > (netMeatRevenue / 3)) {
    // Si la leche/huevos de 3 días igualan o superan la venta única de la carne
    recommendedAction = 'KEEP_FOR_PRODUCE';
    verdictMessage = `Mantener Vivo Recomendado: Extraer ${animal.produceNameEs} te genera ${dairyProduceNetRevenue.toLocaleString()} 🪙 netos cada 22h de forma renovable. Faenarlo solo te daría ${netMeatRevenue.toLocaleString()} 🪙 una única vez.`;
  } else {
    recommendedAction = 'SLAUGHTER_IN_CITY';
    const bonusText = hasCityBonus ? ` con bono oficial en ${cityId.toUpperCase()} (${rrrPercent}% RRR)` : '';
    verdictMessage = `¡Sacrificar en Carnicería! Faenar rinde ${netMeatRevenue.toLocaleString()} 🪙 netos${bonusText} (${totalMeatYield.toLocaleString()} u. de carne). Supera las demás opciones.`;
  }

  return {
    animal,
    animalsCount: safeCount,
    slaughterLocation,
    cityId,
    hasCityBonus,
    rrrPercent,

    baseMeatTotal,
    bonusMeatFromRrr,
    totalMeatYield,
    grossMeatRevenue,
    marketTaxRate,
    marketSetupFeeRate,
    marketTaxesAmount,
    stationNutritionSilverFee,
    netMeatRevenue,

    liveAnimalGrossRevenue,
    liveAnimalNetRevenue,

    dairyProduceUnitsPerCycle,
    dairyProduceGrossRevenue,
    dairyProduceNetRevenue,

    meatProfitVsLiveSale,
    meatProfitVsDailyProduce,
    recommendedAction,
    verdictMessage,
  };
}
