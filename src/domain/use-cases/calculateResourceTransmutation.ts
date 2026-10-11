/**
 * Caso de Uso Puro: Cálculo y Arbitraje de Transmutación de Recursos y Artefactos
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inviolable: Funciones 100% puras, sin dependencias de React, DOM ni JSX.
 */

import {
  TransmutationCalculationInput,
  TransmutationCalculationResult,
  ENCHANTMENT_TRANSMUTATION_SILVER_COST,
  TIER_TRANSMUTATION_SILVER_COST,
  SHARD_TRANSMUTATION_SILVER_COST,
} from '../models/transmutation';

export function calculateResourceTransmutation(
  input: TransmutationCalculationInput
): TransmutationCalculationResult {
  const {
    mode,
    resourceType,
    hasPremium,
  } = input;

  const safeBatchCount = Math.max(1, Math.floor(Number(input.batchCount) || 1));
  const sourceTier = Math.max(4, Math.min(8, Math.floor(Number(input.sourceTier) || 4)));
  const sourceEnchantment = Math.max(0, Math.min(4, Math.floor(Number(input.sourceEnchantment) || 0)));
  const targetTier = Math.max(4, Math.min(8, Math.floor(Number(input.targetTier) || sourceTier)));
  const targetEnchantment = Math.max(0, Math.min(4, Math.floor(Number(input.targetEnchantment) || sourceEnchantment)));

  const sourceMaterialCostPerUnit = Math.max(0, Math.floor(Number(input.sourceItemUnitPrice) || 0));
  const targetMarketPrice = Math.max(0, Math.floor(Number(input.targetItemMarketSellPrice) || 0));

  // 1. Determinar coste oficial de transmutación en plata
  let transmutationSilverFeePerUnit = 0;

  if (mode === 'enchantment') {
    // Transmutación de nivel de encantamiento (.0 -> .1, etc.)
    const tierCosts = ENCHANTMENT_TRANSMUTATION_SILVER_COST[sourceTier] || ENCHANTMENT_TRANSMUTATION_SILVER_COST[4];
    transmutationSilverFeePerUnit = tierCosts[targetEnchantment] || tierCosts[1];
  } else if (mode === 'tier') {
    // Transmutación de tier (T4 -> T5, T5 -> T6, etc.)
    const targetTierCosts = TIER_TRANSMUTATION_SILVER_COST[targetTier] || TIER_TRANSMUTATION_SILVER_COST[5];
    transmutationSilverFeePerUnit = targetTierCosts[sourceEnchantment] || targetTierCosts[0];
  } else {
    // Transmutación de esquirlas/artefactos (5 a 1)
    const shardType = input.shardType || 'rune_to_soul';
    const shardCosts = SHARD_TRANSMUTATION_SILVER_COST[sourceTier] || SHARD_TRANSMUTATION_SILVER_COST[4];
    transmutationSilverFeePerUnit = shardCosts[shardType] || 800;
  }

  // 2. Costes totales (para esquirlas/artefactos la proporción oficial es 5 a 1)
  const inputUnitsPerOutput = mode === 'artefact_shard' ? 5 : 1;
  const totalInputUnitsNeeded = safeBatchCount * inputUnitsPerOutput;
  const totalSourceMaterialCost = sourceMaterialCostPerUnit * totalInputUnitsNeeded;
  const totalTransmutationSilverFee = transmutationSilverFeePerUnit * safeBatchCount;
  const totalInvestment = totalSourceMaterialCost + totalTransmutationSilverFee;

  // 3. Impuestos de mercado al vender el ítem transmutado (4% con Premium / 8% sin Premium + 2.5% de setup)
  const marketTaxRate = hasPremium ? 0.04 : 0.08;
  const setupOrderFeeRate = 0.025;
  const totalFeeRate = marketTaxRate + setupOrderFeeRate;

  const grossRevenue = targetMarketPrice * safeBatchCount;
  const marketFeesTotal = Math.round(grossRevenue * totalFeeRate);
  const netRevenue = grossRevenue - marketFeesTotal;

  // 4. Beneficio neto y ROI
  const netProfit = netRevenue - totalInvestment;
  const profitPerUnit = Math.round(netProfit / safeBatchCount);
  const roiPercent = totalInvestment > 0 ? Number(((netProfit / totalInvestment) * 100).toFixed(1)) : 0;

  // 5. Break-Even (precio mínimo de venta requerido para no perder)
  // Break-Even * (1 - totalFeeRate) * batchCount = totalInvestment
  const feeMultiplier = 1 - totalFeeRate;
  const breakEvenSellPrice = feeMultiplier > 0
    ? Math.ceil((totalInvestment / safeBatchCount) / feeMultiplier)
    : Math.ceil(totalInvestment / safeBatchCount);

  // 6. Veredicto Estratégico de Arbitraje
  const isProfitable = netProfit > 0;
  let arbitrageVerdict: 'PROFITABLE_TRANSMUTATION' | 'BUY_DIRECT_CHEAPER' | 'SELL_BASE_BETTER' = 'BUY_DIRECT_CHEAPER';
  let verdictMessage = '';

  if (isProfitable && roiPercent >= 10) {
    arbitrageVerdict = 'PROFITABLE_TRANSMUTATION';
    verdictMessage = `¡Excelente Arbitraje! Ganancia neta de ${netProfit.toLocaleString()} 🪙 (${roiPercent}% ROI). Es más barato transmutar que comprar el material directamente en mercado.`;
  } else if (isProfitable && roiPercent < 10) {
    arbitrageVerdict = 'PROFITABLE_TRANSMUTATION';
    verdictMessage = `Margen estrecho (${roiPercent}% ROI). Cubre costes con ${profitPerUnit.toLocaleString()} 🪙/u. de beneficio, pero sensible a fluctuaciones de mercado.`;
  } else {
    arbitrageVerdict = 'BUY_DIRECT_CHEAPER';
    verdictMessage = `No rentable en este momento (pérdida de ${Math.abs(netProfit).toLocaleString()} 🪙). El coste de transmutación del sistema (${transmutationSilverFeePerUnit.toLocaleString()} 🪙) supera el precio de compra directa en mercado.`;
  }

  return {
    mode,
    resourceType,
    sourceTier,
    sourceEnchantment,
    targetTier,
    targetEnchantment,
    batchCount: safeBatchCount,

    sourceMaterialCostPerUnit,
    totalSourceMaterialCost,
    transmutationSilverFeePerUnit,
    totalTransmutationSilverFee,
    totalInvestment,

    targetMarketPrice,
    grossRevenue,
    marketTaxRate,
    setupOrderFeeRate,
    marketFeesTotal,
    netRevenue,

    netProfit,
    profitPerUnit,
    roiPercent,
    breakEvenSellPrice,

    isProfitable,
    arbitrageVerdict,
    verdictMessage,
  };
}
