import { EnchantingCalculationInput, EnchantingCalculationResult, EnchantingSlotRequirements, ShardType } from '../models/enchanting';

/**
 * Tabla Oficial de Albion Online de Fragmentos Requeridos según el Slot del Ítem
 * - Armas de 1 Mano (One-Hand Weapon): 96 fragmentos
 * - Armas de 2 Manos (Two-Hand Weapon): 192 fragmentos
 * - Armaduras de Pecho (Chest): 192 fragmentos
 * - Cascos y Zapatos (Head & Shoes): 96 fragmentos
 * - Offhands (Escudos, Libros, Antorchas): 48 fragmentos
 * - Capas (Capes): 96 fragmentos
 */
export const ENCHANTING_SLOT_REQUIREMENTS: Record<string, EnchantingSlotRequirements> = {
  one_hand_weapon: {
    slotId: 'one_hand_weapon',
    slotNameEs: 'Arma de 1 Mano',
    runesRequired: 96,
    soulsRequired: 96,
    relicsRequired: 96,
    avalonianRequired: 96,
  },
  two_hand_weapon: {
    slotId: 'two_hand_weapon',
    slotNameEs: 'Arma de 2 Manos',
    runesRequired: 192,
    soulsRequired: 192,
    relicsRequired: 192,
    avalonianRequired: 192,
  },
  chest: {
    slotId: 'chest',
    slotNameEs: 'Armadura (Pecho)',
    runesRequired: 192,
    soulsRequired: 192,
    relicsRequired: 192,
    avalonianRequired: 192,
  },
  head: {
    slotId: 'head',
    slotNameEs: 'Casco / Capucha',
    runesRequired: 96,
    soulsRequired: 96,
    relicsRequired: 96,
    avalonianRequired: 96,
  },
  shoes: {
    slotId: 'shoes',
    slotNameEs: 'Botas / Zapatos',
    runesRequired: 96,
    soulsRequired: 96,
    relicsRequired: 96,
    avalonianRequired: 96,
  },
  offhand: {
    slotId: 'offhand',
    slotNameEs: 'Mano Secundaria (Offhand)',
    runesRequired: 48,
    soulsRequired: 48,
    relicsRequired: 48,
    avalonianRequired: 48,
  },
  cape: {
    slotId: 'cape',
    slotNameEs: 'Capa',
    runesRequired: 96,
    soulsRequired: 96,
    relicsRequired: 96,
    avalonianRequired: 96,
  },
};

/**
 * Caso de uso: Fusión y Encantamiento de Equipo en Taller de Reparaciones
 */
export function calculateEnchantingEconomy(input: EnchantingCalculationInput): EnchantingCalculationResult {
  const safeTier = Math.max(4, Math.min(8, Math.floor(Number(input.tier) || 4)));
  const safeFrom = Math.max(0, Math.min(3, Math.floor(Number(input.currentEnchantment) || 0))) as 0 | 1 | 2 | 3;
  const safeTo = Math.max(safeFrom + 1, Math.min(4, Math.floor(Number(input.targetEnchantment) || safeFrom + 1))) as 1 | 2 | 3 | 4;
  const safeBatch = Math.max(1, Math.floor(Number(input.batchCount) || 1));

  const slotInfo = ENCHANTING_SLOT_REQUIREMENTS[input.slotId] || ENCHANTING_SLOT_REQUIREMENTS.one_hand_weapon;

  // Determinar tipo de fragmento requerido para este salto
  let shardType: ShardType = 'rune';
  let shardNameEs = 'Runas';
  let shardsPerItem = slotInfo.runesRequired;

  if (safeTo === 1) {
    shardType = 'rune';
    shardNameEs = `Runas T${safeTier}`;
    shardsPerItem = slotInfo.runesRequired;
  } else if (safeTo === 2) {
    shardType = 'soul';
    shardNameEs = `Almas T${safeTier}`;
    shardsPerItem = slotInfo.soulsRequired;
  } else if (safeTo === 3) {
    shardType = 'relic';
    shardNameEs = `Reliquias T${safeTier}`;
    shardsPerItem = slotInfo.relicsRequired;
  } else {
    shardType = 'avalonian';
    shardNameEs = `Fragmentos Avalonianos T${safeTier}`;
    shardsPerItem = slotInfo.avalonianRequired;
  }

  const totalShardsRequired = shardsPerItem * safeBatch;
  const safeShardPrice = Math.max(0, Number(input.shardUnitPrice) || 0);
  const totalShardCost = totalShardsRequired * safeShardPrice;

  const safeBaseItemPrice = Math.max(0, Number(input.baseItemPrice) || 0);
  const totalBaseItemCost = safeBaseItemPrice * safeBatch;

  const totalEnchantingCost = totalBaseItemCost + totalShardCost;
  const costPerEnchantedUnit = safeBatch > 0 ? Math.round(totalEnchantingCost / safeBatch) : 0;

  // Comparación con compra directa en mercado
  const safeTargetMarketPrice = Math.max(0, Number(input.targetItemMarketPrice) || 0);
  const directBuyMarketCost = safeTargetMarketPrice * safeBatch;
  const silverSavedVsDirectBuy = safeBatch > 0 ? (safeTargetMarketPrice - costPerEnchantedUnit) : 0;
  const isCheaperToCraftThanBuy = silverSavedVsDirectBuy > 0;

  // Si se va a revender en el mercado el ítem encantado
  const grossSellRevenue = safeTargetMarketPrice * safeBatch;
  const marketTaxPercent = input.hasPremium ? 4 : 8;
  const setupFeePercent = 2.5;
  const totalTaxPercent = marketTaxPercent + setupFeePercent;

  const marketDeductions = Math.round((grossSellRevenue * totalTaxPercent) / 100);
  const netSellRevenue = Math.max(0, grossSellRevenue - marketDeductions);

  const netProfit = netSellRevenue - totalEnchantingCost;
  const profitPerUnit = safeBatch > 0 ? Math.round(netProfit / safeBatch) : 0;
  const roiPercent = totalEnchantingCost > 0 ? Number(((netProfit / totalEnchantingCost) * 100).toFixed(1)) : 0;
  const isProfitableToResell = netProfit > 0;

  const recommendations: string[] = [];

  if (isCheaperToCraftThanBuy) {
    recommendations.push(
      `💎 Ahorro al Encantar: Encantar este ítem con ${shardsPerItem} ${shardNameEs} te cuesta ${costPerEnchantedUnit.toLocaleString()} 🪙 frente a los ${safeTargetMarketPrice.toLocaleString()} 🪙 que piden en el mercado (Ahorras +${silverSavedVsDirectBuy.toLocaleString()} 🪙 por pieza).`
    );
  } else if (safeTargetMarketPrice > 0) {
    recommendations.push(
      `⚠️ Más Barato Comprar Directo: Comprar la pieza ya encantada a .${safeTo} en el mercado cuesta ${safeTargetMarketPrice.toLocaleString()} 🪙, mientras que encantarla cuesta ${costPerEnchantedUnit.toLocaleString()} 🪙.`
    );
  }

  if (isProfitableToResell) {
    recommendations.push(
      `📈 Oportunidad de Arbitraje/Reventa: Si compras la base a .${safeFrom}, la encantas a .${safeTo} y la revendes con orden en el mercado, obtienes una ganancia neta de +${netProfit.toLocaleString()} 🪙 (+${profitPerUnit.toLocaleString()} 🪙/ud) con un ROI del ${roiPercent}%.`
    );
  }

  return {
    tier: safeTier,
    slotName: slotInfo.slotNameEs,
    fromEnchantment: safeFrom,
    toEnchantment: safeTo,
    batchCount: safeBatch,
    shardType,
    shardNameEs,
    shardsPerItem,
    totalShardsRequired,
    totalShardCost,
    totalBaseItemCost,
    totalEnchantingCost,
    costPerEnchantedUnit,
    directBuyMarketCost,
    silverSavedVsDirectBuy,
    grossSellRevenue,
    marketTaxPercent,
    netSellRevenue,
    netProfit,
    profitPerUnit,
    roiPercent,
    isProfitableToResell,
    isCheaperToCraftThanBuy,
    recommendations,
  };
}
