import { CityId } from '../../types';
import { CraftEquipmentRecipe } from './equipmentCrafting';

export type BlackMarketOrderType = 'instant_buy_order' | 'custom_sell_order';

export interface BlackMarketSimulationInput {
  recipe: CraftEquipmentRecipe;
  tier: number;
  enchantment: number;
  craftingCity: CityId;
  orderType: BlackMarketOrderType;
  currentBlackMarketPrice: number; // Precio manual u obtenido de la orden de compra
  targetRoiPercentage: number;     // ROI deseado, ej. 25%
  batchQuantity: number;           // Cantidad de piezas a craftear y vender
  useFocus: boolean;
  stationFeePer100Nutrition: number;
  craftingBonusPercent?: number;
  hasPremium: boolean;
  materialUnitCosts: Record<string, number>;
  emptyJournalPrice?: number;
  fullJournalValue?: number;
}

export interface BlackMarketSimulationResult {
  itemId: string;
  itemName: string;
  tier: number;
  enchantment: number;
  craftingCity: CityId;
  orderType: BlackMarketOrderType;
  
  // Costes de Crafteo
  grossMaterialCostPerUnit: number;
  rrrEffectivePercentage: number;
  returnedMaterialValuePerUnit: number;
  stationNutritionFeePerUnit: number;
  journalNetBenefitPerUnit: number;
  netCraftingCostPerUnit: number;
  totalBatchCraftingCost: number;

  // Umbrales de Precio para Venta en Mercado Negro
  breakEvenPrice: number;              // Precio mínimo exacto para no perder plata (0% beneficio)
  targetRoiPrice: number;              // Precio necesario para alcanzar el ROI deseado
  recommendedMinimumPrice: number;     // Umbral recomendado (+15% mínimo de seguridad)

  // Comparativa con la Orden Actual del Mercado Negro
  currentBlackMarketPrice: number;
  effectiveNetRevenuePerUnit: number;  // Neto recibido tras impuestos si aplica
  marketTaxesPerUnit: number;
  netProfitPerUnit: number;
  totalBatchNetProfit: number;
  actualRoiPercentage: number;
  
  // Veredicto Estratégico de Albion Online
  verdict: 'IMMEDIATE_PROFIT' | 'WAIT_ORDER_TICK' | 'UNPROFITABLE_NOW';
  verdictMessage: string;
  priceDeltaToTarget: number;          // Cuánta plata falta o sobra para el ROI objetivo
}
