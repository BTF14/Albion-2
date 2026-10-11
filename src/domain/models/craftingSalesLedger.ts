export interface BlackMarketItemRecord {
  id: string;
  timestamp: number;
  dateStr: string;
  itemId: string;
  itemName: string;
  tier: number;
  enchantment: number;
  quality: 'normal' | 'good' | 'outstanding' | 'excellent' | 'masterpiece';
  batchCount: number;
  productionCostTotal: number;
  unitProductionCost: number;
  // Destino de Venta
  destination: 'black_market' | 'royal_city';
  destinationCityName: string; // "Caerleon (Mercado Negro)" o Ciudad Real
  unitSalePrice: number;
  grossRevenue: number;
  marketTaxPercent: number; // 4% o 8%
  setupFeePercent: number;  // 2.5% o 0% si fue venta directa a orden de compra del Mercado Negro
  totalMarketFees: number;
  netRevenue: number;
  netProfit: number;
  profitPerUnit: number;
  roiPercent: number;
  notes?: string;
}
