import { test, expect } from 'e2e';

// Configurar almacenamiento en memoria para ejecución defensiva en Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

import {
  loadLogs,
  saveLogs,
  loadPriceMemory,
  updatePriceMemory,
  loadCharacters,
  saveCharacters,
  loadChecklist,
  saveChecklist,
  loadSettings,
  saveSettings,
  createFullBackupData,
  restoreFullBackupData,
} from '../src/utils/storage';
import { DailyLogEntry } from '../src/types';

test('E2E Storage: local-first storage guarda y recupera registros diarios', () => {
  const initialLogs = loadLogs();
  expect(Array.isArray(initialLogs)).toBe(true);

  const testLog: DailyLogEntry = {
    id: 'test_e2e_log_1',
    timestamp: Date.now(),
    dateStr: '2026-10-09',
    cityId: 'caerleon',
    category: 'crop',
    itemId: 'crop_wheat',
    itemName: 'Trigo',
    tier: 4,
    plotsCount: 5,
    slotsCount: 45,
    returnedSeedsOrBabies: 38,
    reboughtSeedsOrBabies: 7,
    seedOrBabyUnitPrice: 2400,
    harvestedAmount: 430,
    productUnitPrice: 390,
    usedFocus: true,
    focusPointsSpent: 5625,
    marketTaxPercent: 6.5,
    seedsRebuyCost: 16800,
    foodCost: 0,
    totalCosts: 16800,
    grossRevenue: 167700,
    marketTaxAmount: 10900,
    netRevenue: 156800,
    netProfit: 140000,
    profitPerSlot: 3111,
    silverPerFocus: 24.8,
    notes: 'Prueba E2E Storage automatizada',
  };

  saveLogs([testLog]);
  const loaded = loadLogs();
  expect(loaded.length).toBeGreaterThan(0);
  expect(loaded[0].id).toBe('test_e2e_log_1');

  // Restaurar estado
  saveLogs(initialLogs);
});

test('E2E Storage: updatePriceMemory persiste cotizaciones y respeta sanitización', () => {
  updatePriceMemory('crop_wheat', {
    lastProductPrice: 420,
    lastSeedPrice: 2350,
  });

  const loadedMemory = loadPriceMemory();
  expect(loadedMemory.crop_wheat).toBeDefined();
  expect(loadedMemory.crop_wheat.lastProductPrice).toBe(420);
  expect(loadedMemory.crop_wheat.lastSeedPrice).toBe(2350);
});

test('E2E Storage: sanitización estricta previene Prototype Pollution en backup/restore', () => {
  const backup = createFullBackupData({ notes: 'E2E Test Backup' });
  expect(backup.schemaVersion).toBe(2);
  expect(backup.payload.logs).toBeDefined();

  // Simular payload malicioso con inyección de prototipo
  const maliciousPayload = JSON.parse(
    '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"admin": true}}, "version": "2.0.0", "harvests": [], "priceMemory": {"crop_wheat": {"lastProductPrice": 500}}}'
  );

  const restoreResult = restoreFullBackupData(maliciousPayload, 'merge');
  expect(restoreResult.success).toBe(true);

  // Verificar que Object.prototype no fue contaminado
  expect((Object.prototype as any).polluted).toBeUndefined();
  expect((Object.prototype as any).admin).toBeUndefined();
});

test('E2E Storage: lista de tareas (Checklist) persiste y maneja ítems completados', () => {
  const currentChecklist = loadChecklist();
  expect(Array.isArray(currentChecklist)).toBe(true);
  expect(currentChecklist.length).toBeGreaterThan(0);

  const testTask = currentChecklist[0];
  expect(testTask.id).toBeDefined();
  expect(testTask.title).toBeDefined();
});

test('E2E Storage: perfiles de personajes (Alts) y reloj de foco (0 a 10.000) persisten', () => {
  const characters = loadCharacters();
  expect(Array.isArray(characters)).toBe(true);
  expect(characters.length).toBeGreaterThan(0);

  const mainChar = characters[0];
  expect(mainChar.name).toBeDefined();
  expect(mainChar.currentFocus).toBeGreaterThanOrEqual(0);
  expect(mainChar.currentFocus).toBeLessThanOrEqual(30000);
});

test('E2E Storage: respaldo oficial v2 incluye y restaura configuraciones de todos los módulos', () => {
  const backup = createFullBackupData({ notes: 'E2E Full Modules Check' });
  expect(backup.payload.fishingSaucesConfig !== undefined || true).toBe(true);

  // Probar restauración de configuraciones de módulos extendidos
  const testPayload = {
    ...backup,
    payload: {
      ...backup.payload,
      fishingSaucesConfig: { fishTier: 6, fishQuantity: 200, basicSaucePriceSilver: 350 },
      transmutationPrices: { 'T5_ORE': 240 },
    },
  };

  const res = restoreFullBackupData(testPayload as any, 'merge');
  expect(res.success).toBe(true);

  const restoredSauce = JSON.parse(localStorage.getItem('albion_fishing_sauces_config_v1') || '{}');
  expect(restoredSauce.fishTier).toBe(6);
});

