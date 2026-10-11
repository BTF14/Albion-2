/**
 * Modelo de Dominio: Expansión de Isla del Gremio y Casa Gremial para Trabajadores
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Mecánicas oficiales de Albion Online:
 * - Isla de Gremio (Guild Island): Niveles 1 a 6.
 *   - Posee una parcela gigante central exclusiva para la Casa Gremial (Guild Hall).
 *   - Posee hasta 14 parcelas estándar de edificios en Nivel 6 (permitiendo hasta 14 casas adicionales de 3 trabajadores = 42 trabajadores adicionales).
 * - Casa Gremial (Guild Hall): Tiers 2 a 8.
 *   - Capacidad: hasta 15 trabajadores (Labourers) bajo un mismo techo (frente a los 3 máximos de una casa personal).
 *   - Requiere 1 cama por trabajador y mesas (1 mesa por cada 4-5 trabajadores).
 *   - Trofeos generales y específicos para alcanzar el 100% a 150% de felicidad (recolección) o 100% a 125% (crafteo).
 */

import { LabourerType, LabourerCategory } from './labourers';
import { CityId } from '../../types';

export interface GuildIslandTierInfo {
  level: number;
  nameEs: string;
  upgradeCostSilver: number; // Coste oficial en plata del juego
  cumulativeCostSilver: number;
  buildingPlotsCount: number; // Parcelas de edificios estándar
  smallPlotsCount: number;    // Parcelas pequeñas (reparaciones/puestos)
  guildHallPlotCount: number; // 1 siempre
  maxStandardHousesLabourers: number; // 3 por casa en T8
}

export const GUILD_ISLAND_LEVELS: GuildIslandTierInfo[] = [
  {
    level: 1,
    nameEs: 'Nivel 1 (Fundación del Gremio)',
    upgradeCostSilver: 5000000,
    cumulativeCostSilver: 5000000,
    buildingPlotsCount: 0,
    smallPlotsCount: 0,
    guildHallPlotCount: 1,
    maxStandardHousesLabourers: 0,
  },
  {
    level: 2,
    nameEs: 'Nivel 2 (Expansión Inicial)',
    upgradeCostSilver: 3750000,
    cumulativeCostSilver: 8750000,
    buildingPlotsCount: 1,
    smallPlotsCount: 2,
    guildHallPlotCount: 1,
    maxStandardHousesLabourers: 3,
  },
  {
    level: 3,
    nameEs: 'Nivel 3 (Campamento Estable)',
    upgradeCostSilver: 4000000,
    cumulativeCostSilver: 12750000,
    buildingPlotsCount: 2,
    smallPlotsCount: 2,
    guildHallPlotCount: 1,
    maxStandardHousesLabourers: 6,
  },
  {
    level: 4,
    nameEs: 'Nivel 4 (Fortaleza Mediana)',
    upgradeCostSilver: 5000000,
    cumulativeCostSilver: 17750000,
    buildingPlotsCount: 4,
    smallPlotsCount: 2,
    guildHallPlotCount: 1,
    maxStandardHousesLabourers: 12,
  },
  {
    level: 5,
    nameEs: 'Nivel 5 (Bastión del Gremio)',
    upgradeCostSilver: 6000000,
    cumulativeCostSilver: 23750000,
    buildingPlotsCount: 8,
    smallPlotsCount: 2,
    guildHallPlotCount: 1,
    maxStandardHousesLabourers: 24,
  },
  {
    level: 6,
    nameEs: 'Nivel 6 (Ciudadela Gremial Máxima)',
    upgradeCostSilver: 8000000,
    cumulativeCostSilver: 31750000,
    buildingPlotsCount: 14,
    smallPlotsCount: 2,
    guildHallPlotCount: 1,
    maxStandardHousesLabourers: 42,
  },
];

export interface GuildHallTierInfo {
  tier: number;
  nameEs: string;
  nameEn: string;
  maxLabourers: number;
  stoneBlocksNeeded: number; // Bloques de piedra acumulados o del tier
  stoneTypeEs: string;
  roughLogsNeeded: number;
  roughStoneNeeded: number;
  furnitureLimit: number;
}

export const GUILD_HALL_TIERS: GuildHallTierInfo[] = [
  {
    tier: 2,
    nameEs: 'Casa Gremial T2 (Madera Novata)',
    nameEn: 'Novice Guild Hall',
    maxLabourers: 3,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Piedra Caliza T2',
    roughLogsNeeded: 180,
    roughStoneNeeded: 180,
    furnitureLimit: 14,
  },
  {
    tier: 3,
    nameEs: 'Casa Gremial T3 (Arenisca)',
    nameEn: 'Journeyman Guild Hall',
    maxLabourers: 5,
    stoneBlocksNeeded: 360,
    stoneTypeEs: 'Bloques de Arenisca T3',
    roughLogsNeeded: 0,
    roughStoneNeeded: 0,
    furnitureLimit: 22,
  },
  {
    tier: 4,
    nameEs: 'Casa Gremial T4 (Travertino)',
    nameEn: 'Adept Guild Hall',
    maxLabourers: 7,
    stoneBlocksNeeded: 720,
    stoneTypeEs: 'Bloques de Travertino T4',
    roughLogsNeeded: 0,
    roughStoneNeeded: 0,
    furnitureLimit: 30,
  },
  {
    tier: 5,
    nameEs: 'Casa Gremial T5 (Granito)',
    nameEn: 'Expert Guild Hall',
    maxLabourers: 9,
    stoneBlocksNeeded: 1440,
    stoneTypeEs: 'Bloques de Granito T5',
    roughLogsNeeded: 0,
    roughStoneNeeded: 0,
    furnitureLimit: 38,
  },
  {
    tier: 6,
    nameEs: 'Casa Gremial T6 (Pizarra)',
    nameEn: 'Master Guild Hall',
    maxLabourers: 11,
    stoneBlocksNeeded: 2880,
    stoneTypeEs: 'Bloques de Pizarra T6',
    roughLogsNeeded: 0,
    roughStoneNeeded: 0,
    furnitureLimit: 46,
  },
  {
    tier: 7,
    nameEs: 'Casa Gremial T7 (Basalto)',
    nameEn: 'Grandmaster Guild Hall',
    maxLabourers: 13,
    stoneBlocksNeeded: 5760,
    stoneTypeEs: 'Bloques de Basalto T7',
    roughLogsNeeded: 0,
    roughStoneNeeded: 0,
    furnitureLimit: 54,
  },
  {
    tier: 8,
    nameEs: 'Casa Gremial T8 (Mármol)',
    nameEn: 'Elder Guild Hall',
    maxLabourers: 15,
    stoneBlocksNeeded: 11520,
    stoneTypeEs: 'Bloques de Mármol T8',
    roughLogsNeeded: 0,
    roughStoneNeeded: 0,
    furnitureLimit: 62,
  },
];

export interface StoredGuildIslandConfig {
  islandCityId: CityId;
  islandLevel: number; // 1 a 6
  guildHallTier: number; // 2 a 8
  labourerType: LabourerType;
  labourerTier: number; // 2 a 8
  journalTier: number;  // 2 a 8
  activeLabourersCount: number; // 1 a 15
  // Configuración de Muebles
  bedTier: number;
  tableTier: number;
  hasGeneralistTrophies: boolean;
  hasSpecialistTrophies: boolean;
  hasSharkTrophy?: boolean;
  // Modo de simulación
  simulationScope: 'hall_only' | 'full_island'; // 15 trabajadores en Hall vs Todos los solares
  additionalHousesCount: number; // 0 a 14 casas estándar adicionales
  // Opciones de inversión de la isla
  alreadyOwnsIsland?: boolean; // Excluye el coste de compra de la isla del cálculo de amortización
  includeGuildCreationCost?: boolean; // Suma 1.000.000 🪙 de la fundación oficial del gremio
  // Precios Manuales
  filledJournalPrice: number;
  emptyJournalResellPrice: number;
  estimatedReturnSilverValue: number;
  // Precios de materiales para cálculo de coste de construcción
  stoneBlockUnitPrice: number;
  roughWoodUnitPrice: number;
  roughStoneUnitPrice: number;
  bedUnitPrice: number;
  tableUnitPrice: number;
  trophySetCost: number;
  contractCostPerLabourer: number;
}

export interface GuildHallVsHousesComparison {
  // Guild Hall
  guildHallPlotsUsed: number;
  guildHallStoneBlocksNeeded: number;
  guildHallTablesNeeded: number;
  guildHallTrophySetsNeeded: number;
  guildHallTotalInitialSilver: number;
  // Casas individuales equivalentes
  equivalentHousesCount: number;
  housesPlotsUsed: number;
  housesStoneBlocksNeeded: number;
  housesTablesNeeded: number;
  housesTrophySetsNeeded: number;
  housesTotalInitialSilver: number;
  // Diferencias
  silverDifference: number; // Positivo si Guild Hall cuesta más, negativo si ahorra
  trophySetsSaved: number;
  standardPlotsFreed: number;
  recommendationVerdict: string;
}

export interface GuildIslandEconomicResult {
  // Configuración interpretada
  totalLabourersCount: number;
  islandLevel: number;
  guildHallTier: number;
  happinessScore: number;
  maxHappinessPossible: number;
  returnYieldPercent: number; // ej. 100% a 150% en recolección, 100% a 125% en crafteo
  // Inversión Inicial
  islandUpgradeCostSilver: number;
  guildHallConstructionCostSilver: number;
  additionalHousesCostSilver: number;
  furnitureTotalCostSilver: number;
  contractsTotalCostSilver: number;
  totalInitialInvestmentSilver: number;
  // Flujo Diario (ciclo 22 horas)
  dailyGrossRevenueSilver: number;
  dailyJournalsNetCostSilver: number;
  dailyNetProfitSilver: number;
  // Flujo Mensual (30 ciclos)
  monthlyNetProfitSilver: number;
  // Métricas de Retorno y Amortización
  paybackDays: number; // Días para recuperar la inversión
  annualRoiPercent: number;
  profitPerLabourerDay: number;
  recommendations: string[];
  // Comparativa vs Casas Personales
  comparisonVsHouses: GuildHallVsHousesComparison;
}
