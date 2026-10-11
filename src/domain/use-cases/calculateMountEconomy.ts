import {
  MountDefinition,
  MountBreedingInput,
  MountBreedingResult,
  MountStrategySummary,
} from '../models/mounts';

/**
 * Caso de Uso Puro (Gentleman Programming - Clean Architecture)
 * Calcula la rentabilidad financiera integral de criar monturas en Albion Online:
 * - Coste de crías compradas vs nacidas en granja
 * - Consumo estricto de 10 unidades de alimento/día por animal
 * - Retorno probabilístico de crías (con foco vs sin foco)
 * - Coste de ensillado en Guarnicionero (Cuero/Tablas/Barras + Tasa de nutrición)
 * - Comparativa lado a lado: Vender animal adulto vs Ensillar y vender montura lista
 * - Eficiencia de Puntos de Foco (Plata / Foco)
 */
export function calculateMountEconomy(
  input: MountBreedingInput,
  definition: MountDefinition
): MountBreedingResult {
  // 1. Sanitización defensiva de entradas
  const mountCount = Math.max(1, Math.floor(input.mountCount || 1));
  const growthCycles = Math.max(1, definition.growthCycles || 1);
  const cycleHours = input.hasPremium ? 22 : 44; // 22h con Premium, 44h sin Premium
  const totalGrowthHours = growthCycles * cycleHours;

  const foodUnitPrice = Math.max(0, Number.isFinite(input.foodUnitPrice) ? input.foodUnitPrice : 0);
  const babyUnitPrice = Math.max(0, Number.isFinite(input.babyUnitPrice) ? input.babyUnitPrice : 0);
  const saddlingMaterialUnitPrice = Math.max(
    0,
    Number.isFinite(input.saddlingMaterialUnitPrice) ? input.saddlingMaterialUnitPrice : 0
  );
  const stationFeePer100 = Math.max(
    0,
    Number.isFinite(input.stationFeePer100Nutrition) ? input.stationFeePer100Nutrition : 0
  );
  const adultSellPrice = Math.max(0, Number.isFinite(input.adultSellPrice) ? input.adultSellPrice : 0);
  const saddledSellPrice = Math.max(0, Number.isFinite(input.saddledSellPrice) ? input.saddledSellPrice : 0);

  // Impuesto de mercado oficial: 6.5% con Premium (2.5% setup + 4% sales tax), 10.5% sin Premium
  const marketTaxRate = Math.max(
    0,
    Number.isFinite(input.marketTaxRate) ? input.marketTaxRate : input.hasPremium ? 6.5 : 10.5
  );

  // 2. Cálculo de Alimento y Crianza Base
  // En Albion, cada animal consume estrictamente 10 unidades por ciclo de 22h
  const totalFoodUnits = definition.foodPerCycle * growthCycles * mountCount;
  const foodTotalCost = totalFoodUnits * foodUnitPrice;

  // Coste de crías (si se compraron en mercado o se contabilizan como coste de adquisición)
  const babyTotalCost = input.isBabyRaisedOwn ? 0 : babyUnitPrice * mountCount;
  const grossBreedingCost = babyTotalCost + foodTotalCost;

  // 3. Retorno de Crías (Offspring return)
  const offspringChancePercent = input.useNurtureFocus
    ? definition.offspringChanceWithFocus
    : definition.offspringChanceWithoutFocus;

  const offspringExpectedCount = (offspringChancePercent / 100) * mountCount;
  // El valor de las crías devueltas compensa el gasto de crianza
  const offspringValueTotal = offspringExpectedCount * babyUnitPrice;

  // Coste neto de criar al animal adulto
  const netBreedingCost = Math.max(0, grossBreedingCost - offspringValueTotal);
  const netBreedingCostPerUnit = mountCount > 0 ? netBreedingCost / mountCount : 0;

  // 4. Estrategia 1: Vender sólo animal adulto domado (Tame)
  const adultGrossRevenue = adultSellPrice * mountCount;
  const adultMarketTax = (adultGrossRevenue * marketTaxRate) / 100;
  const adultNetRevenue = adultGrossRevenue - adultMarketTax;
  const adultNetProfit = adultNetRevenue - netBreedingCost;
  const adultRoiPercent =
    netBreedingCost > 0 ? (adultNetProfit / netBreedingCost) * 100 : adultNetProfit > 0 ? 100 : 0;
  const adultProfitPerUnit = mountCount > 0 ? adultNetProfit / mountCount : 0;
  const totalDays = totalGrowthHours / 24;
  const adultProfitPerDay = totalDays > 0 ? adultNetProfit / totalDays : adultNetProfit;

  const strategyAdult: MountStrategySummary = {
    grossRevenue: adultGrossRevenue,
    marketTax: adultMarketTax,
    netRevenue: adultNetRevenue,
    totalCost: netBreedingCost,
    netProfit: adultNetProfit,
    roiPercent: adultRoiPercent,
    profitPerUnit: adultProfitPerUnit,
    profitPerDay: adultProfitPerDay,
    isProfitable: adultNetProfit > 0,
  };

  // 5. Estrategia 2: Ensillar en el Guarnicionero (Saddler)
  const materialUnitsNeeded = definition.saddlingMaterial.amount * mountCount;
  const saddlingMaterialCostGross = materialUnitsNeeded * saddlingMaterialUnitPrice;

  // Tasa de estación de nutrición en la ciudad
  const totalNutritionCost = (definition.saddlerBaseNutrition * mountCount * stationFeePer100) / 100;

  // Tasa de Retorno de Recursos (RRR) en el Guarnicionero:
  // Base ciudad sin foco: 15.2%
  // Con foco en guarnicionero: ~43.5%
  // Bono diario de producción (ej. +10% en monturas/guarnicionero):
  const dailyBonus = Math.max(0, input.dailyProductionBonusRRR || 0);

  let saddlingReturnRatePercent = 15.2 + dailyBonus;
  if (input.useSaddlerFocus) {
    saddlingReturnRatePercent = 43.5 + dailyBonus;
  }
  // En Albion el RRR máximo ronda 53.9%
  saddlingReturnRatePercent = Math.min(55, saddlingReturnRatePercent);

  const saddlingReturnedMaterialValue =
    (saddlingMaterialCostGross * saddlingReturnRatePercent) / 100;

  const saddlingNetCost = Math.max(
    0,
    saddlingMaterialCostGross - saddlingReturnedMaterialValue + totalNutritionCost
  );

  const totalSaddledCost = netBreedingCost + saddlingNetCost;

  const saddledGrossRevenue = saddledSellPrice * mountCount;
  const saddledMarketTax = (saddledGrossRevenue * marketTaxRate) / 100;
  const saddledNetRevenue = saddledGrossRevenue - saddledMarketTax;
  const saddledNetProfit = saddledNetRevenue - totalSaddledCost;
  const saddledRoiPercent =
    totalSaddledCost > 0 ? (saddledNetProfit / totalSaddledCost) * 100 : saddledNetProfit > 0 ? 100 : 0;
  const saddledProfitPerUnit = mountCount > 0 ? saddledNetProfit / mountCount : 0;
  const saddledProfitPerDay = totalDays > 0 ? saddledNetProfit / totalDays : saddledNetProfit;

  const strategySaddled: MountStrategySummary = {
    grossRevenue: saddledGrossRevenue,
    marketTax: saddledMarketTax,
    netRevenue: saddledNetRevenue,
    totalCost: totalSaddledCost,
    netProfit: saddledNetProfit,
    roiPercent: saddledRoiPercent,
    profitPerUnit: saddledProfitPerUnit,
    profitPerDay: saddledProfitPerDay,
    isProfitable: saddledNetProfit > 0,
  };

  // 6. Comparativa Estratégica: ¿Conviene vender adulto o ensillar?
  const profitDifferenceSaddledVsAdult = saddledNetProfit - adultNetProfit;
  const bestStrategy: 'sell_adult' | 'saddle_and_sell' =
    profitDifferenceSaddledVsAdult > 0 && strategySaddled.isProfitable
      ? 'saddle_and_sell'
      : 'sell_adult';

  // 7. Métricas de Eficiencia de Puntos de Foco
  // FCE: Reducción a la mitad cada 10.000 de FCE
  const fceNurture = Math.max(0, input.fceNurture || 0);
  const nurtureFocusCostPerDay = Math.round(
    definition.baseNurtureFocusCost * Math.pow(0.5, fceNurture / 10000)
  );
  // Nutrir se realiza 1 vez por cada ciclo de 22h
  const focusNurtureTotalCost = nurtureFocusCostPerDay * growthCycles * mountCount;

  // Extra silver from nurture focus: crías adicionales ganadas por usar foco
  const extraOffspringChance = Math.max(
    0,
    definition.offspringChanceWithFocus - definition.offspringChanceWithoutFocus
  );
  const extraOffspringExpected = (extraOffspringChance / 100) * mountCount;
  const extraSilverFromNurtureFocus = extraOffspringExpected * babyUnitPrice;
  const silverPerNurtureFocus =
    focusNurtureTotalCost > 0 ? extraSilverFromNurtureFocus / focusNurtureTotalCost : 0;

  // Foco en el Guarnicionero (Saddler)
  const fceSaddler = Math.max(0, input.fceSaddler || 0);
  const saddlerFocusCostPerUnit = Math.round(
    definition.saddlerBaseFocusCost * Math.pow(0.5, fceSaddler / 10000)
  );
  const focusSaddlerTotalCost = saddlerFocusCostPerUnit * mountCount;

  // Extra silver en guarnicionero: materiales extra devueltos por el salto de 15.2% a 43.5%
  const focusRrrDelta = 43.5 - 15.2; // ~28.3% más materiales devueltos
  const extraSilverFromSaddlerFocus = (saddlingMaterialCostGross * focusRrrDelta) / 100;
  const silverPerSaddlerFocus =
    focusSaddlerTotalCost > 0 ? extraSilverFromSaddlerFocus / focusSaddlerTotalCost : 0;

  // 8. Veredicto y Asesoría Estratégica Inteligente
  let verdict = '';
  if (!strategyAdult.isProfitable && !strategySaddled.isProfitable) {
    verdict = `⚠️ No rentable con los precios actuales. El coste de alimento (${foodTotalCost.toLocaleString()} 🪙) y crías supera el valor de mercado. Revisa tus precios de compra de grano/carne.`;
  } else if (bestStrategy === 'saddle_and_sell') {
    verdict = `✅ Conviene ensillar en el Guarnicionero: obtienes +${Math.round(
      profitDifferenceSaddledVsAdult
    ).toLocaleString()} 🪙 adicionales de beneficio neto frente a vender el animal sin ensillar (ROI: ${strategySaddled.roiPercent.toFixed(
      1
    )}%).`;
  } else {
    verdict = `💡 Conviene vender el animal adulto directamente: el coste de los materiales de ensillado (${saddlingMaterialCostGross.toLocaleString()} 🪙) no se compensa con el precio final de la montura ensillada. Ganarías más plata vendiendo el animal domado.`;
  }

  return {
    mountId: definition.id,
    mountCount,
    totalGrowthCycles: growthCycles,
    totalGrowthHours,
    totalFoodUnits,
    foodTotalCost,
    babyTotalCost,
    grossBreedingCost,
    offspringExpectedCount,
    offspringValueTotal,
    netBreedingCost,
    netBreedingCostPerUnit,
    strategyAdult,
    saddlingMaterialCostGross,
    saddlingStationFeeTotal: totalNutritionCost,
    saddlingReturnRatePercent,
    saddlingReturnedMaterialValue,
    saddlingNetCost,
    totalSaddledCost,
    strategySaddled,
    profitDifferenceSaddledVsAdult,
    bestStrategy,
    verdict,
    focusNurtureTotalCost,
    extraSilverFromNurtureFocus,
    silverPerNurtureFocus,
    focusSaddlerTotalCost,
    extraSilverFromSaddlerFocus,
    silverPerSaddlerFocus,
  };
}
