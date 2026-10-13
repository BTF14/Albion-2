/**
 * Caso de Uso Puro: Optimizador de Alimentación al Menor Coste (Least-Cost Feed Advisor)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * En Albion Online:
 * - Animales herbívoros (caballos, bueyes, vacas, cerdos, etc.) comen 10 unidades de cualquier verdura/grano al día.
 * - Animales carnívoros (garrasprestas, lobos, etc.) comen 10 unidades de cualquier carne cruda al día.
 * 
 * Esta función evalúa los precios y determina la opción más económica y el porcentaje de ahorro.
 */

import {
  FeedDietType,
  FeedAdvisorResult,
  FeedOptionAnalysis,
  OFFICIAL_HERBIVORE_CROPS,
  OFFICIAL_CARNIVORE_MEATS,
  FeedFoodItemDef,
} from '../models/feedAdvisor';
import { PriceMemory } from '../../types';

export function calculateLeastCostFeed(
  dietType: FeedDietType,
  priceMemory?: PriceMemory,
  customPriceOverrides?: Record<string, number>
): FeedAdvisorResult {
  const catalog: FeedFoodItemDef[] =
    dietType === 'herbivore' ? OFFICIAL_HERBIVORE_CROPS : OFFICIAL_CARNIVORE_MEATS;

  // 1. Mapear y evaluar precios de cada alimento
  const optionsWithPrice = catalog.map((item) => {
    let price = item.defaultPrice;

    if (customPriceOverrides && Number.isFinite(customPriceOverrides[item.itemId])) {
      const p = customPriceOverrides[item.itemId];
      if (p > 0) price = p;
    } else if (priceMemory && priceMemory[item.itemId]?.lastProductPrice) {
      const p = priceMemory[item.itemId].lastProductPrice!;
      if (p > 0) price = p;
    }

    const safeUnitPrice = Math.max(1, Math.round(price));
    const costPer10Units = safeUnitPrice * 10;

    return {
      itemId: item.itemId,
      nameEs: item.nameEs,
      tier: item.tier,
      dietType: item.dietType,
      unitPrice: safeUnitPrice,
      costPer10Units,
    };
  });

  // Ordenar de más barato a más caro
  const sorted = [...optionsWithPrice].sort((a, b) => a.costPer10Units - b.costPer10Units);

  const cheapest = sorted[0] || null;
  const mostExpensive = sorted[sorted.length - 1] || null;

  const maxExpense = mostExpensive ? mostExpensive.costPer10Units : 1;
  const minExpense = cheapest ? cheapest.costPer10Units : 1;

  const maxSavingsPercent = maxExpense > minExpense
    ? Number((((maxExpense - minExpense) / maxExpense) * 100).toFixed(1))
    : 0;

  const options: FeedOptionAnalysis[] = sorted.map((opt) => {
    const isCheapest = cheapest ? opt.itemId === cheapest.itemId : false;
    const savings = maxExpense > opt.costPer10Units
      ? Number((((maxExpense - opt.costPer10Units) / maxExpense) * 100).toFixed(1))
      : 0;

    return {
      ...opt,
      isCheapest,
      savingsVsMostExpensivePercent: savings,
    };
  });

  let advice = '';
  if (cheapest) {
    advice = `Alimentar hoy con ${cheapest.nameEs} cuesta ${cheapest.costPer10Units.toLocaleString()} 🪙 por animal (10 u.), ahorrando hasta un ${maxSavingsPercent}% frente a ${mostExpensive?.nameEs}.`;
  }

  return {
    dietType,
    options,
    cheapestOption: options[0] || null,
    mostExpensiveOption: options[options.length - 1] || null,
    maxSavingsPercent,
    dailyFeedAdvice: advice,
  };
}
