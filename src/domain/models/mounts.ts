import { CityId } from '../../types';

export type MountCategory =
  | 'horse'
  | 'ox'
  | 'stag'
  | 'moose'
  | 'swiftclaw'
  | 'direwolf'
  | 'greywolf'
  | 'wild_boar'
  | 'direbear'
  | 'salamander'
  | 'swamp_dragon'
  | 'ram'
  | 'moabird'
  | 'owl'
  | 'mammoth'
  | 'fire_drake'
  | 'elite_faction'
  | 'armored_horse';

export type MountLocationType = 'pasture' | 'kennel'; // Pastizal (herbívoros) vs Criadero (carnívoros/salvajes)
export type MountDiet = 'herbivore' | 'carnivore';

export interface MountSaddlingMaterial {
  itemId: string;
  nameEs: string;
  tier: number;
  amount: number;
}

export interface MountDefinition {
  id: string;
  nameEs: string;
  nameEn: string;
  tier: number;
  category: MountCategory;
  locationType: MountLocationType;
  diet: MountDiet;
  growthCycles: number; // Días/ciclos de 22 horas con Premium
  foodPerCycle: number; // 10 unidades por ciclo
  favoriteFoodEs: string;
  babyNameEs: string;
  babyNameEn: string;
  adultNameEs: string;
  adultNameEn: string;
  saddledNameEs: string;
  saddledNameEn: string;
  offspringChanceWithoutFocus: number; // Porcentaje base (ej. 80 para T3, 0 para carnívoros)
  offspringChanceWithFocus: number; // Porcentaje con foco de nutrición (ej. 110 para T3, 30 para Garrapresta)
  baseNurtureFocusCost: number; // Coste base de foco por día para nutrir
  saddlingMaterial: MountSaddlingMaterial;
  saddlerBaseNutrition: number; // Coste de nutrición de la estación de guarnicionero
  saddlerBaseFocusCost: number; // Coste de foco base para ensillar
  iconName: string;
  description: string;
}

export interface MountBreedingInput {
  mountId: string;
  mountCount: number; // Cantidad de animales criados (ej. 9 para 1 pastizal completo)
  hasPremium: boolean; // 22h por ciclo y 6.5% impuesto; si es false: 44h y 10.5%
  useNurtureFocus: boolean; // Usar foco al nutrir al animal durante el crecimiento
  useSaddlerFocus: boolean; // Usar foco al ensillar en el Guarnicionero
  fceNurture: number; // Focus Cost Efficiency para crianza
  fceSaddler: number; // Focus Cost Efficiency para guarnicionero
  babyUnitPrice: number; // Precio de compra de la cría (o coste de oportunidad)
  isBabyRaisedOwn: boolean; // Si la cría proviene de cosecha propia anterior
  foodUnitPrice: number; // Precio de 1 unidad de grano o carne
  saddlingMaterialUnitPrice: number; // Precio de 1 cuero, tabla o lingote
  stationFeePer100Nutrition: number; // Tasa de uso de la tienda del Guarnicionero por cada 100 de nutrición
  adultSellPrice: number; // Precio de venta del animal adulto domado en mercado
  saddledSellPrice: number; // Precio de venta de la montura ensillada final en mercado
  marketTaxRate: number; // 6.5% con Premium o 10.5% sin Premium
  dailyProductionBonusRRR?: number; // Bono diario activo de Albion (ej. +10% en Guarnicionero)
}

export interface MountStrategySummary {
  grossRevenue: number;
  marketTax: number;
  netRevenue: number;
  totalCost: number;
  netProfit: number;
  roiPercent: number;
  profitPerUnit: number;
  profitPerDay: number;
  isProfitable: boolean;
}

export interface MountBreedingResult {
  mountId: string;
  mountCount: number;
  totalGrowthCycles: number;
  totalGrowthHours: number;
  totalFoodUnits: number;
  foodTotalCost: number;
  babyTotalCost: number;
  grossBreedingCost: number;
  offspringExpectedCount: number;
  offspringValueTotal: number;
  netBreedingCost: number; // grossBreedingCost - offspringValueTotal
  netBreedingCostPerUnit: number;

  // Estrategia 1: Vender sólo animal adulto (Tame / Domado)
  strategyAdult: MountStrategySummary;

  // Estrategia 2: Ensillar en Guarnicionero y vender montura lista
  saddlingMaterialCostGross: number;
  saddlingStationFeeTotal: number;
  saddlingReturnRatePercent: number; // RRR del Guarnicionero
  saddlingReturnedMaterialValue: number;
  saddlingNetCost: number;
  totalSaddledCost: number; // netBreedingCost + saddlingNetCost
  strategySaddled: MountStrategySummary;

  // Comparativa y recomendación
  profitDifferenceSaddledVsAdult: number; // Ganancia extra en plata al ensillar
  bestStrategy: 'sell_adult' | 'saddle_and_sell';
  verdict: string;

  // Métricas de foco
  focusNurtureTotalCost: number;
  extraSilverFromNurtureFocus: number;
  silverPerNurtureFocus: number;

  focusSaddlerTotalCost: number;
  extraSilverFromSaddlerFocus: number;
  silverPerSaddlerFocus: number;
}

/**
 * Catálogo Oficial Completo de Monturas de Albion Online
 * Exactitud estricta con las mecánicas del juego:
 * - Ciclos: 1 ciclo por tier T3, +1 por cada tier adicional (T3=1, T4=2, T5=3, T6=4, T7=5, T8=6)
 * - Alimento: 10 unidades diarias
 * - Retorno de cría: Los animales domésticos tienen porcentaje base sin foco; las bestias salvajes tienen 0% base.
 */
export const MOUNTS_CATALOG: MountDefinition[] = [
  // ==================== CABALLOS DE MONTAR (T3 a T8) ====================
  {
    id: 'mount_horse_t3',
    nameEs: 'Caballo de Montar (T3)',
    nameEn: 'T3 Riding Horse',
    tier: 3,
    category: 'horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 1, // 22h
    foodPerCycle: 10,
    favoriteFoodEs: 'Trigo o Hortalizas (T2-T8)',
    babyNameEs: 'Potro T3',
    babyNameEn: 'T3 Foal',
    adultNameEs: 'Caballo T3',
    adultNameEn: 'T3 Horse',
    saddledNameEs: 'Caballo de Montar T3',
    saddledNameEn: 'T3 Riding Horse',
    offspringChanceWithoutFocus: 80,
    offspringChanceWithFocus: 110,
    baseNurtureFocusCost: 1000,
    saddlingMaterial: {
      itemId: 'leather_t3',
      nameEs: 'Cuero grueso (T3)',
      tier: 3,
      amount: 10,
    },
    saddlerBaseNutrition: 40,
    saddlerBaseFocusCost: 400,
    iconName: 'Horse',
    description: 'Montura rápida y económica de tier inicial. Ideal para granjeros novatos.',
  },
  {
    id: 'mount_horse_t4',
    nameEs: 'Caballo de Montar (T4)',
    nameEn: 'T4 Riding Horse',
    tier: 4,
    category: 'horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 2, // 44h
    foodPerCycle: 10,
    favoriteFoodEs: 'Nabos o Cultivos (T2-T8)',
    babyNameEs: 'Potro T4',
    babyNameEn: 'T4 Foal',
    adultNameEs: 'Caballo T4',
    adultNameEn: 'T4 Horse',
    saddledNameEs: 'Caballo de Montar T4',
    saddledNameEn: 'T4 Riding Horse',
    offspringChanceWithoutFocus: 60,
    offspringChanceWithFocus: 90,
    baseNurtureFocusCost: 1500,
    saddlingMaterial: {
      itemId: 'leather_t4',
      nameEs: 'Cuero trabajado (T4)',
      tier: 4,
      amount: 20,
    },
    saddlerBaseNutrition: 60,
    saddlerBaseFocusCost: 600,
    iconName: 'Horse',
    description: 'La montura más usada en el juego para transporte diario y desplazamientos en zona segura.',
  },
  {
    id: 'mount_horse_t5',
    nameEs: 'Caballo de Montar (T5)',
    nameEn: 'T5 Riding Horse',
    tier: 5,
    category: 'horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 3, // 66h
    foodPerCycle: 10,
    favoriteFoodEs: 'Coles o Cultivos (T2-T8)',
    babyNameEs: 'Potro T5',
    babyNameEn: 'T5 Foal',
    adultNameEs: 'Caballo T5',
    adultNameEn: 'T5 Horse',
    saddledNameEs: 'Caballo de Montar T5',
    saddledNameEn: 'T5 Riding Horse',
    offspringChanceWithoutFocus: 40,
    offspringChanceWithFocus: 75,
    baseNurtureFocusCost: 2000,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5)',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 800,
    iconName: 'Horse',
    description: 'Mayor velocidad de galope y capacidad de carga intermedia.',
  },
  {
    id: 'mount_horse_t6',
    nameEs: 'Caballo de Montar (T6)',
    nameEn: 'T6 Riding Horse',
    tier: 6,
    category: 'horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 4, // 88h
    foodPerCycle: 10,
    favoriteFoodEs: 'Patatas o Cultivos (T2-T8)',
    babyNameEs: 'Potro T6',
    babyNameEn: 'T6 Foal',
    adultNameEs: 'Caballo T6',
    adultNameEn: 'T6 Horse',
    saddledNameEs: 'Caballo de Montar T6',
    saddledNameEn: 'T6 Riding Horse',
    offspringChanceWithoutFocus: 20,
    offspringChanceWithFocus: 60,
    baseNurtureFocusCost: 2600,
    saddlingMaterial: {
      itemId: 'leather_t6',
      nameEs: 'Cuero endurecido (T6)',
      tier: 6,
      amount: 20,
    },
    saddlerBaseNutrition: 100,
    saddlerBaseFocusCost: 1000,
    iconName: 'Horse',
    description: 'Montura sólida para ZvZ y viajes en Zona Roja / Tierras Lejanas.',
  },
  {
    id: 'mount_horse_t7',
    nameEs: 'Caballo de Montar (T7)',
    nameEn: 'T7 Riding Horse',
    tier: 7,
    category: 'horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 5, // 110h
    foodPerCycle: 10,
    favoriteFoodEs: 'Maíz dulce o Cultivos (T2-T8)',
    babyNameEs: 'Potro T7',
    babyNameEn: 'T7 Foal',
    adultNameEs: 'Caballo T7',
    adultNameEn: 'T7 Horse',
    saddledNameEs: 'Caballo de Montar T7',
    saddledNameEn: 'T7 Riding Horse',
    offspringChanceWithoutFocus: 10,
    offspringChanceWithFocus: 50,
    baseNurtureFocusCost: 3300,
    saddlingMaterial: {
      itemId: 'leather_t7',
      nameEs: 'Cuero reforzado (T7)',
      tier: 7,
      amount: 20,
    },
    saddlerBaseNutrition: 120,
    saddlerBaseFocusCost: 1300,
    iconName: 'Horse',
    description: 'Alta resistencia y velocidad, excelente valor en el mercado para grupos de combate.',
  },
  {
    id: 'mount_horse_t8',
    nameEs: 'Caballo de Montar (T8)',
    nameEn: 'T8 Riding Horse',
    tier: 8,
    category: 'horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 6, // 132h
    foodPerCycle: 10,
    favoriteFoodEs: 'Calabazas o Cultivos (T2-T8)',
    babyNameEs: 'Potro T8',
    babyNameEn: 'T8 Foal',
    adultNameEs: 'Caballo T8',
    adultNameEn: 'T8 Horse',
    saddledNameEs: 'Caballo de Montar T8',
    saddledNameEn: 'T8 Riding Horse',
    offspringChanceWithoutFocus: 5,
    offspringChanceWithFocus: 40,
    baseNurtureFocusCost: 4200,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero fortificado (T8)',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 150,
    saddlerBaseFocusCost: 1800,
    iconName: 'Horse',
    description: 'Montura ecuestre máxima de Albion. Requiere 6 ciclos completos de crianza.',
  },

  // ==================== BUEYES DE TRANSPORTE (T3 a T8) ====================
  {
    id: 'mount_ox_t3',
    nameEs: 'Buey de Transporte (T3)',
    nameEn: 'T3 Transport Ox',
    tier: 3,
    category: 'ox',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 1, // 22h
    foodPerCycle: 10,
    favoriteFoodEs: 'Trigo o Hortalizas (T2-T8)',
    babyNameEs: 'Ternero de buey T3',
    babyNameEn: 'T3 Ox Calf',
    adultNameEs: 'Buey T3',
    adultNameEn: 'T3 Ox',
    saddledNameEs: 'Buey de Transporte T3',
    saddledNameEn: 'T3 Transport Ox',
    offspringChanceWithoutFocus: 80,
    offspringChanceWithFocus: 110,
    baseNurtureFocusCost: 1000,
    saddlingMaterial: {
      itemId: 'planks_t3',
      nameEs: 'Tablas de castaño (T3)',
      tier: 3,
      amount: 10,
    },
    saddlerBaseNutrition: 40,
    saddlerBaseFocusCost: 400,
    iconName: 'Package',
    description: 'Capacidad de carga básica para recolectores iniciales y traslados locales.',
  },
  {
    id: 'mount_ox_t4',
    nameEs: 'Buey de Transporte (T4)',
    nameEn: 'T4 Transport Ox',
    tier: 4,
    category: 'ox',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 2, // 44h
    foodPerCycle: 10,
    favoriteFoodEs: 'Nabos o Cultivos (T2-T8)',
    babyNameEs: 'Ternero de buey T4',
    babyNameEn: 'T4 Ox Calf',
    adultNameEs: 'Buey T4',
    adultNameEn: 'T4 Ox',
    saddledNameEs: 'Buey de Transporte T4',
    saddledNameEn: 'T4 Transport Ox',
    offspringChanceWithoutFocus: 60,
    offspringChanceWithFocus: 90,
    baseNurtureFocusCost: 1500,
    saddlingMaterial: {
      itemId: 'planks_t4',
      nameEs: 'Tablas de pino (T4)',
      tier: 4,
      amount: 20,
    },
    saddlerBaseNutrition: 60,
    saddlerBaseFocusCost: 600,
    iconName: 'Package',
    description: 'El buey más popular para transportar cosechas entre la isla y el mercado de la ciudad.',
  },
  {
    id: 'mount_ox_t5',
    nameEs: 'Buey de Transporte (T5)',
    nameEn: 'T5 Transport Ox',
    tier: 5,
    category: 'ox',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 3, // 66h
    foodPerCycle: 10,
    favoriteFoodEs: 'Coles o Cultivos (T2-T8)',
    babyNameEs: 'Ternero de buey T5',
    babyNameEn: 'T5 Ox Calf',
    adultNameEs: 'Buey T5',
    adultNameEn: 'T5 Ox',
    saddledNameEs: 'Buey de Transporte T5',
    saddledNameEn: 'T5 Transport Ox',
    offspringChanceWithoutFocus: 40,
    offspringChanceWithFocus: 75,
    baseNurtureFocusCost: 2000,
    saddlingMaterial: {
      itemId: 'planks_t5',
      nameEs: 'Tablas de cedro (T5)',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 800,
    iconName: 'Package',
    description: 'Excelente capacidad de carga pesada para refinar materiales en masa.',
  },
  {
    id: 'mount_ox_t6',
    nameEs: 'Buey de Transporte (T6)',
    nameEn: 'T6 Transport Ox',
    tier: 6,
    category: 'ox',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 4, // 88h
    foodPerCycle: 10,
    favoriteFoodEs: 'Patatas o Cultivos (T2-T8)',
    babyNameEs: 'Ternero de buey T6',
    babyNameEn: 'T6 Ox Calf',
    adultNameEs: 'Buey T6',
    adultNameEn: 'T6 Ox',
    saddledNameEs: 'Buey de Transporte T6',
    saddledNameEn: 'T6 Transport Ox',
    offspringChanceWithoutFocus: 20,
    offspringChanceWithFocus: 60,
    baseNurtureFocusCost: 2600,
    saddlingMaterial: {
      itemId: 'planks_t6',
      nameEs: 'Tablas de roble rojo (T6)',
      tier: 6,
      amount: 20,
    },
    saddlerBaseNutrition: 100,
    saddlerBaseFocusCost: 1000,
    iconName: 'Package',
    description: 'Gran capacidad de carga y alta salud frente a ataques de PNJ.',
  },
  {
    id: 'mount_ox_t7',
    nameEs: 'Buey de Transporte (T7)',
    nameEn: 'T7 Transport Ox',
    tier: 7,
    category: 'ox',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 5, // 110h
    foodPerCycle: 10,
    favoriteFoodEs: 'Maíz dulce o Cultivos (T2-T8)',
    babyNameEs: 'Ternero de buey T7',
    babyNameEn: 'T7 Ox Calf',
    adultNameEs: 'Buey T7',
    adultNameEn: 'T7 Ox',
    saddledNameEs: 'Buey de Transporte T7',
    saddledNameEn: 'T7 Transport Ox',
    offspringChanceWithoutFocus: 10,
    offspringChanceWithFocus: 50,
    baseNurtureFocusCost: 3300,
    saddlingMaterial: {
      itemId: 'planks_t7',
      nameEs: 'Tablas de corteza ceniza (T7)',
      tier: 7,
      amount: 20,
    },
    saddlerBaseNutrition: 120,
    saddlerBaseFocusCost: 1300,
    iconName: 'Package',
    description: 'Transporte colosal para gremios y comercio a gran escala.',
  },
  {
    id: 'mount_ox_t8',
    nameEs: 'Buey de Transporte (T8)',
    nameEn: 'T8 Transport Ox',
    tier: 8,
    category: 'ox',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 6, // 132h
    foodPerCycle: 10,
    favoriteFoodEs: 'Calabazas o Cultivos (T2-T8)',
    babyNameEs: 'Ternero de buey T8',
    babyNameEn: 'T8 Ox Calf',
    adultNameEs: 'Buey T8',
    adultNameEn: 'T8 Ox',
    saddledNameEs: 'Buey de Transporte T8',
    saddledNameEn: 'T8 Transport Ox',
    offspringChanceWithoutFocus: 5,
    offspringChanceWithFocus: 40,
    baseNurtureFocusCost: 4200,
    saddlingMaterial: {
      itemId: 'planks_t8',
      nameEs: 'Tablas de madera blanca (T8)',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 150,
    saddlerBaseFocusCost: 1800,
    iconName: 'Package',
    description: 'La montura de carga terrestre de mayor capacidad y resistencia del juego.',
  },

  // ==================== DEPREDADORES Y BESTIAS SALVAJES (CRIADERO / KENNEL) ====================
  {
    id: 'mount_swiftclaw_t5',
    nameEs: 'Garrapresta (T5)',
    nameEn: 'T5 Swiftclaw',
    tier: 5,
    category: 'swiftclaw',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 3, // 66h
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda (T3-T8) o Pescado picado',
    babyNameEs: 'Cría de Garrapresta T5',
    babyNameEn: 'T5 Swiftclaw Cub',
    adultNameEs: 'Garrapresta Domado T5',
    adultNameEn: 'T5 Tame Swiftclaw',
    saddledNameEs: 'Garrapresta Ensillado T5',
    saddledNameEn: 'T5 Swiftclaw',
    offspringChanceWithoutFocus: 0, // Las bestias salvajes tienen 0% sin foco
    offspringChanceWithFocus: 30, // ~30% con foco de nutrición
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5)',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Cat',
    description: 'Carnívoro criado en Criadero. Gran velocidad de carrera instantánea, rey del gank y roaming.',
  },
  {
    id: 'mount_direwolf_t6',
    nameEs: 'Lobo Huargo (T6)',
    nameEn: 'T6 Direwolf',
    tier: 6,
    category: 'direwolf',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 4, // 88h
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda (T3-T8) o Pescado picado',
    babyNameEs: 'Cachorro de Huargo T6',
    babyNameEn: 'T6 Direwolf Pup',
    adultNameEs: 'Huargo Domado T6',
    adultNameEn: 'T6 Tame Direwolf',
    saddledNameEs: 'Lobo Huargo Ensillado T6',
    saddledNameEn: 'T6 Direwolf',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 25,
    baseNurtureFocusCost: 3500,
    saddlingMaterial: {
      itemId: 'leather_t6',
      nameEs: 'Cuero endurecido (T6)',
      tier: 6,
      amount: 20,
    },
    saddlerBaseNutrition: 100,
    saddlerBaseFocusCost: 1200,
    iconName: 'Dog',
    description: 'La montura más rápida de Tier 6 en Albion. Requiere Criadero y carne cruda para alimentarse.',
  },
  {
    id: 'mount_wild_boar_t7',
    nameEs: 'Jabalí Salvaje (T7)',
    nameEn: 'T7 Wild Boar',
    tier: 7,
    category: 'wild_boar',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 5, // 110h
    foodPerCycle: 10,
    favoriteFoodEs: 'Maíz dulce o Cultivos (T2-T8)',
    babyNameEs: 'Lechón salvaje T7',
    babyNameEn: 'T7 Wild Boar Piglet',
    adultNameEs: 'Jabalí Domado T7',
    adultNameEn: 'T7 Tame Wild Boar',
    saddledNameEs: 'Jabalí Ensillado T7',
    saddledNameEn: 'T7 Saddled Wild Boar',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 20,
    baseNurtureFocusCost: 4500,
    saddlingMaterial: {
      itemId: 'leather_t7',
      nameEs: 'Cuero reforzado (T7)',
      tier: 7,
      amount: 20,
    },
    saddlerBaseNutrition: 120,
    saddlerBaseFocusCost: 1500,
    iconName: 'Shield',
    description: 'Excelente montura de transporte blindado y sigilo para recolectores en Zonas Negras.',
  },

  // ==================== CÉLULA HERBÍVOROS SALVAJES (PASTIZAL) ====================
  {
    id: 'mount_giant_stag_t4',
    nameEs: 'Ciervo Gigante (T4)',
    nameEn: 'T4 Giant Stag',
    tier: 4,
    category: 'stag',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 2, // 44h
    foodPerCycle: 10,
    favoriteFoodEs: 'Nabos o Cultivos (T2-T8)',
    babyNameEs: 'Bambi / Cría de Ciervo T4',
    babyNameEn: "T4 Adept's Fawn",
    adultNameEs: 'Ciervo Domado T4',
    adultNameEn: 'T4 Tame Giant Stag',
    saddledNameEs: 'Ciervo Gigante Ensillado T4',
    saddledNameEn: 'T4 Giant Stag',
    offspringChanceWithoutFocus: 0, // Bestia salvaje: 0% base
    offspringChanceWithFocus: 35, // 35% con nutrición de foco
    baseNurtureFocusCost: 1500,
    saddlingMaterial: {
      itemId: 'leather_t4',
      nameEs: 'Cuero trabajado (T4)',
      tier: 4,
      amount: 20,
    },
    saddlerBaseNutrition: 60,
    saddlerBaseFocusCost: 600,
    iconName: 'Compass',
    description: 'Popular montura de transporte rápido con capacidad de carga pasiva para recolectores iniciales.',
  },
  {
    id: 'mount_moose_t6',
    nameEs: 'Alce (T6)',
    nameEn: 'T6 Moose',
    tier: 6,
    category: 'moose',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 4, // 88h
    foodPerCycle: 10,
    favoriteFoodEs: 'Patatas o Cultivos (T2-T8)',
    babyNameEs: 'Cría de Alce T6',
    babyNameEn: 'T6 Moose Calf',
    adultNameEs: 'Alce Domado T6',
    adultNameEn: 'T6 Tame Moose',
    saddledNameEs: 'Alce Ensillado T6',
    saddledNameEn: 'T6 Saddled Moose',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 25,
    baseNurtureFocusCost: 3500,
    saddlingMaterial: {
      itemId: 'leather_t6',
      nameEs: 'Cuero endurecido (T6)',
      tier: 6,
      amount: 20,
    },
    saddlerBaseNutrition: 100,
    saddlerBaseFocusCost: 1200,
    iconName: 'Compass',
    description: 'Montura de transporte pesado y gran velocidad. Muy buscada para escapar de emboscadas con carga.',
  },

  // ==================== CRIATURAS SALVAJES Y ESPECIALES (CRIADERO / KENNEL) ====================
  {
    id: 'mount_swamp_salamander_t5',
    nameEs: 'Salamandra de Pantano (T5)',
    nameEn: 'T5 Swamp Salamander',
    tier: 5,
    category: 'salamander',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 3, // 66-70h
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda o Pescado picado',
    babyNameEs: 'Cría de Salamandra T5',
    babyNameEn: 'T5 Baby Swamp Salamander',
    adultNameEs: 'Salamandra Domada T5',
    adultNameEn: 'T5 Tame Swamp Salamander',
    saddledNameEs: 'Salamandra Ensillada T5',
    saddledNameEn: 'T5 Saddled Swamp Salamander',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 30,
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5)',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Sparkles',
    description: 'Criada en criadero. Velocidad constante en combate y terreno pantanoso, inmune al freno por daño recibido.',
  },
  {
    id: 'mount_winter_bear_t5',
    nameEs: 'Oso Invernal de Facción (T5)',
    nameEn: 'T5 Winter Bear',
    tier: 5,
    category: 'direbear',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 3, // 66-70h
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda o Pescado picado',
    babyNameEs: 'Osezno Invernal T5',
    babyNameEn: 'T5 Winter Bear Cub',
    adultNameEs: 'Oso Invernal Domado T5',
    adultNameEn: 'T5 Tame Winter Bear',
    saddledNameEs: 'Oso Invernal Ensillado T5 (Fort Sterling)',
    saddledNameEn: 'T5 Saddled Winter Bear',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 30,
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5) + Corazón de Montaña',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Shield',
    description: 'Montura de facción de Fort Sterling. Enorme capacidad de aguante, CC y blindaje para transporte de carga.',
  },
  {
    id: 'mount_bighorn_ram_t5',
    nameEs: 'Carnero de Cuernos Grandes (T5)',
    nameEn: 'T5 Bighorn Ram',
    tier: 5,
    category: 'ram',
    locationType: 'kennel',
    diet: 'herbivore',
    growthCycles: 3,
    foodPerCycle: 10,
    favoriteFoodEs: 'Cultivos o Hierbas (T2-T8)',
    babyNameEs: 'Cría de Carnero T5',
    babyNameEn: 'T5 Bighorn Ram Lamb',
    adultNameEs: 'Carnero Domado T5',
    adultNameEn: 'T5 Tame Bighorn Ram',
    saddledNameEs: 'Carnero Ensillado T5 (Martlock)',
    saddledNameEn: 'T5 Saddled Bighorn Ram',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 30,
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5) + Corazón de Roca',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Package',
    description: 'Montura de facción de Martlock. Criado en criadero, excelente salto de carnero para sortear obstáculos.',
  },
  {
    id: 'mount_moabird_t5',
    nameEs: 'Ave Moa / Terrorbird (T5)',
    nameEn: 'T5 Moabird',
    tier: 5,
    category: 'moabird',
    locationType: 'kennel',
    diet: 'herbivore',
    growthCycles: 3,
    foodPerCycle: 10,
    favoriteFoodEs: 'Cultivos o Hierbas (T2-T8)',
    babyNameEs: 'Cría de Ave Moa T5',
    babyNameEn: 'T5 Baby Moabird',
    adultNameEs: 'Ave Moa Domada T5',
    adultNameEn: 'T5 Tame Moabird',
    saddledNameEs: 'Ave Moa Ensillada T5 (Bridgewatch)',
    saddledNameEn: 'T5 Saddled Moabird',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 30,
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5) + Corazón de Bestia',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Compass',
    description: 'Montura de facción de Bridgewatch. Esprint explosivo en las llanuras para desplazamientos ultrarrápidos.',
  },
  {
    id: 'mount_mystic_owl_t5',
    nameEs: 'Búho Místico de las Nieblas (T5)',
    nameEn: 'T5 Mystic Owl',
    tier: 5,
    category: 'owl',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 3,
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda o Pescado picado',
    babyNameEs: 'Cría de Búho Místico T5',
    babyNameEn: 'T5 Mystic Owlet',
    adultNameEs: 'Búho Místico Domado T5',
    adultNameEn: 'T5 Tame Mystic Owl',
    saddledNameEs: 'Búho Místico Ensillado T5 (Brecilien / Nieblas)',
    saddledNameEn: 'T5 Saddled Mystic Owl',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 30,
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5) + Fuego de Hada',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Sparkles',
    description: 'Montura mística exclusiva de Brecilien y las Nieblas (Mists). Excelente maniobrabilidad y planeo en terrenos oscuros.',
  },
  {
    id: 'mount_direbear_t8',
    nameEs: 'Oso Huargo / Oso Pardo Gigante (T8)',
    nameEn: 'T8 Direbear',
    tier: 8,
    category: 'direbear',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 6, // 132h
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda de res / pollo o Pescado',
    babyNameEs: 'Osezno Huargo T8',
    babyNameEn: 'T8 Direbear Cub',
    adultNameEs: 'Oso Huargo Domado T8',
    adultNameEn: 'T8 Tame Direbear',
    saddledNameEs: 'Oso Huargo Ensillado T8',
    saddledNameEn: 'T8 Saddled Direbear',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8)',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 150,
    saddlerBaseFocusCost: 2000,
    iconName: 'Shield',
    description: 'La montura acorazada pesada definitiva. Salud masiva, resistencia a daño colosal y gran capacidad de carga.',
  },
  {
    id: 'mount_mammoth_t8',
    nameEs: 'Mamut de Transporte (T8)',
    nameEn: 'T8 Transport Mammoth',
    tier: 8,
    category: 'mammoth',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 6, // Ciclo épico de 6 días (132h con Premium)
    foodPerCycle: 10,
    favoriteFoodEs: 'Calabazas, Maíz o Cultivos (T2-T8)',
    babyNameEs: 'Cría de Mamut T8',
    babyNameEn: 'T8 Mammoth Calf',
    adultNameEs: 'Mamut Domado T8',
    adultNameEn: 'T8 Tame Mammoth',
    saddledNameEs: 'Mamut de Transporte Ensillado T8',
    saddledNameEn: 'T8 Transport Mammoth',
    offspringChanceWithoutFocus: 0, // Extremadamente valioso
    offspringChanceWithFocus: 15, // 15% con foco de nutrición diario
    baseNurtureFocusCost: 6500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Tablas T8',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 200,
    saddlerBaseFocusCost: 2500,
    iconName: 'Package',
    description: 'El titán económico supremo de Albion Online. Capacidad de carga colosal para mudanzas de gremio y comercio masivo entre ciudades.',
  },

  // ==================== CRIATURAS SALVAJES Y DE FACCIÓN ADICIONALES ====================
  {
    id: 'mount_swamp_dragon_t7',
    nameEs: 'Dragón del Pantano (T7)',
    nameEn: 'T7 Swamp Dragon',
    tier: 7,
    category: 'swamp_dragon',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 5, // 110h (5 ciclos de 22h con Premium)
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda de res / pollo o Pescado picado',
    babyNameEs: 'Cría de Dragón del Pantano T7',
    babyNameEn: 'T7 Swamp Dragon Pup',
    adultNameEs: 'Dragón del Pantano Domado T7',
    adultNameEn: 'T7 Tame Swamp Dragon',
    saddledNameEs: 'Dragón del Pantano Ensillado T7',
    saddledNameEn: 'T7 Saddled Swamp Dragon',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 20,
    baseNurtureFocusCost: 4500,
    saddlingMaterial: {
      itemId: 'leather_t7',
      nameEs: 'Cuero reforzado (T7)',
      tier: 7,
      amount: 20,
    },
    saddlerBaseNutrition: 130,
    saddlerBaseFocusCost: 1600,
    iconName: 'Sparkles',
    description: 'Criado en criadero. El Dragón del Pantano no sufre ralentización al recibir daño de mobs en caminos o pantanos y goza de gran capacidad de carga.',
  },
  {
    id: 'mount_greywolf_t5',
    nameEs: 'Lobo Gris de Caerleon (T5)',
    nameEn: 'T5 Caerleon Greywolf',
    tier: 5,
    category: 'greywolf',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 3, // 66h (3 ciclos de 22h con Premium)
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda o Pescado picado',
    babyNameEs: 'Cachorro de Lobo Gris T5',
    babyNameEn: 'T5 Caerleon Greywolf Pup',
    adultNameEs: 'Lobo Gris Domado T5',
    adultNameEn: 'T5 Tame Greywolf',
    saddledNameEs: 'Lobo Gris Ensillado T5 (Caerleon)',
    saddledNameEn: 'T5 Saddled Greywolf',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 30,
    baseNurtureFocusCost: 2500,
    saddlingMaterial: {
      itemId: 'leather_t5',
      nameEs: 'Cuero curado (T5) + Corazón Sombrío',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Dog',
    description: 'Montura de facción de Caerleon. Gran velocidad de persecución y salto de sigilo para cazadores de forajidos.',
  },

  // ==================== MONTURAS ÉLITE DE FACCIÓN (TIER 8) ====================
  {
    id: 'mount_elite_greywolf_t8',
    nameEs: 'Lobo Gris Élite (T8 - Caerleon)',
    nameEn: 'T8 Elite Greywolf',
    tier: 8,
    category: 'elite_faction',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 6, // 132h (6 ciclos de 22h con Premium)
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda de res / oveja o Pescado',
    babyNameEs: 'Cachorro de Lobo Gris Élite T8',
    babyNameEn: 'T8 Elite Greywolf Pup',
    adultNameEs: 'Lobo Gris Élite Domado T8',
    adultNameEn: 'T8 Tame Elite Greywolf',
    saddledNameEs: 'Lobo Gris Élite Ensillado T8 (Caerleon)',
    saddledNameEn: 'T8 Elite Greywolf',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Corazón Sombrío',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 160,
    saddlerBaseFocusCost: 2200,
    iconName: 'Dog',
    description: 'Montura de facción élite de Caerleon. Capacidad de aullido grupal que otorga velocidad de movimiento a todos los aliados cercanos.',
  },
  {
    id: 'mount_elite_wild_boar_t8',
    nameEs: 'Jabalí Élite (T8 - Lymhurst)',
    nameEn: 'T8 Elite Wild Boar',
    tier: 8,
    category: 'elite_faction',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 6,
    foodPerCycle: 10,
    favoriteFoodEs: 'Calabazas o Maíz dulce',
    babyNameEs: 'Lechón de Jabalí Élite T8',
    babyNameEn: 'T8 Elite Wild Boarlet',
    adultNameEs: 'Jabalí Élite Domado T8',
    adultNameEn: 'T8 Tame Elite Wild Boar',
    saddledNameEs: 'Jabalí Élite Ensillado T8 (Lymhurst)',
    saddledNameEn: 'T8 Elite Wild Boar',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Corazón de Bosque',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 160,
    saddlerBaseFocusCost: 2200,
    iconName: 'Shield',
    description: 'Montura de facción élite de Lymhurst. Carga furiosa e inmunidad temporal a control de masas para transportistas élite.',
  },
  {
    id: 'mount_elite_bighorn_ram_t8',
    nameEs: 'Carnero Élite de Cuernos Grandes (T8 - Martlock)',
    nameEn: 'T8 Elite Bighorn Ram',
    tier: 8,
    category: 'elite_faction',
    locationType: 'kennel',
    diet: 'herbivore',
    growthCycles: 6,
    foodPerCycle: 10,
    favoriteFoodEs: 'Cultivos o Hierbas (T2-T8)',
    babyNameEs: 'Cría de Carnero Élite T8',
    babyNameEn: 'T8 Elite Bighorn Ram Lamb',
    adultNameEs: 'Carnero Élite Domado T8',
    adultNameEn: 'T8 Tame Elite Bighorn Ram',
    saddledNameEs: 'Carnero Élite Ensillado T8 (Martlock)',
    saddledNameEn: 'T8 Elite Bighorn Ram',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Corazón de Roca',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 160,
    saddlerBaseFocusCost: 2200,
    iconName: 'Package',
    description: 'Montura de facción élite de Martlock. Salto sísmico de montaña que derriba y aturde a los enemigos que bloquean el paso.',
  },
  {
    id: 'mount_elite_terrorbird_t8',
    nameEs: 'Ave del Terror Élite (T8 - Bridgewatch)',
    nameEn: 'T8 Elite Terrorbird',
    tier: 8,
    category: 'elite_faction',
    locationType: 'kennel',
    diet: 'herbivore',
    growthCycles: 6,
    foodPerCycle: 10,
    favoriteFoodEs: 'Cultivos o Hierbas (T2-T8)',
    babyNameEs: 'Cría de Ave del Terror Élite T8',
    babyNameEn: 'T8 Elite Baby Terrorbird',
    adultNameEs: 'Ave del Terror Élite Domada T8',
    adultNameEn: 'T8 Tame Elite Terrorbird',
    saddledNameEs: 'Ave del Terror Élite Ensillada T8 (Bridgewatch)',
    saddledNameEn: 'T8 Elite Terrorbird',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Corazón de Bestia',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 160,
    saddlerBaseFocusCost: 2200,
    iconName: 'Compass',
    description: 'Montura de facción élite de Bridgewatch. La mayor aceleración en línea recta del desierto y ceguera de arena a perseguidores.',
  },
  {
    id: 'mount_elite_swamp_salamander_t8',
    nameEs: 'Salamandra de Pantano Élite (T8 - Thetford)',
    nameEn: 'T8 Elite Swamp Salamander',
    tier: 8,
    category: 'elite_faction',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 6,
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda o Pescado picado',
    babyNameEs: 'Cría de Salamandra Élite T8',
    babyNameEn: 'T8 Elite Swamp Salamander Pup',
    adultNameEs: 'Salamandra Élite Domada T8',
    adultNameEn: 'T8 Tame Elite Swamp Salamander',
    saddledNameEs: 'Salamandra de Pantano Élite Ensillada T8 (Thetford)',
    saddledNameEn: 'T8 Elite Swamp Salamander',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Corazón de Ciénaga',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 160,
    saddlerBaseFocusCost: 2200,
    iconName: 'Sparkles',
    description: 'Montura de facción élite de Thetford. Emite un rastro de miasma pantanoso que envenena y ralentiza a los enemigos a su paso.',
  },
  {
    id: 'mount_elite_winter_bear_t8',
    nameEs: 'Oso Invernal Élite (T8 - Fort Sterling)',
    nameEn: 'T8 Elite Winter Bear',
    tier: 8,
    category: 'elite_faction',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 6,
    foodPerCycle: 10,
    favoriteFoodEs: 'Carne cruda de res / pollo o Pescado',
    babyNameEs: 'Osezno Invernal Élite T8',
    babyNameEn: 'T8 Elite Winter Bear Cub',
    adultNameEs: 'Oso Invernal Élite Domado T8',
    adultNameEn: 'T8 Tame Elite Winter Bear',
    saddledNameEs: 'Oso Invernal Élite Ensillado T8 (Fort Sterling)',
    saddledNameEn: 'T8 Elite Winter Bear',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 15,
    baseNurtureFocusCost: 5500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) + Corazón de Montaña',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 160,
    saddlerBaseFocusCost: 2200,
    iconName: 'Shield',
    description: 'Montura de facción élite de Fort Sterling. Rugido gélido que congela a enemigos cercanos y otorga un escudo colosal al jinete.',
  },

  // ==================== DRAGÓN DE LA ACTUALIZACIÓN DRAGONFIRE (TIER 8) ====================
  {
    id: 'mount_firewing_drake_t8',
    nameEs: 'Dragón Alafuego / Firewing Drake (T8 - Dragonfire)',
    nameEn: 'T8 Firewing Drake',
    tier: 8,
    category: 'fire_drake',
    locationType: 'kennel',
    diet: 'carnivore',
    growthCycles: 30, // Proceso legendario de crianza (~27 días en Kennel)
    foodPerCycle: 10,
    favoriteFoodEs: 'Monturas sacrificadas / Carne cruda gourmet T8',
    babyNameEs: 'Huevo de Dragón de Fuego (Drake Egg)',
    babyNameEn: 'T8 Drake Egg',
    adultNameEs: 'Dragón Alafuego Domado T8',
    adultNameEn: 'T8 Tame Firewing Drake',
    saddledNameEs: 'Dragón Alafuego Ensillado T8 (Firewing Drake)',
    saddledNameEn: 'T8 Saddled Firewing Drake',
    offspringChanceWithoutFocus: 0,
    offspringChanceWithFocus: 10,
    baseNurtureFocusCost: 6500,
    saddlingMaterial: {
      itemId: 'leather_t8',
      nameEs: 'Cuero de adamantium (T8) x30 + Escamas de Dragón',
      tier: 8,
      amount: 30,
    },
    saddlerBaseNutrition: 350,
    saddlerBaseFocusCost: 3800,
    iconName: 'Sparkles',
    description: '¡La mítica montura dragón de la actualización Dragonfire! Nacido del Huevo de Dragón (Drake Egg) del jefe Azaryon en el Santuario de Dragones. Posee planeo inmune a ralentizaciones y aliento de fuego abrasador.',
  },

  // ==================== CABALLOS BLINDADOS (T5 a T8) ====================
  {
    id: 'mount_armored_horse_t5',
    nameEs: 'Caballo Blindado (T5)',
    nameEn: 'T5 Armored Horse',
    tier: 5,
    category: 'armored_horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 3,
    foodPerCycle: 10,
    favoriteFoodEs: 'Coles o Cultivos',
    babyNameEs: 'Potro T5',
    babyNameEn: 'T5 Foal',
    adultNameEs: 'Caballo de Montar T5',
    adultNameEn: 'T5 Riding Horse',
    saddledNameEs: 'Caballo Blindado T5',
    saddledNameEn: 'T5 Armored Horse',
    offspringChanceWithoutFocus: 40,
    offspringChanceWithFocus: 75,
    baseNurtureFocusCost: 2000,
    saddlingMaterial: {
      itemId: 'bars_t5',
      nameEs: 'Barras de titanio (T5)',
      tier: 5,
      amount: 20,
    },
    saddlerBaseNutrition: 80,
    saddlerBaseFocusCost: 900,
    iconName: 'Shield',
    description: 'Caballo protegido con armadura de placas para atravesar campamentos hostiles y PvP.',
  },
  {
    id: 'mount_armored_horse_t6',
    nameEs: 'Caballo Blindado (T6)',
    nameEn: 'T6 Armored Horse',
    tier: 6,
    category: 'armored_horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 4,
    foodPerCycle: 10,
    favoriteFoodEs: 'Patatas o Cultivos',
    babyNameEs: 'Potro T6',
    babyNameEn: 'T6 Foal',
    adultNameEs: 'Caballo de Montar T6',
    adultNameEn: 'T6 Riding Horse',
    saddledNameEs: 'Caballo Blindado T6',
    saddledNameEn: 'T6 Armored Horse',
    offspringChanceWithoutFocus: 20,
    offspringChanceWithFocus: 60,
    baseNurtureFocusCost: 2600,
    saddlingMaterial: {
      itemId: 'bars_t6',
      nameEs: 'Barras de runa metálica (T6)',
      tier: 6,
      amount: 20,
    },
    saddlerBaseNutrition: 100,
    saddlerBaseFocusCost: 1100,
    iconName: 'Shield',
    description: 'Estándar para tanques y soportes en ZvZ gracias a su alta armadura y resistencia al CC.',
  },
  {
    id: 'mount_armored_horse_t7',
    nameEs: 'Caballo Blindado (T7)',
    nameEn: 'T7 Armored Horse',
    tier: 7,
    category: 'armored_horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 5,
    foodPerCycle: 10,
    favoriteFoodEs: 'Maíz dulce o Cultivos',
    babyNameEs: 'Potro T7',
    babyNameEn: 'T7 Foal',
    adultNameEs: 'Caballo de Montar T7',
    adultNameEn: 'T7 Riding Horse',
    saddledNameEs: 'Caballo Blindado T7',
    saddledNameEn: 'T7 Armored Horse',
    offspringChanceWithoutFocus: 10,
    offspringChanceWithFocus: 50,
    baseNurtureFocusCost: 3300,
    saddlingMaterial: {
      itemId: 'bars_t7',
      nameEs: 'Barras de meteorito (T7)',
      tier: 7,
      amount: 20,
    },
    saddlerBaseNutrition: 120,
    saddlerBaseFocusCost: 1400,
    iconName: 'Shield',
    description: 'Resistencia masiva contra emboscadas y gankers en Tierras Lejanas.',
  },
  {
    id: 'mount_armored_horse_t8',
    nameEs: 'Caballo Blindado (T8)',
    nameEn: 'T8 Armored Horse',
    tier: 8,
    category: 'armored_horse',
    locationType: 'pasture',
    diet: 'herbivore',
    growthCycles: 6,
    foodPerCycle: 10,
    favoriteFoodEs: 'Calabazas o Cultivos',
    babyNameEs: 'Potro T8',
    babyNameEn: 'T8 Foal',
    adultNameEs: 'Caballo de Montar T8',
    adultNameEn: 'T8 Riding Horse',
    saddledNameEs: 'Caballo Blindado T8',
    saddledNameEn: 'T8 Armored Horse',
    offspringChanceWithoutFocus: 5,
    offspringChanceWithFocus: 40,
    baseNurtureFocusCost: 4200,
    saddlingMaterial: {
      itemId: 'bars_t8',
      nameEs: 'Barras de adamantium (T8)',
      tier: 8,
      amount: 20,
    },
    saddlerBaseNutrition: 150,
    saddlerBaseFocusCost: 1900,
    iconName: 'Shield',
    description: 'El pináculo ecuestre blindado parashotcallers y líderes de alianza en Albion.',
  },
];
