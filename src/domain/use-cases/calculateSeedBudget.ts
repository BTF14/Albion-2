/**
 * Caso de Uso Puro: Calculadora de Presupuesto de Siembra Masiva & Capital de Trabajo
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Determina cuánta plata líquida debe llevar el jugador al mercado para comprar semillas o crías,
 * deduciendo existencias en cofre y proyectando el retorno de la ronda completa.
 */

import { SeedBudgetInput, SeedBudgetResult } from '../models/goals';

export function calculateSeedBudget(input: SeedBudgetInput): SeedBudgetResult {
  const plots = Math.max(0, Math.floor(Number(input.plotsCount) || 0));
  const slotsPerPlot = Math.max(1, Math.floor(Number(input.slotsPerPlot) || 9));
  const totalSlots = plots * slotsPerPlot;

  const currentStock = Math.max(0, Math.floor(Number(input.currentSeedsInStock) || 0));
  const seedPrice = Math.max(0, Number(input.seedUnitPriceManual) || 0);
  const productPrice = Math.max(0, Number(input.expectedProductPriceManual) || 0);
  const taxRate = input.hasPremium ? 0.065 : 0.105;

  const seedsNeeded = totalSlots;
  const seedsToBuy = Math.max(0, seedsNeeded - currentStock);
  const totalSeedCost = seedsToBuy * seedPrice;

  // Rendimiento medio oficial de Albion con Premium (~9 unidades por casilla)
  const estimatedHarvestUnits = totalSlots * 9;
  const estimatedGrossRevenue = estimatedHarvestUnits * productPrice;
  const estimatedNetRevenue = Math.round(estimatedGrossRevenue * (1 - taxRate));
  const estimatedNetProfit = estimatedNetRevenue - totalSeedCost;

  const roiPercent = totalSeedCost > 0
    ? Number(((estimatedNetProfit / totalSeedCost) * 100).toFixed(1))
    : 0;

  return {
    itemId: input.itemId,
    tier: input.tier,
    totalSlots,
    seedsNeeded,
    currentSeedsInStock: currentStock,
    seedsToBuy,
    totalSeedCost,
    estimatedHarvestUnits,
    estimatedGrossRevenue,
    estimatedNetRevenue,
    estimatedNetProfit,
    roiPercent,
  };
}
