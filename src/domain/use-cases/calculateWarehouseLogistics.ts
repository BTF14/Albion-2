/**
 * Caso de Uso Puro: Cálculo de Logística de Almacén y Capacidad de Transporte
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inviolable: Función 100% pura y testeable.
 */

import { WarehouseStoredItem, WarehouseLogisticsReport, OFFICIAL_ISLAND_CHESTS } from '../models/warehouseLogistics';
import { TransportMount } from '../models/transport';

export interface CalculateWarehouseInput {
  items: WarehouseStoredItem[];
  selectedMount: TransportMount;
  bagBonusKg?: number; // e.g. 150 kg de bolsa T6
  porkPieBonusPercent?: number; // 30% si come Pastel de Cerdo
}

export function calculateWarehouseLogistics(input: CalculateWarehouseInput): WarehouseLogisticsReport {
  const {
    items,
    selectedMount,
    bagBonusKg = 150,
    porkPieBonusPercent = 30,
  } = input;

  // 1. Acumulados de peso, slots y valor
  let totalWeightKg = 0;
  let totalVolumeSlots = 0;
  let totalEstimatedSilverValue = 0;

  for (const it of items) {
    const qty = Math.max(0, Math.floor(Number(it.quantity) || 0));
    const unitWeight = Math.max(0, Number(it.weightKgPerUnit) || 0.1);
    const unitPrice = Math.max(0, Number(it.estimatedUnitPrice) || 0);

    totalWeightKg += qty * unitWeight;
    // En Albion cada stack de recursos o productos suele ser de hasta 999 unidades por casilla
    totalVolumeSlots += Math.ceil(qty / 999);
    totalEstimatedSilverValue += qty * unitPrice;
  }

  totalWeightKg = Number(totalWeightKg.toFixed(2));

  // 2. Capacidad efectiva de la montura
  const baseCapacity = selectedMount.baseCapacityKg;
  const pieMultiplier = 1 + (porkPieBonusPercent / 100);
  const effectiveMountCapacityKg = Math.round((baseCapacity + bagBonusKg) * pieMultiplier);

  // 3. Viajes requeridos
  const safeCapacity = Math.max(1, effectiveMountCapacityKg);
  const tripsRequired = totalWeightKg === 0 ? 0 : Math.max(1, Math.ceil(totalWeightKg / safeCapacity));
  const remainingOverheadKg = totalWeightKg === 0
    ? effectiveMountCapacityKg
    : Math.max(0, (tripsRequired * safeCapacity) - totalWeightKg);
  const canCarryInOneTrip = totalWeightKg > 0 && totalWeightKg <= effectiveMountCapacityKg;

  // 4. Recomendación de cofres para la isla
  const recommendedChestType = OFFICIAL_ISLAND_CHESTS[2]; // Cofre T5 Experto por defecto
  const recommendedChestCount = totalVolumeSlots === 0 ? 0 : Math.max(1, Math.ceil(totalVolumeSlots / recommendedChestType.slotCapacity));

  let logisticsAdvice = '';
  if (totalWeightKg === 0) {
    logisticsAdvice = 'El almacén está vacío. Agrega tus cosechas o lotes refinados para planificar tus viajes.';
  } else if (canCarryInOneTrip) {
    logisticsAdvice = `¡Carga completa en 1 solo viaje! Tu ${selectedMount.name} soporta perfectamente los ${totalWeightKg.toLocaleString()} kg con un margen de ${Math.round(remainingOverheadKg).toLocaleString()} kg restantes.`;
  } else {
    logisticsAdvice = `Sobrecarga para 1 solo viaje. Necesitas ${tripsRequired} viajes con tu ${selectedMount.name}, o ascender a una montura de mayor porte como un Buey T7/T8 o Mamut de Transporte.`;
  }

  return {
    timestamp: Date.now(),
    itemsCount: items.length,
    totalWeightKg,
    totalVolumeSlots,
    totalEstimatedSilverValue,

    selectedMount,
    effectiveMountCapacityKg,
    tripsRequired,
    remainingOverheadKg,
    canCarryInOneTrip,

    recommendedChestCount,
    recommendedChestType,
    logisticsAdvice,
  };
}
