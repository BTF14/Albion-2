/**
 * Caso de Uso: Calculadora de Envíos Masivos por Zona Roja & Analizador de Riesgo de Gankers
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Lógica matemática pura, determinista y 100% libre de React/DOM.
 */

import {
  RedZoneTransportInput,
  RedZoneTransportResult,
  CargoItemValuation,
  RED_ZONE_MOUNTS,
  PRESET_ESCAPE_SETS,
  RED_ZONE_ROUTES,
} from '../models/redZoneTransport';

export function calculateRedZoneTransport(input: RedZoneTransportInput): RedZoneTransportResult {
  // 1. Sanitización de Entradas
  const selectedRoute = RED_ZONE_ROUTES.find((r) => r.id === input.routeId) || RED_ZONE_ROUTES[0];
  const selectedMount = RED_ZONE_MOUNTS.find((m) => m.id === input.mountId) || RED_ZONE_MOUNTS[0];
  const selectedEscapeSet = PRESET_ESCAPE_SETS.find((s) => s.id === input.escapeSetId) || PRESET_ESCAPE_SETS[0];

  const escapeSetCost = input.customEscapeCostSilver > 0
    ? input.customEscapeCostSilver
    : selectedEscapeSet.totalSetCostSilver;

  const totalPlayerSilver = Math.max(0, Number(input.totalPlayerSilverReserve) || 0);
  const rawSurvivalInput = Math.max(1, Math.min(99, Number(input.estimatedSurvivalPercent) || 95));
  const redPksCount = Math.max(0, Number(input.redPksReportedCount) || 0);

  // 2. Cálculo Granular de Carga
  const rawItems = Array.isArray(input.cargoItems) ? input.cargoItems : [];
  let totalWeightKg = 0;
  let totalCargoCostOriginSilver = 0;
  let totalGrossRevenueCaerleonSilver = 0;

  const itemValuations: CargoItemValuation[] = rawItems.map((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitWeight = Math.max(0, Number(item.unitWeightKg) || 0);
    const costOrigin = Math.max(0, Number(item.unitCostOriginSilver) || 0);
    const priceCaerleon = Math.max(0, Number(item.unitPriceCaerleonSilver) || 0);

    const itemTotalWeight = qty * unitWeight;
    const itemTotalCost = qty * costOrigin;
    const itemTotalRevenue = qty * priceCaerleon;
    const netProfit = itemTotalRevenue - itemTotalCost;
    const marginPercent = itemTotalCost > 0 ? Math.round((netProfit / itemTotalCost) * 100) : 0;
    const silverPerKg = itemTotalWeight > 0 ? Math.round(netProfit / itemTotalWeight) : 0;

    totalWeightKg += itemTotalWeight;
    totalCargoCostOriginSilver += itemTotalCost;
    totalGrossRevenueCaerleonSilver += itemTotalRevenue;

    return {
      id: item.id,
      nameEs: item.nameEs,
      category: item.category,
      quantity: qty,
      totalWeightKg: Math.round(itemTotalWeight * 100) / 100,
      totalCostOriginSilver: itemTotalCost,
      totalRevenueCaerleonSilver: itemTotalRevenue,
      netProfitSilver: netProfit,
      profitMarginPercent: marginPercent,
      silverPerKg,
      rankPriority: 0,
    };
  });

  // Clasificación por ratio Valor/Peso (Plata / kg) descendente
  const sortedCargoBySilverPerKg = [...itemValuations]
    .sort((a, b) => b.silverPerKg - a.silverPerKg)
    .map((item, idx) => ({ ...item, rankPriority: idx + 1 }));

  // 3. Capacidad de Montura y Evaluación de Sobrecarga (Overburden)
  // Bono del Pastel de Cerdo (+30% capacidad)
  const hasPorkPie = typeof input.hasEatenPorkPie === 'boolean'
    ? input.hasEatenPorkPie
    : selectedEscapeSet.items.some((i) => i.slot === 'food');
  const effectiveCapacityMultiplier = hasPorkPie ? 1.30 : 1.00;
  const mountEffectiveCapacityKg = Math.round(selectedMount.maxLoadKg * effectiveCapacityMultiplier);

  const weightLoadPercent = mountEffectiveCapacityKg > 0
    ? Math.round((totalWeightKg / mountEffectiveCapacityKg) * 100)
    : 0;

  const isOverburdenedMounted = totalWeightKg > mountEffectiveCapacityKg;

  // Lógica vital de Albion: ¿Puede el jugador correr al ser desmontado?
  // Con montura Courier (Jabalí Fantasma / Oso Polar), la capacidad de carga no desaparece al desmontar.
  // Con montura estándar (Buey / Lagarto), la capacidad de carga del jugador a pie sin montura ronda ~120kg.
  const dismountedBaseCapacityKg = (hasPorkPie ? 120 * 1.30 : 120);
  const isOverburdenedDismounted = selectedMount.isCourierMount
    ? isOverburdenedMounted
    : totalWeightKg > dismountedBaseCapacityKg;

  const canEscapeOnDismount = !isOverburdenedDismounted && selectedEscapeSet.id !== 'naked_transport';

  // 4. Finanzas del Viaje (Llegada Exitosa a Caerleon)
  let marketTaxesSilver = 0;
  if (input.destinationSaleType === 'black_market_buy_order') {
    // Órdenes de compra directas del Mercado Negro no pagan tasa de subasta (0%)
    marketTaxesSilver = 0;
  } else {
    // Subasta normal de Caerleon: Tasa de orden (2.5%) + Impuesto de venta (4% con Premium / 8% sin Premium)
    const taxRate = input.hasPremium ? 0.065 : 0.105;
    marketTaxesSilver = Math.round(totalGrossRevenueCaerleonSilver * taxRate);
  }

  const tripNetProfitSilver = totalGrossRevenueCaerleonSilver - totalCargoCostOriginSilver - marketTaxesSilver;
  const tripRoiPercent = totalCargoCostOriginSilver > 0
    ? Math.round((tripNetProfitSilver / totalCargoCostOriginSilver) * 100)
    : 0;

  // 5. Valor en Riesgo y Pérdida Máxima por Muerte (Full Loot)
  const escapeSetAndMountCostSilver = selectedMount.estimatedPriceSilver + escapeSetCost;
  const totalSilverAtRiskSilver = totalCargoCostOriginSilver + escapeSetAndMountCostSilver;

  const percentOfTotalSilverRisked = totalPlayerSilver > 0
    ? Math.round((totalSilverAtRiskSilver / totalPlayerSilver) * 100)
    : 100;

  // 6. Modelo Estadístico Probabilístico y Valor Esperado (Expected Value - EV)
  // Ajuste de probabilidad de supervivencia según factores de riesgo reales:
  let survivalModifier = 0;

  // Bono por Scout (Explorador adelantado en el mapa siguiente)
  if (input.hasScoutAhead) survivalModifier += 12;

  // Penalización por cantidad de zonas rojas de la ruta
  survivalModifier -= (selectedRoute.redZonesCount - 2) * 3;

  // Penalización severa por hostiles reportados en el mapa
  if (redPksCount > 0) {
    if (redPksCount <= 2) survivalModifier -= 4;
    else if (redPksCount <= 5) survivalModifier -= 15;
    else survivalModifier -= 35; // 6 o más hostiles en zona roja es casi suicidio
  }

  // Si no puede escapar a pie y no es montura courier
  if (!selectedMount.isCourierMount && !input.hasScoutAhead && totalWeightKg > dismountedBaseCapacityKg) {
    survivalModifier -= 10;
  }

  const effectiveSurvivalPercent = Math.max(5, Math.min(99, rawSurvivalInput + survivalModifier));
  const estimatedSurvivalRate = effectiveSurvivalPercent / 100;
  const estimatedDeathRate = 1 - estimatedSurvivalRate;

  // Valor Esperado: (Prob Supervivencia * Ganancia Neta) - (Prob Muerte * Pérdida Total)
  const expectedValueSilver = Math.round(
    (estimatedSurvivalRate * tripNetProfitSilver) - (estimatedDeathRate * totalSilverAtRiskSilver)
  );

  // Umbral de Supervivencia de Equilibrio (Break-Even Survival Rate)
  // Formula: P_break_even = TotalAtRisk / (NetProfit + TotalAtRisk)
  const breakEvenDenominator = tripNetProfitSilver + totalSilverAtRiskSilver;
  const breakEvenSurvivalRate = breakEvenDenominator > 0
    ? Math.min(1, Math.max(0, Math.round((totalSilverAtRiskSilver / breakEvenDenominator) * 1000) / 1000))
    : 1;

  const netSilverPerKg = totalWeightKg > 0
    ? Math.round(tripNetProfitSilver / totalWeightKg)
    : 0;

  // 7. Veredicto de Seguridad y Recomendaciones Tácticas
  const tacticalRecommendations: string[] = [];
  let safetyVerdict: RedZoneTransportResult['safetyVerdict'] = 'PRECAUCION';
  let verdictTitleEs = '';
  let verdictDescriptionEs = '';

  if (rawItems.length === 0 || totalWeightKg === 0) {
    safetyVerdict = 'PRECAUCION';
    verdictTitleEs = '⚠️ Manifiesto de Carga Vacío';
    verdictDescriptionEs = 'No has agregado ningún ítem al cargamento. Agrega ítems manuales o pulsa uno de los lotes rápidos para evaluar el riesgo del viaje.';
    tacticalRecommendations.push('Carga ítems de alta rentabilidad como pociones, comidas encantadas o capas para evaluar el viaje.');
  } else if (isOverburdenedMounted) {
    safetyVerdict = 'MATEMATICAMENTE_INVIABLE';
    verdictTitleEs = '⛔ Sobrecarga Crítica en Montura';
    verdictDescriptionEs = `La carga total (${totalWeightKg.toLocaleString()} kg) excede la capacidad máxima de tu montura (${mountEffectiveCapacityKg.toLocaleString()} kg). No podrás moverte ni salir de la ciudad.`;
    tacticalRecommendations.push('Reduce la cantidad de ítems pesados o utiliza una montura de mayor capacidad (ej. Oso Polar).');
  } else if (expectedValueSilver < 0) {
    safetyVerdict = 'MATEMATICAMENTE_INVIABLE';
    verdictTitleEs = '📉 Valor Esperado Negativo (Pérdida Matemática)';
    verdictDescriptionEs = `Estadísticamente perderás dinero a largo plazo (${expectedValueSilver.toLocaleString()} 🪙 por viaje). El margen de beneficio no compensa el riesgo de muerte con ${redPksCount} hostiles en zona roja.`;
    tacticalRecommendations.push(
      `Necesitas una tasa de supervivencia mínima de ${(breakEvenSurvivalRate * 100).toFixed(1)}% para que este viaje sea rentable. Tu tasa actual estimada es de ${effectiveSurvivalPercent}%.`
    );
  } else if (percentOfTotalSilverRisked > 30) {
    safetyVerdict = 'TEMERARIO';
    verdictTitleEs = '🚨 Gestión de Banca Temeraria';
    verdictDescriptionEs = `Estás arriesgando el ${percentOfTotalSilverRisked}% de todo tu patrimonio líquido (${totalSilverAtRiskSilver.toLocaleString()} 🪙) en un único viaje. Una sola emboscada de gankers te dejará en bancarrota.`;
    tacticalRecommendations.push('Regla de oro de Albion: Nunca arriesgues más del 10% al 15% de tu plata total en un solo transporte por zona roja.');
  } else if (!selectedMount.isCourierMount && totalWeightKg > dismountedBaseCapacityKg && !input.hasScoutAhead) {
    safetyVerdict = 'ALTO_RIESGO';
    verdictTitleEs = '⚠️ Montura Vulnerable sin Carga Pasiva';
    verdictDescriptionEs = `Estás usando ${selectedMount.nameEs}. Si un grupo te desmonta, tu capacidad caerá a ~${dismountedBaseCapacityKg} kg quedando en inmovilidad del 100%+ sin poder correr con tus botas de minero.`;
    tacticalRecommendations.push('Cambia a una montura Courier (Jabalí Fantasma / Oso Polar) o añade un explorador (scout) que vaya una pantalla adelante.');
  } else if (effectiveSurvivalPercent >= (breakEvenSurvivalRate * 100) + 12 && percentOfTotalSilverRisked <= 15) {
    safetyVerdict = 'SEGURO';
    verdictTitleEs = '🛡️ Envío Altamente Rentable y Seguro';
    verdictDescriptionEs = `Valor esperado muy positivo (+${expectedValueSilver.toLocaleString()} 🪙/viaje). El riesgo de banca está controlado (${percentOfTotalSilverRisked}% de tu capital) y la configuración de escape te permite huir.`;
    tacticalRecommendations.push(`Margen excelente: obtienes +${netSilverPerKg.toLocaleString()} 🪙 netos por cada kilo transportado.`);
  } else {
    safetyVerdict = 'PRECAUCION';
    verdictTitleEs = '⚖️ Envío Viable con Precaución';
    verdictDescriptionEs = `El viaje genera valor positivo (+${expectedValueSilver.toLocaleString()} 🪙 EV), pero mantente alerta en los pasos estrechos y evita viajar en horas pico de gankers.`;
  }

  // Recomendaciones tácticas adicionales de Albion
  if (selectedEscapeSet.id === 'naked_transport') {
    tacticalRecommendations.push('⚠️ Vas sin equipo de escape. Equipar un set básico T4.1 cuesta muy poco y multiplica tus probabilidades de salvar la carga.');
  }

  if (redPksCount >= 4) {
    tacticalRecommendations.push(`🚨 Hay ${redPksCount} hostiles activos en la ruta. Espera 10-15 minutos a que se dispersen o cambia a una ruta secundaria.`);
  }

  if (input.hasScoutAhead) {
    tacticalRecommendations.push('👀 Ventaja de Scout activa: El explorador te garantiza inspección previa de puertas y burbujas de protección.');
  }

  return {
    totalWeightKg: Math.round(totalWeightKg * 100) / 100,
    mountEffectiveCapacityKg,
    weightLoadPercent,
    isOverburdenedMounted,
    isOverburdenedDismounted,
    canEscapeOnDismount,
    totalCargoCostOriginSilver,
    totalGrossRevenueCaerleonSilver,
    marketTaxesSilver,
    tripNetProfitSilver,
    tripRoiPercent,
    escapeSetAndMountCostSilver,
    totalSilverAtRiskSilver,
    percentOfTotalSilverRisked,
    estimatedSurvivalRate,
    breakEvenSurvivalRate,
    expectedValueSilver,
    netSilverPerKg,
    sortedCargoBySilverPerKg,
    safetyVerdict,
    verdictTitleEs,
    verdictDescriptionEs,
    tacticalRecommendations,
  };
}
