import { RefiningResourceType } from '../models/refining';
import { CraftEquipmentRecipe } from '../models/equipmentCrafting';
import { CRAFT_EQUIPMENT_RECIPES } from '../../data/equipmentRecipes';
import { CityId } from '../../types';

export interface CraftingOpportunityFromRefining {
  recipe: CraftEquipmentRecipe;
  tier: number;
  enchantment: number;
  // Cuántas unidades de este recurso refinado consume la receta
  resourceRequirementPerItem: number;
  resourceType: RefiningResourceType;
  // Cuántas piezas exactas puedes craftear con la cantidad de recurso disponible
  craftableItemCount: number;
  // Cuánto recurso sobrará tras el crafteo
  leftoverRefinedResource: number;
  // Otros materiales secundarios requeridos para craftear esas piezas (ej. lingotes si crafteas dagas con cuero)
  secondaryMaterialsNeeded: {
    materialId: string;
    nameEs: string;
    amountPerItem: number;
    totalAmountNeeded: number;
    estimatedUnitPrice: number;
    totalEstimatedCost: number;
  }[];
  // Fama total que ganará el artesano
  totalCraftFame: number;
  // Diarios de trabajador que llenará (ej. Diarios de Cazador con chaquetas de cuero)
  journalsFilledCount: number;
  partialJournalProgressPercent: number;
  journalNameEs: string;
  associatedLabourer: 'blacksmith' | 'fletcher' | 'imbuer' | 'tinker';
  // Economía de Crafteo
  stationCityId: CityId;
  stationCityBonusActive: boolean;
  optimalCityName: string;
  estimatedSingleItemSellPrice: number;
  grossCraftRevenue: number;
  netCraftRevenue: number; // Tras impuestos
  totalSecondaryMaterialsCost: number;
  stationNutritionalFee: number;
  journalsValueContribution: number; // Valor aportado por vender o usar los diarios llenos
  // Ganancia o pérdida total neta de la cadena de crafteo
  totalChainExpenditure: number; // Coste de refinado asignado + secundarios + tasa + diarios vacíos
  totalChainRevenue: number; // Venta de equipo terminado + diarios
  netChainProfit: number;
  // Comparación directa contra venta del recurso refinado crudo
  rawRefinedSellNetRevenue: number;
  advantageOverRawSale: number; // Diferencia en Plata: craftear vs vender el material directo
  isCraftingMoreProfitable: boolean;
  roiChainPercent: number;
}

export interface RefiningToCraftingPipelineResult {
  refinedResourceType: RefiningResourceType;
  tier: number;
  enchantment: number;
  refinedUnitsAvailable: number;
  refinedUnitMarketPrice: number;
  rawRefinedTotalNetSale: number; // Cuánta plata limpia obtendrías si vendes todo el lote refinado en mercado
  opportunities: CraftingOpportunityFromRefining[];
  topOpportunity?: CraftingOpportunityFromRefining;
}

/**
 * Mapeo oficial entre tipo de recurso refinado y tipo de material en recetas de equipo
 */
const RESOURCE_TYPE_TO_MATERIAL_TYPE: Record<RefiningResourceType, 'metal' | 'leather' | 'cloth' | 'wood' | 'stone'> = {
  ore: 'metal',
  hide: 'leather',
  fiber: 'cloth',
  wood: 'wood',
  stone: 'stone',
};

/**
 * Nombre en español del diario asociado al trabajador
 */
export const LABOURER_JOURNAL_NAMES: Record<string, string> = {
  blacksmith: 'Diario de Herrero (Blacksmith)',
  fletcher: 'Diario de Flechero (Hunter / Fletcher)',
  imbuer: 'Diario de Mago (Imbuer)',
  tinker: 'Diario de Hojalatero (Tinker)',
};

/**
 * Ciudades óptimas por tipo de equipo en Albion Online
 */
export const EQUIPMENT_OPTIMAL_CITIES: Record<string, { cityId: CityId; cityName: string }> = {
  // Hunter / Fletcher
  leather_jacket_mercenary: { cityId: 'lymhurst', cityName: 'Lymhurst' },
  leather_hood_mercenary: { cityId: 'thetford', cityName: 'Thetford' },
  leather_shoes_mercenary: { cityId: 'martlock', cityName: 'Martlock' },
  bow_regular: { cityId: 'lymhurst', cityName: 'Lymhurst' },
  crossbow_regular: { cityId: 'bridgewatch', cityName: 'Bridgewatch' },
  dagger_pair: { cityId: 'bridgewatch', cityName: 'Bridgewatch' },
  torch_regular: { cityId: 'martlock', cityName: 'Martlock' },

  // Blacksmith / Forge
  plate_armor_soldier: { cityId: 'thetford', cityName: 'Thetford' },
  plate_helmet_soldier: { cityId: 'fort_sterling', cityName: 'Fort Sterling' },
  plate_boots_soldier: { cityId: 'bridgewatch', cityName: 'Bridgewatch' },
  sword_broadsword: { cityId: 'lymhurst', cityName: 'Lymhurst' },
  sword_claymore: { cityId: 'lymhurst', cityName: 'Lymhurst' },
  axe_battleaxe: { cityId: 'martlock', cityName: 'Martlock' },
  shield_standard: { cityId: 'martlock', cityName: 'Martlock' },

  // Imbuer / Mage
  cloth_robe_cleric: { cityId: 'fort_sterling', cityName: 'Fort Sterling' },
  cloth_cowl_cleric: { cityId: 'lymhurst', cityName: 'Lymhurst' },
  cloth_sandals_cleric: { cityId: 'martlock', cityName: 'Martlock' },
  fire_staff_regular: { cityId: 'bridgewatch', cityName: 'Bridgewatch' },
  holy_staff_great: { cityId: 'fort_sterling', cityName: 'Fort Sterling' },
  tome_of_spells: { cityId: 'lymhurst', cityName: 'Lymhurst' },

  // Tinker / Toolmaker
  bag_regular: { cityId: 'caerleon', cityName: 'Caerleon' },
  cape_regular: { cityId: 'caerleon', cityName: 'Caerleon' },
  tool_pickaxe: { cityId: 'caerleon', cityName: 'Caerleon' },
  tool_woodaxe: { cityId: 'caerleon', cityName: 'Caerleon' },
};

/**
 * Precios de referencia base si el usuario aún no ha introducido precio manual para un ítem de crafteo
 */
const DEFAULT_CRAFT_SELL_PRICES: Record<number, number> = {
  4: 3500,
  5: 9800,
  6: 28500,
  7: 85000,
  8: 270000,
};

const DEFAULT_JOURNAL_PROFIT: Record<number, number> = {
  4: 1200,
  5: 3100,
  6: 8500,
  7: 22000,
  8: 65000,
};

/**
 * Caso de Uso Puro: Analiza qué puedes craftear a partir del lote de recursos refinados,
 * cuántas piezas produces, cuántos diarios llenas y si te conviene fabricar o vender el material en bruto.
 * Sigue los principios inviolables de Gentleman Programming (Dominio Puro, agnóstico de React).
 */
export function calculateRefiningToCraftingPipeline(params: {
  resourceType: RefiningResourceType;
  tier: number;
  enchantment: number;
  refinedUnitsAvailable: number;
  currentRefinedUnitPrice: number;
  currentCityId: CityId;
  hasPremium: boolean;
  useFocus: boolean;
  manualPrices?: Record<string, number>;
}): RefiningToCraftingPipelineResult {
  const safeTier = Math.max(4, Math.min(8, Math.floor(Number(params.tier) || 5)));
  const safeEnchantment = Math.max(0, Math.min(4, Math.floor(Number(params.enchantment) || 0)));
  const safeUnits = Math.max(1, Math.floor(Number(params.refinedUnitsAvailable) || 1));
  const safeRefinedPrice = Math.max(0, Number(params.currentRefinedUnitPrice) || 0);
  const prices = params.manualPrices || {};

  const targetMaterialType = RESOURCE_TYPE_TO_MATERIAL_TYPE[params.resourceType];

  // Venta directa del material refinado crudo en mercado
  const marketTaxRate = params.hasPremium ? 0.04 : 0.08;
  const setupFeeRate = 0.025;
  const grossRawSale = safeUnits * safeRefinedPrice;
  const rawRefinedTotalNetSale = Math.round(grossRawSale * (1 - marketTaxRate - setupFeeRate));

  // Filtrar recetas oficiales de Albion que utilicen este recurso refinado en el tier correspondiente
  const matchingRecipes = CRAFT_EQUIPMENT_RECIPES.filter((recipe) => {
    return recipe.materials.some((mat) => mat.type === targetMaterialType);
  });

  const opportunities: CraftingOpportunityFromRefining[] = matchingRecipes.map((recipe) => {
    // Material principal que coincide con nuestro recurso
    const primaryMat = recipe.materials.find((m) => m.type === targetMaterialType);
    const resourceRequirementPerItem = Math.max(1, primaryMat ? primaryMat.amount : 1);

    // Con el lote refinado, ¿cuántas piezas podemos craftear?
    const craftableItemCount = Math.floor(safeUnits / resourceRequirementPerItem);
    const leftoverRefinedResource = safeUnits % resourceRequirementPerItem;

    if (craftableItemCount === 0) {
      // Si la cantidad no alcanza para ni 1 pieza
      return createZeroOpportunity(recipe, safeTier, safeEnchantment, resourceRequirementPerItem, params.resourceType);
    }

    // Materiales secundarios requeridos (ej. si haces chaquetas necesitas 16 cuero, 0 secundario; si haces espadas necesitas 16 lingote y 8 cuero)
    const secondaryMaterialsNeeded = recipe.materials
      .filter((m) => m.type !== targetMaterialType)
      .map((secMat) => {
        const totalAmountNeeded = secMat.amount * craftableItemCount;
        const defaultUnitPrice = safeTier === 4 ? 250 : safeTier === 5 ? 750 : safeTier === 6 ? 2200 : 6500;
        const estimatedUnitPrice = Math.max(0, Number(prices[secMat.materialId]) || defaultUnitPrice);
        const totalEstimatedCost = totalAmountNeeded * estimatedUnitPrice;

        return {
          materialId: secMat.materialId,
          nameEs: secMat.nameEs,
          amountPerItem: secMat.amount,
          totalAmountNeeded,
          estimatedUnitPrice,
          totalEstimatedCost,
        };
      });

    const totalSecondaryMaterialsCost = secondaryMaterialsNeeded.reduce((acc, s) => acc + s.totalEstimatedCost, 0);

    // Fama de crafteo y Diarios de trabajador
    const tierScale = safeTier === 4 ? 1.0 : safeTier === 5 ? 2.0 : safeTier === 6 ? 4.0 : safeTier === 7 ? 8.0 : 16.0;
    const enchantScale = safeEnchantment === 0 ? 1.0 : safeEnchantment === 1 ? 1.6 : safeEnchantment === 2 ? 2.5 : safeEnchantment === 3 ? 4.0 : 7.0;
    const baseFamePerItem = (recipe.craftFame || 300) * (tierScale / 2.0) * enchantScale;
    const totalCraftFame = Math.round(baseFamePerItem * craftableItemCount);

    const fameRequiredPerJournal =
      recipe.journalFameThreshold[safeTier] ||
      (safeTier === 4 ? 1800 : safeTier === 5 ? 3600 : safeTier === 6 ? 7200 : safeTier === 7 ? 14400 : 28800);

    const exactJournals = fameRequiredPerJournal > 0 ? totalCraftFame / fameRequiredPerJournal : 0;
    const journalsFilledCount = Math.floor(exactJournals);
    const partialJournalProgressPercent = Math.max(0, Math.min(100, Math.round((exactJournals - journalsFilledCount) * 100)));

    // Valor neto aportado por los diarios
    const defaultJournalUnitProfit = (DEFAULT_JOURNAL_PROFIT[safeTier] || 3100) * enchantScale;
    const manualFilledJournalPrice = Math.max(0, Number(prices[`filled_journal_t${safeTier}`]) || 0);
    const manualEmptyJournalPrice = Math.max(0, Number(prices[`empty_journal_t${safeTier}`]) || 0);
    const journalUnitNetProfit = manualFilledJournalPrice > manualEmptyJournalPrice
      ? manualFilledJournalPrice - manualEmptyJournalPrice
      : defaultJournalUnitProfit;

    const journalsValueContribution = Math.round(journalsFilledCount * journalUnitNetProfit);

    // Ciudad óptima y bono
    const optimalInfo = EQUIPMENT_OPTIMAL_CITIES[recipe.id] || { cityId: 'lymhurst', cityName: 'Lymhurst' };
    const stationCityBonusActive = params.currentCityId === optimalInfo.cityId;

    // Venta del ítem crafteado
    const defaultItemPrice = (DEFAULT_CRAFT_SELL_PRICES[safeTier] || 9800) * enchantScale * (recipe.itemValue / 120);
    const manualItemPrice = Math.max(0, Number(prices[`${recipe.id}_t${safeTier}`]) || 0);
    const estimatedSingleItemSellPrice = manualItemPrice > 0 ? manualItemPrice : Math.round(defaultItemPrice);

    const grossCraftRevenue = estimatedSingleItemSellPrice * craftableItemCount;
    const netCraftRevenue = Math.round(grossCraftRevenue * (1 - marketTaxRate - setupFeeRate));

    // Nutrición en el taller
    const nutritionPerItem = recipe.itemValue * (tierScale / 2.0) * 0.1125;
    const stationFeeTaxPer100 = 650; // Tasa promedio en ciudades reales
    const stationNutritionalFee = Math.round(((nutritionPerItem * craftableItemCount) / 100) * stationFeeTaxPer100);

    // Valor del recurso refinado imputado al crafteo
    const refinedResourceConsumedValue = (craftableItemCount * resourceRequirementPerItem) * safeRefinedPrice;

    // Finanzas consolidadas de la cadena
    const totalChainExpenditure = refinedResourceConsumedValue + totalSecondaryMaterialsCost + stationNutritionalFee;
    const totalChainRevenue = netCraftRevenue + journalsValueContribution;
    const netChainProfit = totalChainRevenue - totalChainExpenditure;

    // Comparación: ¿Cuánto sacas de vender el producto terminado + diarios vs vender ese mismo cuero/barra crudo en mercado?
    const equivalentRawSaleNet = Math.round(refinedResourceConsumedValue * (1 - marketTaxRate - setupFeeRate));
    const advantageOverRawSale = (netCraftRevenue + journalsValueContribution - totalSecondaryMaterialsCost - stationNutritionalFee) - equivalentRawSaleNet;
    const isCraftingMoreProfitable = advantageOverRawSale > 0;

    const roiChainPercent = totalChainExpenditure > 0
      ? Number(((netChainProfit / totalChainExpenditure) * 100).toFixed(1))
      : 0;

    return {
      recipe,
      tier: safeTier,
      enchantment: safeEnchantment,
      resourceRequirementPerItem,
      resourceType: params.resourceType,
      craftableItemCount,
      leftoverRefinedResource,
      secondaryMaterialsNeeded,
      totalCraftFame,
      journalsFilledCount,
      partialJournalProgressPercent,
      journalNameEs: LABOURER_JOURNAL_NAMES[recipe.associatedLabourer] || 'Diario de Crafteo',
      associatedLabourer: recipe.associatedLabourer,
      stationCityId: optimalInfo.cityId,
      stationCityBonusActive,
      optimalCityName: optimalInfo.cityName,
      estimatedSingleItemSellPrice,
      grossCraftRevenue,
      netCraftRevenue,
      totalSecondaryMaterialsCost,
      stationNutritionalFee,
      journalsValueContribution,
      totalChainExpenditure,
      totalChainRevenue,
      netChainProfit,
      rawRefinedSellNetRevenue: equivalentRawSaleNet,
      advantageOverRawSale,
      isCraftingMoreProfitable,
      roiChainPercent,
    };
  });

  // Ordenar oportunidades de mayor ventaja en plata a menor
  opportunities.sort((a, b) => b.advantageOverRawSale - a.advantageOverRawSale);

  const topOpportunity = opportunities.length > 0 ? opportunities[0] : undefined;

  return {
    refinedResourceType: params.resourceType,
    tier: safeTier,
    enchantment: safeEnchantment,
    refinedUnitsAvailable: safeUnits,
    refinedUnitMarketPrice: safeRefinedPrice,
    rawRefinedTotalNetSale,
    opportunities,
    topOpportunity,
  };
}

function createZeroOpportunity(
  recipe: CraftEquipmentRecipe,
  tier: number,
  enchantment: number,
  reqPerItem: number,
  resourceType: RefiningResourceType
): CraftingOpportunityFromRefining {
  return {
    recipe,
    tier,
    enchantment,
    resourceRequirementPerItem: reqPerItem,
    resourceType,
    craftableItemCount: 0,
    leftoverRefinedResource: 0,
    secondaryMaterialsNeeded: [],
    totalCraftFame: 0,
    journalsFilledCount: 0,
    partialJournalProgressPercent: 0,
    journalNameEs: LABOURER_JOURNAL_NAMES[recipe.associatedLabourer] || 'Diario de Crafteo',
    associatedLabourer: recipe.associatedLabourer,
    stationCityId: 'lymhurst',
    stationCityBonusActive: false,
    optimalCityName: 'Lymhurst',
    estimatedSingleItemSellPrice: 0,
    grossCraftRevenue: 0,
    netCraftRevenue: 0,
    totalSecondaryMaterialsCost: 0,
    stationNutritionalFee: 0,
    journalsValueContribution: 0,
    totalChainExpenditure: 0,
    totalChainRevenue: 0,
    netChainProfit: 0,
    rawRefinedSellNetRevenue: 0,
    advantageOverRawSale: 0,
    isCraftingMoreProfitable: false,
    roiChainPercent: 0,
  };
}
