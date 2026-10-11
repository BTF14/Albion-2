import { CraftCategory, EnchantmentLevel, RecipeIngredient, AlbionRecipe } from '../types';

export interface EnchantmentIngredientConfig {
  itemId: string;
  nameEs: string;
  amountPerBatch: number; // Por lote estándar (10 comidas o 5 pociones)
  defaultUnitPrice: number;
  multiplierEstimate: number; // Multiplicador estimado de precio de venta final
}

export const FOOD_ENCHANTMENT_CONFIG: Record<1 | 2 | 3, EnchantmentIngredientConfig> = {
  1: {
    itemId: 'sauce_basic',
    nameEs: 'Salsa de Pescado Básica (.1)',
    amountPerBatch: 10,
    defaultUnitPrice: 1200,
    multiplierEstimate: 1.45,
  },
  2: {
    itemId: 'sauce_fancy',
    nameEs: 'Salsa de Pescado Elegante (.2)',
    amountPerBatch: 10,
    defaultUnitPrice: 3600,
    multiplierEstimate: 2.15,
  },
  3: {
    itemId: 'sauce_special',
    nameEs: 'Salsa de Pescado Especial (.3)',
    amountPerBatch: 10,
    defaultUnitPrice: 11000,
    multiplierEstimate: 3.40,
  },
};

export const POTION_ENCHANTMENT_CONFIG: Record<1 | 2 | 3, EnchantmentIngredientConfig> = {
  1: {
    itemId: 'extract_basic',
    nameEs: 'Extracto Arcano Común (.1)',
    amountPerBatch: 5,
    defaultUnitPrice: 1400,
    multiplierEstimate: 1.50,
  },
  2: {
    itemId: 'extract_major',
    nameEs: 'Extracto Arcano Mayor (.2)',
    amountPerBatch: 5,
    defaultUnitPrice: 4200,
    multiplierEstimate: 2.20,
  },
  3: {
    itemId: 'extract_grand',
    nameEs: 'Extracto Arcano Grandioso (.3)',
    amountPerBatch: 5,
    defaultUnitPrice: 12500,
    multiplierEstimate: 3.50,
  },
};

// ==================== RECETAS DE FABRICACIÓN DE SALSAS Y EXTRACTOS ====================

export interface FishSauceRecipeDef {
  level: 1 | 2 | 3;
  id: string;
  nameEs: string;
  choppedFishNeeded: number;
  seaweedNeeded: number;
  defaultMarketPrice: number;
}

export const FISH_SAUCE_RECIPES: Record<1 | 2 | 3, FishSauceRecipeDef> = {
  1: {
    level: 1,
    id: 'sauce_basic',
    nameEs: 'Salsa de Pescado Básica (.1)',
    choppedFishNeeded: 15,
    seaweedNeeded: 1,
    defaultMarketPrice: 1200,
  },
  2: {
    level: 2,
    id: 'sauce_fancy',
    nameEs: 'Salsa de Pescado Elegante (.2)',
    choppedFishNeeded: 45,
    seaweedNeeded: 3,
    defaultMarketPrice: 3600,
  },
  3: {
    level: 3,
    id: 'sauce_special',
    nameEs: 'Salsa de Pescado Especial (.3)',
    choppedFishNeeded: 135,
    seaweedNeeded: 9,
    defaultMarketPrice: 11000,
  },
};

export interface ArcaneExtractRecipeDef {
  level: 1 | 2 | 3;
  id: string;
  nameEs: string;
  arcaneEssenceNeeded: number;
  defaultMarketPrice: number;
}

export const ARCANE_EXTRACT_RECIPES: Record<1 | 2 | 3, ArcaneExtractRecipeDef> = {
  1: {
    level: 1,
    id: 'extract_basic',
    nameEs: 'Extracto Arcano Común (.1)',
    arcaneEssenceNeeded: 1,
    defaultMarketPrice: 1400,
  },
  2: {
    level: 2,
    id: 'extract_major',
    nameEs: 'Extracto Arcano Mayor (.2)',
    arcaneEssenceNeeded: 3,
    defaultMarketPrice: 4200,
  },
  3: {
    level: 3,
    id: 'extract_grand',
    nameEs: 'Extracto Arcano Grandioso (.3)',
    arcaneEssenceNeeded: 9,
    defaultMarketPrice: 12500,
  },
};

/**
 * Calcula el coste de fabricar 1 salsa de pescado con tus precios manuales de insumos
 */
export function calculateFishSauceCraftCost(
  level: 1 | 2 | 3,
  choppedFishPrice: number,
  seaweedPrice: number
): number {
  const recipe = FISH_SAUCE_RECIPES[level];
  if (!recipe) return 0;
  return recipe.choppedFishNeeded * choppedFishPrice + recipe.seaweedNeeded * seaweedPrice;
}

/**
 * Calcula el coste de fabricar 1 extracto arcano con tu precio manual de esencia arcana
 */
export function calculateArcaneExtractCraftCost(
  level: 1 | 2 | 3,
  arcaneEssencePrice: number
): number {
  const recipe = ARCANE_EXTRACT_RECIPES[level];
  if (!recipe) return 0;
  return recipe.arcaneEssenceNeeded * arcaneEssencePrice;
}

/**
 * Obtiene el ingrediente de encantamiento necesario para una receta y subtier dado.
 */
export function getEnchantmentIngredient(
  category: CraftCategory,
  level: EnchantmentLevel
): RecipeIngredient | null {
  if (level === 0) return null;

  const config = category === 'cooking' ? FOOD_ENCHANTMENT_CONFIG[level] : POTION_ENCHANTMENT_CONFIG[level];
  if (!config) return null;

  return {
    itemId: config.itemId,
    nameEs: config.nameEs,
    amount: config.amountPerBatch,
    defaultUnitPrice: config.defaultUnitPrice,
  };
}

/**
 * Calcula el precio base sugerido del producto terminado según su nivel de encantamiento.
 */
export function getSuggestedEnchantedPrice(
  basePrice: number,
  category: CraftCategory,
  level: EnchantmentLevel
): number {
  if (level === 0) return basePrice;
  const config = category === 'cooking' ? FOOD_ENCHANTMENT_CONFIG[level] : POTION_ENCHANTMENT_CONFIG[level];
  if (!config) return basePrice;

  return Math.round(basePrice * config.multiplierEstimate);
}

// ==================== MOTOR DE COMPARACIÓN DIRECTA DE ENCHANTMENTS (.0 vs .1 vs .2 vs .3) ====================

export interface EnchantmentTierComparisonItem {
  level: EnchantmentLevel;
  levelName: string;
  badgeColor: string;
  sellUnitPrice: number;
  totalUnitsProduced: number;
  grossRevenue: number;
  marketTax: number;
  netRevenue: number;
  
  // Costes
  baseIngredientsNetCost: number;
  enchantmentIngredientName?: string;
  enchantmentItemUnits: number;
  enchantmentItemUnitPrice: number;
  enchantmentItemNetCost: number;
  stationFee: number;
  totalNetCost: number;
  
  // Rentabilidad
  netProfit: number;
  profitPerUnit: number;
  roiPercent: number;
  focusCost: number;
  silverPerFocus: number;
  
  // Comparativa contra .0 (Plano)
  diffNetProfitVsFlat: number; // Diferencia en plata neta respecto a vender plano
  diffPercentVsFlat: number; // Porcentaje de aumento o disminución
  isProfitableVsFlat: boolean; // ¿Vale la pena respecto a plano?
  
  // Distintivos
  isBestNetProfit: boolean;
  isBestSilverPerFocus: boolean;
}

export interface EnchantmentComparisonResult {
  recipe: AlbionRecipe;
  batches: number;
  returnRatePercent: number;
  marketTaxRate: number;
  tiers: Record<EnchantmentLevel, EnchantmentTierComparisonItem>;
  bestProfitLevel: EnchantmentLevel;
  bestFocusLevel: EnchantmentLevel;
  recommendationVerdict: string;
  recommendationType: 'flat_best' | 'enc1_best' | 'enc2_best' | 'enc3_best' | 'loss_warning';
}

export interface CompareEnchantmentParams {
  recipe: AlbionRecipe;
  batches: number;
  returnRatePercent: number; // RRR e.g. 24.8, 47.9
  returnRateWithoutFocus: number;
  useFocus: boolean;
  focusCostPerBatch: number;
  stationFeePer100Nutrition: number;
  marketTaxRate: number; // e.g. 0.065 para Premium
  rawPrices: Record<string, number>; // Precios unitarios de ingredientes base
  sellPrices: Record<EnchantmentLevel, number>; // Precios de venta manuales para .0, .1, .2, .3
  sauceOrExtractPrices?: Record<1 | 2 | 3, number>; // Precios unitarios de salsas/extractos
}

/**
 * Compara las 4 variantes (.0, .1, .2, .3) de una receta en paralelo bajo los mismos parámetros.
 */
export function compareEnchantmentTiers(params: CompareEnchantmentParams): EnchantmentComparisonResult {
  const {
    recipe,
    batches,
    returnRatePercent,
    returnRateWithoutFocus,
    useFocus,
    focusCostPerBatch,
    stationFeePer100Nutrition,
    marketTaxRate,
    rawPrices,
    sellPrices,
    sauceOrExtractPrices,
  } = params;

  const returnDecimal = returnRatePercent / 100;
  const returnDecimalNoFocus = returnRateWithoutFocus / 100;
  const totalUnitsProduced = recipe.outputAmount * batches;
  const totalNutrition = recipe.nutritionCost * batches;
  const stationFee = Math.round((totalNutrition / 100) * stationFeePer100Nutrition);
  const totalFocus = useFocus ? focusCostPerBatch * batches : 0;

  // 1. Coste base de insumos comunes (sin encantamiento)
  let baseGrossCost = 0;
  recipe.ingredients.forEach((ing) => {
    const unitPrice = rawPrices[ing.itemId] ?? ing.defaultUnitPrice ?? 100;
    baseGrossCost += ing.amount * batches * unitPrice;
  });
  const baseIngredientsNetCost = Math.round(baseGrossCost * (1 - returnDecimal));
  const baseIngredientsNetCostNoFocus = Math.round(baseGrossCost * (1 - returnDecimalNoFocus));

  // 2. Calcular cada nivel (.0, .1, .2, .3)
  const tiersResult: Partial<Record<EnchantmentLevel, EnchantmentTierComparisonItem>> = {};

  const levelConfigs: Array<{ level: EnchantmentLevel; name: string; color: string }> = [
    { level: 0, name: '.0 Plano', color: 'slate' },
    { level: 1, name: '.1 Verde', color: 'emerald' },
    { level: 2, name: '.2 Azul', color: 'sky' },
    { level: 3, name: '.3 Morado', color: 'purple' },
  ];

  levelConfigs.forEach(({ level, name, color }) => {
    const sellUnitPrice = sellPrices[level] || getSuggestedEnchantedPrice(recipe.defaultSellPrice, recipe.category, level);
    const grossRevenue = totalUnitsProduced * sellUnitPrice;
    const marketTax = Math.round(grossRevenue * marketTaxRate);
    const netRevenue = grossRevenue - marketTax;

    let enchantmentIngredientName: string | undefined;
    let enchantmentItemUnits = 0;
    let enchantmentItemUnitPrice = 0;
    let enchantmentItemNetCost = 0;
    let enchantmentItemNetCostNoFocus = 0;

    if (level > 0) {
      const activeLevel = level as 1 | 2 | 3;
      const config = recipe.category === 'cooking' ? FOOD_ENCHANTMENT_CONFIG[activeLevel] : POTION_ENCHANTMENT_CONFIG[activeLevel];
      enchantmentIngredientName = config.nameEs;
      enchantmentItemUnits = config.amountPerBatch * batches;
      
      if (sauceOrExtractPrices && sauceOrExtractPrices[activeLevel]) {
        enchantmentItemUnitPrice = sauceOrExtractPrices[activeLevel];
      } else {
        enchantmentItemUnitPrice = config.defaultUnitPrice;
      }

      const enchantmentGrossCost = enchantmentItemUnits * enchantmentItemUnitPrice;
      // En Albion Online, las salsas de pescado y extractos arcanos NO reciben tasa de retorno RRR (se consumen al 100%)
      enchantmentItemNetCost = enchantmentGrossCost;
      enchantmentItemNetCostNoFocus = enchantmentGrossCost;
    }

    const totalNetCost = baseIngredientsNetCost + enchantmentItemNetCost + stationFee;
    const totalNetCostNoFocus = baseIngredientsNetCostNoFocus + enchantmentItemNetCostNoFocus + stationFee;

    const netProfit = netRevenue - totalNetCost;
    const netProfitNoFocus = netRevenue - totalNetCostNoFocus;
    const profitPerUnit = Math.round(netProfit / totalUnitsProduced);
    const roiPercent = totalNetCost > 0 ? (netProfit / totalNetCost) * 100 : 0;

    let silverPerFocus = 0;
    if (useFocus && totalFocus > 0) {
      const focusValueGain = netProfit - netProfitNoFocus;
      silverPerFocus = Number((focusValueGain / totalFocus).toFixed(2));
    }

    tiersResult[level] = {
      level,
      levelName: name,
      badgeColor: color,
      sellUnitPrice,
      totalUnitsProduced,
      grossRevenue,
      marketTax,
      netRevenue,
      baseIngredientsNetCost,
      enchantmentIngredientName,
      enchantmentItemUnits,
      enchantmentItemUnitPrice,
      enchantmentItemNetCost,
      stationFee,
      totalNetCost,
      netProfit,
      profitPerUnit,
      roiPercent: Number(roiPercent.toFixed(1)),
      focusCost: totalFocus,
      silverPerFocus,
      diffNetProfitVsFlat: 0, // Se calculará después de tener .0
      diffPercentVsFlat: 0,
      isProfitableVsFlat: true,
      isBestNetProfit: false,
      isBestSilverPerFocus: false,
    };
  });

  const tiers = tiersResult as Record<EnchantmentLevel, EnchantmentTierComparisonItem>;

  // 3. Comparar cada subtier contra .0
  const flatProfit = tiers[0].netProfit;

  let bestProfitLevel: EnchantmentLevel = 0;
  let maxProfit = -Infinity;

  let bestFocusLevel: EnchantmentLevel = 0;
  let maxSilverPerFocus = -Infinity;

  ([0, 1, 2, 3] as EnchantmentLevel[]).forEach((lvl) => {
    const item = tiers[lvl];
    const diff = item.netProfit - flatProfit;
    item.diffNetProfitVsFlat = diff;
    item.isProfitableVsFlat = lvl === 0 || diff > 0;

    if (flatProfit !== 0) {
      item.diffPercentVsFlat = Number(((diff / Math.abs(flatProfit)) * 100).toFixed(1));
    } else {
      item.diffPercentVsFlat = diff > 0 ? 100 : 0;
    }

    if (item.netProfit > maxProfit) {
      maxProfit = item.netProfit;
      bestProfitLevel = lvl;
    }

    if (item.silverPerFocus > maxSilverPerFocus) {
      maxSilverPerFocus = item.silverPerFocus;
      bestFocusLevel = lvl;
    }
  });

  tiers[bestProfitLevel].isBestNetProfit = true;
  if (useFocus && maxSilverPerFocus > 0) {
    tiers[bestFocusLevel].isBestSilverPerFocus = true;
  }

  // 4. Veredicto y recomendación
  let recommendationVerdict = '';
  let recommendationType: EnchantmentComparisonResult['recommendationType'] = 'flat_best';

  if (bestProfitLevel === 0) {
    recommendationType = 'flat_best';
    recommendationVerdict = `Con tus precios actuales, es más rentable vender ${recipe.nameEs} en su versión PLANA (.0). El sobreprecio en el mercado de las versiones encantadas no compensa el coste de las salsas/extractos.`;
  } else {
    if (bestProfitLevel === 1) recommendationType = 'enc1_best';
    else if (bestProfitLevel === 2) recommendationType = 'enc2_best';
    else recommendationType = 'enc3_best';

    const bestTier = tiers[bestProfitLevel as EnchantmentLevel];
    const extraSilver = bestTier.diffNetProfitVsFlat;
    recommendationVerdict = `¡Conviene encantar a .${bestProfitLevel}! Generas +${extraSilver.toLocaleString()} Plata adicional por lote (${bestTier.diffPercentVsFlat > 0 ? '+' : ''}${bestTier.diffPercentVsFlat}%) en comparación con vender la versión plana (.0).`;
  }

  return {
    recipe,
    batches,
    returnRatePercent,
    marketTaxRate,
    tiers,
    bestProfitLevel,
    bestFocusLevel,
    recommendationVerdict,
    recommendationType,
  };
}

