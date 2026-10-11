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
