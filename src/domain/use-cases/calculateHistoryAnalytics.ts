import { DailyLogEntry } from '../../types';

export interface HistoryKPIs {
  totalNetProfit: number;
  totalGrossRevenue: number;
  totalCosts: number;
  totalSlots: number;
  totalHarvested: number;
  averageROI: number;
  netMarginPercentage: number;
  averageSilverPerFocus: number;
  focusUsageCount: number;
  distinctDays: number;
  avgDailyProfit: number;
  bestItem: { name: string; profit: number; count: number } | null;
}

export interface TimelineDataPoint {
  date: string;
  displayDate: string;
  netProfit: number;
  grossRevenue: number;
  costs: number;
  harvestsCount: number;
}

export interface CategoryDistributionPoint {
  category: string;
  label: string;
  profit: number;
  revenue: number;
  costs: number;
  percentage: number;
  color: string;
}

export interface HistoryAnalyticsResult {
  kpis: HistoryKPIs;
  timeline: TimelineDataPoint[];
  categoryDistribution: CategoryDistributionPoint[];
  totalPositiveProfit: number;
}

const CATEGORY_COLORS: Record<string, { label: string; color: string }> = {
  crop: { label: 'Cultivos', color: '#f59e0b' },
  herb: { label: 'Hierbas', color: '#a855f7' },
  animal_produce: { label: 'Productos Granja', color: '#0ea5e9' },
  animal_meat: { label: 'Ganadería / Carne', color: '#f43f5e' },
  other: { label: 'Otros', color: '#10b981' },
};

/**
 * Caso de uso desacoplado (Gentleman Programming):
 * Calcula indicadores clave, series temporales y distribución por categoría
 * a partir del historial de registros de cosechas.
 */
export function calculateHistoryAnalytics(
  logs: DailyLogEntry[],
  timeRange: '7d' | '30d' | 'all' = 'all'
): HistoryAnalyticsResult {
  const safeLogs = Array.isArray(logs) ? logs : [];

  // Filtrado temporal
  let filtered = safeLogs;
  if (timeRange !== 'all') {
    const daysLimit = timeRange === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLimit);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    filtered = safeLogs.filter((log) => log.dateStr >= cutoffStr);
  }

  // Si no hay registros, devolver estructura vacía defensiva
  if (filtered.length === 0) {
    return {
      kpis: {
        totalNetProfit: 0,
        totalGrossRevenue: 0,
        totalCosts: 0,
        totalSlots: 0,
        totalHarvested: 0,
        averageROI: 0,
        netMarginPercentage: 0,
        averageSilverPerFocus: 0,
        focusUsageCount: 0,
        distinctDays: 0,
        avgDailyProfit: 0,
        bestItem: null,
      },
      timeline: [],
      categoryDistribution: [],
      totalPositiveProfit: 0,
    };
  }

  let totalNetProfit = 0;
  let totalGrossRevenue = 0;
  let totalCosts = 0;
  let totalSlots = 0;
  let totalHarvested = 0;
  let focusUsageCount = 0;
  let sumSilverPerFocus = 0;

  const datesSet = new Set<string>();
  const itemProfits: Record<string, { profit: number; count: number }> = {};
  const dailyMap: Record<string, TimelineDataPoint> = {};
  const categoryMap: Record<string, { profit: number; revenue: number; costs: number }> = {};

  filtered.forEach((log) => {
    const profit = Number.isFinite(log.netProfit) ? log.netProfit : 0;
    const gross = Number.isFinite(log.grossRevenue) ? log.grossRevenue : 0;
    const cost = Number.isFinite(log.totalCosts) ? log.totalCosts : 0;
    const slots = Number.isFinite(log.slotsCount) ? log.slotsCount : 0;
    const harvest = Number.isFinite(log.harvestedAmount) ? log.harvestedAmount : 0;

    totalNetProfit += profit;
    totalGrossRevenue += gross;
    totalCosts += cost;
    totalSlots += slots;
    totalHarvested += harvest;
    datesSet.add(log.dateStr);

    if (log.usedFocus && Number.isFinite(log.silverPerFocus)) {
      focusUsageCount += 1;
      sumSilverPerFocus += log.silverPerFocus;
    }

    // Acumulador de ítem líder
    const itemName = log.itemName || 'Desconocido';
    if (!itemProfits[itemName]) {
      itemProfits[itemName] = { profit: 0, count: 0 };
    }
    itemProfits[itemName].profit += profit;
    itemProfits[itemName].count += 1;

    // Timeline diario
    if (!dailyMap[log.dateStr]) {
      const parts = log.dateStr.split('-');
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : log.dateStr;
      dailyMap[log.dateStr] = {
        date: log.dateStr,
        displayDate,
        netProfit: 0,
        grossRevenue: 0,
        costs: 0,
        harvestsCount: 0,
      };
    }
    dailyMap[log.dateStr].netProfit += profit;
    dailyMap[log.dateStr].grossRevenue += gross;
    dailyMap[log.dateStr].costs += cost;
    dailyMap[log.dateStr].harvestsCount += 1;

    // Distribución por categoría
    const cat = log.category || 'other';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { profit: 0, revenue: 0, costs: 0 };
    }
    categoryMap[cat].profit += profit;
    categoryMap[cat].revenue += gross;
    categoryMap[cat].costs += cost;
  });

  const distinctDays = Math.max(1, datesSet.size);
  const avgDailyProfit = Math.round(totalNetProfit / distinctDays);
  const averageROI =
    totalCosts > 0 ? Math.round((totalNetProfit / totalCosts) * 100) : totalNetProfit > 0 ? 100 : 0;
  const netMarginPercentage =
    totalGrossRevenue > 0 ? Math.round((totalNetProfit / totalGrossRevenue) * 100) : 0;
  const averageSilverPerFocus =
    focusUsageCount > 0 ? Number((sumSilverPerFocus / focusUsageCount).toFixed(1)) : 0;

  // Ítem líder
  let bestItem: { name: string; profit: number; count: number } | null = null;
  Object.entries(itemProfits).forEach(([name, data]) => {
    if (!bestItem || data.profit > bestItem.profit) {
      bestItem = { name, profit: data.profit, count: data.count };
    }
  });

  // Timeline ordenado cronológicamente
  const timeline = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Distribución por categoría
  const totalPositiveProfit = Object.values(categoryMap).reduce(
    (sum, c) => sum + Math.max(0, c.profit),
    0
  );

  const categoryDistribution: CategoryDistributionPoint[] = Object.entries(categoryMap).map(
    ([catKey, data]) => {
      const conf = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.other;
      const profit = Math.max(0, data.profit);
      const percentage =
        totalPositiveProfit > 0 ? Math.round((profit / totalPositiveProfit) * 100) : 0;
      return {
        category: catKey,
        label: conf.label,
        profit: data.profit,
        revenue: data.revenue,
        costs: data.costs,
        percentage,
        color: conf.color,
      };
    }
  );

  return {
    kpis: {
      totalNetProfit,
      totalGrossRevenue,
      totalCosts,
      totalSlots,
      totalHarvested,
      averageROI,
      netMarginPercentage,
      averageSilverPerFocus,
      focusUsageCount,
      distinctDays,
      avgDailyProfit,
      bestItem,
    },
    timeline,
    categoryDistribution,
    totalPositiveProfit,
  };
}
