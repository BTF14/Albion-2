import { CraftCalculationInput, CraftFinancialSummary } from '../models/crafting';

/**
 * Caso de Uso Puro (Clean Architecture):
 * Calcula la rentabilidad y tasa de retorno de recursos (RRR) oficial para recetas
 * de Cocina y Alquimia en Albion Online con soporte para estaciones y bonificaciones de ciudad.
 */
export function calculateCraftingEconomy(input: CraftCalculationInput): CraftFinancialSummary {
  const safeBatches = Math.max(1, Number.isFinite(input.batchCount) ? input.batchCount : 1);
  const safeOutput = Math.max(1, Number.isFinite(input.outputAmount) ? input.outputAmount : 10);
  const safeSellPrice = Math.max(0, Number.isFinite(input.productSellPrice) ? input.productSellPrice : 0);
  const safeNutrition = Math.max(0, Number.isFinite(input.nutritionCost) ? input.nutritionCost : 0);
  const safeStationFee = Math.max(0, Number.isFinite(input.stationUsageFeePer100) ? input.stationUsageFeePer100 : 0);

  // 1. Determinar Tasa de Retorno de Recursos (RRR) oficial
  let returnRatePercent = 0;
  if (input.stationLocation === 'caerleon_city' || input.stationLocation === 'bonus_city') {
    returnRatePercent = input.useFocus ? 47.9 : 24.8;
  } else if (input.stationLocation === 'non_bonus_city') {
    returnRatePercent = input.useFocus ? 43.5 : 15.2;
  } else if (input.stationLocation === 'bonus_island') {
    returnRatePercent = input.useFocus ? 39.9 : 13.0;
  } else {
    // regular_island
    returnRatePercent = input.useFocus ? 37.1 : 0.0;
  }

  // Si hay un bono diario oficial de producción activo (ej. +10% o +20%), se suma a la tasa RRR
  const dailyBonus = Math.max(0, Number.isFinite(input.dailyProductionBonusRRR) ? (input.dailyProductionBonusRRR ?? 0) : 0);
  if (dailyBonus > 0) {
    returnRatePercent = Math.min(58.0, Number((returnRatePercent + dailyBonus).toFixed(1)));
  }

  // 2. Costo bruto de materias primas por todos los lotes
  let rawMaterialCostGross = 0;
  input.ingredients.forEach((ing) => {
    const safeAmount = Math.max(0, Number.isFinite(ing.amount) ? ing.amount : 0);
    const safePrice = Math.max(0, Number.isFinite(ing.unitPrice) ? ing.unitPrice : 0);
    rawMaterialCostGross += safeAmount * safePrice * safeBatches;
  });
  rawMaterialCostGross = Math.round(rawMaterialCostGross);

  // 3. Valor de materiales recuperados por la tasa de retorno (RRR)
  const returnedMaterialValue = Math.round(rawMaterialCostGross * (returnRatePercent / 100));
  const rawMaterialCostEffective = Math.max(0, rawMaterialCostGross - returnedMaterialValue);

  // 4. Tasa de nutrición de la estación del puesto
  const nutritionFeeTotal = Math.round((safeNutrition / 100) * safeStationFee * safeBatches);

  // 5. Costo total de producción
  const totalProductionCost = rawMaterialCostEffective + nutritionFeeTotal;

  // 6. Ingresos brutos y netos
  const totalUnitsProduced = safeOutput * safeBatches;
  const grossRevenue = Math.round(totalUnitsProduced * safeSellPrice);
  const marketTaxRate = input.hasPremium ? 0.065 : 0.105;
  const marketTaxAmount = Math.round(grossRevenue * marketTaxRate);
  const netRevenue = grossRevenue - marketTaxAmount;

  // 7. Ganancia neta y ROI
  const netProfit = netRevenue - totalProductionCost;
  const profitPerUnit = totalUnitsProduced > 0 ? Math.round(netProfit / totalUnitsProduced) : 0;
  const profitPerBatch = Math.round(netProfit / safeBatches);
  const roiPercent =
    totalProductionCost > 0 ? Math.round((netProfit / totalProductionCost) * 100) : netProfit > 0 ? 100 : 0;

  return {
    rawMaterialCostGross,
    returnRatePercent,
    returnedMaterialValue,
    rawMaterialCostEffective,
    nutritionFeeTotal,
    totalProductionCost,
    totalUnitsProduced,
    grossRevenue,
    marketTaxAmount,
    netRevenue,
    netProfit,
    profitPerUnit,
    profitPerBatch,
    roiPercent,
    isProfitable: netProfit > 0,
  };
}
