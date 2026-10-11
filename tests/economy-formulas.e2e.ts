import { test, expect } from 'e2e';
import { calculateCraftingEconomy } from '../src/domain/use-cases/calculateCraftingEconomy';
import { calculateHarvestEconomy } from '../src/domain/use-cases/calculateHarvestEconomy';
import { calculateButcherEconomy } from '../src/domain/use-cases/calculateButcherEconomy';
import { calculateBlackMarketThreshold } from '../src/domain/use-cases/calculateBlackMarketThreshold';
import { calculateRedZoneTransport } from '../src/domain/use-cases/calculateRedZoneTransport';
import { calculateRefiningEconomy, getRawResourcesRequiredPerRefinedUnit } from '../src/domain/use-cases/calculateRefiningEconomy';
import { calculateMountEconomy } from '../src/domain/use-cases/calculateMountEconomy';
import { calculateEquipmentCraftingEconomy } from '../src/domain/use-cases/calculateEquipmentCraftingEconomy';
import { calculateResourceTransmutation } from '../src/domain/use-cases/calculateResourceTransmutation';
import { calculateGuildIslandEconomy } from '../src/domain/use-cases/calculateGuildIslandEconomy';
import { calculateFishingSaucesEconomy } from '../src/domain/use-cases/calculateFishingSaucesEconomy';
import { CRAFT_EQUIPMENT_RECIPES } from '../src/data/equipmentRecipes';
import { MOUNTS_CATALOG } from '../src/domain/models/mounts';

test('E2E Formula: calculateCraftingEconomy respeta RRR oficial en Caerleon con y sin foco', () => {
  const resultWithoutFocus = calculateCraftingEconomy({
    batchCount: 1,
    outputAmount: 10,
    productSellPrice: 5000,
    ingredients: [
      { itemId: 'animal_meat_pig', nameEs: 'Cerdo', amount: 72, unitPrice: 850 },
      { itemId: 'crop_wheat', nameEs: 'Trigo', amount: 36, unitPrice: 380 },
    ],
    nutritionCost: 110,
    stationUsageFeePer100: 450,
    stationLocation: 'caerleon_city',
    useFocus: false,
    hasPremium: true,
  });

  expect(resultWithoutFocus.returnRatePercent).toBe(24.8);
  expect(resultWithoutFocus.returnedMaterialValue).toBeGreaterThan(0);
  expect(resultWithoutFocus.nutritionFeeTotal).toBe(Math.round((110 / 100) * 450));

  const resultWithFocus = calculateCraftingEconomy({
    batchCount: 1,
    outputAmount: 10,
    productSellPrice: 5000,
    ingredients: [
      { itemId: 'animal_meat_pig', nameEs: 'Cerdo', amount: 72, unitPrice: 850 },
    ],
    nutritionCost: 110,
    stationUsageFeePer100: 450,
    stationLocation: 'caerleon_city',
    useFocus: true,
    hasPremium: true,
  });

  expect(resultWithFocus.returnRatePercent).toBe(47.9);
});

test('E2E Formula: calculateHarvestEconomy calcula de forma defensiva balance y Plata/Foco', () => {
  const result = calculateHarvestEconomy({
    plotsCount: 5,
    slotsCount: 45,
    cropOrHerbTier: 4,
    harvestedAmount: 405,
    productUnitPrice: 450,
    reboughtSeeds: 6,
    seedUnitPrice: 3200,
    taxPercent: 6.5,
    surplusSeeds: 0,
    monetizeSurplus: false,
    requiresFood: false,
    foodUnits: 0,
    foodUnitPrice: 0,
    usesOwnCropForFood: false,
    butcherFee: 0,
    category: 'crop',
    usedFocus: true,
    focusPointsSpent: 5625,
  });

  expect(result.grossRevenue).toBe(405 * 450);
  expect(result.netProfit).toBeGreaterThan(0);
  expect(result.silverPerFocus).toBeGreaterThan(15);
  expect(result.isProfitable).toBe(true);
});

test('E2E Formula: calculateButcherEconomy calcula rendimiento base 20 y bonos RRR de ciudad', () => {
  const result = calculateButcherEconomy({
    animalId: 'animal_cow',
    animalsCount: 5,
    slaughterLocation: 'city',
    cityId: 'martlock', // Martlock tiene bono oficial para vacas
    rawMeatMarketPrice: 1050,
    liveAnimalMarketPrice: 20000,
    dairyProduceMarketPrice: 520,
    stationTaxPer100Nutrition: 350,
    useFocus: true,
    hasPremium: true,
  });

  expect(result.baseMeatTotal).toBe(5 * 20); // 100 unidades base
  expect(result.rrrPercent).toBe(47.9); // Bono Martlock + foco
  expect(result.bonusMeatFromRrr).toBe(48); // Math.round(100 * 0.479)
  expect(result.totalMeatYield).toBe(148);
  expect(result.recommendedAction).toBeDefined();
});

test('E2E Formula: calculateRefiningEconomy calcula RRR de 36.7% sin foco y 53.9% con foco en ciudad bono', () => {
  expect(getRawResourcesRequiredPerRefinedUnit(2)).toBe(1);
  expect(getRawResourcesRequiredPerRefinedUnit(3)).toBe(2);
  expect(getRawResourcesRequiredPerRefinedUnit(4)).toBe(2);
  expect(getRawResourcesRequiredPerRefinedUnit(5)).toBe(3);
  expect(getRawResourcesRequiredPerRefinedUnit(6)).toBe(4);
  expect(getRawResourcesRequiredPerRefinedUnit(7)).toBe(5);
  expect(getRawResourcesRequiredPerRefinedUnit(8)).toBe(5);

  const refiningBonusNoFocus = calculateRefiningEconomy({
    resourceType: 'ore',
    tier: 4,
    enchantment: 0,
    batchCount: 50,
    cityId: 'thetford', // Thetford es la ciudad oficial con bono para Mineral
    hasDailyEventBonus: false,
    useFocus: false,
    hasPremium: true,
    stationTaxPer100Nutrition: 400,
    rawMaterialPrice: 180,
    previousTierRefinedPrice: 120,
    finishedRefinedSellPrice: 580,
  });

  expect(refiningBonusNoFocus.effectiveRRR).toBe(36.7);
  expect(refiningBonusNoFocus.isCityBonusActive).toBe(true);
  expect(refiningBonusNoFocus.rawMaterialsReturned).toBeGreaterThan(0);

  const refiningBonusWithFocus = calculateRefiningEconomy({
    resourceType: 'ore',
    tier: 4,
    enchantment: 0,
    batchCount: 50,
    cityId: 'thetford',
    hasDailyEventBonus: false,
    useFocus: true,
    hasPremium: true,
    stationTaxPer100Nutrition: 400,
    rawMaterialPrice: 180,
    previousTierRefinedPrice: 120,
    finishedRefinedSellPrice: 580,
  });

  expect(refiningBonusWithFocus.effectiveRRR).toBe(53.9);
  expect(refiningBonusWithFocus.silverPerFocusPoint).toBeGreaterThan(0);
});

test('E2E Formula: calculateMountEconomy respeta 10 u. alimento/ciclo y materiales de ensillado', () => {
  const horseDef = MOUNTS_CATALOG.find((m) => m.id === 'mount_horse_t4');
  expect(horseDef).toBeDefined();
  expect(horseDef!.foodPerCycle).toBe(10);
  expect(horseDef!.growthCycles).toBe(2);
  expect(horseDef!.saddlingMaterial.amount).toBe(20);

  const mountResult = calculateMountEconomy(
    {
      mountCount: 5,
      isBabyRaisedOwn: false,
      babyUnitPrice: 14000,
      foodUnitPrice: 380,
      useNurtureFocus: true,
      hasPremium: true,
      saddlingMaterialUnitPrice: 420,
      stationFeePer100Nutrition: 350,
      adultSellPrice: 22000,
      saddledSellPrice: 38000,
      marketTaxRate: 6.5,
      currentFocusCostPerBaby: 1400,
    },
    horseDef!
  );

  expect(mountResult.totalFoodUnits).toBe(5 * 10 * 2); // 100 unidades
  expect(mountResult.strategySaddled.isProfitable).toBe(true);
  expect(mountResult.strategySaddled.netRevenue).toBeGreaterThan(mountResult.strategyAdult.netRevenue);
});

test('E2E Formula: calculateEquipmentCraftingEconomy valida 24 mats para 1H y llenado de diarios', () => {
  const broadsword = CRAFT_EQUIPMENT_RECIPES.find((r) => r.id === 'sword_broadsword');
  expect(broadsword).toBeDefined();
  const totalMats = broadsword!.materials.reduce((sum, m) => sum + m.amount, 0);
  expect(totalMats).toBe(24);

  const craftResult = calculateEquipmentCraftingEconomy({
    recipe: broadsword!,
    tier: 5,
    enchantment: 0,
    batchCount: 10,
    stationTaxPer100Nutrition: 400,
    isCityCraftBonusActive: true,
    hasDailyEventBonus: false,
    useFocus: false,
    hasPremium: true,
    materialPrices: {
      bar_metal: 750,
      leather: 820,
    },
    finishedItemSellPrice: 26000,
    emptyJournalPrice: 1200,
    fullJournalSellPrice: 6800,
    labourerHappinessReturnPercent: 125,
  });

  expect(craftResult.effectiveReturnRatePercent).toBe(24.8);
  expect(craftResult.totalCraftFameEarned).toBe(450 * 10);
  expect(craftResult.journalsFilledCount).toBeGreaterThan(0);
  expect(craftResult.netProfit).toBeGreaterThan(0);
});

test('E2E Formula: calculateResourceTransmutation aplica costes oficiales en plata', () => {
  const transmutResult = calculateResourceTransmutation({
    mode: 'enchantment',
    resourceType: 'bar',
    sourceTier: 4,
    sourceEnchantment: 0,
    targetTier: 4,
    targetEnchantment: 1,
    batchCount: 10,
    sourceItemUnitPrice: 400,
    targetItemMarketSellPrice: 2200,
    hasPremium: true,
  });

  expect(transmutResult.transmutationSilverFeePerUnit).toBe(1500); // 1500 plata oficial por T4.1
  expect(transmutResult.totalTransmutationSilverFee).toBe(15000);
});

test('E2E Formula: calculateGuildIslandEconomy calcula solares y amortización finita', () => {
  const result = calculateGuildIslandEconomy({
    islandCityId: 'martlock',
    islandLevel: 6,
    guildHallTier: 5,
    labourerType: 'blacksmith',
    labourerTier: 5,
    journalTier: 5,
    activeLabourersCount: 9,
    bedTier: 5,
    tableTier: 5,
    hasGeneralistTrophies: true,
    hasSpecialistTrophies: true,
    simulationScope: 'hall_only',
    additionalHousesCount: 0,
    alreadyOwnsIsland: false,
    includeGuildCreationCost: true,
    filledJournalPrice: 6200,
    emptyJournalResellPrice: 1200,
    estimatedReturnSilverValue: 9500,
    stoneBlockUnitPrice: 320,
    roughWoodUnitPrice: 40,
    roughStoneUnitPrice: 30,
    bedUnitPrice: 4500,
    tableUnitPrice: 6500,
    trophySetCost: 12000,
    contractCostPerLabourer: 1500,
  });

  expect(result.islandUpgradeCostSilver).toBe(32750000); // 31.75M acumulado Isla Lv6 + 1M creación de gremio
  expect(result.dailyNetProfitSilver).toBeGreaterThan(0);
  expect(result.paybackDays).toBeGreaterThan(0);
  expect(result.totalLabourersCount).toBe(9);
});

test('E2E Formula: calculateBlackMarketThreshold calcula con precisión el Break-Even', () => {
  const baseRecipe = CRAFT_EQUIPMENT_RECIPES[0];

  const threshold = calculateBlackMarketThreshold({
    recipe: baseRecipe,
    tier: 5,
    enchantment: 0,
    craftingCity: 'fort_sterling',
    batchQuantity: 1,
    materialUnitCosts: {
      planks: 850,
      metalbar: 780,
      leather: 820,
      cloth: 750,
    },
    useFocus: false,
    hasPremium: true,
    currentBlackMarketPrice: 25000,
    orderType: 'instant_buy_order',
    targetRoiPercentage: 20,
    stationFeePer100Nutrition: 400,
    emptyJournalPrice: 1200,
    fullJournalValue: 6500,
    craftingBonusPercent: 0,
  });

  expect(threshold.grossMaterialCostPerUnit).toBeGreaterThan(0);
  expect(threshold.breakEvenPrice).toBeGreaterThan(0);
  expect(threshold.targetRoiPrice).toBeGreaterThan(threshold.breakEvenPrice);
  expect(threshold.verdict).toBeDefined();
});

test('E2E Formula: calculateRedZoneTransport calcula supervivencia y Valor Esperado (EV)', () => {
  const result = calculateRedZoneTransport({
    routeId: 'martlock_caerleon',
    originCityId: 'martlock',
    mountId: 'transport_ox_t5',
    escapeSetId: 'budget_windwall',
    cargoItems: [
      {
        id: 'crop_wheat',
        nameEs: 'Trigo',
        category: 'material',
        quantity: 1000,
        unitWeightKg: 0.1,
        unitCostOriginSilver: 380,
        unitPriceCaerleonSilver: 620,
      },
    ],
    customEscapeCostSilver: 100000,
    totalPlayerSilverReserve: 5000000,
    estimatedSurvivalPercent: 90,
    hasScoutAhead: true,
    redPksReportedCount: 1,
    destinationSaleType: 'black_market_buy_order',
    hasPremium: true,
  });

  expect(result.totalWeightKg).toBe(100);
  expect(result.totalGrossRevenueCaerleonSilver).toBe(620000);
  expect(result.tripNetProfitSilver).toBeGreaterThan(0);
  expect(result.totalSilverAtRiskSilver).toBeGreaterThan(0);
  expect(result.breakEvenSurvivalRate).toBeGreaterThan(0);
});

test('E2E Formula: calculateFishingSaucesEconomy calcula rendimiento de picado, salsas y remanente', () => {
  const result = calculateFishingSaucesEconomy({
    fishTier: 4,
    fishQuantity: 100,
    fishMarketPriceSilver: 700,
    choppedFishMarketPriceSilver: 95,
    seaweedMarketPriceSilver: 450,
    basicSaucePriceSilver: 280,
    fancySaucePriceSilver: 950,
    specialSaucePriceSilver: 3200,
    hasPremium: true,
    nutritionFeePer100: 250,
  });

  // 100 peces T4 rinden 8 u. de picado cada uno = 800 u.
  expect(result.totalChoppedFishYield).toBe(800);
  expect(result.rawFishGrossRevenue).toBe(70000);
  expect(result.rawFishNetRevenue).toBe(65450);

  // 800 picado * 95 = 76,000 bruto
  expect(result.choppedFishGrossRevenue).toBe(76000);
  expect(result.choppedFishNetRevenue).toBe(71060);
  expect(result.choppedProfitVsRawFish).toBe(5610); // Más rentable filetear que vender crudo

  // Análisis de salsas
  expect(result.saucesAnalysis.length).toBe(3);
  const basic = result.saucesAnalysis[0];
  // 800 / 15 = 53 lotes = 530 salsas, 795 picado usado, 5 sobrante
  expect(basic.possibleBatches).toBe(53);
  expect(basic.totalSaucesOutput).toBe(530);
  expect(basic.choppedFishUsed).toBe(795);
  expect(basic.leftoverChoppedFish).toBe(5);
  expect(basic.leftoverChoppedFishNetValue).toBeGreaterThan(0);
  expect(basic.seaweedBreakEvenPrice).toBeGreaterThan(0);
  expect(result.bestAction).toBeDefined();
});
