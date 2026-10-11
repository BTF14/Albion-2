import {
  DestinyMasteryProfile,
  FocusEfficiencyResult,
  CraftFocusEfficiencyResult,
  AlbionRecipe,
  AlbionItem,
} from '../types';
import { ALBION_ITEMS } from '../data/items';

const STORAGE_KEY_MASTERY = 'albion_farm_destiny_mastery';

export interface CraftSpecDefinition {
  id: string;
  nameEs: string;
  nameEn: string;
  desc: string;
}

export const CHEF_SPECS: CraftSpecDefinition[] = [
  { id: 'chef_stew', nameEs: 'Maestro de Guisos (Stews)', nameEn: 'Stew Chef', desc: 'Guisos de Cabra (T4), Cordero (T6), Ternera (T8) y Avaloniano (PvP DPS)' },
  { id: 'chef_soup', nameEs: 'Maestro de Sopas (Soups)', nameEn: 'Soup Chef', desc: 'Sopas de Zanahoria (T1), Trigo (T3) y Col (T5) (Regeneración de Vida)' },
  { id: 'chef_salad', nameEs: 'Maestro de Ensaladas (Salads)', nameEn: 'Salad Chef', desc: 'Ensaladas de Zanahoria (T2), Pollo (T3), Ganso (T5) y Cerdo (T6) (Velocidad de Crafteo)' },
  { id: 'chef_pie', nameEs: 'Maestro de Tartas (Pies)', nameEn: 'Pie Chef', desc: 'Pasteles de Pollo (T3), Ganso (T5) y Cerdo (T7) (Rendimiento de Recolección)' },
  { id: 'chef_omelette', nameEs: 'Maestro de Tortillas (Omelettes)', nameEn: 'Omelette Chef', desc: 'Tortillas de Pollo (T4), Ganso (T6), Cerdo (T7), Leyfin y Avalonianas (Cooldowns)' },
  { id: 'chef_sandwich', nameEs: 'Maestro de Sándwiches (Sandwiches)', nameEn: 'Sandwich Chef', desc: 'Sándwiches de Cabra (T4), Cordero (T6) y Ternera (T8) (Salud Máxima Tanque)' },
  { id: 'chef_roast', nameEs: 'Maestro de Asados (Roasts)', nameEn: 'Roast Chef', desc: 'Asados de Pollo (T3), Ganso (T5), Cerdo (T7) y Ternera (T8) (Robo de Vida)' },
  { id: 'chef_special', nameEs: 'Pastelería Dragón & Especial', nameEn: 'Dragon & Special Chef', desc: 'Galletas de Huevo de Dragón (T8 Dragonfire) y recetas de eventos' },
];

export const ALCHEMIST_SPECS: CraftSpecDefinition[] = [
  { id: 'alch_healing', nameEs: 'Pociones Curativas (Healing)', nameEn: 'Healing Potions', desc: 'Pociones de Curación Menor (T2), Normal (T4) y Mayor (T6)' },
  { id: 'alch_energy', nameEs: 'Pociones de Energía (Energy)', nameEn: 'Energy Potions', desc: 'Pociones de Energía Menor (T2), Normal (T4) y Mayor (T6)' },
  { id: 'alch_poison', nameEs: 'Pociones de Veneno (Poison)', nameEn: 'Poison Potions', desc: 'Pociones de Veneno Menor (T4), Normal (T6) y Mayor (T8)' },
  { id: 'alch_resist', nameEs: 'Pociones de Resistencia (Resistance)', nameEn: 'Resistance Potions', desc: 'Pociones de Resistencia T5 y Mayor T7 (PvP & ZvZ)' },
  { id: 'alch_gigantify', nameEs: 'Pociones de Gigantismo (Gigantify)', nameEn: 'Gigantify Potions', desc: 'Pociones de Gigantismo T5 y Mayor T7 (Salud & Carga Máxima)' },
  { id: 'alch_invis_sticky', nameEs: 'Invisibilidad & Frascos Pegajosos', nameEn: 'Invis & Sticky Potions', desc: 'Poción de Invisibilidad T8 y Frascos Pegajosos T5' },
  { id: 'alch_rare_tracking', nameEs: 'Pociones de Rastreo & Dragón', nameEn: 'Tracking & Dragon Potions', desc: 'Purificación, Furia, Ácido, Fuego Infernal, Recolección y Guardia de Vida' },
];

export const DEFAULT_MASTERY_PROFILE: DestinyMasteryProfile = {
  cropMastery: 0,
  herbMastery: 0,
  animalMastery: 0,
  itemSpecs: {
    // Cultivos (Crops)
    crop_carrot: 0,
    crop_bean: 0,
    crop_wheat: 0,
    crop_turnip: 0,
    crop_cabbage: 0,
    crop_potato: 0,
    crop_corn: 0,
    crop_pumpkin: 0,

    // Hierbas (Herbs)
    herb_agaric: 0,
    herb_comfrey: 0,
    herb_burdock: 0,
    herb_teasel: 0,
    herb_foxglove: 0,
    herb_mullein: 0,
    herb_yarrow: 0,

    // Ganadería (Animals por especie)
    animal_chicken: 0,
    animal_goat: 0,
    animal_goose: 0,
    animal_sheep: 0,
    animal_pig: 0,
    animal_cow: 0,
  },
  // Cocina & Alquimia
  chefMastery: 0,
  alchemistMastery: 0,
  craftSpecs: {
    chef_stew: 0,
    chef_soup: 0,
    chef_salad: 0,
    chef_pie: 0,
    chef_omelette: 0,
    chef_sandwich: 0,
    chef_roast: 0,
    chef_special: 0,
    alch_healing: 0,
    alch_energy: 0,
    alch_poison: 0,
    alch_resist: 0,
    alch_gigantify: 0,
    alch_invis_sticky: 0,
    alch_rare_tracking: 0,
  },
};

/**
 * Carga el perfil de maestría guardado o devuelve el predeterminado
 */
export function loadMasteryProfile(): DestinyMasteryProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MASTERY);
    if (!raw) return DEFAULT_MASTERY_PROFILE;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_MASTERY_PROFILE;

    const safeItemSpecs: Record<string, number> = { ...DEFAULT_MASTERY_PROFILE.itemSpecs };
    if (parsed.itemSpecs && typeof parsed.itemSpecs === 'object') {
      for (const [key, val] of Object.entries(parsed.itemSpecs as Record<string, unknown>)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        if (typeof val === 'number' && Number.isFinite(val)) {
          safeItemSpecs[key] = Math.min(100, Math.max(0, Math.floor(val)));
        }
      }
    }

    const safeCraftSpecs: Record<string, number> = { ...DEFAULT_MASTERY_PROFILE.craftSpecs };
    if (parsed.craftSpecs && typeof parsed.craftSpecs === 'object') {
      for (const [key, val] of Object.entries(parsed.craftSpecs as Record<string, unknown>)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        if (typeof val === 'number' && Number.isFinite(val)) {
          safeCraftSpecs[key] = Math.min(100, Math.max(0, Math.floor(val)));
        }
      }
    }

    return {
      cropMastery: Math.min(100, Math.max(0, Number(parsed.cropMastery) || 0)),
      herbMastery: Math.min(100, Math.max(0, Number(parsed.herbMastery) || 0)),
      animalMastery: Math.min(100, Math.max(0, Number(parsed.animalMastery) || 0)),
      chefMastery: Math.min(100, Math.max(0, Number(parsed.chefMastery) || 0)),
      alchemistMastery: Math.min(100, Math.max(0, Number(parsed.alchemistMastery) || 0)),
      itemSpecs: safeItemSpecs,
      craftSpecs: safeCraftSpecs,
    };
  } catch (e) {
    console.error('Error cargando perfil de maestría de la Tabla del Destino', e);
    return DEFAULT_MASTERY_PROFILE;
  }
}

/**
 * Guarda el perfil de maestría en localStorage
 */
export function saveMasteryProfile(profile: DestinyMasteryProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_MASTERY, JSON.stringify(profile));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('albion_mastery_updated'));
    }
  } catch (e) {
    console.error('Error guardando perfil de maestría', e);
  }
}

/**
 * Mapea el ID de ítem al ID de la especialización de la Tabla del Destino
 */
export function getItemSpecKey(itemId: string): string {
  if (itemId.startsWith('crop_') || itemId.startsWith('herb_')) {
    return itemId;
  }
  if (itemId.includes('chicken')) return 'animal_chicken';
  if (itemId.includes('goat')) return 'animal_goat';
  if (itemId.includes('goose')) return 'animal_goose';
  if (itemId.includes('sheep')) return 'animal_sheep';
  if (itemId.includes('pig')) return 'animal_pig';
  if (itemId.includes('cow')) return 'animal_cow';
  return itemId;
}

/**
 * Obtiene todos los IDs de especialización de una misma rama
 */
export function getBranchSpecKeys(category: string): string[] {
  if (category === 'crop') {
    return [
      'crop_carrot',
      'crop_bean',
      'crop_wheat',
      'crop_turnip',
      'crop_cabbage',
      'crop_potato',
      'crop_corn',
      'crop_pumpkin',
    ];
  }
  if (category === 'herb') {
    return [
      'herb_agaric',
      'herb_comfrey',
      'herb_burdock',
      'herb_teasel',
      'herb_foxglove',
      'herb_mullein',
      'herb_yarrow',
    ];
  }
  return [
    'animal_chicken',
    'animal_goat',
    'animal_goose',
    'animal_sheep',
    'animal_pig',
    'animal_cow',
  ];
}

/**
 * Calcula la Eficiencia de Coste de Foco (FCE) y el coste exacto de foco por casilla y parcela
 * Basado en la fórmula matemática oficial de Albion Online:
 * FCE = (BranchMastery * 30) + (ItemSpec * 250) + (OtherSpecsInBranch * 30)
 * Cost = round(1000 * 0.5 ^ (FCE / 10000))
 */
export function calculateFocusCost(
  itemId: string,
  profile: DestinyMasteryProfile,
  customSeedPrice?: number,
  customProductPrice?: number
): FocusEfficiencyResult {
  const item = ALBION_ITEMS.find((i) => i.id === itemId) || ALBION_ITEMS[0];
  const specKey = getItemSpecKey(itemId);

  let branchMastery = 0;
  if (item.category === 'crop') branchMastery = profile.cropMastery;
  else if (item.category === 'herb') branchMastery = profile.herbMastery;
  else branchMastery = profile.animalMastery;

  const itemSpec = Math.min(100, Math.max(0, profile.itemSpecs[specKey] ?? 0));
  const branchKeys = getBranchSpecKeys(item.category);

  // Suma de especializaciones cruzadas en la misma rama (excluyendo este ítem)
  let otherSpecsSum = 0;
  branchKeys.forEach((key) => {
    if (key !== specKey) {
      otherSpecsSum += Math.min(100, Math.max(0, profile.itemSpecs[key] ?? 0));
    }
  });

  // Cálculo de Eficiencia de Coste de Foco (FCE)
  const fce = (branchMastery * 30) + (itemSpec * 250) + (otherSpecsSum * 30);

  // Coste por casilla con límite inferior de 125 puntos
  const rawCost = 1000 * Math.pow(0.5, fce / 10000);
  const focusCostPerSlot = Math.max(125, Math.round(rawCost));
  const focusCostPerPlot = focusCostPerSlot * 9;

  // Capacidad con los 10.000 puntos diarios que genera el personaje con cuenta Premium
  const slotsPer10kFocus = Math.floor(10000 / focusCostPerSlot);
  const plotsPer10kFocus = Number((slotsPer10kFocus / 9).toFixed(1));

  // Estimación de beneficio neto por punto de foco (Silver / Focus)
  const defaultFallbackSeed =
    item.category === 'animal_produce'
      ? 0
      : item.category === 'animal_meat'
      ? 3000 + item.tier * 1000
      : 1500 + item.tier * 450;
  const defaultFallbackProd = 220 + item.tier * 65;

  const seedPrice = customSeedPrice && customSeedPrice > 0 ? customSeedPrice : defaultFallbackSeed;
  const productPrice = customProductPrice && customProductPrice > 0 ? customProductPrice : defaultFallbackProd;

  let extraSilverGainedPerSlot = 0;
  if (item.category === 'crop' || item.category === 'herb') {
    // En cultivos, el foco incrementa la tasa de retorno de semillas
    const rateWithout = item.defaultSeedReturnWithoutFocus / 100;
    const rateWith = item.defaultSeedReturnWithFocus / 100;
    const extraSeeds = Math.max(0, rateWith - rateWithout);
    extraSilverGainedPerSlot = extraSeeds * seedPrice;
  } else if (item.category === 'animal_produce') {
    // En animales de producción, el foco asegura retorno de crías o duplicación
    extraSilverGainedPerSlot = productPrice * 4;
  } else {
    // Matanza
    extraSilverGainedPerSlot = seedPrice * 0.9;
  }

  const silverPerFocusEstimate = Number(
    (extraSilverGainedPerSlot / Math.max(1, focusCostPerSlot)).toFixed(2)
  );

  return {
    fce,
    focusCostPerSlot,
    focusCostPerPlot,
    slotsPer10kFocus,
    plotsPer10kFocus,
    silverPerFocusEstimate,
  };
}

/**
 * Calcula el tiempo necesario para recargar foco hasta el límite de 30.000 puntos
 * Albion Online genera 10.000 puntos de foco cada 24 horas (416.666 puntos por hora)
 */
export function calculateFocusRefill(currentFocus: number): {
  pointsMissing: number;
  hoursToFull: number;
  minutesToFull: number;
  isFull: boolean;
  timeString: string;
} {
  const current = Math.min(30000, Math.max(0, currentFocus));
  const missing = 30000 - current;
  if (missing <= 0) {
    return {
      pointsMissing: 0,
      hoursToFull: 0,
      minutesToFull: 0,
      isFull: true,
      timeString: '¡Foco al Máximo (30.000 / 30.000)! Gastar para no desperdiciar',
    };
  }

  // 10.000 pts / 24h = 416.6667 pts/h => horas = missing / (10000 / 24)
  const totalHours = missing / (10000 / 24);
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  return {
    pointsMissing: missing,
    hoursToFull: hours,
    minutesToFull: minutes,
    isFull: false,
    timeString: `${hours}h ${minutes}m para alcanzar el tope de 30.000`,
  };
}

/**
 * Calcula la Eficiencia de Coste de Foco (FCE) y el coste exacto de foco para una receta de Cocina o Alquimia
 * Fórmula oficial de Albion Online:
 * FCE = (BranchMastery * 30) + (ItemSpec * 250) + (OtherSpecsInBranch * 30)
 * Cost = round(baseFocusCost * 0.5 ^ (FCE / 10000))
 */
export function calculateRecipeFocusCost(
  recipe: AlbionRecipe,
  profile: DestinyMasteryProfile,
  totalRawCostPerBatch = 0,
  returnRateWithoutFocus = 24.8,
  returnRateWithFocus = 47.9
): CraftFocusEfficiencyResult {
  const isCooking = recipe.category === 'cooking';
  const branchMastery = isCooking
    ? Math.min(100, Math.max(0, profile.chefMastery ?? 0))
    : Math.min(100, Math.max(0, profile.alchemistMastery ?? 0));

  const craftSpecs = profile.craftSpecs || {};
  const currentSpec = Math.min(100, Math.max(0, craftSpecs[recipe.specKey] ?? 0));

  const branchSpecs = isCooking ? CHEF_SPECS : ALCHEMIST_SPECS;
  let otherSpecsSum = 0;
  branchSpecs.forEach((s) => {
    if (s.id !== recipe.specKey) {
      otherSpecsSum += Math.min(100, Math.max(0, craftSpecs[s.id] ?? 0));
    }
  });

  // FCE total:
  const fce = (branchMastery * 30) + (currentSpec * 250) + (otherSpecsSum * 30);

  const baseFocusCost = recipe.baseFocusCost || 1000;
  // Coste real por lote: base * 0.5 ^ (FCE / 10000)
  const rawCost = baseFocusCost * Math.pow(0.5, fce / 10000);
  const actualFocusCostPerBatch = Math.max(1, Math.round(rawCost));

  const batchesPer10kFocus = Math.floor(10000 / actualFocusCostPerBatch);
  const focusSavedPercent = Math.round(((baseFocusCost - actualFocusCostPerBatch) / baseFocusCost) * 100);

  // Valor económico del foco:
  // Al usar foco, recuperas (returnRateWithFocus - returnRateWithoutFocus)% de materias primas
  const deltaReturnRate = Math.max(0, (returnRateWithFocus - returnRateWithoutFocus) / 100);
  const extraSilverPerBatch = totalRawCostPerBatch * deltaReturnRate;
  const silverPerFocus = Number((extraSilverPerBatch / Math.max(1, actualFocusCostPerBatch)).toFixed(2));

  return {
    fce,
    baseFocusCost,
    actualFocusCostPerBatch,
    batchesPer10kFocus,
    focusSavedPercent,
    silverPerFocus,
  };
}
