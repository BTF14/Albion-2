/**
 * Modelo de Dominio: Planificador de Envíos Masivos por Zona Roja & Analizador de Riesgo de Gankers a Caerleon
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Mecánicas oficiales de Albion Online:
 * - Ciudades Reales conectadas a Caerleon a través de Zonas Rojas (Full Loot PvP).
 * - En caso de ser abatido (ganked), el jugador pierde el 100% de la carga del inventario, la montura y el equipamiento.
 * - Transporte de alta rentabilidad hacia el Mercado Negro (Black Market) o el mercado central de Caerleon.
 * - Clasificación de carga según ratio Valor / Peso (Plata / kg).
 * - Mecánica de monturas: Carga pasiva de mensajero (Courier) vs Carga exclusiva de montura. Si te desmontan en un buey con sobrepeso, inmovilidad inmediata del 200%.
 * - Sets de escape: Movilidad, invisibilidad y purgas de control de masas (Capa Fort Sterling, Zapatos de Minero, Hábito de Clérigo, Poción de Invisibilidad).
 * - Modelo probabilístico: Valor Esperado (EV) y Umbral de Supervivencia de Equilibrio (Break-Even Survival Threshold).
 */

import { CityId } from '../../types';

export interface RedZoneMount {
  id: string;
  nameEs: string;
  tier: number;
  maxLoadKg: number; // Capacidad máxima de carga
  isCourierMount: boolean; // Si es true, el peso permanece en el jugador tras ser desmontado (Crucial para sobrevivir)
  moveSpeedPercent: number; // Velocidad de galope
  baseHp: number;
  armorResilience: string; // Baja, Media, Alta, Muy Alta
  specialAbilityEs: string;
  estimatedPriceSilver: number;
}

export interface EscapeGearItem {
  slot: 'head' | 'chest' | 'shoes' | 'cape' | 'weapon' | 'potion' | 'food';
  nameEs: string;
  tier: number;
  abilityEs: string;
  estimatedCostSilver: number;
}

export interface PresetEscapeSet {
  id: string;
  nameEs: string;
  descriptionEs: string;
  items: EscapeGearItem[];
  totalSetCostSilver: number;
}

export interface RedZoneCargoItem {
  id: string;
  nameEs: string;
  category: 'food' | 'potion' | 'equipment' | 'material' | 'mount' | 'custom';
  unitWeightKg: number;
  quantity: number;
  unitCostOriginSilver: number; // Coste de adquisición en ciudad de origen
  unitPriceCaerleonSilver: number; // Precio de venta esperado en Caerleon / Mercado Negro
}

export interface RedZoneTransportRoute {
  id: string;
  originCityId: CityId;
  destinationCityId: 'caerleon';
  nameEs: string;
  redZonesCount: number; // Número de mapas de zona roja a cruzar
  averageDangerLevel: 'medium' | 'high' | 'extreme';
  notableChokePointsEs: string;
}

export interface RedZoneTransportInput {
  routeId: string;
  originCityId: CityId;
  mountId: string;
  escapeSetId: string;
  customEscapeCostSilver: number;
  cargoItems: RedZoneCargoItem[];
  // Simulación de Riesgo de Gankers
  estimatedSurvivalPercent: number; // ej. 95% (5% de probabilidad de ser emboscado)
  hasScoutAhead: boolean; // Si cuenta con un explorador delante que avisa de rojos (+15% supervivencia estimada)
  redPksReportedCount: number; // Número de hostiles reportados en el mapa
  totalPlayerSilverReserve: number; // Reserva total de plata del jugador (para gestión de banca)
  hasEatenPorkPie?: boolean; // Bono oficial de Albion: +30% capacidad de carga
  destinationSaleType: 'black_market_buy_order' | 'caerleon_market_sell_order';
  hasPremium: boolean;
}

export interface CargoItemValuation {
  id: string;
  nameEs: string;
  category: string;
  quantity: number;
  totalWeightKg: number;
  totalCostOriginSilver: number;
  totalRevenueCaerleonSilver: number;
  netProfitSilver: number;
  profitMarginPercent: number;
  silverPerKg: number; // Ratio clave de Albion: mayor es mejor
  rankPriority: number;
}

export interface RedZoneTransportResult {
  // Capacidad y Carga
  totalWeightKg: number;
  mountEffectiveCapacityKg: number;
  weightLoadPercent: number;
  isOverburdenedMounted: boolean;
  isOverburdenedDismounted: boolean; // Alerta crítica: si te desmontan, ¿puedes correr?
  canEscapeOnDismount: boolean;

  // Finanzas de la Operación (Viaje Exitoso)
  totalCargoCostOriginSilver: number;
  totalGrossRevenueCaerleonSilver: number;
  marketTaxesSilver: number;
  tripNetProfitSilver: number;
  tripRoiPercent: number;

  // Valor en Riesgo y Pérdida Máxima por Muerte (Gank)
  escapeSetAndMountCostSilver: number;
  totalSilverAtRiskSilver: number; // Carga total + Set + Montura
  percentOfTotalSilverRisked: number; // % del banco en riesgo en un solo viaje

  // Análisis Estadístico y Probabilístico (Valor Esperado - EV)
  estimatedSurvivalRate: number; // 0.0 a 1.0
  breakEvenSurvivalRate: number; // Supervivencia mínima requerida para no perder plata a largo plazo
  expectedValueSilver: number; // EV en plata por viaje (promediando muertes vs éxitos)
  netSilverPerKg: number; // Rentabilidad global por kilo de carga

  // Clasificación de Carga
  sortedCargoBySilverPerKg: CargoItemValuation[];

  // Veredicto de Seguridad y Recomendaciones Tácticas
  safetyVerdict: 'SEGURO' | 'PRECAUCION' | 'ALTO_RIESGO' | 'TEMERARIO' | 'MATEMATICAMENTE_INVIABLE';
  verdictTitleEs: string;
  verdictDescriptionEs: string;
  tacticalRecommendations: string[];
}

export const RED_ZONE_MOUNTS: RedZoneMount[] = [
  {
    id: 'spectral_direboar',
    nameEs: 'Jabalí Fantasma (Spectral Direboar)',
    tier: 7,
    maxLoadKg: 1049,
    isCourierMount: true, // ¡Permite correr con carga si te desmontan!
    moveSpeedPercent: 120,
    baseHp: 1680,
    armorResilience: 'Alta',
    specialAbilityEs: 'Parpadeo Espectral (Invisibilidad de 5s)',
    estimatedPriceSilver: 1450000,
  },
  {
    id: 'pest_lizard',
    nameEs: 'Lagarto de Plagas (Pest Lizard)',
    tier: 7,
    maxLoadKg: 450,
    isCourierMount: false,
    moveSpeedPercent: 110,
    baseHp: 2150,
    armorResilience: 'Muy Alta',
    specialAbilityEs: 'Nube Tóxica (Desmonta y atonta perseguidores)',
    estimatedPriceSilver: 1850000,
  },
  {
    id: 'polar_bear',
    nameEs: 'Oso Polar / Grizzly Bear',
    tier: 7,
    maxLoadKg: 2240,
    isCourierMount: true,
    moveSpeedPercent: 105,
    baseHp: 2850,
    armorResilience: 'Extrema',
    specialAbilityEs: 'Rugido Ursino (Aumenta defensa y velocidad al ser atacado)',
    estimatedPriceSilver: 2400000,
  },
  {
    id: 'swamp_dragon',
    nameEs: 'Salamandra de Pantano (Swamp Dragon)',
    tier: 7,
    maxLoadKg: 780,
    isCourierMount: false,
    moveSpeedPercent: 105,
    baseHp: 1980,
    armorResilience: 'Alta',
    specialAbilityEs: 'Inmunidad al relentizamiento por daño directo',
    estimatedPriceSilver: 850000,
  },
  {
    id: 'armored_horse_t7',
    nameEs: 'Caballo de Guerra Blindado T7',
    tier: 7,
    maxLoadKg: 350,
    isCourierMount: false,
    moveSpeedPercent: 125,
    baseHp: 1450,
    armorResilience: 'Alta',
    specialAbilityEs: 'Alta velocidad constante y resistencia a cortes',
    estimatedPriceSilver: 280000,
  },
  {
    id: 'transport_ox_t5',
    nameEs: 'Buey de Transporte T5 (Riesgo Crítico)',
    tier: 5,
    maxLoadKg: 1350,
    isCourierMount: false, // Peligro: inmovilidad inmediata al desmontar
    moveSpeedPercent: 75,
    baseHp: 1800,
    armorResilience: 'Media',
    specialAbilityEs: 'Ninguna (Fácil de emboscar y desmontar)',
    estimatedPriceSilver: 85000,
  },
  {
    id: 'transport_ox_t8',
    nameEs: 'Buey de Transporte T8 Anciano (Solo con Scout)',
    tier: 8,
    maxLoadKg: 3200,
    isCourierMount: false,
    moveSpeedPercent: 85,
    baseHp: 3200,
    armorResilience: 'Alta',
    specialAbilityEs: 'Capacidad colosal (Inmovilidad letal si te desmontan)',
    estimatedPriceSilver: 950000,
  },
];

export const PRESET_ESCAPE_SETS: PresetEscapeSet[] = [
  {
    id: 'meta_escape_set',
    nameEs: 'Set de Escape Meta (Invisibilidad + Sprint de Minero)',
    descriptionEs: 'La combinación más probada en Albion Online para escapar de grupos de gankers al ser desmontado.',
    items: [
      { slot: 'head', nameEs: 'Hábito de Clérigo (Bloque de Hielo)', tier: 6, abilityEs: 'Bloque de Hielo (Inmunidad)', estimatedCostSilver: 45000 },
      { slot: 'chest', nameEs: 'Chaqueta de Asesino (Emboscada)', tier: 6, abilityEs: 'Invisibilidad de 8s', estimatedCostSilver: 65000 },
      { slot: 'shoes', nameEs: 'Botas de Minero (Flee)', tier: 6, abilityEs: 'Sprint Extremo +120% vel (10s)', estimatedCostSilver: 75000 },
      { slot: 'cape', nameEs: 'Capa de Fort Sterling', tier: 6, abilityEs: 'Purga automática de control de masas', estimatedCostSilver: 85000 },
      { slot: 'weapon', nameEs: 'Daga Sanguinaria + Antorcha', tier: 6, abilityEs: 'Doble Carrera y Dash de movilidad', estimatedCostSilver: 95000 },
      { slot: 'potion', nameEs: 'Poción de Invisibilidad T8 (x2)', tier: 8, abilityEs: '6s de invisibilidad en carrera', estimatedCostSilver: 36000 },
      { slot: 'food', nameEs: 'Pastel de Cerdo T7 (Comido)', tier: 7, abilityEs: '+30% de capacidad de carga', estimatedCostSilver: 12000 },
    ],
    totalSetCostSilver: 413000,
  },
  {
    id: 'budget_escape_set',
    nameEs: 'Set de Escape Económico T4.1',
    descriptionEs: 'Equipo básico de huida para viajes de bajo volumen o cargamentos pequeños.',
    items: [
      { slot: 'head', nameEs: 'Capucha de Cazador', tier: 4, abilityEs: 'Devolver Daño', estimatedCostSilver: 12000 },
      { slot: 'chest', nameEs: 'Chaqueta de Asesino', tier: 4, abilityEs: 'Invisibilidad', estimatedCostSilver: 18000 },
      { slot: 'shoes', nameEs: 'Botas de Soldado', tier: 4, abilityEs: 'Wanderlust (Carrera continua)', estimatedCostSilver: 15000 },
      { slot: 'cape', nameEs: 'Capa de Fort Sterling', tier: 4, abilityEs: 'Purga CC', estimatedCostSilver: 38000 },
      { slot: 'weapon', nameEs: 'Bastón Doble', tier: 4, abilityEs: 'Doble Salto de Escape', estimatedCostSilver: 22000 },
      { slot: 'potion', nameEs: 'Poción de Invisibilidad T6 (x1)', tier: 6, abilityEs: 'Invisibilidad rápida', estimatedCostSilver: 14000 },
      { slot: 'food', nameEs: 'Pastel de Cerdo T7', tier: 7, abilityEs: '+30% Carga', estimatedCostSilver: 12000 },
    ],
    totalSetCostSilver: 131000,
  },
  {
    id: 'naked_transport',
    nameEs: 'Sin Set de Escape (Kamikaze)',
    descriptionEs: 'Transporte sin equipo de escape. Si te desmontan, la muerte es prácticamente 100% garantizada.',
    items: [],
    totalSetCostSilver: 0,
  },
];

export const RED_ZONE_ROUTES: RedZoneTransportRoute[] = [
  {
    id: 'martlock_to_caerleon',
    originCityId: 'martlock',
    destinationCityId: 'caerleon',
    nameEs: 'Martlock ➔ Caerleon (Vía Creag Garr)',
    redZonesCount: 3,
    averageDangerLevel: 'high',
    notableChokePointsEs: 'Puente de Creag Garr y pasos estrechos de montaña.',
  },
  {
    id: 'fort_sterling_to_caerleon',
    originCityId: 'fort_sterling',
    destinationCityId: 'caerleon',
    nameEs: 'Fort Sterling ➔ Caerleon (Vía Malag Creag)',
    redZonesCount: 3,
    averageDangerLevel: 'extreme',
    notableChokePointsEs: 'Desfiladeros de nieve con campamentos frecuentes de gankers.',
  },
  {
    id: 'lymhurst_to_caerleon',
    originCityId: 'lymhurst',
    destinationCityId: 'caerleon',
    nameEs: 'Lymhurst ➔ Caerleon (Vía Highstone Mound)',
    redZonesCount: 2,
    averageDangerLevel: 'medium',
    notableChokePointsEs: 'Senderos boscosos con alta visibilidad de árboles.',
  },
  {
    id: 'bridgewatch_to_caerleon',
    originCityId: 'bridgewatch',
    destinationCityId: 'caerleon',
    nameEs: 'Bridgewatch ➔ Caerleon (Vía Drytop River)',
    redZonesCount: 3,
    averageDangerLevel: 'high',
    notableChokePointsEs: 'Dunas abiertas pero con cuellos de botella en ríos secos.',
  },
  {
    id: 'thetford_to_caerleon',
    originCityId: 'thetford',
    destinationCityId: 'caerleon',
    nameEs: 'Thetford ➔ Caerleon (Vía Sunkenbough)',
    redZonesCount: 3,
    averageDangerLevel: 'extreme',
    notableChokePointsEs: 'Pantanos con ralentizaciones naturales y cruces angostos.',
  },
];
