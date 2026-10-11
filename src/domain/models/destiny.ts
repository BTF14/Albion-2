export interface CraftSpecDefinition {
  id: string;
  nameEs: string;
  nameEn: string;
  desc: string;
}

export interface DestinyMasteryProfile {
  cropMastery: number; // 0 a 100
  herbMastery: number; // 0 a 100
  animalMastery: number; // 0 a 100
  chefMastery?: number; // 0 a 100
  alchemistMastery?: number; // 0 a 100
  itemSpecs: Record<string, number>; // itemId -> 0 a 100
  craftSpecs?: Record<string, number>; // specKey -> 0 a 100
}

export interface FocusEfficiencyResult {
  itemId: string;
  branchMasteryLevel: number;
  itemSpecLevel: number;
  totalFCE: number;
  branchFCEContribution: number;
  specFCEContribution: number;
  otherSpecsFCEContribution: number;
  baseFocusCost: number;
  actualFocusCost: number;
  discountPercentage: number;
  plotsPossibleWith10k: number;
  slotsPossibleWith10k: number;
  extraSilverFromFocus: number;
  silverPerFocus: number;
  dailySilverEfficiency10k: number;
}

export interface CraftFocusEfficiencyResult {
  recipeId: string;
  baseFocusCost: number;
  actualFocusCostPerBatch: number;
  totalFCE: number;
  discountPercentage: number;
  batchesWith10kFocus: number;
  resourceReturnWithoutFocus: number;
  resourceReturnWithFocus: number;
  focusBonusReturnRate: number;
  silverSavedPerBatch: number;
  silverPerFocus: number;
}
