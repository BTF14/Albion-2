/**
 * Caso de Uso Puro: Calculadora de Fileteado de Pescado y Elaboración de Salsas (Fish Chopping & Sauces)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Función matemática pura, determinista y 100% libre de React/DOM.
 */

import {
  FishingSaucesInput,
  FishingSaucesResult,
  FishSauceAnalysisItem,
  OFFICIAL_FISH_TIERS,
  FISH_SAUCE_RECIPES,
} from '../models/fishingSauces';

export function calculateFishingSaucesEconomy(input: FishingSaucesInput): FishingSaucesResult {
  // 1. Sanitización de entradas
  const safeTier = Math.max(1, Math.min(8, Math.floor(Number(input.fishTier) || 4)));
  const safeQty = Math.max(1, Math.floor(Number(input.fishQuantity) || 100));

  const tierInfo = OFFICIAL_FISH_TIERS.find((f) => f.tier === safeTier) || OFFICIAL_FISH_TIERS[3];
  const fishPrice = Math.max(0, Number(input.fishMarketPriceSilver) >= 0 ? Number(input.fishMarketPriceSilver) : tierInfo.estimatedMarketPriceSilver);
  const choppedPrice = Math.max(0, Number(input.choppedFishMarketPriceSilver) >= 0 ? Number(input.choppedFishMarketPriceSilver) : 95);
  const seaweedPrice = Math.max(0, Number(input.seaweedMarketPriceSilver) >= 0 ? Number(input.seaweedMarketPriceSilver) : 450);
  const nutritionFee = Math.max(0, Number(input.nutritionFeePer100) || 0);

  // Tasa de mercado oficial de Albion (4% con Premium / 8% sin Premium + 2.5% orden de venta)
  const marketTaxRate = input.hasPremium ? 0.065 : 0.105;

  // 2. Rendimiento oficial de Pescado Picado
  const totalChoppedFishYield = safeQty * tierInfo.choppedFishYield;

  // 3. Opción A: Vender Pescado Entero en el Mercado
  const rawFishGrossRevenue = safeQty * fishPrice;
  const rawFishNetRevenue = Math.round(rawFishGrossRevenue * (1 - marketTaxRate));

  // 4. Opción B: Filetear y Vender Pescado Picado Directo
  const choppedFishGrossRevenue = totalChoppedFishYield * choppedPrice;
  const choppedFishNetRevenue = Math.round(choppedFishGrossRevenue * (1 - marketTaxRate));
  const choppedProfitVsRawFish = choppedFishNetRevenue - rawFishNetRevenue;

  // 5. Opción C: Crafteo de Salsas (.1, .2, .3)
  const saucePrices = {
    sauce_basic: Math.max(0, Number(input.basicSaucePriceSilver) || 280),
    sauce_fancy: Math.max(0, Number(input.fancySaucePriceSilver) || 950),
    sauce_special: Math.max(0, Number(input.specialSaucePriceSilver) || 3200),
  };

  const saucesAnalysis: FishSauceAnalysisItem[] = FISH_SAUCE_RECIPES.map((recipe) => {
    const possibleBatches = Math.floor(totalChoppedFishYield / recipe.choppedFishRequired);
    const choppedFishUsed = possibleBatches * recipe.choppedFishRequired;
    const leftoverChoppedFish = totalChoppedFishYield - choppedFishUsed;
    const leftoverChoppedFishNetValue = Math.round(leftoverChoppedFish * choppedPrice * (1 - marketTaxRate));

    const totalSaucesOutput = possibleBatches * recipe.outputAmount;
    const extraSeaweedCost = possibleBatches * recipe.seaweedRequired * seaweedPrice;
    
    // Tasa de uso de estación de cocina (~1 nutrición por lote de salsas)
    const stationFeeSilver = Math.round(possibleBatches * (nutritionFee / 100));

    const unitPrice = saucePrices[recipe.id];
    const grossRevenue = totalSaucesOutput * unitPrice;
    const netRevenue = Math.round(grossRevenue * (1 - marketTaxRate)) - extraSeaweedCost - stationFeeSilver;
    const totalNetWithLeftover = netRevenue + leftoverChoppedFishNetValue;
    const netProfitVsRawFish = totalNetWithLeftover - rawFishNetRevenue;

    // Coste unitario de crafteo de 1 salsa
    const craftCostPerUnit = Math.round(
      (recipe.choppedFishRequired * choppedPrice + recipe.seaweedRequired * seaweedPrice + (nutritionFee / 100)) / recipe.outputAmount
    );
    const marginPerUnit = unitPrice - craftCostPerUnit;

    // Precio umbral de alga marina (Seaweed Break-Even)
    const netSauceBatchValue = recipe.outputAmount * unitPrice * (1 - marketTaxRate) - (nutritionFee / 100);
    const netChoppedBatchValue = recipe.choppedFishRequired * choppedPrice * (1 - marketTaxRate);
    const seaweedBreakEvenPrice = recipe.seaweedRequired > 0
      ? Math.max(0, Math.round((netSauceBatchValue - netChoppedBatchValue) / recipe.seaweedRequired))
      : 0;

    const totalCostBase = rawFishNetRevenue + extraSeaweedCost + stationFeeSilver;
    const roiPercent = totalCostBase > 0 ? Math.round((netProfitVsRawFish / totalCostBase) * 100) : 0;

    return {
      recipe,
      possibleBatches,
      choppedFishUsed,
      leftoverChoppedFish,
      leftoverChoppedFishNetValue,
      totalSaucesOutput,
      extraSeaweedCost,
      stationFeeSilver,
      grossRevenue,
      netRevenue,
      totalNetWithLeftover,
      netProfitVsRawFish,
      craftCostPerUnit,
      marketPricePerUnit: unitPrice,
      marginPerUnit,
      seaweedBreakEvenPrice,
      roiPercent,
    };
  });

  // 6. Determinar Mejor Estrategia
  let bestAction: FishingSaucesResult['bestAction'] = 'SELL_RAW_FISH';
  let bestActionNetRevenue = rawFishNetRevenue;
  let verdictTitleEs = 'Venta Directa de Pescado Entero';
  let verdictDescriptionEs = `Vender el pescado crudo rinde ${rawFishNetRevenue.toLocaleString()} 🪙 netos. Filetearlo o hacer salsas no supera este valor con las cotizaciones actuales.`;

  if (choppedFishNetRevenue > bestActionNetRevenue) {
    bestAction = 'CHOP_AND_SELL';
    bestActionNetRevenue = choppedFishNetRevenue;
    verdictTitleEs = '¡Filetear y Vender Pescado Picado!';
    verdictDescriptionEs = `Picar tus ${safeQty.toLocaleString()} pescados produce ${totalChoppedFishYield.toLocaleString()} u. de Pescado Picado, rindiendo +${choppedProfitVsRawFish.toLocaleString()} 🪙 netos más que venderlos enteros.`;
  }

  // Evaluar si alguna salsa supera la mejor opción previa
  for (const sauce of saucesAnalysis) {
    if (sauce.totalNetWithLeftover > bestActionNetRevenue && sauce.possibleBatches > 0) {
      bestActionNetRevenue = sauce.totalNetWithLeftover;
      if (sauce.recipe.id === 'sauce_basic') {
        bestAction = 'CRAFT_BASIC_SAUCE';
        verdictTitleEs = '¡Craftear Salsa Básica (.1)!';
      } else if (sauce.recipe.id === 'sauce_fancy') {
        bestAction = 'CRAFT_FANCY_SAUCE';
        verdictTitleEs = '¡Craftear Salsa Elegante (.2)!';
      } else {
        bestAction = 'CRAFT_SPECIAL_SAUCE';
        verdictTitleEs = '¡Craftear Salsa Especial (.3)!';
      }
      verdictDescriptionEs = `Convertir el lote en ${sauce.recipe.nameEs} genera ${sauce.totalNetWithLeftover.toLocaleString()} 🪙 netos (+${sauce.netProfitVsRawFish.toLocaleString()} 🪙 frente a vender el pescado crudo, ROI +${sauce.roiPercent}%)${sauce.leftoverChoppedFish > 0 ? ` conservando ${sauce.leftoverChoppedFish} u. de picado sobrante (${sauce.leftoverChoppedFishNetValue.toLocaleString()} 🪙 netos)` : ''}.`;
    }
  }

  return {
    fishTier: safeTier,
    fishQuantity: safeQty,
    totalChoppedFishYield,
    rawFishGrossRevenue,
    rawFishNetRevenue,
    choppedFishGrossRevenue,
    choppedFishNetRevenue,
    choppedProfitVsRawFish,
    saucesAnalysis,
    bestAction,
    bestActionNetRevenue,
    verdictTitleEs,
    verdictDescriptionEs,
  };
}
