import { CityRefiningBonus, RefiningCalculationInput, RefiningCalculationResult, RefiningResourceType } from '../models/refining';
import { CityId } from '../../types';

/**
 * Bonos oficiales de refinado por Ciudad Real en Albion Online
 */
export const CITY_REFINING_BONUSES: Record<CityId, CityRefiningBonus | null> = {
  thetford: {
    cityId: 'thetford',
    cityName: 'Thetford',
    color: '#8B5CF6',
    resourceType: 'ore',
    refinedProductEs: 'Barras de Metal (Lingotes)',
    rawResourceEs: 'Mineral de Hierro',
    bonusCityNameEs: 'Thetford (Pantano)',
    baseRRRWithoutFocus: 36.7,
    baseRRRWithFocus: 53.9,
  },
  fort_sterling: {
    cityId: 'fort_sterling',
    cityName: 'Fort Sterling',
    color: '#06B6D4',
    resourceType: 'wood',
    refinedProductEs: 'Tablas de Madera',
    rawResourceEs: 'Troncos de Madera',
    bonusCityNameEs: 'Fort Sterling (Montaña)',
    baseRRRWithoutFocus: 36.7,
    baseRRRWithFocus: 53.9,
  },
  bridgewatch: {
    cityId: 'bridgewatch',
    cityName: 'Bridgewatch',
    color: '#F59E0B',
    resourceType: 'stone',
    refinedProductEs: 'Bloques de Piedra',
    rawResourceEs: 'Rocas de Piedra',
    bonusCityNameEs: 'Bridgewatch (Estepa)',
    baseRRRWithoutFocus: 36.7,
    baseRRRWithFocus: 53.9,
  },
  lymhurst: {
    cityId: 'lymhurst',
    cityName: 'Lymhurst',
    color: '#10B981',
    resourceType: 'fiber',
    refinedProductEs: 'Telas Tejidas',
    rawResourceEs: 'Fibras de Lino/Algodón',
    bonusCityNameEs: 'Lymhurst (Bosque)',
    baseRRRWithoutFocus: 36.7,
    baseRRRWithFocus: 53.9,
  },
  martlock: {
    cityId: 'martlock',
    cityName: 'Martlock',
    color: '#3B82F6',
    resourceType: 'hide',
    refinedProductEs: 'Cueros Curtidos',
    rawResourceEs: 'Pieles de Animales',
    bonusCityNameEs: 'Martlock (Tierras Altas)',
    baseRRRWithoutFocus: 36.7,
    baseRRRWithFocus: 53.9,
  },
  caerleon: null,
  brecilien: null,
};

/**
 * Generador puro de Item IDs técnicos de Albion Online para consulta a Albion Data Project (ADP)
 */
export function getAlbionRefiningItemIds(
  resourceType: RefiningResourceType,
  tier: number,
  enchantment: number
): { rawItemId: string; prevTierItemId: string; refinedItemId: string } {
  const safeTier = Math.max(2, Math.min(8, Math.floor(tier)));
  const safeEnchant = Math.max(0, Math.min(4, Math.floor(enchantment)));
  const prevTier = Math.max(2, safeTier - 1);

  let rawPrefix = 'ORE';
  let refinedPrefix = 'BAR';

  switch (resourceType) {
    case 'wood':
      rawPrefix = 'WOOD';
      refinedPrefix = 'PLANKS';
      break;
    case 'hide':
      rawPrefix = 'HIDE';
      refinedPrefix = 'LEATHER';
      break;
    case 'fiber':
      rawPrefix = 'FIBER';
      refinedPrefix = 'CLOTH';
      break;
    case 'stone':
      rawPrefix = 'ROCK';
      refinedPrefix = 'STONE';
      break;
    case 'ore':
    default:
      rawPrefix = 'ORE';
      refinedPrefix = 'BAR';
      break;
  }

  const rawItemId = safeEnchant > 0 && safeTier >= 4
    ? `T${safeTier}_${rawPrefix}_LEVEL${safeEnchant}@${safeEnchant}`
    : `T${safeTier}_${rawPrefix}`;

  const refinedItemId = safeEnchant > 0 && safeTier >= 4
    ? `T${safeTier}_${refinedPrefix}_LEVEL${safeEnchant}@${safeEnchant}`
    : `T${safeTier}_${refinedPrefix}`;

  const prevTierItemId = safeTier > 2 ? `T${prevTier}_${refinedPrefix}` : '';

  return {
    rawItemId,
    prevTierItemId,
    refinedItemId,
  };
}

/**
 * Cantidad de recursos brutos requeridos por cada unidad del tier correspondiente:
 * - T2: 1 recurso bruto (no consume material previo)
 * - T3: 2 recursos brutos + 1 T2 refinado
 * - T4: 2 recursos brutos + 1 T3 refinado
 * - T5: 3 recursos brutos + 1 T4 refinado
 * - T6: 4 recursos brutos + 1 T5 refinado
 * - T7: 5 recursos brutos + 1 T6 refinado
 * - T8: 5 recursos brutos + 1 T7 refinado
 */
export function getRawResourcesRequiredPerRefinedUnit(tier: number): number {
  if (tier <= 2) return 1;
  if (tier === 3 || tier === 4) return 2;
  if (tier === 5) return 3;
  if (tier === 6) return 4;
  return 5; // T7 y T8
}

/**
 * Caso de uso: Cálculo del Refinado de Recursos Brutos
 */
export function calculateRefiningEconomy(input: RefiningCalculationInput): RefiningCalculationResult {
  const safeTier = Math.max(2, Math.min(8, Math.floor(Number(input.tier) || 4)));
  const safeEnchantment = Math.max(0, Math.min(4, Math.floor(Number(input.enchantment) || 0)));
  const safeBatchCount = Math.max(1, Math.floor(Number(input.batchCount) || 1));
  const calculationMode = input.calculationMode || 'single_batch';

  // Obtener IDs oficiales de Albion para ADP
  const itemIds = getAlbionRefiningItemIds(input.resourceType, safeTier, safeEnchantment);

  // Verificar bono de ciudad
  const cityBonus = CITY_REFINING_BONUSES[input.cityId];
  const isCityBonusActive = Boolean(cityBonus && cityBonus.resourceType === input.resourceType);

  // Determinar RRR base
  let effectiveRRR = 15.2; // RRR base sin bono de ciudad y sin foco

  if (isCityBonusActive) {
    effectiveRRR = input.useFocus ? 53.9 : 36.7;
  } else {
    effectiveRRR = input.useFocus ? 43.5 : 15.2;
  }

  // Bono diario de evento oficial si está activo
  if (input.hasDailyEventBonus && Number(input.dailyEventBonusPercent) > 0) {
    effectiveRRR += Number(input.dailyEventBonusPercent);
  }

  effectiveRRR = Math.min(58.5, effectiveRRR); // Tope técnico en Albion

  // Proporción de retorno (factor de devolución)
  const returnRateFactor = effectiveRRR / 100;

  // Factor de cascada completa 1 / (1 - RRR)
  const cascadeMultiplier = returnRateFactor < 1 ? Number((1 / (1 - returnRateFactor)).toFixed(3)) : 1;
  const cascadeTotalUnitsProduced = Math.floor(safeBatchCount * cascadeMultiplier);

  // Requerimientos por unidad base
  const rawPerUnit = getRawResourcesRequiredPerRefinedUnit(safeTier);
  const prevTierPerUnit = safeTier > 2 ? 1 : 0;

  const totalRawMaterialsRequired = rawPerUnit * safeBatchCount;
  const totalPreviousTierRequired = prevTierPerUnit * safeBatchCount;

  // Retorno de materiales por RRR (primer ciclo)
  const rawMaterialsReturned = Math.floor(totalRawMaterialsRequired * returnRateFactor);
  const previousTierReturned = Math.floor(totalPreviousTierRequired * returnRateFactor);

  const effectiveRawMaterialsUsed = Math.max(0, totalRawMaterialsRequired - rawMaterialsReturned);
  const effectivePreviousTierUsed = Math.max(0, totalPreviousTierRequired - previousTierReturned);

  // Precios
  const safeRawPrice = Math.max(0, Number(input.rawMaterialPrice) || 0);
  const safePrevPrice = Math.max(0, Number(input.previousTierRefinedPrice) || 0);
  const safeSellPrice = Math.max(0, Number(input.finishedRefinedSellPrice) || 0);

  const grossRawMaterialCost = totalRawMaterialsRequired * safeRawPrice;
  const grossPreviousTierCost = totalPreviousTierRequired * safePrevPrice;

  const returnedValueTotal = (rawMaterialsReturned * safeRawPrice) + (previousTierReturned * safePrevPrice);
  const effectiveMaterialCost = Math.max(0, (grossRawMaterialCost + grossPreviousTierCost) - returnedValueTotal);

  // Unidades producidas según modo
  const totalUnitsProduced = calculationMode === 'cascade_full' ? cascadeTotalUnitsProduced : safeBatchCount;

  // Tasa de la estación de nutrición en ciudad
  const nutritionPerUnit = safeTier === 2 ? 0.5 : safeTier === 3 ? 1 : safeTier === 4 ? 2 : safeTier === 5 ? 4 : safeTier === 6 ? 8 : safeTier === 7 ? 16 : 32;
  const totalNutritionUsed = Math.round(nutritionPerUnit * totalUnitsProduced);
  const safeStationTax = Math.max(0, Number(input.stationTaxPer100Nutrition) || 0);
  const stationFeeTotal = Math.round((totalNutritionUsed / 100) * safeStationTax);

  // Coste total de la operación
  const totalExpenditure = (calculationMode === 'cascade_full' ? grossRawMaterialCost + grossPreviousTierCost : effectiveMaterialCost) + stationFeeTotal;

  // Ingresos
  const grossRevenue = totalUnitsProduced * safeSellPrice;

  const marketTaxPercent = input.hasPremium ? 4 : 8;
  const setupFeePercent = 2.5;
  const totalTaxPercent = marketTaxPercent + setupFeePercent;

  const marketDeductions = Math.round((grossRevenue * totalTaxPercent) / 100);
  const netRevenue = Math.max(0, grossRevenue - marketDeductions);

  const netProfit = netRevenue - totalExpenditure;
  const profitPerUnit = totalUnitsProduced > 0 ? Math.round(netProfit / totalUnitsProduced) : 0;
  const roiPercent = totalExpenditure > 0 ? Number(((netProfit / totalExpenditure) * 100).toFixed(1)) : 0;

  // Maestría del Refinador y Eficiencia de Foco
  const safeRefinerMastery = Math.max(0, Math.min(100, Math.floor(Number(input.refinerMasteryLevel) || 0)));
  const safeResourceSpec = Math.max(0, Math.min(100, Math.floor(Number(input.resourceSpecLevel) || 0)));
  const safeOtherTiers = Math.max(0, Math.min(100, Math.floor(Number(input.otherTiersAverageSpec) || 0)));

  const refinerMasteryFCE = safeRefinerMastery * 30;
  const resourceSpecFCE = safeResourceSpec * 250;
  const otherTiersFCE = safeOtherTiers * 30 * 4; // Otros 4 tiers refinables
  const totalFCE = refinerMasteryFCE + resourceSpecFCE + otherTiersFCE;

  // Costo base de foco en refinado
  const baseFactor = safeTier === 4 ? 14 : safeTier === 5 ? 29 : safeTier === 6 ? 58 : safeTier === 7 ? 116 : 232;
  const enchantMultiplier = safeEnchantment === 0 ? 1 : safeEnchantment === 1 ? 1.5 : safeEnchantment === 2 ? 2.25 : safeEnchantment === 3 ? 3.375 : 5.0;
  const baseFocusCostPerUnit = Math.round(baseFactor * enchantMultiplier);

  const focusReductionFactor = Math.pow(2, -totalFCE / 10000);
  const actualFocusCostPerUnit = Math.max(1, Math.round(baseFocusCostPerUnit * focusReductionFactor));
  const focusDiscountPercent = Math.min(99, Math.round((1 - focusReductionFactor) * 100));

  const totalBatchFocusCost = input.useFocus ? actualFocusCostPerUnit * totalUnitsProduced : 0;
  const unitsWith10kFocus = Math.max(1, Math.floor(10000 / actualFocusCostPerUnit));
  const dailyFocusProfit = input.useFocus && profitPerUnit > 0 ? unitsWith10kFocus * profitPerUnit : 0;

  const silverPerFocusPoint = (input.useFocus && totalBatchFocusCost > 0 && netProfit > 0)
    ? Number((netProfit / totalBatchFocusCost).toFixed(1))
    : 0;

  // Texto para lista de compra rápida
  const shoppingListText = `📋 [Lista de Compra Albion] Refinar ${totalUnitsProduced}x T${safeTier}.${safeEnchantment} (${input.resourceType.toUpperCase()}):\n` +
    `• Materia Prima: ${totalRawMaterialsRequired} uds a ~${safeRawPrice.toLocaleString()} 🪙 (${grossRawMaterialCost.toLocaleString()} 🪙)\n` +
    (safeTier > 2 ? `• Material Previo T${safeTier - 1}.0: ${totalPreviousTierRequired} uds a ~${safePrevPrice.toLocaleString()} 🪙 (${grossPreviousTierCost.toLocaleString()} 🪙)\n` : '') +
    `• Inversión Total: ${(grossRawMaterialCost + grossPreviousTierCost).toLocaleString()} 🪙\n` +
    `• Devolución RRR (${effectiveRRR}%): +${rawMaterialsReturned} brutas` + (safeTier > 2 ? ` y +${previousTierReturned} previas` : '') + ` (+${returnedValueTotal.toLocaleString()} 🪙 devueltos)\n` +
    `• Ganancia Neta Estimada: ${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString()} 🪙 (ROI: ${roiPercent}%)`;

  const recommendations: string[] = [];

  if (isCityBonusActive && cityBonus) {
    recommendations.push(
      `🏛️ Bono de Ciudad Activo: ${cityBonus.bonusCityNameEs} otorga ${effectiveRRR}% de RRR en ${cityBonus.refinedProductEs}, devolviendo ${rawMaterialsReturned} unidades de materia prima.`
    );
  } else {
    recommendations.push(
      `⚠️ Sin Bono de Ciudad: Esta ciudad tiene sólo ${effectiveRRR}% RRR. Llevar la materia prima a su Ciudad Real correspondiente elevaría el retorno a un 36.7% sin foco o 53.9% con foco.`
    );
  }

  if (calculationMode === 'cascade_full') {
    recommendations.push(
      `🔄 Modo Cascada Completa Activo: Multiplicador x${cascadeMultiplier}. Re-refinando continuamente los materiales devueltos produces ${cascadeTotalUnitsProduced} unidades en vez de ${safeBatchCount} con el mismo lote inicial.`
    );
  }

  if (totalFCE > 0) {
    recommendations.push(
      `🎯 Maestría Aplicada: ${totalFCE.toLocaleString()} FCE (-${focusDiscountPercent}% costo de foco). Refinas a ${actualFocusCostPerUnit} foco/unidad en vez de ${baseFocusCostPerUnit}. Produces ${unitsWith10kFocus} unidades diarias con 10k foco.`
    );
  }

  if (netProfit > 0) {
    recommendations.push(
      `💰 Operación Rentable: Ganancia neta de +${netProfit.toLocaleString()} 🪙 (${profitPerUnit.toLocaleString()} 🪙/ud) con un ROI del ${roiPercent}%.`
    );
  } else {
    recommendations.push(
      `🛑 Pérdida Proyectada: El coste de compra de materias primas supera el precio de venta en mercado por ${Math.abs(netProfit).toLocaleString()} 🪙. Considera usar foco o comprar mediante órdenes de compra.`
    );
  }

  return {
    resourceType: input.resourceType,
    tier: safeTier,
    enchantment: safeEnchantment,
    batchCount: safeBatchCount,
    calculationMode,
    effectiveRRR,
    isCityBonusActive,
    bonusCityName: cityBonus ? cityBonus.cityName : 'Sin Bono',
    albionRawItemId: itemIds.rawItemId,
    albionPrevTierItemId: itemIds.prevTierItemId,
    albionRefinedItemId: itemIds.refinedItemId,
    totalRawMaterialsRequired,
    rawMaterialsReturned,
    effectiveRawMaterialsUsed,
    totalPreviousTierRequired,
    previousTierReturned,
    effectivePreviousTierUsed,
    cascadeMultiplier,
    cascadeTotalUnitsProduced,
    grossRawMaterialCost,
    grossPreviousTierCost,
    returnedValueTotal,
    effectiveMaterialCost,
    totalNutritionUsed,
    stationFeeTotal,
    totalExpenditure,
    totalUnitsProduced,
    grossRevenue,
    marketTaxPercent,
    setupFeePercent,
    marketDeductions,
    netRevenue,
    netProfit,
    profitPerUnit,
    roiPercent,
    baseFocusCostPerUnit,
    actualFocusCostPerUnit,
    totalBatchFocusCost,
    focusDiscountPercent,
    silverPerFocusPoint,
    unitsWith10kFocus,
    dailyFocusProfit,
    isProfitable: netProfit > 0,
    shoppingListText,
    recommendations,
  };
}
