import { DailyLogEntry, PriceMemory, CityId, AlbionItem } from '../types';
import { ALBION_ITEMS, CITIES } from '../data/items';
import { RECIPES } from '../data/recipes';
import { ALBION_MOUNTS, AlbionMount } from '../data/mounts';
import { RECIPE_MARKET_PROFILES } from './marketVelocity';

export type OpportunityCategory = 'crop' | 'herb' | 'food' | 'potion' | 'mount';

export interface MarketOpportunityItem {
  id: string;
  nameEs: string;
  nameEn?: string;
  tier: number;
  category: OpportunityCategory;
  categoryLabelEs: string;
  iconName: string;
  productionFacilityEs: string; // ej. "Granja (Parcela 9)", "Cocina (Caerleon +15%)", "Pastizal + Guarnicionero"
  recommendedCityNameEs?: string;

  // Métricas financieras
  estimatedNetProfit: number; // Plata neta por ciclo / lote / montura
  profitUnitLabelEs: string; // ej. "por parcela (9)", "por lote (10u)", "por montura ensillada"
  profitPerDay22h: number; // Normalizado a plata neta por 22 horas
  roiPercent: number; // Margen de retorno % sobre inversión
  investmentRequired: number; // Coste en semillas, crías, alimentos o insumos
  estimatedGrossRevenue: number;
  silverPerFocusEstimate?: number;

  // Métricas de rotación y velocidad de absorción
  rotationSpeed: 'ultra_fast' | 'fast' | 'moderate' | 'slow_niche';
  rotationSpeedLabelEs: string;
  saleTimeEst: string; // ej. "1 - 3 horas", "1 - 2 días"
  dailyDemandEst: string; // ej. "1,500 - 3,500 u./día"
  quadrantBadgeClass: string;
  quadrantTitleEs: string;

  // Datos históricos del usuario
  historicalHarvestsCount: number;
  historicalTotalNetProfit: number;
  historicalAvgProfit: number;
  hasUserHistory: boolean;

  // Recomendaciones y consejos
  strategicTip: string;
  actionType: 'simulator' | 'crafting' | 'mount_info' | 'logger';
  targetRecipeId?: string;
}

export interface OpportunitiesSummary {
  bestCrop: MarketOpportunityItem | null;
  bestHerb: MarketOpportunityItem | null;
  bestFood: MarketOpportunityItem | null;
  bestPotion: MarketOpportunityItem | null;
  bestMount: MarketOpportunityItem | null;
  topOverallOpportunities: MarketOpportunityItem[];
  allOpportunities: MarketOpportunityItem[];
}

/**
 * Normaliza velocidad en etiqueta y clases visuales
 */
function getSpeedBadge(speed: 'ultra_fast' | 'fast' | 'moderate' | 'slow_niche') {
  switch (speed) {
    case 'ultra_fast':
      return {
        label: '⚡ Salida Ultrarrápida',
        quadrantTitle: 'Pan Caliente / Oro',
        classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-700',
      };
    case 'fast':
      return {
        label: '⏱️ Salida Rápida',
        quadrantTitle: 'Alta Liquidez',
        classes: 'bg-sky-950/80 text-sky-300 border-sky-700',
      };
    case 'moderate':
      return {
        label: '⏳ Salida Moderada',
        quadrantTitle: 'Volumen Medio',
        classes: 'bg-amber-950/80 text-amber-300 border-amber-700',
      };
    case 'slow_niche':
      return {
        label: '💎 Mercado de Nicho',
        quadrantTitle: 'Lujo / Exclusivo',
        classes: 'bg-purple-950/80 text-purple-300 border-purple-700',
      };
  }
}

/**
 * Precios de referencia por defecto para semillas si el usuario aún no ingresó un precio manual
 */
const DEFAULT_SEED_PRICES: Record<string, number> = {
  crop_carrot: 2000,
  crop_bean: 4000,
  crop_wheat: 8000,
  crop_turnip: 16000,
  crop_cabbage: 32000,
  crop_potato: 64000,
  crop_corn: 128000,
  crop_pumpkin: 256000,
  herb_burdock: 2000,
  herb_agaric: 4000,
  herb_comfrey: 8000,
  herb_teasel: 16000,
  herb_foxglove: 32000,
  herb_mullein: 64000,
  herb_yarrow: 128000,
};

const DEFAULT_PRODUCT_PRICES: Record<string, number> = {
  crop_carrot: 360,
  crop_bean: 380,
  crop_wheat: 410,
  crop_turnip: 430,
  crop_cabbage: 460,
  crop_potato: 490,
  crop_corn: 520,
  crop_pumpkin: 550,
  herb_burdock: 280,
  herb_agaric: 350,
  herb_comfrey: 420,
  herb_teasel: 480,
  herb_foxglove: 540,
  herb_mullein: 620,
  herb_yarrow: 720,
};

/**
 * Calcula y genera la matriz completa de oportunidades de mercado
 * integrando los registros históricos de cosecha, la memoria de precios y
 * la velocidad de rotación real en Albion Online.
 */
export function calculateMarketOpportunities(
  logs: DailyLogEntry[],
  priceMemory: PriceMemory,
  recipePrices: Record<string, number> = {},
  currentCityId: CityId = 'martlock',
  hasPremium: boolean = true
): OpportunitiesSummary {
  const opportunities: MarketOpportunityItem[] = [];

  // Mapear historial de usuario por item
  const userHistoryMap: Record<
    string,
    {
      count: number;
      totalProfit: number;
      totalPlots: number;
      avgProfit: number;
      avgROI: number;
      avgSilverPerFocus: number;
      bestCityId: CityId;
    }
  > = {};

  logs.forEach((log) => {
    const key = log.itemId;
    if (!userHistoryMap[key]) {
      userHistoryMap[key] = {
        count: 0,
        totalProfit: 0,
        totalPlots: 0,
        avgProfit: 0,
        avgROI: 0,
        avgSilverPerFocus: 0,
        bestCityId: log.cityId,
      };
    }
    userHistoryMap[key].count += 1;
    userHistoryMap[key].totalProfit += log.netProfit;
    userHistoryMap[key].totalPlots += log.plotsCount || 1;
  });

  Object.values(userHistoryMap).forEach((val) => {
    val.avgProfit = val.count > 0 ? Math.round(val.totalProfit / val.count) : 0;
  });

  const taxRate = hasPremium ? 0.04 : 0.08; // Impuesto de venta de orden (4% con premium, 8% sin premium)

  // =========================================================================
  // 1. CULTIVOS Y HIERBAS (CROPS & HERBS)
  // =========================================================================
  const farmingItems = ALBION_ITEMS.filter((i) => i.category === 'crop' || i.category === 'herb');

  farmingItems.forEach((item) => {
    const isCrop = item.category === 'crop';
    const history = userHistoryMap[item.id];
    const hasHistory = !!history && history.count > 0;

    // Precios manuales guardados vs defaults
    const seedPrice =
      priceMemory[item.id]?.lastSeedPrice || DEFAULT_SEED_PRICES[item.id] || 8000;
    const productPrice =
      priceMemory[item.id]?.lastProductPrice || DEFAULT_PRODUCT_PRICES[item.id] || 400;

    // Cálculo por parcela estándar de 9 casillas
    const hasCityBonus = item.bonusCityIds.includes(currentCityId);
    // Base 9.33 unidades por casilla (84 u.) con bono +10% (~96 u.)
    const yieldPerSlot = hasCityBonus ? 10.66 : 9.33;
    const totalYield = Math.round(yieldPerSlot * 9);

    // Retorno de semilla con foco promedio (~91%) o sin foco (0% en cultivos, ~66-92% en hierbas)
    const seedReturnRateWithFocus = (item.defaultSeedReturnWithFocus || 100) / 100;
    // Si se usa foco, recuperas la mayoría de semillas (solo recompras 1 o 2 por parcela)
    const seedsLostWithFocus = Math.max(0, 9 - 9 * (seedReturnRateWithFocus * 0.9));
    const rebuyCostWithFocus = Math.round(seedsLostWithFocus * seedPrice);

    // Sin foco:
    const seedReturnRateNoFocus = (item.defaultSeedReturnWithoutFocus || 0) / 100;
    const seedsLostNoFocus = Math.max(0, 9 - 9 * seedReturnRateNoFocus);
    const rebuyCostNoFocus = Math.round(seedsLostNoFocus * seedPrice);

    // Ingreso bruto de la cosecha
    const grossRevenue = totalYield * productPrice;
    const marketTax = Math.round(grossRevenue * taxRate);
    const netRevenue = grossRevenue - marketTax;

    // Beneficio neto estimado por parcela de 9 casillas (promediado entre foco y sin foco)
    const estimatedNetProfit =
      hasHistory && history.totalPlots > 0
        ? Math.round(history.totalProfit / history.totalPlots)
        : Math.round(netRevenue - rebuyCostWithFocus);

    const investment = Math.round(9 * seedPrice);
    const roiPercent = investment > 0 ? Math.round((estimatedNetProfit / investment) * 100) : 100;

    // Velocidad de rotación
    let speed: 'ultra_fast' | 'fast' | 'moderate' | 'slow_niche' = 'fast';
    if (['crop_wheat', 'crop_carrot', 'crop_cabbage', 'herb_comfrey', 'herb_foxglove'].includes(item.id)) {
      speed = 'ultra_fast';
    } else if (['crop_pumpkin', 'herb_yarrow'].includes(item.id)) {
      speed = 'moderate';
    }

    const badge = getSpeedBadge(speed);
    const bonusCity = CITIES.find((c) => item.bonusCityIds.includes(c.id));

    opportunities.push({
      id: item.id,
      nameEs: item.nameEs,
      nameEn: item.nameEn,
      tier: item.tier,
      category: isCrop ? 'crop' : 'herb',
      categoryLabelEs: isCrop ? 'Cultivo Agrícola' : 'Hierba Alquímica',
      iconName: item.iconName,
      productionFacilityEs: isCrop ? 'Granja (Parcela 9)' : 'Jardín de Hierbas (Parcela 9)',
      recommendedCityNameEs: bonusCity ? `${bonusCity.name} (+10%)` : undefined,
      estimatedNetProfit,
      profitUnitLabelEs: 'por parcela (9 casillas / 22h)',
      profitPerDay22h: estimatedNetProfit,
      roiPercent,
      investmentRequired: investment,
      estimatedGrossRevenue: grossRevenue,
      silverPerFocusEstimate: isCrop ? Math.round(rebuyCostNoFocus / (450 * 9)) : undefined,
      rotationSpeed: speed,
      rotationSpeedLabelEs: badge.label,
      saleTimeEst: speed === 'ultra_fast' ? '1 - 3 horas' : '3 - 8 horas',
      dailyDemandEst: isCrop ? '3,000 - 8,000 u./día' : '1,500 - 4,000 u./día',
      quadrantBadgeClass: badge.classes,
      quadrantTitleEs: badge.quadrantTitle,
      historicalHarvestsCount: history?.count || 0,
      historicalTotalNetProfit: history?.totalProfit || 0,
      historicalAvgProfit: history?.avgProfit || 0,
      hasUserHistory: hasHistory,
      strategicTip: hasCityBonus
        ? `¡Aprovecha el bono de tu isla en ${bonusCity?.name}! Te da +10% de cosecha garantizada.`
        : `Demanda masiva permanente para abastecer cocineros y alquimistas de zona real y negra.`,
      actionType: 'simulator',
    });
  });

  // =========================================================================
  // 2. COMIDAS Y POCIONES (FOOD & POTIONS)
  // =========================================================================
  RECIPES.forEach((recipe) => {
    const isFood = recipe.category === 'cooking';
    const profile = RECIPE_MARKET_PROFILES[recipe.id];
    const speed = profile?.baseSpeed || 'fast';
    const badge = getSpeedBadge(speed);

    // Coste de ingredientes por lote
    let ingredientsCost = 0;
    recipe.ingredients.forEach((ing) => {
      const unitPrice =
        priceMemory[ing.itemId]?.lastProductPrice || ing.defaultUnitPrice || 400;
      ingredientsCost += unitPrice * ing.amount;
    });

    // RRR (Resource Return Rate): Caerleon para comida (+15% RRR = 24.8% efectivo), Brecilien para pociones
    const rrr = isFood
      ? currentCityId === 'caerleon'
        ? 0.248
        : 0.152
      : currentCityId === 'brecilien'
      ? 0.248
      : 0.152;

    const effectiveCost = Math.round(ingredientsCost * (1 - rrr));

    // Precio de venta unitario
    const unitSellPrice =
      recipePrices[recipe.id] || recipe.defaultSellPrice || (isFood ? 2500 : 3200);

    const grossRevenue = unitSellPrice * recipe.outputAmount;
    const marketTax = Math.round(grossRevenue * taxRate);
    const netRevenue = grossRevenue - marketTax;
    const netProfitPerBatch = netRevenue - effectiveCost;

    const roiPercent = effectiveCost > 0 ? Math.round((netProfitPerBatch / effectiveCost) * 100) : 0;

    opportunities.push({
      id: recipe.id,
      nameEs: recipe.nameEs,
      nameEn: recipe.nameEn,
      tier: recipe.tier,
      category: isFood ? 'food' : 'potion',
      categoryLabelEs: isFood ? 'Comida Elaborada' : 'Poción Alquímica',
      iconName: recipe.iconName,
      productionFacilityEs: isFood
        ? 'Cocina (Bono Caerleon +15%)'
        : 'Alquimia (Bono Brecilien +15%)',
      recommendedCityNameEs: isFood ? 'Caerleon (+15% RRR)' : 'Brecilien (+15% RRR)',
      estimatedNetProfit: netProfitPerBatch,
      profitUnitLabelEs: `por lote (${recipe.outputAmount} unidades)`,
      profitPerDay22h: netProfitPerBatch * 5, // Estimado de 5 lotes diarios cómodos
      roiPercent,
      investmentRequired: effectiveCost,
      estimatedGrossRevenue: grossRevenue,
      rotationSpeed: speed,
      rotationSpeedLabelEs: badge.label,
      saleTimeEst: profile?.typicalSaleHoursEst || '2 - 6 horas',
      dailyDemandEst: profile?.dailyCityVolumeEst || '1,000 - 3,000 u./día',
      quadrantBadgeClass: badge.classes,
      quadrantTitleEs: badge.quadrantTitle,
      historicalHarvestsCount: 0,
      historicalTotalNetProfit: 0,
      historicalAvgProfit: 0,
      hasUserHistory: false,
      strategicTip: profile?.primaryUseEs
        ? `Uso principal: ${profile.primaryUseEs}.`
        : 'Demanda continua en mercados de ciudades reales.',
      actionType: 'crafting',
      targetRecipeId: recipe.id,
    });
  });

  // =========================================================================
  // 3. MONTURAS Y PASTIZALES AVANZADOS (MOUNTS)
  // =========================================================================
  ALBION_MOUNTS.forEach((mount) => {
    const badge = getSpeedBadge(mount.rotationSpeed);

    // Coste de la cría/potro
    const babyPrice = Math.max(0, Number(mount.defaultBabyPrice) || 0);

    // Coste de comida (grano para herbívoros o carne para carnívoros)
    const rawFoodPrice =
      mount.diet === 'herbivore'
        ? priceMemory['crop_wheat']?.lastProductPrice ?? mount.defaultFoodUnitPrice
        : priceMemory['animal_meat_chicken']?.lastProductPrice ?? mount.defaultFoodUnitPrice;

    const foodPrice = Math.max(0, Number.isFinite(rawFoodPrice) ? rawFoodPrice : mount.defaultFoodUnitPrice);
    const totalFoodCost = Math.max(0, mount.totalFoodRequired * foodPrice);

    // Coste de ensillado (20 cueros o 20 tablas de madera en el guarnicionero)
    const saddleCost = Math.max(0, mount.saddleMaterialAmount * mount.defaultSaddleMaterialUnitPrice);

    // Coste total de producción
    const totalProductionCost = babyPrice + totalFoodCost + saddleCost;

    // Precio de venta en el mercado
    const sellPrice = Math.max(0, Number(mount.defaultSellPrice) || 0);
    const grossRevenue = sellPrice;
    const marketTax = Math.round(grossRevenue * taxRate);
    const netRevenue = grossRevenue - marketTax;
    const netProfit = netRevenue - totalProductionCost;

    // Normalizado a ciclo de 22 horas
    const profitPerDay22h = Math.round(netProfit / Math.max(1, mount.cycles22h));
    const roiPercent =
      totalProductionCost > 0 ? Math.round((netProfit / totalProductionCost) * 100) : 0;

    opportunities.push({
      id: mount.id,
      nameEs: mount.nameEs,
      nameEn: mount.nameEn,
      tier: mount.tier,
      category: 'mount',
      categoryLabelEs: 'Crianza & Ensillado de Montura',
      iconName: mount.category === 'ox' ? 'Beef' : 'Package',
      productionFacilityEs: `${
        mount.building === 'pasture' ? 'Pastizal' : 'Criadero (Kennel)'
      } + Guarnicionero`,
      recommendedCityNameEs: 'Cualquier Ciudad Real',
      estimatedNetProfit: netProfit,
      profitUnitLabelEs: `por montura ensillada (${mount.cycles22h * 22}h total)`,
      profitPerDay22h,
      roiPercent,
      investmentRequired: totalProductionCost,
      estimatedGrossRevenue: grossRevenue,
      rotationSpeed: mount.rotationSpeed,
      rotationSpeedLabelEs: badge.label,
      saleTimeEst: mount.saleTimeEst,
      dailyDemandEst: mount.demandDailyEst,
      quadrantBadgeClass: badge.classes,
      quadrantTitleEs: badge.quadrantTitle,
      historicalHarvestsCount: 0,
      historicalTotalNetProfit: 0,
      historicalAvgProfit: 0,
      hasUserHistory: false,
      strategicTip: `Requiere ${mount.totalFoodRequired} u. de alimento y ensillar con ${mount.saddleMaterialAmount} ${mount.saddleMaterialNameEs}.`,
      actionType: 'mount_info',
    });
  });

  // Top oportunidades por categoría (ordenadas por beneficio neto y ROI)
  const crops = opportunities.filter((o) => o.category === 'crop');
  const herbs = opportunities.filter((o) => o.category === 'herb');
  const foods = opportunities.filter((o) => o.category === 'food');
  const potions = opportunities.filter((o) => o.category === 'potion');
  const mounts = opportunities.filter((o) => o.category === 'mount');

  const sortByNetProfit = (a: MarketOpportunityItem, b: MarketOpportunityItem) =>
    b.estimatedNetProfit - a.estimatedNetProfit;

  const bestCrop = [...crops].sort(sortByNetProfit)[0] || null;
  const bestHerb = [...herbs].sort(sortByNetProfit)[0] || null;
  const bestFood = [...foods].sort(sortByNetProfit)[0] || null;
  const bestPotion = [...potions].sort(sortByNetProfit)[0] || null;
  const bestMount = [...mounts].sort((a, b) => b.profitPerDay22h - a.profitPerDay22h)[0] || null;

  // Top Overall (mezcla balanceada de rotación y margen)
  const topOverallOpportunities = [...opportunities]
    .filter((o) => o.estimatedNetProfit > 0)
    .sort((a, b) => {
      // Ponderación: Beneficio normalizado por día * factor de velocidad
      const speedMultiplierA =
        a.rotationSpeed === 'ultra_fast'
          ? 1.5
          : a.rotationSpeed === 'fast'
          ? 1.2
          : a.rotationSpeed === 'moderate'
          ? 0.9
          : 0.6;
      const speedMultiplierB =
        b.rotationSpeed === 'ultra_fast'
          ? 1.5
          : b.rotationSpeed === 'fast'
          ? 1.2
          : b.rotationSpeed === 'moderate'
          ? 0.9
          : 0.6;
      return b.profitPerDay22h * speedMultiplierB - a.profitPerDay22h * speedMultiplierA;
    })
    .slice(0, 10);

  return {
    bestCrop,
    bestHerb,
    bestFood,
    bestPotion,
    bestMount,
    topOverallOpportunities,
    allOpportunities: opportunities,
  };
}
