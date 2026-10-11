import { StationLocation, EnchantmentLevel } from '../../types';

export interface CraftCalculationInput {
  recipeId: string;
  outputAmount: number;
  nutritionCost: number;
  userMode: 'farmer' | 'crafter';
  stationLocation: StationLocation;
  hasPremium: boolean;
  useFocus: boolean;
  stationUsageFeePer100: number; // Tasa del puesto por cada 100 de nutrición
  productSellPrice: number;
  ingredients: {
    itemId: string;
    amount: number;
    unitPrice: number;
  }[];
  batchCount: number;
  enchantmentLevel: EnchantmentLevel;
  dailyProductionBonusRRR?: number; // Bono diario oficial de Albion (ej. +10% o +20% RRR)
}

export interface CraftFinancialSummary {
  rawMaterialCostGross: number;
  returnRatePercent: number;
  returnedMaterialValue: number;
  rawMaterialCostEffective: number;
  nutritionFeeTotal: number;
  totalProductionCost: number;
  totalUnitsProduced: number;
  grossRevenue: number;
  marketTaxAmount: number;
  netRevenue: number;
  netProfit: number;
  profitPerUnit: number;
  profitPerBatch: number;
  roiPercent: number;
  isProfitable: boolean;
}
