import { CategoryType, CityId } from '../../types';

export interface HarvestCalculationInput {
  category: CategoryType;
  tier: number;
  plotsCount: number;
  slotsCount: number;
  returnedSeeds: number;
  reboughtSeeds: number;
  seedUnitPrice: number;
  surplusSeeds: number;
  monetizeSurplus: boolean;
  harvestedAmount: number;
  productUnitPrice: number;
  requiresFood: boolean;
  foodUnits: number;
  foodUnitPrice: number;
  usesOwnCropForFood: boolean;
  butcherFee: number;
  usedFocus: boolean;
  focusPointsSpent: number;
  taxPercent: number; // e.g. 4, 6.5, 8, 10.5
}

export interface HarvestFinancialSummary {
  seedsCost: number;
  foodCost: number;
  totalExtraFees: number;
  totalCosts: number;
  productGross: number;
  productTax: number;
  productNet: number;
  surplusGross: number;
  surplusTax: number;
  surplusNet: number;
  grossRevenue: number;
  marketTaxAmount: number;
  netRevenue: number;
  netProfit: number;
  roiPercent: number;
  profitPerPlot: number;
  profitPerSlot: number;
  silverPerFocus: number;
  isProfitable: boolean;
}
