export type LabourerType =
  // Recolección
  | 'lumberjack'   // Madera (Madera en bruto / Tablas)
  | 'stonecutter'  // Piedra (Piedra en bruto / Bloques)
  | 'prospector'   // Mineral (Mena en bruto / Lingotes)
  | 'cropper'      // Fibra (Fibra en bruto / Tela)
  | 'gamekeeper'   // Pieles (Piel en bruto / Cuero)
  | 'fisherman'    // Pescado (Pescados / Pescado picado / Tesoros)
  // Crafteo
  | 'blacksmith'   // Forja de Guerrero (Armas y Armaduras de Placas)
  | 'fletcher'     // Cabaña de Cazador (Arcos, Ballestas, Chaquetas de Cuero)
  | 'imbuer'       // Torre de Mago (Báculos, Túnicas de Tela, Libros)
  | 'tinker'       // Taller de Hojalatero (Herramientas, Bolsas, Capas)
  // Combate
  | 'mercenary';   // Combate PvE (Plata pura)

export type LabourerCategory = 'gathering' | 'crafting' | 'mercenary';

export interface LabourerDefinition {
  id: LabourerType;
  nameEs: string;
  nameEn: string;
  category: LabourerCategory;
  professionEs: string;
  journalNameEs: string;
  journalNameEn: string;
  primaryReturnsEs: string;
  specialistTrophyNameEs: string;
  description: string;
}

export interface HouseTierInfo {
  tier: number;
  nameEs: string;
  nameEn: string;
  maxLabourers: number;
  furnitureLimit: number;
  stoneBlocksNeeded: number; // 180 bloques del tier
  stoneTypeEs: string;
  roughLogsNeeded: number;
  roughStoneNeeded: number;
  fameReward: number;
}

export interface LabourerHappinessConfig {
  houseTier: number;
  labourerTier: number;
  journalTier: number;
  bedTier: number;
  tableTier: number;
  hasGeneralistTrophies: boolean;
  hasSpecialistTrophies: boolean;
  hasSharkTrophy?: boolean; // Para pescadores o trofeos raros
}

export interface PersistedLabourerConfig {
  labourerType: LabourerType;
  labourerTier: number;
  journalTier: number;
  houseTier: number;
  labourersCount: number;
  houseType: 'house' | 'guild_hall';
  // Precios manuales
  filledJournalPrice: number;
  emptyJournalResellPrice: number;
  estimatedReturnSilverValue: number;
  // Costes de instalación
  stoneBlockUnitPrice: number;
  roughWoodUnitPrice: number;
  roughStoneUnitPrice: number;
  furnitureCostPerLabourer: number;
  contractCostPerLabourer: number;
}

export interface LabourerEconomicInput {
  labourerType: LabourerType;
  labourerTier: number; // 2 a 8
  journalTier: number;  // 2 a 8
  houseTier: number;    // 2 a 8
  labourersCount: number; // Número de trabajadores (1 a 3 por casa o 15 por Guild Hall)
  // Precios manuales de mercado
  filledJournalPrice: number;    // Coste de comprar diario lleno
  emptyJournalResellPrice: number; // Precio al que vendes el diario vacío que devuelve el trabajador
  estimatedReturnSilverValue: number; // Valor estimado de mercado de los recursos que devuelve
  // Costes de instalación (opcional para cálculo de ROI / amortización)
  houseConstructionCost?: number; // Coste en plata de los bloques + madera de la casa
  furnitureCost?: number;         // Coste de camas, mesas y trofeos
  labourerHireContractCost?: number; // Coste de contratar o comprar al trabajador
}

export interface LabourerEconomicResult {
  happinessScore: number;       // Puntuación de felicidad calculada
  maxHappinessPossible: number; // Felicidad máxima teórica
  returnYieldPercent: number;   // % de retorno (ej. 100% a 150% en recolección, 100% a 125% en crafteo)
  cycleDurationHours: number;   // 22 horas
  // Balance diario por trabajador
  dailyGrossRevenue: number;     // Valor de los recursos devueltos
  dailyJournalNetCost: number;   // Coste diario lleno - retorno diario vacío
  dailyNetProfit: number;        // Ganancia neta diaria por trabajador
  // Totales para el grupo de trabajadores
  totalDailyGross: number;
  totalDailyNetProfit: number;
  totalMonthlyNetProfit: number; // 30 ciclos de 22h
  roiPercent: number;            // Retorno sobre coste del diario (%)
  // Amortización de instalación
  initialSetupInvestment: number;
  daysToAmortize: number;        // Días para recuperar la inversión de la casa y muebles
  recommendations: string[];
}
