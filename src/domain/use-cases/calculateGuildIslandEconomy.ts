/**
 * Caso de Uso: Calculadora de Expansión de Isla del Gremio y Casa Gremial para Trabajadores
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Función matemática pura, determinista y 100% testeable sin dependencias de React ni DOM.
 */

import {
  StoredGuildIslandConfig,
  GuildIslandEconomicResult,
  GuildHallVsHousesComparison,
  GUILD_ISLAND_LEVELS,
  GUILD_HALL_TIERS,
} from '../models/guildIsland';
import {
  LABOURER_CATALOG,
  calculateLabourerHappinessAndYield,
} from '../use-cases/calculateLabourerEconomy';

export function calculateGuildIslandEconomy(
  config: StoredGuildIslandConfig
): GuildIslandEconomicResult {
  // 1. Sanitización defensiva de entradas
  const safeLevel = Math.max(1, Math.min(6, Math.floor(Number(config.islandLevel) || 1)));
  const safeHallTier = Math.max(2, Math.min(8, Math.floor(Number(config.guildHallTier) || 2)));
  const safeLabourerTier = Math.max(2, Math.min(8, Math.floor(Number(config.labourerTier) || 2)));
  const safeJournalTier = Math.max(2, Math.min(8, Math.floor(Number(config.journalTier) || 2)));

  const islandLevelInfo = GUILD_ISLAND_LEVELS.find((l) => l.level === safeLevel) || GUILD_ISLAND_LEVELS[0];
  const guildHallInfo = GUILD_HALL_TIERS.find((h) => h.tier === safeHallTier) || GUILD_HALL_TIERS[0];

  // Número de trabajadores en la Casa Gremial (hasta su capacidad de tier)
  const hallLabourers = Math.max(1, Math.min(guildHallInfo.maxLabourers, Math.floor(Number(config.activeLabourersCount) || guildHallInfo.maxLabourers)));

  // Casas estándar adicionales en la isla de gremio
  const maxHousesForLevel = islandLevelInfo.buildingPlotsCount;
  const safeAdditionalHouses = config.simulationScope === 'full_island'
    ? Math.max(0, Math.min(maxHousesForLevel, Math.floor(Number(config.additionalHousesCount) || maxHousesForLevel)))
    : 0;

  // Cada casa estándar T8 admite 3 trabajadores
  const additionalLabourers = safeAdditionalHouses * 3;
  const totalLabourersCount = hallLabourers + additionalLabourers;

  // 2. Cálculo de Felicidad y Retorno (Mecánica oficial de Albion Online)
  const labourerDef = LABOURER_CATALOG.find((l) => l.id === config.labourerType) || LABOURER_CATALOG[0];

  const hasMatchingBeds = (Number(config.bedTier) || safeHallTier) >= safeJournalTier;
  const hasMatchingTables = (Number(config.tableTier) || safeHallTier) >= safeJournalTier;
  const hasMatchingFurniture = hasMatchingBeds && hasMatchingTables;

  const happinessResult = calculateLabourerHappinessAndYield(
    safeHallTier,
    safeLabourerTier,
    safeJournalTier,
    labourerDef.category,
    hasMatchingFurniture,
    Boolean(config.hasGeneralistTrophies),
    Boolean(config.hasSpecialistTrophies)
  );

  const returnYieldPercent = happinessResult.yieldPercent;
  const happinessScore = happinessResult.happinessScore;
  const maxHappinessPossible = happinessResult.maxHappiness;
  const maxYield = labourerDef.category === 'gathering' ? 150 : labourerDef.category === 'crafting' ? 125 : 110;

  // 3. Inversión Inicial (Plata requerida para construir y amueblar)
  const guildCreationCost = config.includeGuildCreationCost ? 1000000 : 0;
  const rawIslandCost = islandLevelInfo.cumulativeCostSilver + guildCreationCost;
  const islandUpgradeCostSilver = config.alreadyOwnsIsland ? 0 : rawIslandCost;

  // Materiales de la Casa Gremial
  const stonePrice = Math.max(0, Number(config.stoneBlockUnitPrice) || 1200);
  const roughLogsPrice = Math.max(0, Number(config.roughWoodUnitPrice) || 150);
  const roughStonePrice = Math.max(0, Number(config.roughStoneUnitPrice) || 150);

  const guildHallConstructionCostSilver = (guildHallInfo.stoneBlocksNeeded * stonePrice) +
    (guildHallInfo.roughLogsNeeded * roughLogsPrice) +
    (guildHallInfo.roughStoneNeeded * roughStonePrice);

  // Coste de casas estándar adicionales (si se activa simulación de isla completa)
  const standardHouseStoneBlocks = 180; // Bloques por tier
  const additionalHousesCostSilver = safeAdditionalHouses * (standardHouseStoneBlocks * stonePrice + 60000);

  // Muebles: 1 cama por trabajador, 1 mesa cada 4 trabajadores, trofeos
  const bedPrice = Math.max(0, Number(config.bedUnitPrice) || 8500);
  const tablePrice = Math.max(0, Number(config.tableUnitPrice) || 18000);
  const trophySetPrice = Math.max(0, Number(config.trophySetCost) || 35000);

  const tablesNeeded = Math.ceil(totalLabourersCount / 4);
  const furnitureTotalCostSilver = (totalLabourersCount * bedPrice) +
    (tablesNeeded * tablePrice) +
    (trophySetPrice * (1 + safeAdditionalHouses));

  // Contratos de contratación por trabajador
  const contractPrice = Math.max(0, Number(config.contractCostPerLabourer) || 1000);
  const contractsTotalCostSilver = totalLabourersCount * contractPrice;

  const totalInitialInvestmentSilver = islandUpgradeCostSilver +
    guildHallConstructionCostSilver +
    additionalHousesCostSilver +
    furnitureTotalCostSilver +
    contractsTotalCostSilver;

  // 4. Flujo Financiero Diario (Ciclo oficial de 22 horas)
  const filledJournalPrice = Math.max(0, Number(config.filledJournalPrice) || 0);
  const emptyJournalPrice = Math.max(0, Number(config.emptyJournalResellPrice) || 0);
  const singleJournalNetCost = Math.max(0, filledJournalPrice - emptyJournalPrice);
  const dailyJournalsNetCostSilver = totalLabourersCount * singleJournalNetCost;

  const returnResourceEstimatedValue = Math.max(0, Number(config.estimatedReturnSilverValue) || 24000);
  const yieldMultiplier = returnYieldPercent / 100;
  const singleLabourerGrossReturn = Math.round(returnResourceEstimatedValue * yieldMultiplier);
  const dailyGrossRevenueSilver = totalLabourersCount * singleLabourerGrossReturn;

  const dailyNetProfitSilver = dailyGrossRevenueSilver - dailyJournalsNetCostSilver;
  const monthlyNetProfitSilver = dailyNetProfitSilver * 30; // 30 ciclos de 22h

  // 5. Retorno de Inversión y Amortización
  const profitPerLabourerDay = totalLabourersCount > 0
    ? Math.round(dailyNetProfitSilver / totalLabourersCount)
    : 0;

  const paybackDays = dailyNetProfitSilver > 0
    ? Math.ceil(totalInitialInvestmentSilver / dailyNetProfitSilver)
    : Infinity;

  const annualRoiPercent = totalInitialInvestmentSilver > 0
    ? Math.round(((dailyNetProfitSilver * 365) / totalInitialInvestmentSilver) * 100)
    : 0;

  // 6. Recomendaciones Tácticas
  const recommendations: string[] = [];

  if (safeLabourerTier < safeJournalTier) {
    recommendations.push(
      `⚠️ Nivel Insuficiente: Un trabajador Tier ${safeLabourerTier} no puede aceptar Diarios Tier ${safeJournalTier}. Sube de nivel a tu trabajador o baja el tier del diario.`
    );
  } else if (safeHallTier < safeJournalTier) {
    recommendations.push(
      `⚠️ Casa Gremial T${safeHallTier} inferior al Diario T${safeJournalTier}: Tus trabajadores tendrán una severa penalización de felicidad y su rendimiento caerá.`
    );
  } else if (safeHallTier > safeJournalTier && safeLabourerTier > safeJournalTier) {
    recommendations.push(
      `🌟 ¡Estrategia Óptima de Albion! Tu Casa Gremial T${safeHallTier} y trabajadores superan en tier al Diario T${safeJournalTier}. Esto maximiza la felicidad alcanzando el ${maxYield}% de retorno.`
    );
  } else {
    recommendations.push(
      `ℹ️ Mismo Tier (T${safeHallTier}): Tus trabajadores rendirán al retorno base (${returnYieldPercent}%). Para alcanzar el ${maxYield}% máximo, se recomienda subir la Guild Hall a T${Math.min(8, safeHallTier + 1)} y diarios de tier inferior.`
    );
  }

  if (paybackDays <= 45 && Number.isFinite(paybackDays)) {
    recommendations.push(
      `💎 Inversión de Alta Rentabilidad: La isla y Casa Gremial se amortizarán en solo ${paybackDays} días de operaciones con tus precios actuales.`
    );
  } else if (Number.isFinite(paybackDays)) {
    recommendations.push(
      `⏱️ Amortización a Mediano Plazo: Recuperarás la inversión total en ${paybackDays} días (${Math.round(paybackDays / 30)} meses).`
    );
  }

  if (totalLabourersCount >= 15) {
    recommendations.push(
      `🏰 Complejo Masivo: Estás procesando ${totalLabourersCount} diarios cada 22h, generando +${dailyNetProfitSilver.toLocaleString()} 🪙 netos por ciclo.`
    );
  }

  // 7. Comparativa Estratégica: Guild Hall vs Casas Personales T8
  // Para albergar los mismos trabajadores del salón (hasta 15):
  const targetLabourers = hallLabourers;
  const equivalentHousesCount = Math.ceil(targetLabourers / 3);
  const housesStoneBlocksNeeded = equivalentHousesCount * 180;
  const housesTablesNeeded = equivalentHousesCount; // 1 mesa por cada casa
  const housesTrophySetsNeeded = equivalentHousesCount; // 1 juego completo de trofeos en cada casa

  const housesStoneCost = housesStoneBlocksNeeded * stonePrice;
  const housesTablesCost = housesTablesNeeded * tablePrice;
  const housesBedsCost = targetLabourers * bedPrice;
  const housesTrophiesCost = housesTrophySetsNeeded * trophySetPrice;
  const housesContractsCost = targetLabourers * contractPrice;
  const housesTotalInitialSilver = housesStoneCost + housesTablesCost + housesBedsCost + housesTrophiesCost + housesContractsCost;

  const guildHallPlotsUsed = 1;
  const guildHallStoneBlocksNeeded = guildHallInfo.stoneBlocksNeeded;
  const guildHallTablesNeeded = Math.ceil(targetLabourers / 4);
  const guildHallTrophySetsNeeded = 1; // Solo 1 set para los 15 trabajadores
  const guildHallTotalInitialSilver = guildHallConstructionCostSilver +
    (targetLabourers * bedPrice) +
    (guildHallTablesNeeded * tablePrice) +
    trophySetPrice +
    (targetLabourers * contractPrice);

  const silverDifference = guildHallTotalInitialSilver - housesTotalInitialSilver;
  const trophySetsSaved = Math.max(0, housesTrophySetsNeeded - 1);
  const standardPlotsFreed = equivalentHousesCount;

  let recommendationVerdict = '';
  if (trophySetsSaved > 0 && trophySetPrice > 20000) {
    recommendationVerdict = `Ahorras ${trophySetsSaved} juegos completos de trofeos y liberas ${standardPlotsFreed} parcelas de construcción estándar en tu isla. El Guild Hall es altamente recomendado para operaciones gremiales a gran escala.`;
  } else {
    recommendationVerdict = `El Guild Hall centraliza la gestión de tus ${targetLabourers} trabajadores en 1 solo edificio, ahorrando tiempo de recolección y liberando ${standardPlotsFreed} parcelas estándar para otros fines.`;
  }

  const comparisonVsHouses: GuildHallVsHousesComparison = {
    guildHallPlotsUsed,
    guildHallStoneBlocksNeeded,
    guildHallTablesNeeded,
    guildHallTrophySetsNeeded,
    guildHallTotalInitialSilver,
    equivalentHousesCount,
    housesPlotsUsed: equivalentHousesCount,
    housesStoneBlocksNeeded,
    housesTablesNeeded,
    housesTrophySetsNeeded,
    housesTotalInitialSilver,
    silverDifference,
    trophySetsSaved,
    standardPlotsFreed,
    recommendationVerdict,
  };

  return {
    totalLabourersCount,
    islandLevel: safeLevel,
    guildHallTier: safeHallTier,
    happinessScore,
    maxHappinessPossible,
    returnYieldPercent,
    islandUpgradeCostSilver,
    guildHallConstructionCostSilver,
    additionalHousesCostSilver,
    furnitureTotalCostSilver,
    contractsTotalCostSilver,
    totalInitialInvestmentSilver,
    dailyGrossRevenueSilver,
    dailyJournalsNetCostSilver,
    dailyNetProfitSilver,
    monthlyNetProfitSilver,
    paybackDays,
    annualRoiPercent,
    profitPerLabourerDay,
    recommendations,
    comparisonVsHouses,
  };
}
