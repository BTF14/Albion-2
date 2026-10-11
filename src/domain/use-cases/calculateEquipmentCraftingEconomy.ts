import {
  CraftingBatchCalculationInput,
  CraftingBatchCalculationResult,
} from '../models/equipmentCrafting';

/**
 * Multiplicador de valor y requerimientos por tier de Albion Online
 */
const TIER_SCALE_MULTIPLIER: Record<number, number> = {
  4: 1.0,
  5: 2.0,
  6: 4.0,
  7: 8.0,
  8: 16.0,
};

/**
 * Multiplicador de valor y requerimientos por nivel de encantamiento (.0 a .4)
 */
const ENCHANTMENT_MULTIPLIER: Record<number, number> = {
  0: 1.0,
  1: 1.6,
  2: 2.5,
  3: 4.0,
  4: 7.0,
};

/**
 * Caso de Uso: Calcula la rentabilidad financiera integral de un lote de crafteo en Albion Online
 * (Costes de materiales, RRR, tasa de nutrición, fama, llenado de libros y doble vía de salida:
 *  vender libros llenos en mercado vs entregarlos a trabajadores de casas).
 * 
 * Sigue 100% los principios de Clean Architecture / Gentleman Programming (código puro sin React).
 */
export function calculateEquipmentCraftingEconomy(
  input: CraftingBatchCalculationInput
): CraftingBatchCalculationResult {
  const safeBatchCount = Math.max(1, Math.floor(Number(input.batchCount) || 1));
  const safeTier = Math.max(4, Math.min(8, Math.floor(Number(input.tier) || 5)));
  const safeEnchantment = Math.max(0, Math.min(4, Math.floor(Number(input.enchantment) || 0)));

  const tierScale = TIER_SCALE_MULTIPLIER[safeTier] || 2.0;
  const enchantScale = ENCHANTMENT_MULTIPLIER[safeEnchantment] || 1.0;

  // 1. Fama generada por pieza y total del lote
  const baseFamePerItem = (input.recipe.craftFame || 300) * (tierScale / 2.0) * enchantScale;
  const totalCraftFameEarned = Math.round(baseFamePerItem * safeBatchCount);

  // Fama requerida por diario del tier correspondiente
  const fameRequiredPerJournal =
    input.recipe.journalFameThreshold[safeTier] ||
    (safeTier === 4 ? 1800 : safeTier === 5 ? 3600 : safeTier === 6 ? 7200 : safeTier === 7 ? 14400 : 28800);

  const exactJournalsFilled = totalCraftFameEarned / fameRequiredPerJournal;
  const journalsFilledCount = Math.floor(exactJournalsFilled);
  const partialJournalProgressPercent = Math.round((exactJournalsFilled - journalsFilledCount) * 100);

  // 2. Tasa de Devolución de Recursos (RRR %):
  // Reglas oficiales de Albion:
  // - Base sin bonificación: 15.2% (sin foco) / 43.5% (con foco)
  // - Con bonificación de ciudad en el ítem: 24.8% (sin foco) / 47.9% (con foco)
  // - Bonos de eventos diarios de Albion (+10% o +20% RRR si están activos)
  let baseRRR = input.isCityCraftBonusActive
    ? (input.useFocus ? 47.9 : 24.8)
    : (input.useFocus ? 43.5 : 15.2);

  if (input.hasDailyEventBonus && input.dailyEventBonusPercent && input.dailyEventBonusPercent > 0) {
    baseRRR = Math.min(58.0, baseRRR + input.dailyEventBonusPercent);
  }

  const effectiveReturnRatePercent = Number(baseRRR.toFixed(1));
  const returnRateRatio = effectiveReturnRatePercent / 100;

  // 3. Costes brutos de materiales del lote
  let singleItemGrossMaterialCost = 0;
  input.recipe.materials.forEach((mat) => {
    const unitPrice = Math.max(0, Number(input.materialPrices[mat.materialId]) || 0);
    singleItemGrossMaterialCost += mat.amount * unitPrice;
  });

  const grossMaterialCost = Math.round(singleItemGrossMaterialCost * safeBatchCount);

  // Valor de materiales recuperados por RRR
  const returnedMaterialValue = Math.round(grossMaterialCost * returnRateRatio);
  const effectiveMaterialCost = Math.max(0, grossMaterialCost - returnedMaterialValue);

  // 4. Tasas de la tienda de la ciudad (User Fee en nutrición)
  // Fórmula oficial de Albion Online:
  // Nutrición consumida = Item Value * 0.1125
  // Coste = (Nutrición / 100) * Tasa_por_100
  const itemValue = (input.recipe.itemValue || 100) * (tierScale / 2.0);
  const nutritionPerItem = itemValue * 0.1125;
  const totalNutritionUsed = Math.round(nutritionPerItem * safeBatchCount);
  const safeStationTax = Math.max(0, Number(input.stationTaxPer100Nutrition) || 0);
  const stationFeeTotal = Math.round((totalNutritionUsed / 100) * safeStationTax);

  // 5. Ingresos por venta de las piezas terminadas
  const singleItemSellPrice = Math.max(0, Number(input.finishedItemSellPrice) || 0);
  const grossItemSales = Math.round(singleItemSellPrice * safeBatchCount);

  // Impuestos de mercado de Albion:
  // Premium: 4% impuesto + 2.5% tasa de publicación = 6.5%
  // Sin Premium: 8% impuesto + 2.5% tasa de publicación = 10.5%
  const marketTaxPercent = input.hasPremium ? 4.0 : 8.0;
  const setupFeePercent = 2.5;
  const totalMarketTaxPercent = marketTaxPercent + setupFeePercent;

  const marketDeductions = Math.round((grossItemSales * totalMarketTaxPercent) / 100);
  const netItemSales = Math.max(0, grossItemSales - marketDeductions);

  // 6. Economía y Rendimiento de los Diarios
  const emptyJournalPrice = Math.max(0, Number(input.emptyJournalBuyPrice) || 0);
  const filledJournalPrice = Math.max(0, Number(input.filledJournalSellPrice) || 0);

  // Diarios a computar (los enteros llenados)
  const effectiveJournalsToAccount = Math.max(0, journalsFilledCount);
  const emptyJournalsInvestmentCost = effectiveJournalsToAccount * emptyJournalPrice;

  // Opción A: Venta de libros llenos en el mercado
  const sellFilledJournalsGross = effectiveJournalsToAccount * filledJournalPrice;
  const sellFilledJournalsTax = Math.round((sellFilledJournalsGross * totalMarketTaxPercent) / 100);
  const sellFilledJournalsNet = Math.max(0, sellFilledJournalsGross - sellFilledJournalsTax);
  const sellFilledNetProfit = sellFilledJournalsNet - emptyJournalsInvestmentCost;

  // Opción B: Entregar a los trabajadores (Labourers) de tu casa
  // Rendimiento esperado (Yield %: 125% si la casa y trabajador son Tier superior)
  const estimatedReturnPerJournal = Math.max(
    0,
    Number(input.labourerReturnedMaterialValue) || (filledJournalPrice * 1.15)
  );
  const labourerMultiplier = ((input.labourerYieldPercent || 125) / 100);
  const useLabourersGross = Math.round(effectiveJournalsToAccount * estimatedReturnPerJournal * labourerMultiplier);
  const useLabourersNetProfit = useLabourersGross - emptyJournalsInvestmentCost;

  // Opción C: No llevar diarios
  const noJournalsNetProfit = 0;

  // Determinar la estrategia activa seleccionada por el usuario
  let activeJournalsNetProfit = 0;
  let grossFilledJournalsValue = 0;

  if (input.journalStrategy === 'sell_filled') {
    grossFilledJournalsValue = sellFilledJournalsNet;
    activeJournalsNetProfit = sellFilledNetProfit;
  } else if (input.journalStrategy === 'use_labourers') {
    grossFilledJournalsValue = useLabourersGross;
    activeJournalsNetProfit = useLabourersNetProfit;
  } else {
    grossFilledJournalsValue = 0;
    activeJournalsNetProfit = 0;
  }

  // 7. Balance Financiero Global y Maestría en la Tabla del Destino (Destiny Board)
  // Cálculo de Eficiencia de Costo de Foco (FCE):
  // - Nivel de Artesano de la Rama (Crafter): +30 FCE por nivel
  // - Nivel de Especialización del Ítem (Spec): +250 FCE directo al ítem + 30 FCE a la subfamilia
  // - Otras especializaciones de la misma rama: +30 FCE por nivel en ~6 armas hermanas
  const safeCrafterMastery = Math.max(0, Math.min(100, Math.floor(Number(input.crafterMasteryLevel) || 0)));
  const safeItemSpec = Math.max(0, Math.min(120, Math.floor(Number(input.itemSpecLevel) || 0)));
  const safeOtherSpecs = Math.max(0, Math.min(100, Math.floor(Number(input.otherSpecsAverageLevel) || 0)));

  const crafterMasteryFCE = safeCrafterMastery * 30;
  const itemSpecFCE = safeItemSpec * 250;
  const otherSpecsFCE = safeOtherSpecs * 30 * 6; // 6 especializaciones hermanas de la familia
  const totalFCE = crafterMasteryFCE + itemSpecFCE + otherSpecsFCE;

  // Costo base de foco en Albion Online:
  // Basado en el total de materiales consumidos y el tier:
  // T4: 10 foco base/recurso | T5: 20 | T6: 40 | T7: 80 | T8: 160
  // Con multiplicador de encantamiento (.0: 1.0, .1: 1.5, .2: 2.25, .3: 3.375, .4: 5.0)
  const totalMaterialsInRecipe = input.recipe.materials.reduce((sum, m) => sum + m.amount, 0);
  const resourceBaseCostFactor = safeTier === 4 ? 10 : safeTier === 5 ? 20 : safeTier === 6 ? 40 : safeTier === 7 ? 80 : 160;
  const enchantFocusMultiplier = safeEnchantment === 0 ? 1.0 : safeEnchantment === 1 ? 1.5 : safeEnchantment === 2 ? 2.25 : safeEnchantment === 3 ? 3.375 : 5.0;
  const baseFocusCostPerItem = Math.round(totalMaterialsInRecipe * resourceBaseCostFactor * enchantFocusMultiplier);

  // Fórmula oficial de reducción exponencial de Albion Online:
  // Costo Final = Base * 2^(-FCE / 10000)
  const focusReductionFactor = Math.pow(2, -totalFCE / 10000);
  const actualFocusCostPerItem = Math.max(1, Math.round(baseFocusCostPerItem * focusReductionFactor));
  const focusDiscountPercent = Math.min(99, Math.round((1 - focusReductionFactor) * 100));

  const totalBatchFocusCost = input.useFocus ? actualFocusCostPerItem * safeBatchCount : 0;
  const availableFocus = Math.max(1, Math.floor(Number(input.availableFocusPoints) || 10000));
  const itemsCraftableWith10k = Math.max(1, Math.floor(10000 / actualFocusCostPerItem));

  // Desglose de Calidad de Fabricación y Efecto de Ensaladas (Salads)
  // Ensaladas oficiales de Albion:
  // Bean T2 (+37.5% calidad roll), Turnip T4 (+75%), Potato T6 (+112.5%), Kraken T6 (+150%)
  const saladType = input.saladType || (input.hasCrafterSalad ? 'potato_t6' : 'none');
  let saladQualityBonusPercent = 0;
  let saladNameEs = 'Sin Comida';

  if (saladType === 'bean_t2') {
    saladQualityBonusPercent = 37.5;
    saladNameEs = 'Ensalada de Alubias (T2)';
  } else if (saladType === 'turnip_t4') {
    saladQualityBonusPercent = 75.0;
    saladNameEs = 'Ensalada de Nabos (T4)';
  } else if (saladType === 'potato_t6') {
    saladQualityBonusPercent = 112.5;
    saladNameEs = 'Ensalada de Patatas (T6)';
  } else if (saladType === 'kraken_t6') {
    saladQualityBonusPercent = 150.0;
    saladNameEs = 'Ensalada de Kraken (T6 Avaloniana)';
  }

  // Modificador de calidad por nivel de especialista (+0.75% por nivel)
  const specQualityBonus = safeItemSpec * 0.75;
  const totalQualityRollBonus = 1 + ((saladQualityBonusPercent + specQualityBonus) / 100);

  // Probabilidades de calidad proyectadas en Albion
  const baseGoodProb = 12.0 * totalQualityRollBonus;
  const baseOutstandingProb = 3.0 * totalQualityRollBonus;
  const baseExcellentProb = 0.8 * totalQualityRollBonus;
  const baseMasterpieceProb = 0.15 * totalQualityRollBonus;
  const nonNormalProb = Math.min(85, baseGoodProb + baseOutstandingProb + baseExcellentProb + baseMasterpieceProb);

  const masterpiecePercent = Number(Math.min(15, baseMasterpieceProb).toFixed(2));
  const excellentPercent = Number(Math.min(25, baseExcellentProb).toFixed(1));
  const outstandingPercent = Number(Math.min(35, baseOutstandingProb).toFixed(1));
  const goodPercent = Number(Math.min(50, baseGoodProb).toFixed(1));
  const normalPercent = Number(Math.max(15, 100 - (goodPercent + outstandingPercent + excellentPercent + masterpiecePercent)).toFixed(1));

  // Estimación de sobreprecio por calidades superiores
  // Buena (+5%), Notable (+15%), Excelente (+35%), Obra Maestra (+120%)
  const qualityWeightMultiplier = (
    (normalPercent * 1.0) +
    (goodPercent * 1.05) +
    (outstandingPercent * 1.15) +
    (excellentPercent * 1.35) +
    (masterpiecePercent * 2.20)
  ) / 100;

  const estimatedQualityBonusSilverPerItem = Math.max(0, Math.round(singleItemSellPrice * (qualityWeightMultiplier - 1.0)));

  // Total de gastos = Coste efectivo de materiales + Tasa de nutrición + Compra de diarios vacíos (si aplica)
  const totalExpenditure =
    effectiveMaterialCost +
    stationFeeTotal +
    (input.journalStrategy !== 'no_journals' ? emptyJournalsInvestmentCost : 0);

  const totalRevenue = netItemSales + grossFilledJournalsValue;
  const netProfit = totalRevenue - totalExpenditure;
  const profitPerUnit = Math.round(netProfit / safeBatchCount);

  const roiPercent = totalExpenditure > 0
    ? Number(((netProfit / totalExpenditure) * 100).toFixed(1))
    : 0;

  // Estimación exacta de plata por foco real gastado con maestría
  const silverPerFocusPoint = (input.useFocus && totalBatchFocusCost > 0 && netProfit > 0)
    ? Number((netProfit / totalBatchFocusCost).toFixed(1))
    : 0;

  // Ganancia neta estimada con 10.000 de foco diario
  const dailyFocusSilverProfit = input.useFocus && profitPerUnit > 0
    ? Math.round(itemsCraftableWith10k * profitPerUnit)
    : 0;

  // Comparativa de Estrategia
  const recommendedStrategy = useLabourersNetProfit >= sellFilledNetProfit ? 'use_labourers' : 'sell_filled';
  const strategyAdvantageSilver = Math.abs(useLabourersNetProfit - sellFilledNetProfit);

  // 8. Recomendaciones Tácticas
  const recommendations: string[] = [];

  if (input.isCityCraftBonusActive) {
    recommendations.push(
      `✅ Bono de Ciudad Activo: Crafteas en una ciudad con especialización, elevando el RRR a ${effectiveReturnRatePercent}%.`
    );
  } else {
    recommendations.push(
      `💡 Consejo de Ciudad: Craftear este ítem en la ciudad con bono regional aumentaría tu retorno de materiales hasta 24.8% sin foco o 47.9% con foco.`
    );
  }

  if (totalFCE > 0) {
    recommendations.push(
      `🎯 Maestría Aplicada: Eficiencia de ${totalFCE.toLocaleString()} FCE (-${focusDiscountPercent}% foco). Cada pieza cuesta ${actualFocusCostPerItem.toLocaleString()} foco en vez de ${baseFocusCostPerItem.toLocaleString()}. Con 10k foco puedes forjar ${itemsCraftableWith10k} piezas diarias.`
    );
  } else {
    recommendations.push(
      `📚 Sube tu Maestría: Con maestría 0 cada pieza cuesta ${baseFocusCostPerItem.toLocaleString()} de foco. Subir especialista a 100 reducirá el costo en más de un 75% multiplicando tus piezas diarias.`
    );
  }

  if (saladQualityBonusPercent > 0) {
    recommendations.push(
      `🥗 Comida de Artesano: ${saladNameEs} otorga +${saladQualityBonusPercent}% a las tiradas de calidad, aumentando el valor promedio por pieza en +${estimatedQualityBonusSilverPerItem.toLocaleString()} 🪙.`
    );
  }

  if (journalsFilledCount > 0) {
    if (recommendedStrategy === 'use_labourers') {
      recommendations.push(
        `🏠 Ventaja de Trabajadores: Entregar tus ${journalsFilledCount} diarios a trabajadores en casa T${safeTier + 1} genera +${strategyAdvantageSilver.toLocaleString()} 🪙 más de ganancia que venderlos directamente en el mercado.`
      );
    } else {
      recommendations.push(
        `🛒 Ventaja de Mercado: Los precios actuales de diarios llenos hacen más rentable venderlos en el mercado (+${sellFilledNetProfit.toLocaleString()} 🪙 neto).`
      );
    }
  }

  if (input.journalStrategy === 'no_journals' && journalsFilledCount > 0) {
    recommendations.push(
      `⚠️ Pérdida de Oportunidad: Estás perdiendo aproximadamente +${Math.max(sellFilledNetProfit, useLabourersNetProfit).toLocaleString()} 🪙 por no llevar diarios en el inventario.`
    );
  }

  return {
    recipeId: input.recipe.id,
    recipeName: input.recipe.nameEs,
    batchCount: safeBatchCount,
    totalCraftFameEarned,
    fameRequiredPerJournal,
    journalsFilledCount,
    partialJournalProgressPercent,
    effectiveReturnRatePercent,
    grossMaterialCost,
    returnedMaterialValue,
    effectiveMaterialCost,
    totalNutritionUsed,
    stationFeeTotal,
    grossItemSales,
    marketTaxPercent,
    setupFeePercent,
    marketDeductions,
    netItemSales,
    emptyJournalsInvestmentCost: input.journalStrategy !== 'no_journals' ? emptyJournalsInvestmentCost : 0,
    grossFilledJournalsValue,
    netJournalsProfit: activeJournalsNetProfit,
    totalExpenditure,
    totalRevenue,
    netProfit,
    profitPerUnit,
    roiPercent,
    silverPerFocusPoint,
    isProfitable: netProfit > 0,
    masteryMetrics: {
      totalFCE,
      crafterMasteryFCE,
      itemSpecFCE,
      otherSpecsFCE,
      baseFocusCostPerItem,
      actualFocusCostPerItem,
      focusDiscountPercent,
      itemsCraftableWith10k,
      totalBatchFocusCost,
      dailyFocusSilverProfit,
    },
    qualityMetrics: {
      normalPercent,
      goodPercent,
      outstandingPercent,
      excellentPercent,
      masterpiecePercent,
      saladNameEs,
      saladQualityBonusPercent,
      estimatedQualityBonusSilverPerItem,
    },
    journalComparison: {
      sellFilledNetProfit,
      useLabourersNetProfit,
      noJournalsNetProfit,
      recommendedStrategy,
      strategyAdvantageSilver,
    },
    recommendations,
  };
}
