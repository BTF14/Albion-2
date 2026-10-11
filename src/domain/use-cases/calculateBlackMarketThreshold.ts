import {
  BlackMarketSimulationInput,
  BlackMarketSimulationResult,
} from '../models/blackMarket';
import { CITY_CRAFTING_BONUSES } from '../../data/equipmentRecipes';

const TIER_SCALE_MULTIPLIER: Record<number, number> = {
  4: 1.0,
  5: 2.0,
  6: 4.0,
  7: 8.0,
  8: 16.0,
};

const ENCHANTMENT_MULTIPLIER: Record<number, number> = {
  0: 1.0,
  1: 1.6,
  2: 2.5,
  3: 4.0,
  4: 7.0,
};

/**
 * Caso de Uso Puro (Gentleman Programming & Albion Mechanics):
 * Calcula el umbral de coste y beneficio para órdenes del Mercado Negro de Caerleon.
 * 
 * Regla Inviolable de Albion:
 * - Si se vende a una orden de compra directa ('instant_buy_order') del Mercado Negro,
 *   el pago es instantáneo y NO aplica tasa de mercado (0% tax) ni tasa de orden (0% setup).
 * - Si el jugador coloca una orden de venta ('custom_sell_order'), se aplica 4% (o 8%) + 2.5%.
 */
export function calculateBlackMarketThreshold(
  input: BlackMarketSimulationInput
): BlackMarketSimulationResult {
  const { recipe, craftingCity, materialUnitCosts } = input;
  
  // Sanitización defensiva de entradas numéricas
  const safeBatchCount = Math.max(1, Math.floor(Number(input.batchQuantity) || 1));
  const safeTier = Math.max(4, Math.min(8, Math.floor(Number(input.tier) || recipe.tier || 5)));
  const safeEnchantment = Math.max(0, Math.min(4, Math.floor(Number(input.enchantment) || 0)));
  const currentPrice = Math.max(0, Math.floor(Number(input.currentBlackMarketPrice) || 0));
  const targetRoi = Math.max(0, Number(input.targetRoiPercentage) || 0);
  const stationFee = Math.max(0, Math.min(2000, Number(input.stationFeePer100Nutrition) || 0));
  const emptyJournalPrice = Math.max(0, Number(input.emptyJournalPrice) || 0);
  const fullJournalValue = Math.max(0, Number(input.fullJournalValue) || 0);
  const craftingBonusPercent = Math.max(0, Number(input.craftingBonusPercent) || 0);

  const tierScale = TIER_SCALE_MULTIPLIER[safeTier] || 2.0;
  const enchantScale = ENCHANTMENT_MULTIPLIER[safeEnchantment] || 1.0;

  // 1. Detección de bonificación de crafteo de ciudad
  const cityBonusData = CITY_CRAFTING_BONUSES[craftingCity];
  const hasCityBonus = cityBonusData
    ? cityBonusData.specializedItems.some((spec) =>
        recipe.nameEs.toLowerCase().includes(spec.toLowerCase())
      )
    : false;

  // RRR oficial de Albion Online
  let baseRRR = hasCityBonus
    ? (input.useFocus ? 47.9 : 24.8)
    : (input.useFocus ? 43.5 : 15.2);

  if (craftingBonusPercent > 0) {
    baseRRR = Math.min(58.0, baseRRR + craftingBonusPercent);
  }

  const rrrEffectivePercentage = Number(baseRRR.toFixed(1));
  const returnRateRatio = rrrEffectivePercentage / 100;

  // 2. Coste Bruto de Materiales por Unidad
  let grossMaterialCostPerUnit = 0;
  for (const mat of recipe.materials) {
    const unitPrice = Math.max(0, Number(materialUnitCosts[mat.materialId]) || 0);
    grossMaterialCostPerUnit += mat.amount * unitPrice;
  }
  // Escalar por encantamiento si el material base cambia de valor
  grossMaterialCostPerUnit = Math.round(grossMaterialCostPerUnit * enchantScale);

  // 3. Valor devuelto por RRR
  const returnedMaterialValuePerUnit = Math.round(grossMaterialCostPerUnit * returnRateRatio);

  // 4. Tasa de Nutrición del Taller
  const nutritionUsed = (recipe.itemValue || 100) * (tierScale / 2.0) * enchantScale * 0.1125;
  const stationNutritionFeePerUnit = Math.round((nutritionUsed / 100) * stationFee);

  // 5. Beneficio Neto por Llenado de Diarios de Trabajador
  const baseFamePerItem = (recipe.craftFame || 300) * (tierScale / 2.0) * enchantScale;
  const fameRequiredPerJournal = Math.max(
    1,
    recipe.journalFameThreshold[safeTier] ||
    (safeTier === 4 ? 1800 : safeTier === 5 ? 3600 : safeTier === 6 ? 7200 : safeTier === 7 ? 14400 : 28800)
  );

  const fameRatioPerItem = baseFamePerItem / fameRequiredPerJournal;
  let journalNetBenefitPerUnit = 0;
  if (emptyJournalPrice > 0 && fullJournalValue > emptyJournalPrice) {
    const netPerJournal = fullJournalValue - emptyJournalPrice;
    journalNetBenefitPerUnit = Math.round(fameRatioPerItem * netPerJournal);
  }

  // 6. Coste Neto de Crafteo por Unidad
  const netCraftingCostPerUnit = Math.max(
    0,
    grossMaterialCostPerUnit - returnedMaterialValuePerUnit + stationNutritionFeePerUnit - journalNetBenefitPerUnit
  );
  const totalBatchCraftingCost = netCraftingCostPerUnit * safeBatchCount;

  // 7. Cálculo de Impuestos según tipo de orden en el Mercado Negro
  // Las órdenes de compra directa de Caerleon pagan en el acto y NO cobran tasa de subasta ni tasa de orden.
  const isDirectBuyOrder = input.orderType === 'instant_buy_order';
  const marketTaxRate = isDirectBuyOrder ? 0 : (input.hasPremium ? 0.04 : 0.08);
  const setupFeeRate = isDirectBuyOrder ? 0 : 0.025;
  const totalFeeMultiplier = 1 - (marketTaxRate + setupFeeRate);

  // 8. Umbrales de Precio (Break-Even y Target ROI)
  // Precio Bruto * (1 - tasas) = Coste Neto
  // => Precio Bruto = Coste Neto / totalFeeMultiplier
  const breakEvenPrice = totalFeeMultiplier > 0
    ? Math.ceil(netCraftingCostPerUnit / totalFeeMultiplier)
    : netCraftingCostPerUnit;

  const targetNetNeeded = netCraftingCostPerUnit * (1 + targetRoi / 100);
  const targetRoiPrice = totalFeeMultiplier > 0
    ? Math.ceil(targetNetNeeded / totalFeeMultiplier)
    : Math.ceil(targetNetNeeded);

  const recommendedNetNeeded = netCraftingCostPerUnit * 1.15; // 15% de margen mínimo de seguridad
  const recommendedMinimumPrice = totalFeeMultiplier > 0
    ? Math.ceil(recommendedNetNeeded / totalFeeMultiplier)
    : Math.ceil(recommendedNetNeeded);

  // 9. Evaluación de la Oferta Actual del Mercado Negro
  const effectiveNetRevenuePerUnit = Math.round(currentPrice * totalFeeMultiplier);
  const marketTaxesPerUnit = currentPrice - effectiveNetRevenuePerUnit;
  const netProfitPerUnit = effectiveNetRevenuePerUnit - netCraftingCostPerUnit;
  const totalBatchNetProfit = netProfitPerUnit * safeBatchCount;
  const actualRoiPercentage = netCraftingCostPerUnit > 0
    ? Number(((netProfitPerUnit / netCraftingCostPerUnit) * 100).toFixed(1))
    : (netProfitPerUnit > 0 ? 100 : 0);

  const priceDeltaToTarget = currentPrice - targetRoiPrice;

  // 10. Veredicto Estratégico de Albion Online
  let verdict: 'IMMEDIATE_PROFIT' | 'WAIT_ORDER_TICK' | 'UNPROFITABLE_NOW' = 'UNPROFITABLE_NOW';
  let verdictMessage = '';

  if (currentPrice >= targetRoiPrice && actualRoiPercentage >= targetRoi) {
    verdict = 'IMMEDIATE_PROFIT';
    verdictMessage = `¡Excelente oportunidad! La orden paga ${currentPrice.toLocaleString()} plata (+${actualRoiPercentage.toFixed(1)}% ROI). Supera tu objetivo del ${targetRoi}%.`;
  } else if (currentPrice >= breakEvenPrice && currentPrice < targetRoiPrice) {
    verdict = 'WAIT_ORDER_TICK';
    verdictMessage = `Cubre costes pero no alcanza tu ROI deseado. El Mercado Negro incrementa su oferta con cada tick de subasta. Faltan ${Math.abs(priceDeltaToTarget).toLocaleString()} plata por unidad.`;
  } else {
    verdict = 'UNPROFITABLE_NOW';
    verdictMessage = `Precio actual insuficiente (${currentPrice.toLocaleString()} plata vs ${breakEvenPrice.toLocaleString()} plata de coste mínimo). No vendas a este precio; espera a que el Mercado Negro suba su orden de compra.`;
  }

  return {
    itemId: recipe.id,
    itemName: recipe.nameEs,
    tier: safeTier,
    enchantment: safeEnchantment,
    craftingCity,
    orderType: input.orderType,

    grossMaterialCostPerUnit,
    rrrEffectivePercentage,
    returnedMaterialValuePerUnit,
    stationNutritionFeePerUnit,
    journalNetBenefitPerUnit,
    netCraftingCostPerUnit,
    totalBatchCraftingCost,

    breakEvenPrice,
    targetRoiPrice,
    recommendedMinimumPrice,

    currentBlackMarketPrice: currentPrice,
    effectiveNetRevenuePerUnit,
    marketTaxesPerUnit,
    netProfitPerUnit,
    totalBatchNetProfit,
    actualRoiPercentage,

    verdict,
    verdictMessage,
    priceDeltaToTarget,
  };
}
