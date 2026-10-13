/**
 * Caso de Uso Puro: Calculadora de Sets, Re-Gear & Presupuesto de Bajas
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

import { LoadoutProfile, RegearBudgetAnalysis, LoadoutItem } from '../models/loadouts';

export function calculateLoadoutRegear(loadout: LoadoutProfile): RegearBudgetAnalysis {
  let costPerDeath = 0;
  let mostExpensive: LoadoutItem | null = null;
  let itemsCount = 0;

  const items = Object.values(loadout.items).filter((i): i is LoadoutItem => i !== null);

  for (const item of items) {
    const qty = Math.max(1, Number.isFinite(item.quantity) ? item.quantity : 1);
    const unitPrice = Math.max(0, Number.isFinite(item.unitPrice) ? item.unitPrice : 0);
    const itemTotal = unitPrice * qty;

    costPerDeath += itemTotal;
    itemsCount += 1;

    if (!mostExpensive || itemTotal > (mostExpensive.unitPrice * mostExpensive.quantity)) {
      mostExpensive = item;
    }
  }

  const budget3Deaths = costPerDeath * 3;
  const budget5Deaths = costPerDeath * 5;
  const budget10Deaths = costPerDeath * 10;

  return {
    loadout: {
      ...loadout,
      totalCost: costPerDeath,
    },
    costPerDeath,
    budget3Deaths,
    budget5Deaths,
    budget10Deaths,
    mostExpensiveItem: mostExpensive,
    itemsCount,
  };
}
