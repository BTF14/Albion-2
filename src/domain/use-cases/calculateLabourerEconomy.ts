import {
  LabourerDefinition,
  LabourerType,
  HouseTierInfo,
  LabourerEconomicInput,
  LabourerEconomicResult,
} from '../models/labourers';

// Catálogo Oficial de Trabajadores de Albion Online
export const LABOURERS_CATALOG: LabourerDefinition[] = [
  // --- RECOLECCIÓN (GATHERING) ---
  {
    id: 'lumberjack',
    nameEs: 'Leñador',
    nameEn: 'Lumberjack',
    category: 'gathering',
    professionEs: 'Talar Madera en mundo abierto',
    journalNameEs: 'Diario de Leñador',
    journalNameEn: "Woodchopper's Journal",
    primaryReturnsEs: 'Madera sin procesar (Troncos) y Tablones refinados',
    specialistTrophyNameEs: 'Trofeo de Leñador',
    description: 'Devuelve madera de acuerdo al tier del diario entregado. Requiere talar árboles para llenarse.',
  },
  {
    id: 'stonecutter',
    nameEs: 'Cantero',
    nameEn: 'Stonecutter',
    category: 'gathering',
    professionEs: 'Picar Piedra en mundo abierto',
    journalNameEs: 'Diario de Cantero',
    journalNameEn: "Stonecutter's Journal",
    primaryReturnsEs: 'Piedra en bruto y Bloques de piedra tallados',
    specialistTrophyNameEs: 'Trofeo de Cantero',
    description: 'Devuelve piedra y bloques para construcción. Se llena picando depósitos de roca.',
  },
  {
    id: 'prospector',
    nameEs: 'Prospector',
    nameEn: 'Prospector',
    category: 'gathering',
    professionEs: 'Extraer Mena de Mineral',
    journalNameEs: 'Diario de Prospector',
    journalNameEn: "Prospector's Journal",
    primaryReturnsEs: 'Mena de metal en bruto y Barras de lingote',
    specialistTrophyNameEs: 'Trofeo de Prospector',
    description: 'Devuelve menas de cobre, hierro, titanio, etc. Se llena minando vetas metálicas.',
  },
  {
    id: 'cropper',
    nameEs: 'Cosechador',
    nameEn: 'Cropper',
    category: 'gathering',
    professionEs: 'Recolectar Fibra en pantanos/estepas',
    journalNameEs: 'Diario de Cosechador',
    journalNameEn: "Cropper's Journal",
    primaryReturnsEs: 'Fibra de plantas y Telas tejidas',
    specialistTrophyNameEs: 'Trofeo de Cosechador',
    description: 'Devuelve fibras vegetales de mundo abierto para refino textil. Se llena recolectando fibra.',
  },
  {
    id: 'gamekeeper',
    nameEs: 'Desollador',
    nameEn: 'Gamekeeper',
    category: 'gathering',
    professionEs: 'Desollar Pieles de animales salvajes',
    journalNameEs: 'Diario de Desollador',
    journalNameEn: "Gamekeeper's Journal",
    primaryReturnsEs: 'Pieles en bruto y Cuero curtido',
    specialistTrophyNameEs: 'Trofeo de Desollador',
    description: 'Devuelve pieles para curtido de armaduras ligeras. Se llena desollando fauna en mundo abierto.',
  },
  {
    id: 'fisherman',
    nameEs: 'Pescador',
    nameEn: 'Fisherman',
    category: 'gathering',
    professionEs: 'Pesca en ríos, lagos y mares',
    journalNameEs: 'Diario de Pescador',
    journalNameEn: "Fisherman's Journal",
    primaryReturnsEs: 'Pescado crudo, Pescado picado, Algas y Objetos sumergidos',
    specialistTrophyNameEs: 'Trofeo de Pescador / Tiburón disecado',
    description: 'Devuelve pescados comestibles y algas para salsas de comida (.1, .2, .3). Se llena pescando.',
  },
  // --- ARTESANÍA (CRAFTING) ---
  {
    id: 'blacksmith',
    nameEs: 'Herrero',
    nameEn: 'Blacksmith',
    category: 'crafting',
    professionEs: 'Forja de Guerrero (Espadas, Hachas, Mazas, Placas)',
    journalNameEs: 'Diario de Herrero',
    journalNameEn: "Blacksmith's Journal",
    primaryReturnsEs: 'Barras de metal refinado y Tablones de madera',
    specialistTrophyNameEs: 'Trofeo de Herrero',
    description: 'Se llena crafteando armamento y armaduras pesadas en la Forja de Guerrero.',
  },
  {
    id: 'fletcher',
    nameEs: 'Flechero',
    nameEn: 'Fletcher',
    category: 'crafting',
    professionEs: 'Cabaña de Cazador (Arcos, Ballestas, Dagas, Cuero)',
    journalNameEs: 'Diario de Flechero',
    journalNameEn: "Fletcher's Journal",
    primaryReturnsEs: 'Cuero curtido refinado y Tablones de madera',
    specialistTrophyNameEs: 'Trofeo de Flechero',
    description: 'Se llena crafteando arcos, lanzas, dagas o chaquetas de cazador en la Cabaña de Cazador.',
  },
  {
    id: 'imbuer',
    nameEs: 'Mago / Imbuidor',
    nameEn: 'Imbuer',
    category: 'crafting',
    professionEs: 'Torre del Mago (Báculos, Túnicas de Tela, Calaveras)',
    journalNameEs: 'Diario de Mago',
    journalNameEn: "Imbuer's Journal",
    primaryReturnsEs: 'Tela refinada y Barras de metal',
    specialistTrophyNameEs: 'Trofeo de Mago',
    description: 'Se llena crafteando báculos arcanos, pirománticos o túnicas en la Torre del Mago.',
  },
  {
    id: 'tinker',
    nameEs: 'Hojalatero',
    nameEn: 'Tinker',
    category: 'crafting',
    professionEs: 'Taller de Herramientas (Herramientas, Bolsas, Capas, Muebles)',
    journalNameEs: 'Diario de Hojalatero',
    journalNameEn: "Tinker's Journal",
    primaryReturnsEs: 'Tablones, Barras de metal, Telas y Cueros variados',
    specialistTrophyNameEs: 'Trofeo de Hojalatero',
    description: 'Se llena crafteando herramientas de recolección, mochilas, bolsas y capas en el Taller de Herramientas.',
  },
  // --- COMBATE (MERCENARIO) ---
  {
    id: 'mercenary',
    nameEs: 'Mercenario',
    nameEn: 'Mercenary',
    category: 'mercenary',
    professionEs: 'Combate PvE (Dungeons, Mobs de mundo abierto)',
    journalNameEs: 'Diario de Mercenario',
    journalNameEn: "Mercenary's Journal",
    primaryReturnsEs: 'Bolsas de Plata pura directa',
    specialistTrophyNameEs: 'Trofeo de Mercenario',
    description: 'Se llena ganando fama de combate matando criaturas y jefes en Albion Online. Devuelve plata directa.',
  },
];

export const LABOURER_CATALOG = LABOURERS_CATALOG;

// Requisitos oficiales de construcción por Tier de Casa
export const HOUSES_TIER_INFO: HouseTierInfo[] = [
  {
    tier: 2,
    nameEs: "Casa de Novato (T2)",
    nameEn: "Novice's House",
    maxLabourers: 1,
    furnitureLimit: 5,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Caliza T2 (Limestone)',
    roughLogsNeeded: 30,
    roughStoneNeeded: 3,
    fameReward: 540,
  },
  {
    tier: 3,
    nameEs: "Casa de Oficial (T3)",
    nameEn: "Journeyman's House",
    maxLabourers: 2,
    furnitureLimit: 7,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Arenisca T3 (Sandstone)',
    roughLogsNeeded: 60,
    roughStoneNeeded: 6,
    fameReward: 2430,
  },
  {
    tier: 4,
    nameEs: "Casa de Adepto (T4)",
    nameEn: "Adept's House",
    maxLabourers: 2,
    furnitureLimit: 10,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Travertino T4 (Travertine)',
    roughLogsNeeded: 120,
    roughStoneNeeded: 12,
    fameReward: 8505,
  },
  {
    tier: 5,
    nameEs: "Casa de Experto (T5)",
    nameEn: "Expert's House",
    maxLabourers: 3,
    furnitureLimit: 14,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Granito T5 (Granite)',
    roughLogsNeeded: 240,
    roughStoneNeeded: 24,
    fameReward: 26000,
  },
  {
    tier: 6,
    nameEs: "Casa de Maestro (T6)",
    nameEn: "Master's House",
    maxLabourers: 3,
    furnitureLimit: 14,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Pizarra T6 (Slate)',
    roughLogsNeeded: 480,
    roughStoneNeeded: 48,
    fameReward: 78000,
  },
  {
    tier: 7,
    nameEs: "Casa de Gran Maestro (T7)",
    nameEn: "Grandmaster's House",
    maxLabourers: 3,
    furnitureLimit: 14,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Basalto T7 (Basalt)',
    roughLogsNeeded: 960,
    roughStoneNeeded: 96,
    fameReward: 234000,
  },
  {
    tier: 8,
    nameEs: "Casa de Anciano (T8)",
    nameEn: "Elder's House",
    maxLabourers: 3,
    furnitureLimit: 14,
    stoneBlocksNeeded: 180,
    stoneTypeEs: 'Bloques de Mármol T8 (Marble)',
    roughLogsNeeded: 1920,
    roughStoneNeeded: 192,
    fameReward: 700000,
  },
];

/**
 * Calcula la felicidad esperada y el porcentaje de retorno de un trabajador en Albion Online.
 * 
 * Reglas de Albion Online:
 * - El trabajador puede aceptar diarios de su mismo tier o inferiores.
 * - Si el tier del trabajador y la casa es 1 nivel superior al del diario (ej. Casa T6 + Trabajador T6 con Diario T5),
 *   la felicidad alcanza el máximo beneficio logrando hasta 150% de retorno en recolectores o 122.5% - 130% en crafteo.
 * - Si el tier del diario es igual al del trabajador con muebles a nivel, el retorno base ronda 100% - 110%.
 * - Si la casa o muebles son inferiores al diario, la felicidad decae drásticamente (hasta no poder aceptar el diario).
 */
export function calculateLabourerHappinessAndYield(
  houseTier: number,
  labourerTier: number,
  journalTier: number,
  category: 'gathering' | 'crafting' | 'mercenary',
  hasMatchingFurniture: boolean = true,
  hasGeneralistTrophies: boolean = true,
  hasSpecialistTrophies: boolean = true
): { happinessScore: number; maxHappiness: number; yieldPercent: number } {
  // Validación defensiva
  const safeHouseTier = Math.max(2, Math.min(8, houseTier));
  const safeLabourerTier = Math.max(2, Math.min(8, labourerTier));
  const safeJournalTier = Math.max(2, Math.min(8, journalTier));

  // Si el tier del trabajador es menor que el diario, no lo puede aceptar (0%)
  if (safeLabourerTier < safeJournalTier) {
    return { happinessScore: 0, maxHappiness: 100, yieldPercent: 0 };
  }

  // Felicidad máxima requerida según el tier del diario
  // Base aproximada: T2=100, T3=150, T4=200, T5=250, T6=300, T7=350, T8=400
  const maxHappiness = safeJournalTier * 50;

  // Cálculo de felicidad acumulada:
  // Cama (aporta hasta 100 puntos si la cama es >= journalTier)
  // Mesa (aporta hasta 50 puntos si la mesa es >= journalTier)
  // Trofeos generalistas (aportan +5 a +10 por tier)
  // Trofeos especialistas (aportan +5 a +10 por tier)
  let happiness = 0;

  if (safeHouseTier >= safeJournalTier && hasMatchingFurniture) {
    happiness += 100; // Cama a nivel
    happiness += 50;  // Mesa a nivel
  } else if (safeHouseTier < safeJournalTier) {
    happiness += 60;  // Penalización por muebles bajos
  }

  if (hasGeneralistTrophies) {
    happiness += 25;
  }
  if (hasSpecialistTrophies) {
    happiness += 25;
  }

  // Si el trabajador y la casa superan el tier del diario (+1 tier ventaja)
  if (safeHouseTier > safeJournalTier && safeLabourerTier > safeJournalTier) {
    happiness += 50; // Bonificación por tier superior
  }

  // Determinación del porcentaje de rendimiento (Yield %)
  let maxYield = category === 'gathering' ? 150 : category === 'crafting' ? 125 : 110;
  let minYield = 100;

  let yieldPercent = minYield;
  if (safeHouseTier > safeJournalTier && safeLabourerTier > safeJournalTier) {
    yieldPercent = maxYield;
  } else if (safeHouseTier === safeJournalTier && safeLabourerTier === safeJournalTier) {
    yieldPercent = category === 'gathering' ? 112.5 : category === 'crafting' ? 108 : 100;
  } else {
    // Rendimiento mermado por muebles inferiores
    yieldPercent = 90;
  }

  return {
    happinessScore: Math.min(happiness, maxHappiness + 100),
    maxHappiness,
    yieldPercent,
  };
}

/**
 * Caso de Uso: Calcula la rentabilidad financiera y ROI de los trabajadores (Labourers).
 * Respeta el estándar puro de Gentleman Programming (sin React ni DOM).
 */
export function calculateLabourerEconomy(input: LabourerEconomicInput): LabourerEconomicResult {
  const safeLabourerTier = Math.max(2, Math.min(8, Number(input.labourerTier) || 2));
  const safeJournalTier = Math.max(2, Math.min(8, Number(input.journalTier) || 2));
  const safeHouseTier = Math.max(2, Math.min(8, Number(input.houseTier) || 2));
  const safeLabourersCount = Math.max(1, Math.min(15, Math.floor(Number(input.labourersCount) || 1)));

  const filledJournalPrice = Math.max(0, Number(input.filledJournalPrice) || 0);
  const emptyJournalResellPrice = Math.max(0, Number(input.emptyJournalResellPrice) || 0);
  const estimatedReturnSilverValue = Math.max(0, Number(input.estimatedReturnSilverValue) || 0);

  const houseConstructionCost = Math.max(0, Number(input.houseConstructionCost) || 0);
  const furnitureCost = Math.max(0, Number(input.furnitureCost) || 0);
  const labourerHireContractCost = Math.max(0, Number(input.labourerHireContractCost) || 0);

  const def = LABOURERS_CATALOG.find((l) => l.id === input.labourerType) || LABOURERS_CATALOG[0];

  const { happinessScore, maxHappiness, yieldPercent } = calculateLabourerHappinessAndYield(
    safeHouseTier,
    safeLabourerTier,
    safeJournalTier,
    def.category
  );

  // Si el trabajador no puede aceptar el diario
  if (yieldPercent <= 0) {
    return {
      happinessScore: 0,
      maxHappinessPossible: maxHappiness,
      returnYieldPercent: 0,
      cycleDurationHours: 22,
      dailyGrossRevenue: 0,
      dailyJournalNetCost: 0,
      dailyNetProfit: 0,
      totalDailyGross: 0,
      totalDailyNetProfit: 0,
      totalMonthlyNetProfit: 0,
      roiPercent: 0,
      initialSetupInvestment: houseConstructionCost + furnitureCost + labourerHireContractCost * safeLabourersCount,
      daysToAmortize: 0,
      recommendations: [
        `⚠️ El trabajador es Tier ${safeLabourerTier} y no puede procesar diarios de Tier ${safeJournalTier}. Sube de nivel al trabajador o entrégale diarios de T${safeLabourerTier} o menor.`,
      ],
    };
  }

  // Coste neto diario por diario procesado (compras lleno, recibes vacío y lo revendes o reutilizas)
  const dailyJournalNetCost = Math.max(0, filledJournalPrice - emptyJournalResellPrice);

  // Ingreso bruto efectivo escalado por el rendimiento de felicidad
  // Rendimiento 100% = valor base. Rendimiento 150% = 1.5 * valor base
  const multiplier = yieldPercent / 100;
  const dailyGrossRevenue = Math.round(estimatedReturnSilverValue * multiplier);

  // Ganancia neta por trabajador por ciclo de 22 horas
  const dailyNetProfit = dailyGrossRevenue - dailyJournalNetCost;

  // Totales para la casa o conjunto de trabajadores
  const totalDailyGross = dailyGrossRevenue * safeLabourersCount;
  const totalDailyNetProfit = dailyNetProfit * safeLabourersCount;
  const totalMonthlyNetProfit = totalDailyNetProfit * 30; // 30 ciclos de 22h

  // Retorno porcentual sobre la inversión del diario
  const roiPercent = dailyJournalNetCost > 0
    ? Math.round((dailyNetProfit / dailyJournalNetCost) * 100)
    : dailyNetProfit > 0
    ? 100
    : 0;

  // Inversión de instalación inicial (Casa + Muebles + Contratos de trabajadores)
  const initialSetupInvestment =
    houseConstructionCost + furnitureCost + (labourerHireContractCost * safeLabourersCount);

  // Días para amortizar la inversión
  const daysToAmortize = totalDailyNetProfit > 0
    ? Math.ceil(initialSetupInvestment / totalDailyNetProfit)
    : 0;

  // Recomendaciones tácticas de Albion Online
  const recommendations: string[] = [];

  if (safeHouseTier > safeJournalTier) {
    recommendations.push(
      `✅ Configuración óptima de felicidad: Tu casa T${safeHouseTier} y trabajador T${safeLabourerTier} están 1 tier por encima del diario T${safeJournalTier}, alcanzando el máximo rendimiento (${yieldPercent}%).`
    );
  } else if (safeHouseTier === safeJournalTier) {
    recommendations.push(
      `💡 Consejo de optimización: Al usar casa y trabajador T${safeHouseTier} con diarios del mismo tier, tu rendimiento es de ~${yieldPercent}%. Subir la casa y trabajador a T${safeHouseTier + 1} aumentaría el retorno al ${def.category === 'gathering' ? '150%' : '125%'}.`
    );
  }

  if (dailyJournalNetCost === 0 && filledJournalPrice > 0) {
    recommendations.push(
      `📘 Recuerda que si llenas los diarios tú mismo recolectando o crafteando en lugar de comprarlos en el mercado, el coste del diario lleno es 0 y todo el retorno es ganancia pura.`
    );
  }

  if (daysToAmortize > 0 && initialSetupInvestment > 0) {
    recommendations.push(
      `⏱️ Amortización: Recuperarás la inversión inicial de ${initialSetupInvestment.toLocaleString()} 🪙 en aproximadamente ${daysToAmortize} días de trabajo continuado.`
    );
  }

  return {
    happinessScore,
    maxHappinessPossible: maxHappiness,
    returnYieldPercent: yieldPercent,
    cycleDurationHours: 22,
    dailyGrossRevenue,
    dailyJournalNetCost,
    dailyNetProfit,
    totalDailyGross,
    totalDailyNetProfit,
    totalMonthlyNetProfit,
    roiPercent,
    initialSetupInvestment,
    daysToAmortize,
    recommendations,
  };
}
