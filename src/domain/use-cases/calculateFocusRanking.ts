import { AlbionItem, AlbionRecipe, DestinyMasteryProfile, PriceMemory, CityId } from '../../types';
import { FocusActivityItem, FocusOptimizerSummary } from '../models/focus';
import { calculateFocusCost, calculateRecipeFocusCost } from '../../utils/destinyBoard';

export interface CalculateFocusRankingParams {
  items: AlbionItem[];
  recipes: AlbionRecipe[];
  masteryProfile: DestinyMasteryProfile;
  priceMemory: PriceMemory;
  recipePrices: Record<string, number>;
  currentCityId: CityId;
  dailyFocus?: number;
  hasPremium?: boolean;
  dailyBonusCookingRRR?: number;
  dailyBonusAlchemyRRR?: number;
}

/**
 * Caso de Uso Puro (Clean Architecture):
 * Calcula el ranking ordenado de actividades de gasto de foco en Albion Online
 * basándose 100% en los precios manuales del usuario y las fórmulas oficiales de la Tabla del Destino.
 */
export function calculateFocusRanking(params: CalculateFocusRankingParams): FocusOptimizerSummary {
  const {
    items,
    recipes,
    masteryProfile,
    priceMemory,
    recipePrices,
    currentCityId,
    dailyFocus = 10000,
    hasPremium = true,
  } = params;

  const marketTaxRate = hasPremium ? 0.065 : 0.105;
  const activities: FocusActivityItem[] = [];

  // 1. EVALUAR CULTIVOS (CROPS) Y HIERBAS (HERBS)
  items.forEach((item) => {
    if (item.category !== 'crop' && item.category !== 'herb' && item.category !== 'animal_produce') {
      return;
    }

    const memory = priceMemory[item.id];
    const hasManualPrice = Boolean(memory?.lastProductPrice || memory?.lastSeedPrice);

    const defaultSeedPrice = item.category === 'animal_produce' ? 0 : 1500 + item.tier * 400;
    const defaultProdPrice = 220 + item.tier * 60;

    const seedPrice = memory?.lastSeedPrice && memory.lastSeedPrice > 0 ? memory.lastSeedPrice : defaultSeedPrice;
    const prodPrice = memory?.lastProductPrice && memory.lastProductPrice > 0 ? memory.lastProductPrice : defaultProdPrice;

    // Cálculo oficial de foco por casilla según maestría
    const focusCostResult = calculateFocusCost(item.id, masteryProfile, seedPrice, prodPrice);
    const focusCostPerSlot = focusCostResult.focusCostPerSlot;
    const fce = focusCostResult.fce;

    const isCityBonusActive = item.bonusCityIds.includes(currentCityId);

    if (item.category === 'crop' || item.category === 'herb') {
      // Rendimiento base: 9 casillas por parcela. Con premium 1 casilla da ~9 vegetales/hierbas promedio (+10% si ciudad con bono)
      const baseYieldPerSlot = isCityBonusActive ? 9.9 : 9.0;
      const grossYieldSilver = baseYieldPerSlot * prodPrice;
      const netYieldSilver = grossYieldSilver * (1 - marketTaxRate);

      // Semillas:
      const seedReturnWithoutFocus = (item.defaultSeedReturnWithoutFocus || 0) / 100;
      const seedReturnWithFocus = (item.defaultSeedReturnWithFocus || 100) / 100;

      // Ganancia por casilla sin foco:
      const costWithoutFocus = (1 - seedReturnWithoutFocus) * seedPrice;
      const profitWithoutFocus = Math.round(netYieldSilver - costWithoutFocus);

      // Ganancia por casilla con foco:
      // Si el retorno supera 100%, el excedente se vende
      let costWithFocus = 0;
      let surplusSilver = 0;
      if (seedReturnWithFocus >= 1.0) {
        costWithFocus = 0;
        const surplusSeed = seedReturnWithFocus - 1.0;
        surplusSilver = surplusSeed * seedPrice * (1 - marketTaxRate);
      } else {
        costWithFocus = (1 - seedReturnWithFocus) * seedPrice;
      }
      const profitWithFocus = Math.round(netYieldSilver - costWithFocus + surplusSilver);

      // La plata neta ganada DIRECTAMENTE por gastar el foco:
      const extraSilverFromFocus = Math.max(0, profitWithFocus - profitWithoutFocus);
      const silverPerFocus = Number((extraSilverFromFocus / Math.max(1, focusCostPerSlot)).toFixed(2));

      // Asignación de 10.000 puntos diarios:
      const actionsPer10kFocus = Math.floor(dailyFocus / Math.max(1, focusCostPerSlot));
      const plotsOrBatchesPer10kFocus = Number((actionsPer10kFocus / 9).toFixed(1));
      const dailyNetProfitWith10k = Math.round(actionsPer10kFocus * profitWithFocus);

      activities.push({
        id: item.id,
        nameEs: item.nameEs,
        nameEn: item.nameEn,
        category: item.category as 'crop' | 'herb',
        tier: item.tier,
        iconName: item.iconName,
        cityBonusIds: item.bonusCityIds,
        isCityBonusActive,
        fce,
        focusCostPerAction: focusCostPerSlot,
        focusCostPerUnit: Math.round(focusCostPerSlot / baseYieldPerSlot),
        actionsPer10kFocus,
        plotsOrBatchesPer10kFocus,
        silverPerFocus,
        dailyNetProfitWith10k,
        profitWithoutFocus,
        profitWithFocus,
        extraSilverFromFocus,
        unitSellPrice: prodPrice,
        hasManualPrice,
        notes: isCityBonusActive ? 'Bono de Ciudad (+10% rendimiento)' : 'Sin bono de ciudad',
      });
    } else if (item.category === 'animal_produce') {
      // Animales en pastizal (Gallinas, Vacas, etc. producen huevos/leche)
      const baseProductCount = 8; // unidades de leche/huevos
      const netProductRev = baseProductCount * prodPrice * (1 - marketTaxRate);

      // Con foco se asegura retorno de crías
      const babyCost = 4000 + item.tier * 1500;
      const extraSilverFromFocus = Math.round(babyCost * 0.4); // Ahorro en cría
      const silverPerFocus = Number((extraSilverFromFocus / Math.max(1, focusCostPerSlot)).toFixed(2));

      const actionsPer10kFocus = Math.floor(dailyFocus / Math.max(1, focusCostPerSlot));
      const plotsOrBatchesPer10kFocus = Number((actionsPer10kFocus / 9).toFixed(1));
      const dailyNetProfitWith10k = Math.round(actionsPer10kFocus * (netProductRev + extraSilverFromFocus));

      activities.push({
        id: item.id,
        nameEs: item.nameEs,
        nameEn: item.nameEn,
        category: 'animal',
        tier: item.tier,
        iconName: item.iconName,
        cityBonusIds: item.bonusCityIds,
        isCityBonusActive,
        fce,
        focusCostPerAction: focusCostPerSlot,
        focusCostPerUnit: Math.round(focusCostPerSlot / baseProductCount),
        actionsPer10kFocus,
        plotsOrBatchesPer10kFocus,
        silverPerFocus,
        dailyNetProfitWith10k,
        profitWithoutFocus: Math.round(netProductRev),
        profitWithFocus: Math.round(netProductRev + extraSilverFromFocus),
        extraSilverFromFocus,
        unitSellPrice: prodPrice,
        hasManualPrice,
        notes: 'Producción continua diaria',
      });
    }
  });

  // 2. EVALUAR RECETAS DE COCINA Y ALQUIMIA
  recipes.forEach((recipe) => {
    const isCooking = recipe.category === 'cooking';
    const isCityBonusActive =
      (isCooking && currentCityId === 'caerleon') || (!isCooking && currentCityId === 'brecilien');

    // Retorno en ciudad con bono: 24.8% sin foco, 47.9% con foco
    const activeDailyBonus = isCooking ? (params.dailyBonusCookingRRR || 0) : (params.dailyBonusAlchemyRRR || 0);
    const returnRateWithoutFocus = Math.min(58.0, (isCityBonusActive ? 24.8 : 15.2) + activeDailyBonus);
    const returnRateWithFocus = Math.min(58.0, (isCityBonusActive ? 47.9 : 43.5) + activeDailyBonus);

    // Calcular costo de materias primas por lote:
    let rawCostPerBatch = 0;
    recipe.ingredients.forEach((ing) => {
      const ingPrice = priceMemory[ing.itemId]?.lastProductPrice || ing.defaultUnitPrice || 350;
      rawCostPerBatch += ing.amount * ingPrice;
    });

    const focusResult = calculateRecipeFocusCost(
      recipe,
      masteryProfile,
      rawCostPerBatch,
      returnRateWithoutFocus,
      returnRateWithFocus
    );

    const actualFocusCostPerBatch = Math.max(1, focusResult.actualFocusCostPerBatch);
    const fce = focusResult.fce;

    // Precio de venta del producto terminado:
    const recipePriceKey = `${recipe.id}_enc_0`;
    const manualSellPrice = recipePrices[recipePriceKey];
    const hasManualPrice = Boolean(manualSellPrice && manualSellPrice > 0);
    const unitSellPrice = hasManualPrice && manualSellPrice ? manualSellPrice : recipe.defaultSellPrice;

    const outputAmount = recipe.outputAmount || 10;
    const grossBatchRevenue = outputAmount * unitSellPrice;
    const netBatchRevenue = grossBatchRevenue * (1 - marketTaxRate);

    // Con tasa de retorno:
    // Costo efectivo = Costo bruto * (1 - ReturnRate / 100)
    const effectiveCostWithoutFocus = rawCostPerBatch * (1 - returnRateWithoutFocus / 100);
    const effectiveCostWithFocus = rawCostPerBatch * (1 - returnRateWithFocus / 100);

    const profitWithoutFocus = Math.round(netBatchRevenue - effectiveCostWithoutFocus);
    const profitWithFocus = Math.round(netBatchRevenue - effectiveCostWithFocus);

    // Plata ganada puramente gracias al uso de foco (materias primas extra recuperadas)
    const extraSilverFromFocus = Math.max(0, profitWithFocus - profitWithoutFocus);
    const silverPerFocus = Number((extraSilverFromFocus / actualFocusCostPerBatch).toFixed(2));

    const batchesPer10kFocus = Math.floor(dailyFocus / actualFocusCostPerBatch);
    const dailyNetProfitWith10k = Math.round(batchesPer10kFocus * profitWithFocus);

    activities.push({
      id: recipe.id,
      nameEs: recipe.nameEs,
      nameEn: recipe.nameEn,
      category: recipe.category === 'cooking' ? 'cooking' : 'alchemy',
      tier: recipe.tier,
      iconName: recipe.iconName,
      cityBonusIds: [recipe.recommendedBonusCityId],
      isCityBonusActive,
      fce,
      focusCostPerAction: actualFocusCostPerBatch,
      focusCostPerUnit: Math.round(actualFocusCostPerBatch / Math.max(1, outputAmount)),
      actionsPer10kFocus: batchesPer10kFocus,
      plotsOrBatchesPer10kFocus: batchesPer10kFocus,
      silverPerFocus,
      dailyNetProfitWith10k,
      profitWithoutFocus,
      profitWithFocus,
      extraSilverFromFocus,
      unitSellPrice,
      hasManualPrice,
      notes: isCityBonusActive
        ? `Tasa RRR bonificada (${returnRateWithFocus}%)`
        : `Sin bono local (${returnRateWithFocus}%)`,
    });
  });

  // 3. ORDENAR POR PLATA POR FOCO (SILVER / FOCUS) DESCENDENTE CON DESEMPATE DETERMINISTA
  const sortedActivities = activities.sort((a, b) => {
    if (b.silverPerFocus !== a.silverPerFocus) {
      return b.silverPerFocus - a.silverPerFocus;
    }
    return b.dailyNetProfitWith10k - a.dailyNetProfitWith10k;
  });

  const bestOverall = sortedActivities[0] || null;
  const bestFarming = sortedActivities.find((a) => a.category === 'crop' || a.category === 'herb') || null;
  const bestCrafting = sortedActivities.find((a) => a.category === 'cooking' || a.category === 'alchemy') || null;

  return {
    bestOverall,
    bestFarming,
    bestCrafting,
    topRanked: sortedActivities,
  };
}
