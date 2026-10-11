import { CityId } from '../../types';

export type CraftStationType =
  | 'forge'      // Forja del Guerrero (Blacksmith)
  | 'hunter'     // Cabaña del Cazador (Fletcher)
  | 'mage'       // Torre del Mago (Imbuer)
  | 'toolmaker'; // Taller de Hojalatero (Tinker)

export type CraftEquipmentSlot =
  | 'one_hand_weapon'
  | 'two_hand_weapon'
  | 'head'
  | 'chest'
  | 'shoes'
  | 'offhand'
  | 'tool'
  | 'bag'
  | 'cape';

export type ItemQuality = 'normal' | 'good' | 'outstanding' | 'excellent' | 'masterpiece';

export interface CraftingMaterialRequirement {
  materialId: string;
  nameEs: string;
  tier: number;
  amount: number;
  type: 'metal' | 'leather' | 'cloth' | 'wood' | 'stone' | 'artifact' | 'other';
}

export interface CraftEquipmentRecipe {
  id: string;
  nameEs: string;
  nameEn: string;
  station: CraftStationType;
  slot: CraftEquipmentSlot;
  tier: number;
  itemValue: number; // Item Value oficial de Albion (para tasa de nutrición en puestos de ciudad)
  craftFame: number; // Fama base generada al craftear (llena diarios)
  materials: CraftingMaterialRequirement[];
  associatedLabourer: 'blacksmith' | 'fletcher' | 'imbuer' | 'tinker';
  journalFameThreshold: Record<number, number>; // Fama requerida para llenar diario T4 a T8
}

export interface CityCraftingBonus {
  cityId: CityId;
  cityName: string;
  color: string;
  primaryStation: CraftStationType;
  specialtiesEs: string[];
  baseRRRWithoutFocus: number; // ej. 24.8% en bonificados, 15.2% base en no-bonificados
  baseRRRWithFocus: number;    // ej. 47.9% en bonificados, 43.5% en no-bonificados
}

export interface CraftingBatchCalculationInput {
  recipe: CraftEquipmentRecipe;
  tier: number;
  enchantment: number; // 0, 1, 2, 3, 4
  quality: ItemQuality;
  batchCount: number; // Cuántas piezas craftear
  cityId: CityId;
  isCityCraftBonusActive: boolean; // Si el ítem goza del bono de especialización de la ciudad
  hasDailyEventBonus: boolean;     // Bono diario oficial si aplica (ej +10% o +20% RRR)
  dailyEventBonusPercent?: number;
  useFocus: boolean;
  hasPremium: boolean;
  stationTaxPer100Nutrition: number; // Plata cobrada por el dueño del taller por cada 100 de nutrición
  hasCrafterSalad: boolean;          // +Calidad y velocidad de crafteo
  // Maestría del Artesano en la Tabla del Destino (Destiny Board)
  crafterMasteryLevel?: number;       // Nivel de Artesano de la Rama (0-100, +30 FCE/nivel)
  itemSpecLevel?: number;             // Nivel de Especialización del Ítem (0-100, +250 FCE directo + 30 FCE a la rama)
  otherSpecsAverageLevel?: number;    // Nivel promedio de otras especializaciones de la misma rama (0-100, +30 FCE/nivel)
  saladType?: 'none' | 'bean_t2' | 'turnip_t4' | 'potato_t6' | 'kraken_t6'; // Comida de artesano
  availableFocusPoints?: number;      // Foco disponible del personaje (por defecto 10.000)
  // Precios manuales de entrada
  materialPrices: Record<string, number>; // id -> precio manual por unidad
  finishedItemSellPrice: number;          // Precio de venta manual en mercado por unidad
  emptyJournalBuyPrice: number;           // Precio de compra del diario vacío
  filledJournalSellPrice: number;         // Precio de venta del diario lleno en mercado
  // Configuración de estrategia con diarios
  journalStrategy: 'sell_filled' | 'use_labourers' | 'no_journals';
  labourerHouseTier?: number;             // Tier de casa donde residen tus trabajadores
  labourerTier?: number;                  // Tier del trabajador
  labourerYieldPercent?: number;          // Rendimiento esperado (ej: 125% para crafteo en tier adecuado)
  labourerReturnedMaterialValue?: number; // Estimación manual del valor de recursos devueltos por diario
}

export interface CraftingBatchCalculationResult {
  recipeId: string;
  recipeName: string;
  batchCount: number;
  // Métricas de Fama y Diarios
  totalCraftFameEarned: number;
  fameRequiredPerJournal: number;
  journalsFilledCount: number;        // Diarios enteros llenados
  partialJournalProgressPercent: number; // Progreso hacia el siguiente diario
  // Materiales y Devolución (RRR)
  effectiveReturnRatePercent: number; // % RRR aplicado
  grossMaterialCost: number;          // Coste total de materiales brutos
  returnedMaterialValue: number;      // Valor de materiales recuperados por RRR
  effectiveMaterialCost: number;      // Coste bruto - materiales devueltos
  // Tasas de Ciudad
  totalNutritionUsed: number;
  stationFeeTotal: number;
  // Ingresos del Ítem
  grossItemSales: number;
  marketTaxPercent: number;           // 4% o 8%
  setupFeePercent: number;            // 2.5%
  marketDeductions: number;
  netItemSales: number;
  // Economía de Diarios
  emptyJournalsInvestmentCost: number; // Coste de comprar los diarios vacíos
  grossFilledJournalsValue: number;    // Venta en mercado o retorno de trabajadores
  netJournalsProfit: number;           // Ganancia limpia aportada por los diarios
  // Balance Financiero Final
  totalExpenditure: number;            // Materiales + Tasa + Diarios vacíos
  totalRevenue: number;                // Venta ítem neta + Ingreso diarios
  netProfit: number;                   // Ganancia o pérdida total neta
  profitPerUnit: number;               // Ganancia o pérdida neta por pieza crafteada
  roiPercent: number;                  // Retorno sobre la inversión (%)
  silverPerFocusPoint: number;         // Plata neta por punto de foco gastado
  isProfitable: boolean;
  // Métricas de Maestría y Eficiencia de Foco en la Tabla del Destino
  masteryMetrics: {
    totalFCE: number;                  // Eficiencia de Costo de Foco Total
    crafterMasteryFCE: number;         // Aporte de la maestría general de la rama (+30/nivel)
    itemSpecFCE: number;               // Aporte de la especialización directa (+250/nivel)
    otherSpecsFCE: number;             // Aporte de las demás especializaciones (+30/nivel)
    baseFocusCostPerItem: number;      // Costo de foco base sin maestría
    actualFocusCostPerItem: number;    // Costo de foco final reducido con maestría
    focusDiscountPercent: number;      // Porcentaje de reducción del costo de foco
    itemsCraftableWith10k: number;     // Piezas que puedes forjar con 10.000 de foco diario
    totalBatchFocusCost: number;       // Foco requerido para el lote actual
    dailyFocusSilverProfit: number;    // Ganancia neta estimada con los 10.000 de foco diario
  };
  // Desglose de Calidad de Fabricación y Efecto de Ensaladas
  qualityMetrics: {
    normalPercent: number;
    goodPercent: number;
    outstandingPercent: number;
    excellentPercent: number;
    masterpiecePercent: number;
    saladNameEs: string;
    saladQualityBonusPercent: number;
    estimatedQualityBonusSilverPerItem: number;
  };
  // Comparativa de Estrategia de Libros
  journalComparison: {
    sellFilledNetProfit: number;
    useLabourersNetProfit: number;
    noJournalsNetProfit: number;
    recommendedStrategy: 'sell_filled' | 'use_labourers';
    strategyAdvantageSilver: number;
  };
  recommendations: string[];
}
