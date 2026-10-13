/**
 * Caso de Uso Puro: Planificador de Suministro de Diarios para Trabajadores
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

import { LabourerSupplyRow, JournalSupplyAnalysis, JournalPriceSetting } from '../models/journalSupply';

export const DEFAULT_JOURNAL_PRICES: Record<number, JournalPriceSetting> = {
  2: { tier: 2, emptyPrice: 150, fullPrice: 1200 },
  3: { tier: 3, emptyPrice: 300, fullPrice: 2800 },
  4: { tier: 4, emptyPrice: 600, fullPrice: 6500 },
  5: { tier: 5, emptyPrice: 1200, fullPrice: 14000 },
  6: { tier: 6, emptyPrice: 2500, fullPrice: 32000 },
  7: { tier: 7, emptyPrice: 5500, fullPrice: 78000 },
  8: { tier: 8, emptyPrice: 12000, fullPrice: 195000 },
};

export function calculateJournalSupply(
  rows: LabourerSupplyRow[],
  customJournalPrices?: Record<number, Partial<JournalPriceSetting>>
): JournalSupplyAnalysis {
  let totalLabourers = 0;
  let dailyCostBuyFull = 0;
  let dailyCostBuyEmpty = 0;

  for (const row of rows) {
    const count = Math.max(0, Number.isFinite(row.labourersCount) ? row.labourersCount : 0);
    if (count <= 0) continue;

    totalLabourers += count;

    const basePricing = DEFAULT_JOURNAL_PRICES[row.tier] || {
      tier: row.tier,
      emptyPrice: 1000,
      fullPrice: 10000,
    };

    const override = customJournalPrices?.[row.tier];
    const emptyPrice = override?.emptyPrice ?? basePricing.emptyPrice;
    const fullPrice = override?.fullPrice ?? basePricing.fullPrice;

    dailyCostBuyFull += count * fullPrice;
    dailyCostBuyEmpty += count * emptyPrice;
  }

  const dailyJournalsDemand = totalLabourers;
  const weeklyJournalsDemand = totalLabourers * 7;
  const dailySavingsFillingYourself = Math.max(0, dailyCostBuyFull - dailyCostBuyEmpty);

  const savingsPercent = dailyCostBuyFull > 0
    ? Number(((dailySavingsFillingYourself / dailyCostBuyFull) * 100).toFixed(1))
    : 0;

  let recommendation = '';
  if (totalLabourers === 0) {
    recommendation = 'Agrega trabajadores para auditar la demanda y rotación de diarios.';
  } else if (dailySavingsFillingYourself > 50000) {
    recommendation = `¡Gran ahorro! Llenar tus propios diarios vacíos te ahorra ${dailySavingsFillingYourself.toLocaleString()} 🪙 diarios (${savingsPercent}%) frente a comprarlos llenos en subasta.`;
  } else {
    recommendation = `Para ${totalLabourers} obreros, necesitas ${dailyJournalsDemand} diarios cada 22h (${weeklyJournalsDemand}/semana).`;
  }

  return {
    totalLabourers,
    dailyJournalsDemand,
    weeklyJournalsDemand,
    dailyCostBuyFull,
    dailyCostBuyEmpty,
    dailySavingsFillingYourself,
    savingsPercent,
    recommendation,
  };
}
