import { HarvestCalculationInput, HarvestFinancialSummary } from '../models/economy';

/**
 * Caso de Uso Puro (Clean Architecture):
 * Evalúa las finanzas de una cosecha, recolección de hierbas o producción ganadera
 * asegurando validación defensiva (anti-NaN) y cálculos exactos de tasas de mercado de Albion Online.
 */
export function calculateHarvestEconomy(input: HarvestCalculationInput): HarvestFinancialSummary {
  const safePlots = Math.max(1, Number.isFinite(input.plotsCount) ? input.plotsCount : 1);
  const safeSlots = Math.max(1, Number.isFinite(input.slotsCount) ? input.slotsCount : safePlots * 9);
  const safeRebought = Math.max(0, Number.isFinite(input.reboughtSeeds) ? input.reboughtSeeds : 0);
  const safeSeedPrice = Math.max(0, Number.isFinite(input.seedUnitPrice) ? input.seedUnitPrice : 0);
  const safeHarvested = Math.max(0, Number.isFinite(input.harvestedAmount) ? input.harvestedAmount : 0);
  const safeProductPrice = Math.max(0, Number.isFinite(input.productUnitPrice) ? input.productUnitPrice : 0);
  const safeFoodUnits = Math.max(0, Number.isFinite(input.foodUnits) ? input.foodUnits : 0);
  const safeFoodPrice = Math.max(0, Number.isFinite(input.foodUnitPrice) ? input.foodUnitPrice : 0);
  const safeButcherFee = Math.max(0, Number.isFinite(input.butcherFee) ? input.butcherFee : 0);
  const safeTax = Math.max(0, Number.isFinite(input.taxPercent) ? input.taxPercent : 0);
  const safeSurplus = Math.max(0, Number.isFinite(input.surplusSeeds) ? input.surplusSeeds : 0);
  const safeFocusSpent = Math.max(0, Number.isFinite(input.focusPointsSpent) ? input.focusPointsSpent : 0);

  // 1. Costes
  const seedsCost = Math.round(safeRebought * safeSeedPrice);
  const foodCost = input.requiresFood && !input.usesOwnCropForFood ? Math.round(safeFoodUnits * safeFoodPrice) : 0;
  const totalExtraFees = input.category === 'animal_meat' ? Math.round(safeButcherFee) : 0;
  const totalCosts = seedsCost + foodCost + totalExtraFees;

  // 2. Ingresos por producto cosechado
  const productGross = Math.round(safeHarvested * safeProductPrice);
  const productTax = Math.round(productGross * (safeTax / 100));
  const productNet = productGross - productTax;

  // 3. Ingresos por venta de semillas de excedente (si aplica)
  const surplusGross = safeSurplus > 0 && input.monetizeSurplus ? Math.round(safeSurplus * safeSeedPrice) : 0;
  const surplusTax = Math.round(surplusGross * (safeTax / 100));
  const surplusNet = surplusGross - surplusTax;

  // 4. Totales brutos y netos
  const grossRevenue = productGross + surplusGross;
  const marketTaxAmount = productTax + surplusTax;
  const netRevenue = productNet + surplusNet;
  const netProfit = netRevenue - totalCosts;

  // 5. Métricas de rentabilidad
  const roiPercent = totalCosts > 0 ? Math.round((netProfit / totalCosts) * 100) : netProfit > 0 ? 100 : 0;
  const profitPerPlot = Math.round(netProfit / safePlots);
  const profitPerSlot = Math.round(netProfit / safeSlots);

  // 6. Plata por foco gastado
  const silverPerFocus =
    input.usedFocus && safeFocusSpent > 0 && netProfit > 0
      ? Number((netProfit / safeFocusSpent).toFixed(2))
      : 0;

  return {
    seedsCost,
    foodCost,
    totalExtraFees,
    totalCosts,
    productGross,
    productTax,
    productNet,
    surplusGross,
    surplusTax,
    surplusNet,
    grossRevenue,
    marketTaxAmount,
    netRevenue,
    netProfit,
    roiPercent,
    profitPerPlot,
    profitPerSlot,
    silverPerFocus,
    isProfitable: netProfit > 0,
  };
}
