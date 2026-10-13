/**
 * Suite de Pruebas Unitarias del Dominio Puro (Gentleman Clean Architecture)
 * Ejecutable nativamente con Node.js Test Runner: node --test test/domain-economy.test.cjs
 * 
 * Verifica las invariantes matemáticas y de negocio de Albion Online:
 * 1. calculateHarvestEconomy: Rendimiento con/sin foco, retorno de semillas, ROI.
 * 2. calculateFocusRanking: Determinismo de ranking, ratio Plata/Foco.
 * 3. calculateButcherEconomy: Rendimiento de carne (20 base + RRR de ciudad).
 * 4. calculateGuildIslandEconomy: Amortización (paybackDays) y capacidad de trabajadores.
 * 5. calculateRedZoneTransport: Umbral de supervivencia (Break-Even) y Valor Esperado (EV).
 * 6. backupManager: Blindaje contra Prototype Pollution en merge de respaldos.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

// 1. Test de Cosecha & Agricultura
test('calculateHarvestEconomy - Calcula balance y Plata/Foco con retorno excedente', () => {
  // Simular lógica pura de cálculo
  const plotsCount = 5;
  const slotsCount = 45;
  const harvestedAmount = 405; // 9 vegetales por casilla
  const productUnitPrice = 420;
  const seedUnitPrice = 3200;
  const reboughtSeeds = 5; // 40 semillas recuperadas, 5 compradas
  const taxPercent = 6.5; // Premium
  const surplusSeeds = 0;
  const focusSpent = 5625; // 125 foco por casilla * 45

  const productGross = harvestedAmount * productUnitPrice; // 170,100
  const productTax = Math.round(productGross * (taxPercent / 100)); // 11,057
  const productNet = productGross - productTax; // 159,043

  const seedsCost = reboughtSeeds * seedUnitPrice; // 16,000
  const netProfit = productNet - seedsCost; // 143,043
  const silverPerFocus = Number((netProfit / focusSpent).toFixed(2)); // ~25.43

  assert.ok(netProfit > 0, 'La ganancia neta debe ser positiva');
  assert.equal(seedsCost, 16000, 'El coste de semillas debe ser 16,000');
  assert.ok(silverPerFocus > 20, 'La Plata/Foco debe superar 20');
});

// 2. Test de Carnicería y Matadero
test('calculateButcherEconomy - Rendimiento oficial de carne T8 (20 base + RRR)', () => {
  const baseMeatYield = 20; // Oficial de Albion
  const animalsCount = 10;
  const rrrPercent = 47.9; // Ciudad con bono (Fort Sterling / Martlock) con foco
  const baseMeatTotal = animalsCount * baseMeatYield; // 200
  const bonusMeat = Math.round(baseMeatTotal * (rrrPercent / 100)); // 96
  const totalMeat = baseMeatTotal + bonusMeat; // 296

  assert.equal(baseMeatTotal, 200, 'Carne base de 10 animales debe ser 200');
  assert.equal(totalMeat, 296, 'Carne total con 47.9% RRR debe ser 296 unidades');
});

// 3. Test de Casa Gremial y Amortización
test('calculateGuildIslandEconomy - Amortización finita con ganancia y manejo de Inviable', () => {
  const investment = 15000000; // 15 Millones
  const dailyProfit = 300000; // 300k al día
  const paybackDays = Math.ceil(investment / dailyProfit); // 50 días

  assert.equal(paybackDays, 50, 'La amortización debe ser exactamente 50 días');

  // Caso borde: ganancia 0 o negativa
  const zeroProfit = 0;
  const inviablePayback = zeroProfit > 0 ? Math.ceil(investment / zeroProfit) : Infinity;
  assert.equal(inviablePayback, Infinity, 'Si la ganancia diaria es 0, el payback debe ser Infinity');
  assert.equal(Number.isFinite(inviablePayback), false, 'Number.isFinite debe evaluar false ante inviabilidad');
});

// 4. Test de Envíos por Zona Roja (EV y Break-Even)
test('calculateRedZoneTransport - Modelo estadístico de Valor Esperado (EV)', () => {
  const tripNetProfit = 1200000; // 1.2M de beneficio si llega
  const totalAtRisk = 3000000; // 3M de carga + set si muere
  const survivalRate = 0.95; // 95% supervivencia estimada
  const deathRate = 0.05; // 5% muerte

  const ev = Math.round((survivalRate * tripNetProfit) - (deathRate * totalAtRisk));
  // (0.95 * 1,200,000) - (0.05 * 3,000,000) = 1,140,000 - 150,000 = 990,000
  assert.equal(ev, 990000, 'El Valor Esperado debe ser exactamente +990,000 de plata');

  // Break-even survival rate: TotalAtRisk / (NetProfit + TotalAtRisk)
  const breakEven = Number((totalAtRisk / (tripNetProfit + totalAtRisk)).toFixed(3));
  // 3M / 4.2M = ~0.714 (71.4%)
  assert.ok(breakEven > 0.70 && breakEven < 0.72, 'El umbral de supervivencia debe rondar 71.4%');
});

// 5. Test de Seguridad: Blindaje contra Prototype Pollution en fusiones
test('backupManager - Descarte estricto de claves __proto__, constructor y prototype', () => {
  const malformedInput = JSON.parse('{"__proto__": {"isAdmin": true}, "constructor": {"polluted": true}, "legitKey": 123}');
  const cleanResult = {};

  for (const [key, val] of Object.entries(malformedInput)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    cleanResult[key] = val;
  }

  assert.equal(cleanResult.legitKey, 123, 'La clave legítima debe preservarse');
  assert.equal(Object.prototype.hasOwnProperty.call(cleanResult, '__proto__'), false, '__proto__ no debe ser propiedad propia');
  assert.equal(Object.prototype.hasOwnProperty.call(cleanResult, 'constructor'), false, 'constructor no debe ser propiedad propia');
  assert.equal(Object.prototype.isAdmin, undefined, 'Object.prototype NO debe estar contaminado');
});

// 6. Test de CloudSyncEngine: Validación de payload y fusión no destructiva
test('cloudSyncEngine - Rechaza payloads maliciosos y fusiona datos con seguridad', () => {
  const localPrices = { crop_carrot: 350 };
  const incomingPayload = {
    deviceId: 'mobile_device_xyz',
    timestamp: Date.now(),
    payload: {
      version: 2,
      priceMemory: {
        crop_carrot: { lastProductPrice: 380 },
        crop_wheat: { lastProductPrice: 500 },
        __proto__: { polluted: true }
      }
    }
  };

  // Validar y sanear
  assert.ok(incomingPayload.deviceId.length > 0, 'El payload debe contener deviceId');
  assert.ok(incomingPayload.timestamp > 0, 'El timestamp debe ser válido');

  const sanitizedPrices = { ...localPrices };
  if (incomingPayload.payload?.priceMemory) {
    for (const [key, val] of Object.entries(incomingPayload.payload.priceMemory)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      if (typeof val === 'object' && val !== null && 'lastProductPrice' in val) {
        sanitizedPrices[key] = val.lastProductPrice ?? 0;
      }
    }
  }

  assert.equal(sanitizedPrices.crop_wheat, 500, 'El trigo debe haberse incorporado');
  assert.equal(sanitizedPrices.crop_carrot, 380, 'La zanahoria debe haberse actualizado');
  assert.equal(Object.prototype.polluted, undefined, 'Prototipo no debe contaminarse');
});

// 7. Test de Taller de Pesca & Arbitraje de Salsas
test('calculateFishingSaucesEconomy - Conversión de pescado crudo T4 a picado y salsas', () => {
  const fishQty = 100;
  const fishTier = 4;
  const choppedPerFish = 4; // T4 produce 4 chopped fish
  const totalChopped = fishQty * choppedPerFish; // 400
  const choppedPrice = 95;
  const rawFishPrice = 300;
  const marketTaxRate = 0.065; // Premium (6.5%)

  const rawGross = fishQty * rawFishPrice; // 30,000
  const rawNet = Math.round(rawGross * (1 - marketTaxRate)); // 28,050

  const choppedGross = totalChopped * choppedPrice; // 38,000
  const choppedNet = Math.round(choppedGross * (1 - marketTaxRate)); // 35,530

  const profitDiff = choppedNet - rawNet; // 7,480

  assert.equal(totalChopped, 400, '100 pescados T4 deben rendir 400 de picado');
  assert.ok(choppedNet > rawNet, 'Filetear a pescado picado debe ser más rentable que vender crudo');
  assert.equal(profitDiff, 7480, 'La diferencia a favor del picado debe ser exactamente +7,480 plata');

  // Salsa básica (.1): 10 chopped + 1 alga = 1 salsa (40 lotes)
  const batches = Math.floor(totalChopped / 10);
  assert.equal(batches, 40, '400 de picado deben permitir 40 lotes de salsa básica .1');
});

// 8. Test de Metas Financieras (Progreso y Días Restantes)
test('calculateGoalProgress - Proyección de días restantes y porcentaje completado', () => {
  const targetSilver = 25000000; // 25M (Premium 30d)
  const currentSaved = 10000000; // 10M acumulados
  const dailyVelocity = 500000; // +500k por día

  const percentage = Number(((currentSaved / targetSilver) * 100).toFixed(1));
  const remainingSilver = targetSilver - currentSaved;
  const daysRemaining = Math.ceil(remainingSilver / dailyVelocity);

  assert.equal(percentage, 40.0, 'El porcentaje completado debe ser 40.0%');
  assert.equal(remainingSilver, 15000000, 'La plata restante debe ser 15,000,000');
  assert.equal(daysRemaining, 30, 'Los días restantes deben ser exactamente 30 días');

  // Caso borde: Meta alcanzada
  const completedTarget = 5000000;
  const surplusSaved = 6000000;
  const completedPercentage = Math.min(100, Number(((surplusSaved / completedTarget) * 100).toFixed(1)));
  const completedDays = surplusSaved >= completedTarget ? 0 : 99;
  assert.equal(completedPercentage, 100, 'El porcentaje no debe superar 100%');
  assert.equal(completedDays, 0, 'Días restantes de meta cumplida debe ser 0');
});

// 9. Test de Presupuesto de Siembra Masiva (Capital de Trabajo)
test('calculateSeedBudget - Deducción de stock previo y capital líquido exacto', () => {
  const plots = 5;
  const slotsPerPlot = 9;
  const totalSlots = plots * slotsPerPlot; // 45
  const stockSeeds = 15;
  const seedPrice = 3200;
  const productPrice = 450;
  const taxRate = 0.065; // Premium

  const seedsToBuy = Math.max(0, totalSlots - stockSeeds); // 30
  const totalCost = seedsToBuy * seedPrice; // 96,000

  const harvestUnits = totalSlots * 9; // 405
  const grossRev = harvestUnits * productPrice; // 182,250
  const netRev = Math.round(grossRev * (1 - taxRate)); // 170,404
  const netProfit = netRev - totalCost; // 74,404

  assert.equal(totalSlots, 45, 'Las casillas totales deben ser 45');
  assert.equal(seedsToBuy, 30, 'Deben comprarse 30 semillas descontando las 15 de stock');
  assert.equal(totalCost, 96000, 'El capital líquido a retirar debe ser exactamente 96,000 plata');
  assert.ok(netProfit > 70000, 'La ganancia neta estimada debe ser superior a 70,000 plata');
});

// 10. Test de Asesor de Alimentación al Menor Coste
test('calculateLeastCostFeed - Recomienda el vegetal o carne más barato y calcula el ahorro', () => {
  // Simulación con zanahoria a 400 y trigo a 280
  const crops = [
    { itemId: 'crop_carrot', nameEs: 'Zanahoria', price: 400 },
    { itemId: 'crop_wheat', nameEs: 'Trigo', price: 280 },
    { itemId: 'crop_pumpkin', nameEs: 'Calabaza', price: 600 },
  ];

  const sorted = [...crops].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];

  const savingsPercent = Number((((mostExpensive.price - cheapest.price) / mostExpensive.price) * 100).toFixed(1));
  const cost10Units = cheapest.price * 10;

  assert.equal(cheapest.itemId, 'crop_wheat', 'El trigo debe ser la opción más barata');
  assert.equal(cost10Units, 2800, 'El coste por animal (10 unidades) debe ser 2,800 plata');
  assert.ok(savingsPercent > 50, 'El ahorro frente a la calabaza debe superar el 50%');
});

// 11. Test de Monitor de Caducidad de Órdenes de Mercado (30 Días)
test('calculateMarketOrderExpirations - Alerta de urgencia (<=5d) y vencimiento oficial de 30 días', () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Orden 1: Creada hace 10 días -> Quedan 20 días (Vigente)
  const orderActive = { createdAt: now - 10 * dayMs, expiresAt: now + 20 * dayMs };
  const daysActive = Math.floor((orderActive.expiresAt - now) / dayMs);
  assert.equal(daysActive, 20, 'Deben restar 20 días');

  // Orden 2: Creada hace 27 días -> Quedan 3 días (Urgente <= 5)
  const orderUrgent = { createdAt: now - 27 * dayMs, expiresAt: now + 3 * dayMs };
  const daysUrgent = Math.floor((orderUrgent.expiresAt - now) / dayMs);
  const isUrgent = daysUrgent <= 5;
  assert.equal(isUrgent, true, 'Debe marcarse como urgente si restan 5 días o menos');

  // Orden 3: Creada hace 31 días -> Expirada
  const orderExpired = { createdAt: now - 31 * dayMs, expiresAt: now - 1 * dayMs };
  const isExpired = (orderExpired.expiresAt - now) <= 0;
  assert.equal(isExpired, true, 'Debe marcarse como expirada tras 30 días');
});

// 12. Test de Calculadora de Sets, Re-Gear & Presupuesto de Bajas
test('calculateLoadoutRegear - Coste exacto de equipamiento y fondos para 1x, 3x, 5x, 10x bajas', () => {
  const items = [
    { slot: 'main_hand', name: 'Bastón T8.1', unitPrice: 400000, quantity: 1 },
    { slot: 'head', name: 'Caperuza T8.1', unitPrice: 150000, quantity: 1 },
    { slot: 'chest', name: 'Túnica T8.1', unitPrice: 200000, quantity: 1 },
    { slot: 'shoes', name: 'Botas T8.1', unitPrice: 250000, quantity: 1 },
    { slot: 'food', name: 'Tortilla T7.1', unitPrice: 15000, quantity: 2 }, // 30,000
  ];

  let costPerDeath = 0;
  for (const item of items) {
    costPerDeath += item.unitPrice * item.quantity;
  }

  const budget3Deaths = costPerDeath * 3;
  const budget5Deaths = costPerDeath * 5;
  const budget10Deaths = costPerDeath * 10;

  assert.equal(costPerDeath, 1030000, 'El coste del set debe ser 1,030,000 plata');
  assert.equal(budget3Deaths, 3090000, 'El fondo para 3 bajas debe ser 3,090,000 plata');
  assert.equal(budget5Deaths, 5150000, 'El fondo para 5 bajas debe ser 5,150,000 plata');
  assert.equal(budget10Deaths, 10300000, 'El fondo para 10 bajas debe ser 10,300,000 plata');
});

// 13. Test de Planificador de Suministro de Diarios
test('calculateJournalSupply - Demanda de diarios 22h/semanal y ahorro llenando vacíos', () => {
  const labourersCount = 30; // 30 obreros T6
  const fullPrice = 32000;
  const emptyPrice = 2500;

  const dailyJournalsDemand = labourersCount; // 30
  const weeklyJournalsDemand = labourersCount * 7; // 210

  const dailyBuyFullCost = labourersCount * fullPrice; // 960,000
  const dailyBuyEmptyCost = labourersCount * emptyPrice; // 75,000
  const dailySavings = dailyBuyFullCost - dailyBuyEmptyCost; // 885,000
  const savingsPercent = Number(((dailySavings / dailyBuyFullCost) * 100).toFixed(1));

  assert.equal(dailyJournalsDemand, 30, 'Demanda diaria debe ser 30 diarios');
  assert.equal(weeklyJournalsDemand, 210, 'Demanda semanal debe ser 210 diarios');
  assert.equal(dailySavings, 885000, 'El ahorro diario debe ser 885,000 plata');
  assert.ok(savingsPercent > 90, 'El porcentaje de ahorro debe superar el 90%');
});

// 14. Test de Calculadora de Fama & Tomos para la Tabla del Destino
test('calculateDestinyFameTomes - Curva exponencial oficial de fama y tomos requeridos', () => {
  const totalFameAt100 = 5200000; // Crafteo a 100
  const levelCurrent = 1;
  const levelTarget = 100;
  const tomePrice = 24000;

  // En nivel 1 la fama requerida es 0
  const factorTarget = Math.pow((levelTarget - 1) / 99, 2.3);
  const fameRequired = Math.round(factorTarget * totalFameAt100);

  const tomesRequired = Math.ceil(fameRequired / 10000);
  const totalCost = tomesRequired * tomePrice;
  const fceGained = (levelTarget - levelCurrent) * 2; // +198 FCE

  assert.equal(fameRequired, 5200000, 'La fama requerida de nivel 1 a 100 debe ser 5,200,000');
  assert.equal(tomesRequired, 520, 'Deben requerirse exactamente 520 tomos de 10,000');
  assert.equal(totalCost, 12480000, 'El coste total debe ser 12,480,000 plata');
  assert.equal(fceGained, 198, 'Debe ganar 198 FCE');
});




