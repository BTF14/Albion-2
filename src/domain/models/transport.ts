import { CityId } from '../../types';

export interface TransportMount {
  id: string;
  name: string;
  tier: number;
  baseCapacityKg: number;
  description: string;
  speedBonus: string;
  isArmored?: boolean;
  courierPassive?: boolean; // Mantiene la bonificación de carga en el inventario al desmontar
}

export const TRANSPORT_MOUNTS: TransportMount[] = [
  {
    id: 'ox_t3',
    name: 'Buey del Conjurador (T3)',
    tier: 3,
    baseCapacityKg: 674,
    description: 'Económico y accesible para viajes cortos de recolección.',
    speedBonus: '+40% galope',
  },
  {
    id: 'ox_t4',
    name: 'Buey del Transportista (T4)',
    tier: 4,
    baseCapacityKg: 1123,
    description: 'La opción estándar más usada para cosechas de islas y comercio local.',
    speedBonus: '+45% galope',
  },
  {
    id: 'stag_t4',
    name: 'Ciervo Gigante (T4)',
    tier: 4,
    baseCapacityKg: 449,
    description: 'Evasivo y ágil: Retiene su carga pasiva si te desmontan. Ideal para transportar en zona roja.',
    speedBonus: '+85% galope',
    courierPassive: true,
  },
  {
    id: 'ox_t5',
    name: 'Buey del Transportista (T5)',
    tier: 5,
    baseCapacityKg: 1872,
    description: 'Capacidad media para transporte regular entre Ciudades Reales.',
    speedBonus: '+50% galope',
  },
  {
    id: 'horse_t5',
    name: 'Caballo de Transporte (T5)',
    tier: 5,
    baseCapacityKg: 535,
    description: 'Equilibrado en velocidad y resistencia para viajes interurbanos rápidos.',
    speedBonus: '+75% galope',
    courierPassive: true,
  },
  {
    id: 'ox_t6',
    name: 'Buey del Transportista (T6)',
    tier: 6,
    baseCapacityKg: 3120,
    description: 'Alta capacidad para rutas de comercio seguro entre mercados.',
    speedBonus: '+55% galope',
  },
  {
    id: 'ox_t7',
    name: 'Buey del Transportista (T7)',
    tier: 7,
    baseCapacityKg: 5200,
    description: 'Gran capacidad para caravanas pesadas de recursos refinados.',
    speedBonus: '+60% galope',
  },
  {
    id: 'boar_t7',
    name: 'Jabalí Ensillado (T7)',
    tier: 7,
    baseCapacityKg: 1560,
    description: 'La montura rey de zona roja: Mantiene toda su carga pasiva al desmontar y ofrece alta velocidad.',
    speedBonus: '+75% galope',
    courierPassive: true,
  },
  {
    id: 'salamander_t7',
    name: 'Salamandra de Pantano (T7)',
    tier: 7,
    baseCapacityKg: 450,
    description: 'Velocidad 100% constante inmune a ralentizaciones de daño. Retiene carga pasiva.',
    speedBonus: '+100% constante',
    courierPassive: true,
  },
  {
    id: 'lizard_t7',
    name: 'Lagarto de Plagas (T7)',
    tier: 7,
    baseCapacityKg: 480,
    description: 'Excelente para escapar de gankers: gas tóxico y velocidad constante del 105%.',
    speedBonus: '+105% constante',
    courierPassive: true,
  },
  {
    id: 'bear_t7',
    name: 'Oso Pardo Ensillado (T7)',
    tier: 7,
    baseCapacityKg: 2470,
    description: 'Tanque blindado con carga pasiva: Muy difícil de derribar para grupos pequeños de gankers.',
    speedBonus: '+60% galope',
    isArmored: true,
    courierPassive: true,
  },
  {
    id: 'ox_t8',
    name: 'Buey del Transportista (T8)',
    tier: 8,
    baseCapacityKg: 8667,
    description: 'Máxima capacidad entre monturas convencionales para rutas 100% seguras.',
    speedBonus: '+65% galope',
  },
  {
    id: 'mammoth_t8',
    name: 'Mamut de Transporte (T8)',
    tier: 8,
    baseCapacityKg: 45000,
    description: 'El coloso indiscutible de Albion para arbitraje y transporte industrial masivo.',
    speedBonus: '+35% galope',
    isArmored: true,
  },
];

export interface TransportItemWeight {
  itemId: string;
  name: string;
  category: 'crop' | 'herb' | 'animal_product' | 'mount' | 'food' | 'potion';
  weightKg: number;
}

export const ITEM_WEIGHTS: Record<string, number> = {
  // Cultivos (0.15 kg)
  crop_carrot: 0.15,
  crop_bean: 0.15,
  crop_wheat: 0.15,
  crop_turnip: 0.15,
  crop_cabbage: 0.15,
  crop_potato: 0.15,
  crop_corn: 0.15,
  crop_pumpkin: 0.15,

  // Hierbas (0.15 kg)
  herb_arcane: 0.15,
  herb_brightleaf: 0.15,
  herb_crenell: 0.15,
  herb_dragon: 0.15,
  herb_elusive: 0.15,
  herb_firebloom: 0.15,
  herb_ghoul: 0.15,

  // Productos de Animales (0.15 kg)
  prod_chicken_egg: 0.15,
  prod_raw_chicken: 0.15,
  prod_goat_milk: 0.15,
  prod_raw_goat: 0.15,
  prod_goose_egg: 0.15,
  prod_raw_goose: 0.15,
  prod_sheep_milk: 0.15,
  prod_raw_mutton: 0.15,
  prod_cow_milk: 0.15,
  prod_raw_beef: 0.15,
  prod_raw_pork: 0.15,

  // Comidas y Pociones (0.20 kg)
  food_salad: 0.20,
  food_pie: 0.20,
  food_omelette: 0.20,
  food_stew: 0.20,
  food_sandwich: 0.20,
  food_roast: 0.20,
  potion_minor_heal: 0.20,
  potion_heal: 0.20,
  potion_major_heal: 0.20,
  potion_minor_energy: 0.20,
  potion_energy: 0.20,
  potion_major_energy: 0.20,
  potion_invis: 0.20,
  potion_poison: 0.20,
  potion_major_poison: 0.20,

  // Monturas ensilladas (45.0 - 112.3 kg)
  mount_horse_t3: 45.0,
  mount_horse_t4: 45.0,
  mount_horse_t5: 45.0,
  mount_horse_t6: 45.0,
  mount_horse_t7: 45.0,
  mount_horse_t8: 45.0,
  mount_ox_t3: 45.0,
  mount_ox_t4: 55.0,
  mount_ox_t5: 68.0,
  mount_ox_t6: 82.0,
  mount_ox_t7: 98.0,
  mount_ox_t8: 112.3,
  mount_stag_t4: 45.0,
  mount_wolf_t6: 45.0,
  mount_claw_t7: 45.0,
  mount_swamp_dragon_t7: 55.0,
  mount_boar_t7: 55.0,
  mount_bear_t7: 65.0,

  // Recursos Refinados: Tablas (Madera)
  mat_plank_t2: 0.20,
  mat_plank_t3: 0.30,
  mat_plank_t4: 0.50,
  mat_plank_t5: 0.80,
  mat_plank_t6: 1.30,
  mat_plank_t7: 2.10,
  mat_plank_t8: 3.40,

  // Recursos Refinados: Lingotes (Mineral)
  mat_bar_t2: 0.20,
  mat_bar_t3: 0.30,
  mat_bar_t4: 0.50,
  mat_bar_t5: 0.80,
  mat_bar_t6: 1.30,
  mat_bar_t7: 2.10,
  mat_bar_t8: 3.40,

  // Recursos Refinados: Cuero (Pieles)
  mat_leather_t2: 0.20,
  mat_leather_t3: 0.30,
  mat_leather_t4: 0.50,
  mat_leather_t5: 0.80,
  mat_leather_t6: 1.30,
  mat_leather_t7: 2.10,
  mat_leather_t8: 3.40,

  // Recursos Refinados: Tela (Fibra)
  mat_cloth_t2: 0.20,
  mat_cloth_t3: 0.30,
  mat_cloth_t4: 0.50,
  mat_cloth_t5: 0.80,
  mat_cloth_t6: 1.30,
  mat_cloth_t7: 2.10,
  mat_cloth_t8: 3.40,

  // Recursos Refinados: Bloques de Piedra
  mat_stone_t2: 0.20,
  mat_stone_t3: 0.30,
  mat_stone_t4: 0.50,
  mat_stone_t5: 0.80,
  mat_stone_t6: 1.30,
  mat_stone_t7: 2.10,
  mat_stone_t8: 3.40,

  // Pesca y Salsas de Encantamiento
  prod_seaweed: 0.10,
  prod_chopped_fish: 0.10,
  sauce_basic: 0.15,
  sauce_fancy: 0.15,
  sauce_special: 0.15,
  essence_arcane: 0.10,

  // Diarios de Trabajador
  journal_full_t4: 0.10,
  journal_full_t5: 0.10,
  journal_full_t6: 0.10,
  journal_full_t7: 0.10,
  journal_full_t8: 0.10,
};

export type RouteDangerLevel = 'safe' | 'dangerous_red' | 'mists';

export interface RouteInfo {
  originCity: CityId;
  destinationCity: CityId;
  dangerLevel: RouteDangerLevel;
  dangerDescription: string;
  hasCaerleonBonus: boolean;
  redZonesCount: number;
  safeZonesCount: number;
  tacticalAdvice: string;
  recommendedMountCategory: string;
}

export function evaluateRouteDanger(origin: CityId, destination: CityId): RouteInfo {
  const isCaerleonInvolved = origin === 'caerleon' || destination === 'caerleon';
  const isBrecilienInvolved = origin === 'brecilien' || destination === 'brecilien';

  if (origin === destination) {
    return {
      originCity: origin,
      destinationCity: destination,
      dangerLevel: 'safe',
      dangerDescription: 'Tránsito Local o Isla Privada: Transporte interno sin cruzar zonas abiertas de mapa.',
      hasCaerleonBonus: origin === 'caerleon',
      redZonesCount: 0,
      safeZonesCount: 0,
      tacticalAdvice: 'Sin riesgo de PVP. Usa la montura de mayor capacidad disponible (Buey T6-T8 o Mamut) para minimizar viajes.',
      recommendedMountCategory: 'Carga Masiva (Buey T6/T8 o Mamut)',
    };
  }

  if (isCaerleonInvolved) {
    return {
      originCity: origin,
      destinationCity: destination,
      dangerLevel: 'dangerous_red',
      dangerDescription: 'Ruta de Zona Roja: PVP de botín completo. Riesgo de ganks y emboscadas en puertas de mapa.',
      hasCaerleonBonus: destination === 'caerleon' || origin === 'caerleon',
      redZonesCount: 3,
      safeZonesCount: 2,
      tacticalAdvice: 'Cruza en horarios valle de gankers. Utiliza un scout desarmado en la siguiente puerta y NUNCA uses monturas sin carga pasiva.',
      recommendedMountCategory: 'Evasión & Carga Pasiva (Jabalí T7, Oso T7 o Ciervo T4)',
    };
  }

  if (isBrecilienInvolved) {
    return {
      originCity: origin,
      destinationCity: destination,
      dangerLevel: 'mists',
      dangerDescription: 'Ruta por Caminos de Avalon o Nieblas: Portales inestables con cargas limitadas y entradas variables.',
      hasCaerleonBonus: false,
      redZonesCount: 0,
      safeZonesCount: 0,
      tacticalAdvice: 'Revisa las cargas restantes del portal de Avalón antes de cargar peso excesivo. Si el portal se cierra, quedarás varado.',
      recommendedMountCategory: 'Montura rápida y de escape (Ciervo Gigante o Caballo T5)',
    };
  }

  return {
    originCity: origin,
    destinationCity: destination,
    dangerLevel: 'safe',
    dangerDescription: 'Ruta Segura de Ciudades Reales: Puedes transitar completamente por Zonas Azules y Amarillas sin riesgo de perder mercancía.',
    hasCaerleonBonus: false,
    redZonesCount: 0,
    safeZonesCount: 6,
    tacticalAdvice: 'Ruta 100% libre de saqueo letal. Si te noquean en zona amarilla no pierdes el botín. Maximiza la capacidad con Buey T8 o Mamut.',
    recommendedMountCategory: 'Capacidad Máxima (Buey T6-T8 o Mamut de Transporte)',
  };
}
