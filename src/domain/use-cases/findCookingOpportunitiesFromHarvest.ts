import { RECIPES } from '../../data/recipes';
import { AlbionRecipe } from '../../types';

export interface CookingOpportunityFromHarvest {
  recipe: AlbionRecipe;
  ingredientNameEs: string;
  amountRequiredPerBatch: number;
  batchesPossible: number;
  totalOutputUnits: number;
  estimatedProfitPerBatch: number;
  totalEstimatedNetProfit: number;
  silverPerFocus: number;
  isProfitable: boolean;
}

/**
 * Busca qué recetas de Cocina y Alquimia se pueden elaborar a partir de un cultivo/carne/producto cosechado.
 * Retorna las oportunidades ordenadas por rentabilidad y viabilidad.
 */
export function findCookingOpportunitiesFromHarvest(
  harvestItemId: string,
  harvestAmount: number,
  manualPrices: Record<string, number> = {}
): CookingOpportunityFromHarvest[] {
  const safeHarvestAmount = Math.max(0, Number.isFinite(harvestAmount) ? harvestAmount : 0);
  if (!harvestItemId || safeHarvestAmount <= 0) return [];

  // Mapear el ID de cosecha al ID de ingrediente en RECIPES si difieren ligeramente
  // Por ejemplo 'crop_wheat' coincide con itemId: 'crop_wheat'
  const matchingRecipes = RECIPES.filter((r) => {
    return r.ingredients.some((ing) => ing.itemId === harvestItemId);
  });

  return matchingRecipes.map((recipe) => {
    const ing = recipe.ingredients.find((i) => i.itemId === harvestItemId);
    const amountPerBatch = Math.max(1, ing ? ing.amount : 1);
    const ingredientNameEs = ing ? ing.nameEs : 'Ingrediente';
    const batchesPossible = Math.floor(safeHarvestAmount / amountPerBatch);
    const totalOutputUnits = batchesPossible * (recipe.outputAmount || 10);

    // Cálculo estimado rápido de ganancia
    const sellPrice = Math.max(0, manualPrices[`recipe_sell_${recipe.id}`] || recipe.defaultSellPrice);
    const grossRevenue = (sellPrice * totalOutputUnits);
    const netRevenue = Math.round(grossRevenue * 0.935); // 6.5% impuesto medio

    // Coste de otros ingredientes (estimado con defaultUnitPrice)
    const otherCostPerBatch = recipe.ingredients
      .filter((i) => i.itemId !== harvestItemId)
      .reduce((acc, other) => {
        const p = manualPrices[`ing_${other.itemId}`] || other.defaultUnitPrice || 500;
        return acc + (p * other.amount);
      }, 0);

    const harvestUnitVal = manualPrices[`prod_${harvestItemId}`] || 400;
    const harvestValueUsed = batchesPossible * amountPerBatch * harvestUnitVal;
    const totalProductionCost = (otherCostPerBatch * batchesPossible) + harvestValueUsed;

    const totalEstimatedNetProfit = netRevenue - totalProductionCost;
    const estimatedProfitPerBatch = batchesPossible > 0 ? Math.round(totalEstimatedNetProfit / batchesPossible) : 0;
    const silverPerFocus = recipe.baseFocusCost > 0 
      ? Math.round(Math.max(0, totalEstimatedNetProfit) / (recipe.baseFocusCost * Math.max(1, batchesPossible)))
      : 0;

    return {
      recipe,
      ingredientNameEs,
      amountRequiredPerBatch: amountPerBatch,
      batchesPossible,
      totalOutputUnits,
      estimatedProfitPerBatch,
      totalEstimatedNetProfit,
      silverPerFocus,
      isProfitable: totalEstimatedNetProfit > 0,
    };
  }).filter((opp) => opp.batchesPossible > 0)
    .sort((a, b) => b.totalEstimatedNetProfit - a.totalEstimatedNetProfit);
}
