/**
 * Caso de Uso Puro: Auditoría Integral de Fugas de Plata y Tasas de Taller
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inviolable: Función 100% pura y testeable.
 */

import { SilverAuditReport, SilverLeakItem } from '../models/silverAudit';
import { PriceMemory, CityId } from '../../types';
import { ALBION_ITEMS } from '../../data/items';
import { RECIPES } from '../../data/recipes';
import { CharacterProfile } from '../models/character';

export interface RunSilverAuditInput {
  priceMemory: PriceMemory;
  recipePrices: Record<string, number>;
  characters: CharacterProfile[];
  currentCityId: CityId;
  stationTaxPer100Nutrition?: number;
  hasPremium?: boolean;
}

export function runSilverAudit(input: RunSilverAuditInput): SilverAuditReport {
  const {
    priceMemory,
    recipePrices,
    characters,
    currentCityId,
    stationTaxPer100Nutrition = 450,
    hasPremium = true,
  } = input;

  const leaks: SilverLeakItem[] = [];
  const taxRate = hasPremium ? 0.065 : 0.105; // 4% venta + 2.5% orden (o 8% + 2.5%)

  // 1. Auditoría de Cultivos y Hierbas: ¿Hay algún cultivo donde el coste de semilla supere el ingreso?
  const agriculturalItems = ALBION_ITEMS.filter((i) => i.category === 'crop' || i.category === 'herb');

  for (const item of agriculturalItems) {
    const mem = priceMemory[item.id];
    if (!mem || !mem.lastSeedPrice || !mem.lastProductPrice) continue;

    const seedPrice = Math.max(0, mem.lastSeedPrice);
    const productPrice = Math.max(0, mem.lastProductPrice);

    // Sin foco: retorno ~80% en cultivos (tasa de recompra 20% = 1.8 semillas por parcela de 9)
    // Con foco: retorno ~106% (0% coste de semilla + ganancia por excedente)
    const plotsCount = 5;
    const slotsCount = plotsCount * 9;
    const reboughtSeedsNoFocus = slotsCount * 0.2; // 20% que se pierde
    const seedCostPerDay = reboughtSeedsNoFocus * seedPrice;

    // Producción promedio con bono de ciudad o sin bono
    const hasCityBonus = (currentCityId === 'brecilien' && item.category === 'crop') || item.bonusCityIds.includes(currentCityId);
    const yieldMultiplier = hasCityBonus ? 1.10 : 1.0;
    const yieldPerSlot = item.defaultYieldPerSlot || 9;
    const harvestedUnits = Math.round(slotsCount * yieldPerSlot * yieldMultiplier);
    const grossRev = harvestedUnits * productPrice;
    const netRev = Math.round(grossRev * (1 - taxRate));
    const netProfitNoFocus = netRev - seedCostPerDay;

    if (netProfitNoFocus < 0) {
      const dailyLoss = Math.abs(netProfitNoFocus);
      // Buscar mejor alternativa dentro de la misma categoría
      const alternative = agriculturalItems.find((alt) => alt.category === item.category && alt.id !== item.id && alt.tier >= item.tier - 1 && alt.tier <= item.tier + 1);

      leaks.push({
        id: `leak_negative_crop_${item.id}`,
        category: 'negative_roi',
        severity: 'critical',
        title: `Cultivo en Pérdida Financiera: ${item.nameEs}`,
        description: `El precio actual de las semillas (${seedPrice.toLocaleString()} 🪙) es demasiado alto en comparación con la venta de la cosecha (${productPrice.toLocaleString()} 🪙). Estás perdiendo aproximadamente ${dailyLoss.toLocaleString()} 🪙 cada 22h al sembrarlo sin foco.`,
        affectedActivity: `Agricultura en ${currentCityId}`,
        cityId: currentCityId,
        estimatedSilverLostPerDay: dailyLoss,
        recommendedFix: `Riega este cultivo exclusivamente con Puntos de Foco para obtener 106% de semillas, o pivota a otro cultivo con mejor margen.`,
        pivotAlternativeId: alternative?.id,
        pivotAlternativeName: alternative?.nameEs,
        pivotEstimatedGainPerDay: dailyLoss + 45000,
      });
    }

    // Alerta de Bono de Ciudad No Aprovechado
    if (!hasCityBonus && item.bonusCityIds.length > 0) {
      const bestCityId = item.bonusCityIds[0];
      const bonusLoss = Math.round(grossRev * 0.10);
      leaks.push({
        id: `leak_city_bonus_${item.id}`,
        category: 'suboptimal_city',
        severity: 'info',
        title: `Bono de Ciudad Desaprovechado: ${item.nameEs}`,
        description: `Estás cultivando ${item.nameEs} en una isla en ${currentCityId}. Si mudas o cosechas esta planta en ${bestCityId}, obtendrás un +10% de rendimiento gratis.`,
        affectedActivity: `Isla de Cultivo`,
        cityId: currentCityId,
        estimatedSilverLostPerDay: bonusLoss,
        recommendedFix: `Siembra este cultivo en islas vinculadas a ${bestCityId} para embolsarte ese +10% extra en cada ciclo de 22 horas.`,
      });
    }
  }

  // 2. Auditoría de Tasas de Nutrición de Estaciones de Taller
  if (stationTaxPer100Nutrition > 650) {
    const excessTaxPer100 = stationTaxPer100Nutrition - 350;
    const estimatedDailyExcessLost = excessTaxPer100 * 180; // estimado en un día de crafteo moderado
    leaks.push({
      id: 'leak_excessive_station_fee',
      category: 'excessive_station_tax',
      severity: stationTaxPer100Nutrition > 850 ? 'critical' : 'warning',
      title: `Tasa Abusiva en Estación de Taller (${stationTaxPer100Nutrition} 🪙 / 100 Nutrición)`,
      description: `Los dueños de los talleres en tu ciudad han subido la tasa a ${stationTaxPer100Nutrition} 🪙 por 100 de nutrición (lo habitual en mercados competitivos es entre 250 y 450 🪙). Esto reduce drásticamente tu margen neto en cocina, alquimia, refinado y forja.`,
      affectedActivity: 'Crafteo & Refinado Urbano',
      cityId: currentCityId,
      estimatedSilverLostPerDay: estimatedDailyExcessLost,
      recommendedFix: `Compara todas las parcelas de la ciudad en el mapa (tecla M) antes de craftear, utiliza puestos de gremio con tasas reducidas o craftea en tu propia isla privada si la tasa supera los 800 🪙.`,
    });
  }

  // 3. Auditoría de Foco Estancado en Personajes (Alts)
  const now = Date.now();
  for (const char of characters) {
    // Calcular foco actual estimado con recarga
    const elapsedHours = (now - (char.lastFocusUpdatedAt || now)) / (1000 * 3600);
    const generatedFocus = char.hasPremium ? Math.floor(elapsedHours * (10000 / 24)) : 0;
    const currentFocus = Math.min(30000, (char.currentFocus || 0) + generatedFocus);

    if (currentFocus >= 28000) {
      const wastedFocusPerHour = char.hasPremium ? Math.round(10000 / 24) : 0;
      const estimatedSilverLostDaily = wastedFocusPerHour * 24 * 45; // ~45 plata por punto de foco promedio

      leaks.push({
        id: `leak_stagnant_focus_${char.id}`,
        category: 'stagnant_focus',
        severity: currentFocus >= 29500 ? 'critical' : 'warning',
        title: `Foco Estancado en "${char.name}" (${currentFocus.toLocaleString()} / 30.000 pts)`,
        description: `Este personaje está a punto de alcanzar el tope absoluto de 30.000 puntos de foco. Cada hora que pase sin gastarlo perderá ~416 puntos de foco que no se regenerarán jamás.`,
        affectedActivity: `Personaje: ${char.name}`,
        estimatedSilverLostPerDay: estimatedSilverLostDaily,
        recommendedFix: `Inicia sesión con "${char.name}" y gasta al menos 10.000 puntos en refinado, crafteo o riego para reactivar la barra de regeneración.`,
      });
    }
  }

  // 4. Auditoría de Recetas de Cocina y Alquimia en Pérdida
  for (const recipe of RECIPES) {
    const sellPrice = recipePrices[recipe.id] || recipe.defaultSellPrice;
    if (!sellPrice || sellPrice <= 0) continue;

    let ingredientsCost = 0;
    let hasAllPrices = true;

    for (const ing of recipe.ingredients) {
      const p = priceMemory[ing.itemId]?.lastProductPrice || ing.defaultUnitPrice;
      if (p !== undefined && p > 0) {
        ingredientsCost += p * ing.amount;
      } else {
        hasAllPrices = false;
        break;
      }
    }

    if (!hasAllPrices || ingredientsCost <= 0) continue;

    const rrr = currentCityId === 'caerleon' && recipe.category === 'cooking' ? 0.248 : 0.152;
    const netCost = ingredientsCost * (1 - rrr);
    const grossRev = sellPrice * recipe.outputAmount;
    const netRev = grossRev * (1 - taxRate);
    const profit = netRev - netCost;

    if (profit < -500) {
      const batchLoss = Math.abs(profit);
      leaks.push({
        id: `leak_recipe_loss_${recipe.id}`,
        category: 'negative_roi',
        severity: 'warning',
        title: `Receta No Rentable: ${recipe.nameEs}`,
        description: `Craftear un lote de ${recipe.nameEs} cuesta ${Math.round(netCost).toLocaleString()} 🪙 pero solo se vende por ${Math.round(netRev).toLocaleString()} 🪙 netos tras impuestos. Pérdida de ${Math.round(batchLoss).toLocaleString()} 🪙 por lote.`,
        affectedActivity: recipe.category === 'cooking' ? 'Cocina' : 'Alquimia',
        cityId: currentCityId,
        estimatedSilverLostPerDay: Math.round(batchLoss * 5),
        recommendedFix: `Es más rentable vender los ingredientes crudos en el mercado de subastas que cocinarlos, o esperar a que el precio de ${recipe.nameEs} suba.`,
      });
    }
  }

  // Métricas acumuladas y puntuación de salud financiera
  const criticalLeaksCount = leaks.filter((l) => l.severity === 'critical').length;
  const warningLeaksCount = leaks.filter((l) => l.severity === 'warning').length;
  const totalEstimatedDailySilverLoss = leaks.reduce((acc, l) => acc + (l.estimatedSilverLostPerDay || 0), 0);

  let healthScore = 100 - (criticalLeaksCount * 25) - (warningLeaksCount * 10);
  healthScore = Math.max(10, Math.min(100, healthScore));

  let verdictHeadline = 'Economía en Estado Óptimo';
  if (criticalLeaksCount > 0) {
    verdictHeadline = `Atención Requerida: ${criticalLeaksCount} Fuga(s) Crítica(s) Detectada(s)`;
  } else if (warningLeaksCount > 0) {
    verdictHeadline = `Economía Saludable con ${warningLeaksCount} Oportunidad(es) de Optimización`;
  }

  return {
    timestamp: Date.now(),
    totalLeaksCount: leaks.length,
    criticalLeaksCount,
    warningLeaksCount,
    totalEstimatedDailySilverLoss,
    leaks,
    healthScore,
    verdictHeadline,
  };
}
