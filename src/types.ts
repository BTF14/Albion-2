export type CategoryType = 'crop' | 'herb' | 'animal_produce' | 'animal_meat';

export type AppTab =
  | 'logger'
  | 'history'
  | 'calendar'
  | 'todo'
  | 'mastery'
  | 'focus_optimizer'
  | 'focus_portfolio'
  | 'mounts'
  | 'butcher'
  | 'labourers'
  | 'guild_island'
  | 'crafting_equipment'
  | 'refining'
  | 'transmutation'
  | 'enchanting'
  | 'sales_ledger'
  | 'black_market_simulator'
  | 'transport'
  | 'warehouse_logistics'
  | 'red_zone_transport'
  | 'silver_audit'
  | 'analytics'
  | 'simulator'
  | 'value_added'
  | 'fishing_sauces'
  | 'goals'
  | 'regear'
  | 'guide';

export type CityId = 'fort_sterling' | 'lymhurst' | 'bridgewatch' | 'martlock' | 'thetford' | 'caerleon' | 'brecilien';

export interface CityInfo {
  id: CityId;
  name: string;
  biome: string;
  color: string;
  cropBonusNames: string[];
  herbBonusNames: string[];
  animalBonusNames: string[];
  notes: string;
}

export interface AlbionItem {
  id: string;
  nameEs: string;
  nameEn: string;
  category: CategoryType;
  tier: number;
  iconName: string;
  bonusCityIds: CityId[]; // Ciudades donde tiene bonificación
  defaultYieldPerSlot: number; // Ej. ~9 unidades por casilla
  defaultSeedReturnWithoutFocus: number; // Porcentaje teórico de referencia
  defaultSeedReturnWithFocus: number;
  babyNameEs?: string; // Para animales (ej. "Pollito", "Lechón")
  foodPerCycle?: number; // Ej. 10 cultivos por animal adulto al día
  favoriteFoodNameEs?: string; // Comida favorita que duplica velocidad o reduce costo de alimento a la mitad
  meatCityBonusId?: CityId; // Para carnicería específica
  description: string;
}

export interface DailyLogEntry {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  cityId: CityId;
  category: CategoryType;
  itemId: string;
  itemName: string;
  tier: number;
  characterId?: string; // ID del Alt / Personaje que cosechó
  characterName?: string; // Nombre del Alt (ej. "Principal", "Alt Martlock")
  
  // Capacidad
  plotsCount: number; // Cantidad de parcelas (ej: 5)
  slotsCount: number; // Espacios totales (normalmente plotsCount * 9)
  
  // Semillas o crías
  returnedSeedsOrBabies: number; // Lo que recuperaste
  reboughtSeedsOrBabies: number; // Lo que tuviste que comprar para resembrar
  seedOrBabyUnitPrice: number; // Precio manual de cada semilla/cría
  surplusSeedsCount?: number; // Excedente de semillas obtenidas (con foco)
  surplusSeedsRevenue?: number; // Valor de venta del excedente
  
  // Producción
  harvestedAmount: number; // Unidades cosechadas o carne obtenida
  productUnitPrice: number; // Precio manual de venta
  
  // Alimento (solo para ganadería)
  foodConsumedUnits?: number; // Cantidad de vegetales consumidos
  foodUnitPrice?: number; // Costo por vegetal (0 si usas tus propios cultivos)
  
  // Tasas extras (ej. tasa de carnicería para matanza)
  extraFees?: number;
  
  // Foco
  usedFocus: boolean;
  focusPointsSpent?: number;
  
  // Impuesto de mercado
  marketTaxPercent: number; // ej. 4%, 8%, 10.5%
  
  // Resultados financieros calculados
  seedsRebuyCost: number;
  foodCost: number;
  totalCosts: number;
  grossRevenue: number;
  marketTaxAmount: number;
  netRevenue: number;
  netProfit: number; // netRevenue - totalCosts
  profitPerSlot: number;
  silverPerFocus: number; // Plata neta / foco (si usó foco)
  notes?: string;
}

export interface PriceMemoryItem {
  lastSeedPrice?: number;
  lastProductPrice?: number;
  lastFoodPrice?: number;
  sellPrice?: number;
  buyPrice?: number;
  updatedAt?: number; // Timestamp en ms del momento en que se guardó
}

export interface PriceMemory {
  [itemId: string]: PriceMemoryItem;
}

export interface PriceCacheStatus {
  isExpired: boolean;
  ageMs: number;
  remainingMs: number;
  formattedAge: string;
  formattedRemaining: string;
}

export interface IslandTimer {
  id: string;
  name: string;
  cityId: CityId;
  itemId: string;
  plotsCount: number;
  plantedAt: number; // timestamp in ms
  durationHours: number; // default 22
  targetTime: number; // plantedAt + durationHours * 3600 * 1000
  notes?: string;
}

export type TodoTaskCategory = 'island' | 'crafting' | 'transport' | 'market' | 'custom';

export interface DailyChecklistItem {
  id: string;
  title: string;
  cityId: CityId;
  itemId?: string;
  plotsCount: number;
  completedDate?: string; // YYYY-MM-DD
  harvested: boolean;
  replanted: boolean;
  usedFocus: boolean;
  // Campos enriquecidos para lista de cosas por hacer / tareas personalizadas
  category?: TodoTaskCategory;
  isCustomTask?: boolean;
  completed?: boolean;
  notes?: string;
  priority?: 'normal' | 'high';
  createdAt?: number;
}

export interface DestinyMasteryProfile {
  cropMastery: number; // 0-100
  herbMastery: number; // 0-100
  animalMastery: number; // 0-100
  itemSpecs: {
    [itemId: string]: number; // 0-100
  };
  // Cocina & Alquimia
  chefMastery?: number; // 0-100 (Cocinero Maestro)
  alchemistMastery?: number; // 0-100 (Alquimista Maestro)
  craftSpecs?: {
    [specKey: string]: number; // 0-100
  };
}

export interface FocusEfficiencyResult {
  fce: number; // Focus Cost Efficiency total
  focusCostPerSlot: number; // e.g. 1000 down to 125
  focusCostPerPlot: number; // focusCostPerSlot * 9
  slotsPer10kFocus: number; // Slots waterable with 10k daily focus
  plotsPer10kFocus: number; // Plots waterable with 10k daily focus
  silverPerFocusEstimate: number; // Estimated silver profit per focus point
}

export interface CraftFocusEfficiencyResult {
  fce: number; // Focus Cost Efficiency total para la receta
  baseFocusCost: number; // Costo base sin maestría
  actualFocusCostPerBatch: number; // Costo real tras aplicar fórmula oficial
  batchesPer10kFocus: number; // Lotes posibles con los 10.000 pts diarios
  focusSavedPercent: number; // Porcentaje de foco ahorrado
  silverPerFocus: number; // Plata estimada obtenida por cada punto de foco
}

// ==================== VALOR AGREGADO: COCINA & ALQUIMIA ====================
export type CraftCategory = 'cooking' | 'alchemy';
export type StationLocation =
  | 'bonus_city' // Ciudad con bono (Caerleon para comida, Brecilien para pociones: 24.8% / 47.9%)
  | 'non_bonus_city' // Ciudad sin bono de especialidad (15.2% / 43.5%)
  | 'bonus_island' // Isla en ciudad bonificada (13.0% / 39.9%)
  | 'regular_island' // Isla común sin bono (0.0% / 37.1%)
  | 'caerleon_city'; // Compatibilidad retroactiva
export type EnchantmentLevel = 0 | 1 | 2 | 3;

export interface RecipeIngredient {
  itemId: string;
  nameEs: string;
  amount: number; // Cantidad requerida por lote (batch)
  defaultUnitPrice?: number;
}

export interface AlbionRecipe {
  id: string;
  nameEs: string;
  nameEn: string;
  category: CraftCategory;
  specKey: string; // Rama de especialización en la Tabla del Destino (ej. 'chef_stew', 'alch_healing')
  tier: number;
  outputAmount: number; // p. ej. 10 comidas o 5 pociones por lote
  iconName: string;
  nutritionCost: number; // Nutrición consumida por lote
  baseFocusCost: number; // Foco base sin especialización
  defaultSellPrice: number; // Precio de mercado estimado (.0)
  ingredients: RecipeIngredient[];
  buffDescription: string;
  recommendedBonusCityId: CityId;
  isDragonUpdate?: boolean;
  isAvalonian?: boolean;
  isTracking?: boolean;
}
