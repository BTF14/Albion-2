import { AlbionRecipe, EnchantmentLevel } from '../types';

export type TurnoverSpeed = 'ultra_fast' | 'fast' | 'moderate' | 'slow_niche';

export type MarketDemandType =
  | 'zvz_meta' // Mandatorio en Gremios y ZvZ (Consumo de miles por hora)
  | 'gathering_meta' // Consumo universal de recolectores y transportistas
  | 'ganking_pvp' // Gankers, roamers y cazadores de nieblas
  | 'pve_fame' // Leveo de armas, mazmorras y nieblas
  | 'crafting_econ' // Artesanos que mejoran calidad/velocidad
  | 'luxury_niche'; // Jugadores ballena, HCE o torneos extremos

export type OpportunityQuadrant =
  | 'liquid_gold' // 🏆 Oro Líquido: Alto Beneficio + Venta Ultrarrápida
  | 'fast_cash' // ⚡ Pan Caliente: Margen Estable + Venta Instantánea (Bajo Riesgo)
  | 'high_ticket_niche' // 💎 Mercado de Lujo: Mucho Margen + Venta Lenta (Lotes Pequeños)
  | 'low_yield_slow'; // ⚠️ Riesgo / Estancamiento: Poco Margen o Venta Muy Lenta

export interface MarketProfile {
  baseSpeed: TurnoverSpeed;
  demandType: MarketDemandType;
  primaryUseEs: string;
  dailyCityVolumeEst: string; // e.g. "3,000 - 8,000 uds/día"
  typicalSaleHoursEst: string; // e.g. "2 - 6 horas"
  maxRecommendedBatchPerDay: number; // Lotes recomendados para no tumbar precio ni estancarse
  notesEs: string;
}

// Perfiles de mercado base según la realidad económica de Albion Online
export const RECIPE_MARKET_PROFILES: Record<string, MarketProfile> = {
  // --- COMIDAS TIER TOP PVP / RECOLECCIÓN ---
  cook_pork_omelette_t7: {
    baseSpeed: 'ultra_fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'ZvZ Masivo, Nieblas, Healers y Magos de Daño por Reducción de CD',
    dailyCityVolumeEst: '5,000 - 15,000 uds/día',
    typicalSaleHoursEst: '1 - 4 horas',
    maxRecommendedBatchPerDay: 50, // 500 uds
    notesEs: 'Es la comida más consumida de todo Albion Online junto con el Guisado T8. Venta instantánea garantizada en cualquier ciudad.',
  },
  cook_beef_stew_t8: {
    baseSpeed: 'ultra_fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'ZvZ, Roaming PvP, Daño Burst Absoluto para DPS Melee y Ranged',
    dailyCityVolumeEst: '4,000 - 12,000 uds/día',
    typicalSaleHoursEst: '1 - 4 horas',
    maxRecommendedBatchPerDay: 40, // 400 uds
    notesEs: 'Consumo masivo en todas las zonas negras. Los gremios compran miles a diario.',
  },
  cook_pork_pie_t7: {
    baseSpeed: 'ultra_fast',
    demandType: 'gathering_meta',
    primaryUseEs: 'Recolectores T6-T8, Transportistas de Carga y Crafteadores',
    dailyCityVolumeEst: '6,000 - 14,000 uds/día',
    typicalSaleHoursEst: '1 - 3 horas',
    maxRecommendedBatchPerDay: 50,
    notesEs: 'El rey de la economía civil. Nunca se devalúa porque cada recolector usa 2 o 3 por hora.',
  },
  cook_cabbage_soup_t5: {
    baseSpeed: 'ultra_fast',
    demandType: 'pve_fame',
    primaryUseEs: 'Farmeo PvE en Nieblas, Caminos de Avalon y Mazmorras Abiertas',
    dailyCityVolumeEst: '4,000 - 9,000 uds/día',
    typicalSaleHoursEst: '2 - 6 horas',
    maxRecommendedBatchPerDay: 40,
    notesEs: 'La comida preferida para levear rápido sin necesidad de curaciones.',
  },
  cook_pork_roast_t7: {
    baseSpeed: 'fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'Bruisers, Tanques y Duelos 1v1 (Robo de Vida)',
    dailyCityVolumeEst: '1,500 - 4,000 uds/día',
    typicalSaleHoursEst: '4 - 12 horas',
    maxRecommendedBatchPerDay: 25,
    notesEs: 'Demanda constante en peleas de facción y nieblas letales.',
  },
  cook_beef_sandwich_t8: {
    baseSpeed: 'fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'Tanques principales en ZvZ y Puertas del Infierno (+Vida Máxima)',
    dailyCityVolumeEst: '1,000 - 3,000 uds/día',
    typicalSaleHoursEst: '6 - 16 horas',
    maxRecommendedBatchPerDay: 20,
    notesEs: 'Buena rotación en ciudades centrales y Caerleon.',
  },
  cook_pork_salad_t6: {
    baseSpeed: 'fast',
    demandType: 'crafting_econ',
    primaryUseEs: 'Crafteo masivo de equipo en talleres (+Velocidad y Calidad)',
    dailyCityVolumeEst: '1,200 - 3,500 uds/día',
    typicalSaleHoursEst: '4 - 12 horas',
    maxRecommendedBatchPerDay: 20,
    notesEs: 'Comprada por crafteadores de equipo T7-T8 para forjar obras maestras.',
  },
  cook_avalonian_pork_omelette_t7: {
    baseSpeed: 'moderate',
    demandType: 'zvz_meta',
    primaryUseEs: 'PvP de Alto Rendimiento, GvG y HCE',
    dailyCityVolumeEst: '400 - 1,200 uds/día',
    typicalSaleHoursEst: '12 - 36 horas',
    maxRecommendedBatchPerDay: 10,
    notesEs: 'Requiere Energía Avaloniana. Margen elevado pero menor volumen que la estándar.',
  },
  cook_avalonian_beef_stew_t8: {
    baseSpeed: 'moderate',
    demandType: 'zvz_meta',
    primaryUseEs: 'Combate Avaloniano y Duelos de Alta Gama',
    dailyCityVolumeEst: '400 - 1,200 uds/día',
    typicalSaleHoursEst: '12 - 36 horas',
    maxRecommendedBatchPerDay: 10,
    notesEs: 'Excelente para vender en Caerleon o Fort Sterling.',
  },
  cook_drake_biscuits_t8: {
    baseSpeed: 'fast',
    demandType: 'pve_fame',
    primaryUseEs: 'Nueva comida Dragonfire: +5% Fama durante 25h acumulable',
    dailyCityVolumeEst: '800 - 2,500 uds/día',
    typicalSaleHoursEst: '6 - 18 horas',
    maxRecommendedBatchPerDay: 15,
    notesEs: 'Gran novedad muy demandada por jugadores que suben maestrías.',
  },
  cook_leyfin_omelette_t7: {
    baseSpeed: 'moderate',
    demandType: 'zvz_meta',
    primaryUseEs: 'Tortilla de Pez Leyfin con velocidad de casteo curativo',
    dailyCityVolumeEst: '300 - 900 uds/día',
    typicalSaleHoursEst: '12 - 30 horas',
    maxRecommendedBatchPerDay: 8,
    notesEs: 'Comida de dragón para healers especializados.',
  },

  // --- POCIONES META PVP & GANKING ---
  alch_major_resistance_t7: {
    baseSpeed: 'ultra_fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'Poción defensiva mandatoria en todo ZvZ, Roaming y Hellgates',
    dailyCityVolumeEst: '6,000 - 16,000 uds/día',
    typicalSaleHoursEst: '1 - 3 horas',
    maxRecommendedBatchPerDay: 60, // 300 uds
    notesEs: 'La poción más gastada del juego. Los gremios exigen llevar al menos 3 a 5 por regear.',
  },
  alch_poison_t6: {
    baseSpeed: 'ultra_fast',
    demandType: 'ganking_pvp',
    primaryUseEs: 'Ganking, Desmonte de Caballos y Jefes de Mazmorras',
    dailyCityVolumeEst: '5,000 - 12,000 uds/día',
    typicalSaleHoursEst: '1 - 4 horas',
    maxRecommendedBatchPerDay: 50,
    notesEs: 'Todo ganker lleva venenos T6 en la mochila. Salida velocísima en el mercado.',
  },
  alch_major_poison_t8: {
    baseSpeed: 'fast',
    demandType: 'ganking_pvp',
    primaryUseEs: 'Ganking letal a presas de alto valor y HCE',
    dailyCityVolumeEst: '2,000 - 5,000 uds/día',
    typicalSaleHoursEst: '3 - 8 horas',
    maxRecommendedBatchPerDay: 30,
    notesEs: 'Mayor daño por segundo, rotación rápida a buen precio.',
  },
  alch_invisibility_t8: {
    baseSpeed: 'ultra_fast',
    demandType: 'ganking_pvp',
    primaryUseEs: 'Poción clave para gankers, escapes en zona negra y Nieblas',
    dailyCityVolumeEst: '3,000 - 8,000 uds/día',
    typicalSaleHoursEst: '2 - 6 horas',
    maxRecommendedBatchPerDay: 35,
    notesEs: 'Inmunidad temporal vital. Se compra a precios elevados sin rechistar.',
  },
  alch_major_healing_t6: {
    baseSpeed: 'fast',
    demandType: 'pve_fame',
    primaryUseEs: 'Corrupted Dungeons 1v1, Nieblas y Mazmorras en solitario',
    dailyCityVolumeEst: '2,500 - 6,000 uds/día',
    typicalSaleHoursEst: '3 - 8 horas',
    maxRecommendedBatchPerDay: 30,
    notesEs: 'Muy popular entre jugadores de peleas 1v1 en nieblas amarillas y rojas.',
  },
  alch_major_gigantify_t7: {
    baseSpeed: 'fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'Sobrevivir a bursts de daño masivo en ZvZ y Corrupted',
    dailyCityVolumeEst: '1,500 - 4,000 uds/día',
    typicalSaleHoursEst: '4 - 10 horas',
    maxRecommendedBatchPerDay: 25,
    notesEs: 'Alternativa clave a la poción de resistencia para tanques y bruisers.',
  },
  alch_major_energy_t6: {
    baseSpeed: 'moderate',
    demandType: 'pve_fame',
    primaryUseEs: 'Magos con gasto de maná excesivo en PvE y Avalonianas',
    dailyCityVolumeEst: '800 - 2,000 uds/día',
    typicalSaleHoursEst: '6 - 18 horas',
    maxRecommendedBatchPerDay: 15,
    notesEs: 'Venta regular pero con menor volumen que curación y veneno.',
  },
  alch_cleansing_t8: {
    baseSpeed: 'moderate',
    demandType: 'zvz_meta',
    primaryUseEs: 'Poción de Limpieza de CC para soportes y Nieblas 1v1',
    dailyCityVolumeEst: '600 - 1,800 uds/día',
    typicalSaleHoursEst: '8 - 24 horas',
    maxRecommendedBatchPerDay: 15,
    notesEs: 'Usada por jugadores avanzados contra acumulaciones de control.',
  },
  alch_berserk_t8: {
    baseSpeed: 'moderate',
    demandType: 'ganking_pvp',
    primaryUseEs: 'Duelos extremos de Nieblas donde se arriesga vida por daño',
    dailyCityVolumeEst: '400 - 1,200 uds/día',
    typicalSaleHoursEst: '12 - 36 horas',
    maxRecommendedBatchPerDay: 10,
    notesEs: 'Demanda de nicho agresiva.',
  },
  alch_lifeward_potion_t8: {
    baseSpeed: 'fast',
    demandType: 'zvz_meta',
    primaryUseEs: 'Poción Dragón de resurrección en combate',
    dailyCityVolumeEst: '500 - 1,500 uds/día',
    typicalSaleHoursEst: '8 - 24 horas',
    maxRecommendedBatchPerDay: 10,
    notesEs: 'Muy codiciada por gremios élite en castillos y asedios.',
  },
};

// Modificador de velocidad y volumen según el nivel de encantamiento (.0 plano vs .1 vs .2 vs .3)
export function getEnchantmentVelocityModifier(level: EnchantmentLevel): {
  speedFactor: number; // Multiplicador de velocidad de venta
  volumePercent: number; // Porcentaje del volumen respecto al .0
  levelWarning?: string;
  speedTier: TurnoverSpeed;
} {
  switch (level) {
    case 0:
      return {
        speedFactor: 1.0,
        volumePercent: 100,
        speedTier: 'ultra_fast',
      };
    case 1:
      return {
        speedFactor: 0.75,
        volumePercent: 60,
        speedTier: 'fast',
        levelWarning: 'Excelente balance: Comprado masivamente en ZvZ por jugadores con presupuesto medio-alto.',
      };
    case 2:
      return {
        speedFactor: 0.35,
        volumePercent: 20,
        speedTier: 'moderate',
        levelWarning: 'Rotación moderada: Comprado por jugadores de Nieblas letales y Hellgates 5v5. Venta más pausada.',
      };
    case 3:
      return {
        speedFactor: 0.1,
        volumePercent: 5,
        speedTier: 'slow_niche',
        levelWarning: '⚠️ ALERTA DE NICHO: Se vende a precios muy altos pero muy pocas unidades al día. Riesgo de plata estancada si fabricas grandes cantidades.',
      };
  }
}

export interface CalculatedMarketVelocity {
  turnoverSpeed: TurnoverSpeed;
  speedLabelEs: string;
  badgeColor: string;
  demandType: MarketDemandType;
  demandLabelEs: string;
  dailyVolumeEst: string;
  saleTimeEst: string;
  quadrant: OpportunityQuadrant;
  quadrantTitleEs: string;
  quadrantBadgeClass: string;
  liquidityScore: number; // 0 a 100
  recommendedBatchLimit: number;
  velocityTrapWarning?: string;
  practicalAdviceEs: string;
}

export function evaluateMarketVelocity(
  recipe: AlbionRecipe,
  enchantmentLevel: EnchantmentLevel,
  profitPerUnit: number,
  roiPercent: number
): CalculatedMarketVelocity {
  const profile = RECIPE_MARKET_PROFILES[recipe.id] || {
    baseSpeed: (recipe.tier >= 7 ? 'fast' : 'moderate') as TurnoverSpeed,
    demandType: 'zvz_meta' as MarketDemandType,
    primaryUseEs: 'Consumo habitual de combate o economía',
    dailyCityVolumeEst: '1,000 - 3,000 uds/día',
    typicalSaleHoursEst: '4 - 16 horas',
    maxRecommendedBatchPerDay: 20,
    notesEs: 'Demanda regular en mercados de ciudad real.',
  };

  const encMod = getEnchantmentVelocityModifier(enchantmentLevel);

  // Determinar la velocidad resultante ajustada al encantamiento
  let speed: TurnoverSpeed = profile.baseSpeed;
  if (enchantmentLevel === 3) {
    speed = 'slow_niche';
  } else if (enchantmentLevel === 2) {
    if (speed === 'ultra_fast') speed = 'fast';
    else if (speed === 'fast') speed = 'moderate';
    else speed = 'slow_niche';
  } else if (enchantmentLevel === 1) {
    if (speed === 'ultra_fast') speed = 'fast';
  }

  // Puntuación de liquidez de 0 a 100
  let liquidityScore = 50;
  if (speed === 'ultra_fast') liquidityScore = 95;
  else if (speed === 'fast') liquidityScore = 80;
  else if (speed === 'moderate') liquidityScore = 55;
  else liquidityScore = 25;

  // Ajuste por tier de receta (T7/T8 suele tener más volumen que T4/T5 de combate básico)
  if (recipe.tier === 7 || recipe.tier === 8) liquidityScore = Math.min(100, liquidityScore + 5);

  // Cuadrante de oportunidad económica
  let quadrant: OpportunityQuadrant = 'fast_cash';
  let quadrantTitleEs = 'Pan Caliente (Flujo Seguro)';
  let quadrantBadgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/30';

  const isHighProfit = roiPercent >= 20 || profitPerUnit >= 2500;
  const isFastSpeed = speed === 'ultra_fast' || speed === 'fast';

  if (isHighProfit && isFastSpeed) {
    quadrant = 'liquid_gold';
    quadrantTitleEs = '🏆 Oro Líquido (Alto Margen + Venta Inmediata)';
    quadrantBadgeClass = 'bg-amber-500/25 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/30';
  } else if (!isHighProfit && isFastSpeed) {
    quadrant = 'fast_cash';
    quadrantTitleEs = '⚡ Pan Caliente (Margen Frecuente + Venta en Horas)';
    quadrantBadgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  } else if (isHighProfit && !isFastSpeed) {
    quadrant = 'high_ticket_niche';
    quadrantTitleEs = '💎 Mercado de Lujo (Gran Margen pero Salida Lenta)';
    quadrantBadgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  } else {
    quadrant = 'low_yield_slow';
    quadrantTitleEs = '⚠️ Riesgo de Capital Estancado (Bajo Margen y Salida Lenta)';
    quadrantBadgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  }

  // Advertencia de trampa de papel
  let velocityTrapWarning: string | undefined = undefined;
  if (enchantmentLevel === 3) {
    velocityTrapWarning =
      'Precaución con los ítems .3: Su margen en papel puede superar el 40%, pero el volumen diario en una sola ciudad suele ser menor a 50 unidades. Si crafteas más de 1-2 lotes te verás obligado a hacer undercut constante o esperar semanas.';
  } else if (speed === 'slow_niche' && isHighProfit) {
    velocityTrapWarning =
      'Margen alto pero rotación lenta: El capital invertido tardará varios días en regresar a tu bolsillo. Fabrica solo lo que puedas permitirte tener estacionado.';
  }

  // Tiempos y volúmenes calculados
  let speedLabelEs = 'Venta Rápida';
  let badgeColor = 'emerald';
  let saleTimeEst = '2 a 8 horas';

  if (speed === 'ultra_fast') {
    speedLabelEs = '🚀 Venta Instantánea (< 4h)';
    badgeColor = 'amber';
    saleTimeEst = '1 a 4 horas';
  } else if (speed === 'fast') {
    speedLabelEs = '⚡ Venta Rápida (Mismo Día)';
    badgeColor = 'emerald';
    saleTimeEst = '4 a 12 horas';
  } else if (speed === 'moderate') {
    speedLabelEs = '⚖️ Venta Moderada (1 a 2 Días)';
    badgeColor = 'sky';
    saleTimeEst = '1 a 2 días';
  } else {
    speedLabelEs = '🐢 Venta Lenta / Nicho (Días o Semanas)';
    badgeColor = 'purple';
    saleTimeEst = '3 a 7+ días';
  }

  // Límite de lote recomendado
  const baseBatch = profile.maxRecommendedBatchPerDay;
  const recommendedBatchLimit = Math.max(1, Math.round(baseBatch * (encMod.volumePercent / 100)));

  // Consejo práctico para el jugador
  let practicalAdviceEs = '';
  if (quadrant === 'liquid_gold') {
    practicalAdviceEs = `¡Excelente elección! Puedes fabricar hasta ${recommendedBatchLimit} lotes (${recommendedBatchLimit * recipe.outputAmount} unids) y se liquidarán en menos de 24 horas sin saturar el mercado.`;
  } else if (quadrant === 'fast_cash') {
    practicalAdviceEs = `Ideal para mantener liquidez continua. Ganas menos plata por unidad pero tu plata entra y sale en horas, permitiéndote reinvertir constantemente.`;
  } else if (quadrant === 'high_ticket_niche') {
    practicalAdviceEs = `Venta lenta pero muy bien pagada. Consejo de veterano: fabrica como máximo ${recommendedBatchLimit} lotes (${recommendedBatchLimit * recipe.outputAmount} unids) a la vez para no competir contra tus propias órdenes de venta.`;
  } else {
    practicalAdviceEs = `Poco aconsejable con los precios actuales. No compensa tener el capital retenido para el margen que produce.`;
  }

  return {
    turnoverSpeed: speed,
    speedLabelEs,
    badgeColor,
    demandType: profile.demandType,
    demandLabelEs:
      profile.demandType === 'zvz_meta'
        ? 'PvP ZvZ Masivo'
        : profile.demandType === 'gathering_meta'
        ? 'Recolección y Carga'
        : profile.demandType === 'ganking_pvp'
        ? 'Ganking & Nieblas'
        : profile.demandType === 'pve_fame'
        ? 'Farmeo PvE & Fama'
        : profile.demandType === 'crafting_econ'
        ? 'Economía de Crafteo'
        : 'Lujo & Coleccionista',
    dailyVolumeEst: profile.dailyCityVolumeEst,
    saleTimeEst,
    quadrant,
    quadrantTitleEs,
    quadrantBadgeClass,
    liquidityScore,
    recommendedBatchLimit,
    velocityTrapWarning,
    practicalAdviceEs,
  };
}
