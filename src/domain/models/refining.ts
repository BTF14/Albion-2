import { CityId } from '../../types';

export type RefiningResourceType = 'ore' | 'wood' | 'hide' | 'fiber' | 'stone';

export interface RefiningRecipe {
  id: string;
  nameEs: string;
  resourceType: RefiningResourceType;
  tier: number;
  enchantment: number; // 0, 1, 2, 3, 4
  productNameEs: string;
  rawMaterialNameEs: string;
  refinedPreviousTierNameEs?: string;
  rawAmountRequired: number; // Minerales brutos, troncos, pieles, fibras o piedras
  previousTierAmountRequired: number; // Lingote, tabla, cuero, tela o bloque del tier inferior (1 unidad)
  itemValue: number; // Valor oficial de Albion para tasa de estación de nutrición
  refiningFame: number;
}

export interface CityRefiningBonus {
  cityId: CityId;
  cityName: string;
  color: string;
  resourceType: RefiningResourceType;
  refinedProductEs: string;
  rawResourceEs: string;
  bonusCityNameEs: string;
  baseRRRWithoutFocus: number; // 36.7% en ciudad bonificada, 15.2% en ciudad no-bonificada
  baseRRRWithFocus: number;    // 53.9% en ciudad bonificada con foco, 43.5% en no-bonificada
}

export type RefiningCalculationMode = 'single_batch' | 'cascade_full';

export interface RefiningCalculationInput {
  resourceType: RefiningResourceType;
  tier: number;
  enchantment: number;
  batchCount: number; // Cuántas unidades del producto refinado se desean procesar
  cityId: CityId;
  calculationMode?: RefiningCalculationMode; // Lote único o cascada completa re-refinando
  hasDailyEventBonus: boolean;
  dailyEventBonusPercent?: number;
  useFocus: boolean;
  hasPremium: boolean;
  stationTaxPer100Nutrition: number;
  // Precios manuales
  rawMaterialPrice: number;            // Precio del recurso en bruto (ej. Mineral de Hierro T4)
  previousTierRefinedPrice: number;    // Precio del material refinado anterior T(n-1) (ej. Lingote de Bronce T3)
  finishedRefinedSellPrice: number;    // Precio de venta en mercado del producto refinado final
  // Maestría del Refinador (Destiny Board)
  refinerMasteryLevel?: number;        // Nivel de Refinador general de la rama (0-100, +30 FCE/nivel)
  resourceSpecLevel?: number;          // Nivel de Especialista del Tier específico (0-100, +250 FCE directo + 30 a la rama)
  otherTiersAverageSpec?: number;      // Nivel promedio de los demás tiers (0-100, +30 FCE/nivel)
}

export interface RefiningCalculationResult {
  resourceType: RefiningResourceType;
  tier: number;
  enchantment: number;
  batchCount: number;
  calculationMode: RefiningCalculationMode;
  effectiveRRR: number;               // % de Retorno de Recursos aplicado
  isCityBonusActive: boolean;
  bonusCityName: string;
  // Identificadores de Albion Online para ADP
  albionRawItemId: string;
  albionPrevTierItemId: string;
  albionRefinedItemId: string;
  // Consumo y Devolución de Materiales
  totalRawMaterialsRequired: number;
  rawMaterialsReturned: number;
  effectiveRawMaterialsUsed: number;
  totalPreviousTierRequired: number;
  previousTierReturned: number;
  effectivePreviousTierUsed: number;
  // Modo Cascada Completa
  cascadeMultiplier: number;          // Factor 1 / (1 - RRR)
  cascadeTotalUnitsProduced: number;  // Unidades producidas si se re-refinan los retornos
  // Finanzas Brutas y Efectivas
  grossRawMaterialCost: number;
  grossPreviousTierCost: number;
  returnedValueTotal: number;
  effectiveMaterialCost: number;
  // Tasa de la estación
  totalNutritionUsed: number;
  stationFeeTotal: number;
  totalExpenditure: number;           // Materiales efectivos + Tasa
  // Ingresos de Venta
  totalUnitsProduced: number;
  grossRevenue: number;
  marketTaxPercent: number;           // 4% o 8%
  setupFeePercent: number;            // 2.5%
  marketDeductions: number;
  netRevenue: number;
  // Balance
  netProfit: number;
  profitPerUnit: number;
  roiPercent: number;
  // Foco y Maestría
  baseFocusCostPerUnit: number;
  actualFocusCostPerUnit: number;
  totalBatchFocusCost: number;
  focusDiscountPercent: number;
  silverPerFocusPoint: number;
  unitsWith10kFocus: number;
  dailyFocusProfit: number;
  isProfitable: boolean;
  shoppingListText: string;
  recommendations: string[];
}
