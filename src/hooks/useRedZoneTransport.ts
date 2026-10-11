/**
 * Custom Hook: useRedZoneTransport
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Gestiona el estado reactivo, la persistencia en localStorage y la sanitización
 * defensiva para el Planificador de Envíos Masivos y Riesgo de Gankers a Caerleon.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RedZoneTransportInput,
  RedZoneCargoItem,
  RedZoneTransportResult,
  RED_ZONE_MOUNTS,
  PRESET_ESCAPE_SETS,
  RED_ZONE_ROUTES,
} from '../domain/models/redZoneTransport';
import { calculateRedZoneTransport } from '../domain/use-cases/calculateRedZoneTransport';
import { CityId } from '../types';

const STORAGE_KEY = 'albion_red_zone_transport_config_v1';

export const DEFAULT_CARGO_ITEMS: RedZoneCargoItem[] = [
  {
    id: 'poison_potion_t8',
    nameEs: 'Poción de Veneno Mayor T8',
    category: 'potion',
    unitWeightKg: 0.14,
    quantity: 150,
    unitCostOriginSilver: 8200,
    unitPriceCaerleonSilver: 14800,
  },
  {
    id: 'pork_pie_t7_2',
    nameEs: 'Pastel de Cerdo T7.2 (Encantado)',
    category: 'food',
    unitWeightKg: 0.22,
    quantity: 200,
    unitCostOriginSilver: 11500,
    unitPriceCaerleonSilver: 19800,
  },
  {
    id: 'fort_sterling_cape_t6',
    nameEs: 'Capa de Fort Sterling T6.0',
    category: 'equipment',
    unitWeightKg: 1.5,
    quantity: 25,
    unitCostOriginSilver: 62000,
    unitPriceCaerleonSilver: 104000,
  },
  {
    id: 'resistance_potion_t7',
    nameEs: 'Poción de Resistencia Mayor T7',
    category: 'potion',
    unitWeightKg: 0.14,
    quantity: 100,
    unitCostOriginSilver: 7100,
    unitPriceCaerleonSilver: 12900,
  },
];

export const DEFAULT_RED_ZONE_CONFIG: RedZoneTransportInput = {
  routeId: 'martlock_to_caerleon',
  originCityId: 'martlock',
  mountId: 'spectral_direboar', // Jabalí Fantasma (Courier + Invisibilidad)
  escapeSetId: 'meta_escape_set',
  customEscapeCostSilver: 0,
  cargoItems: DEFAULT_CARGO_ITEMS,
  estimatedSurvivalPercent: 95,
  hasScoutAhead: false,
  redPksReportedCount: 1,
  totalPlayerSilverReserve: 25000000, // 25 Millones de banca de ejemplo
  hasEatenPorkPie: true,
  destinationSaleType: 'black_market_buy_order',
  hasPremium: true,
};

function sanitizeCargoItem(raw: unknown): RedZoneCargoItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const id = typeof obj.id === 'string' ? obj.id.replace(/[^\w-]/g, '') : `item_${Date.now()}`;
  const nameEs = typeof obj.nameEs === 'string' ? obj.nameEs.slice(0, 80) : 'Ítem Desconocido';
  const category = ['food', 'potion', 'equipment', 'material', 'mount', 'custom'].includes(String(obj.category))
    ? (obj.category as RedZoneCargoItem['category'])
    : 'custom';

  const unitWeightKg = Math.max(0.01, Math.min(500, Number(obj.unitWeightKg) || 0.5));
  const quantity = Math.max(1, Math.min(100000, Math.floor(Number(obj.quantity) || 1)));
  const unitCostOriginSilver = Math.max(0, Math.min(500000000, Number(obj.unitCostOriginSilver) || 0));
  const unitPriceCaerleonSilver = Math.max(0, Math.min(500000000, Number(obj.unitPriceCaerleonSilver) || 0));

  return {
    id,
    nameEs,
    category,
    unitWeightKg,
    quantity,
    unitCostOriginSilver,
    unitPriceCaerleonSilver,
  };
}

function sanitizeConfig(raw: unknown): RedZoneTransportInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_RED_ZONE_CONFIG;
  }
  const obj = raw as Record<string, unknown>;

  const routeId = RED_ZONE_ROUTES.some((r) => r.id === obj.routeId)
    ? String(obj.routeId)
    : DEFAULT_RED_ZONE_CONFIG.routeId;

  const mountId = RED_ZONE_MOUNTS.some((m) => m.id === obj.mountId)
    ? String(obj.mountId)
    : DEFAULT_RED_ZONE_CONFIG.mountId;

  const escapeSetId = PRESET_ESCAPE_SETS.some((s) => s.id === obj.escapeSetId)
    ? String(obj.escapeSetId)
    : DEFAULT_RED_ZONE_CONFIG.escapeSetId;

  let cargoItems: RedZoneCargoItem[] = DEFAULT_CARGO_ITEMS;
  if (Array.isArray(obj.cargoItems)) {
    const valid = obj.cargoItems
      .map(sanitizeCargoItem)
      .filter((i): i is RedZoneCargoItem => i !== null);
    if (valid.length > 0) cargoItems = valid;
  }

  return {
    routeId,
    originCityId: (obj.originCityId as CityId) || 'martlock',
    mountId,
    escapeSetId,
    customEscapeCostSilver: Math.max(0, Number(obj.customEscapeCostSilver) || 0),
    cargoItems,
    estimatedSurvivalPercent: Math.max(1, Math.min(99, Number(obj.estimatedSurvivalPercent) || 95)),
    hasScoutAhead: Boolean(obj.hasScoutAhead),
    redPksReportedCount: Math.max(0, Math.min(50, Math.floor(Number(obj.redPksReportedCount) || 0))),
    totalPlayerSilverReserve: Math.max(0, Number(obj.totalPlayerSilverReserve) || 25000000),
    hasEatenPorkPie: typeof obj.hasEatenPorkPie === 'boolean' ? obj.hasEatenPorkPie : true,
    destinationSaleType: obj.destinationSaleType === 'caerleon_market_sell_order'
      ? 'caerleon_market_sell_order'
      : 'black_market_buy_order',
    hasPremium: typeof obj.hasPremium === 'boolean' ? obj.hasPremium : true,
  };
}

export function useRedZoneTransport(initialOriginCityId?: CityId) {
  const [config, setConfig] = useState<RedZoneTransportInput>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sanitized = sanitizeConfig(parsed);
        if (initialOriginCityId) {
          sanitized.originCityId = initialOriginCityId;
          const matchingRoute = RED_ZONE_ROUTES.find((r) => r.originCityId === initialOriginCityId);
          if (matchingRoute) sanitized.routeId = matchingRoute.id;
        }
        return sanitized;
      }
    } catch {
      // Fallback seguro
    }
    const def = { ...DEFAULT_RED_ZONE_CONFIG };
    if (initialOriginCityId) {
      def.originCityId = initialOriginCityId;
      const matchingRoute = RED_ZONE_ROUTES.find((r) => r.originCityId === initialOriginCityId);
      if (matchingRoute) def.routeId = matchingRoute.id;
    }
    return def;
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
      // Manejo silencioso de cuotas
    }
  }, [config]);

  // Actualizar configuración
  const updateConfig = useCallback((changes: Partial<RedZoneTransportInput>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...changes };
      // Si cambia la ciudad de origen, ajustar la ruta predeterminada correspondiente
      if (changes.originCityId && changes.originCityId !== prev.originCityId) {
        const matchingRoute = RED_ZONE_ROUTES.find((r) => r.originCityId === changes.originCityId);
        if (matchingRoute) {
          updated.routeId = matchingRoute.id;
        }
      }
      return updated;
    });
  }, []);

  // Agregar nuevo ítem a la carga
  const addCargoItem = useCallback((item: Omit<RedZoneCargoItem, 'id'>) => {
    const newItem: RedZoneCargoItem = {
      ...item,
      id: `cargo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setConfig((prev) => ({
      ...prev,
      cargoItems: [...prev.cargoItems, newItem],
    }));
  }, []);

  // Actualizar un ítem de la carga
  const updateCargoItem = useCallback((id: string, changes: Partial<RedZoneCargoItem>) => {
    setConfig((prev) => ({
      ...prev,
      cargoItems: prev.cargoItems.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }));
  }, []);

  // Eliminar un ítem de la carga
  const removeCargoItem = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      cargoItems: prev.cargoItems.filter((item) => item.id !== id),
    }));
  }, []);

  // Cargar lotes predefinidos de alta rentabilidad
  const loadPresetBatch = useCallback((batchType: 'potions' | 'food' | 'capes' | 'black_market_weapons') => {
    let items: RedZoneCargoItem[] = [];
    if (batchType === 'potions') {
      items = [
        { id: `pot_${Date.now()}_1`, nameEs: 'Poción de Veneno Mayor T8', category: 'potion', unitWeightKg: 0.14, quantity: 200, unitCostOriginSilver: 8500, unitPriceCaerleonSilver: 15200 },
        { id: `pot_${Date.now()}_2`, nameEs: 'Poción de Salud Mayor T7', category: 'potion', unitWeightKg: 0.14, quantity: 300, unitCostOriginSilver: 4200, unitPriceCaerleonSilver: 7600 },
        { id: `pot_${Date.now()}_3`, nameEs: 'Poción de Invisibilidad T8', category: 'potion', unitWeightKg: 0.14, quantity: 80, unitCostOriginSilver: 18000, unitPriceCaerleonSilver: 29500 },
        { id: `pot_${Date.now()}_4`, nameEs: 'Poción de Resistencia Mayor T7', category: 'potion', unitWeightKg: 0.14, quantity: 150, unitCostOriginSilver: 6800, unitPriceCaerleonSilver: 12400 },
      ];
    } else if (batchType === 'food') {
      items = [
        { id: `food_${Date.now()}_1`, nameEs: 'Pastel de Cerdo T7.2', category: 'food', unitWeightKg: 0.22, quantity: 250, unitCostOriginSilver: 11000, unitPriceCaerleonSilver: 19500 },
        { id: `food_${Date.now()}_2`, nameEs: 'Tortilla de Cerdo T7.1', category: 'food', unitWeightKg: 0.22, quantity: 300, unitCostOriginSilver: 7800, unitPriceCaerleonSilver: 13900 },
        { id: `food_${Date.now()}_3`, nameEs: 'Guiso de Ternera T8.1', category: 'food', unitWeightKg: 0.25, quantity: 180, unitCostOriginSilver: 14500, unitPriceCaerleonSilver: 24800 },
      ];
    } else if (batchType === 'capes') {
      items = [
        { id: `cape_${Date.now()}_1`, nameEs: 'Capa de Fort Sterling T6.0', category: 'equipment', unitWeightKg: 1.5, quantity: 30, unitCostOriginSilver: 65000, unitPriceCaerleonSilver: 108000 },
        { id: `cape_${Date.now()}_2`, nameEs: 'Capa de Thetford T7.0', category: 'equipment', unitWeightKg: 1.6, quantity: 20, unitCostOriginSilver: 115000, unitPriceCaerleonSilver: 189000 },
        { id: `cape_${Date.now()}_3`, nameEs: 'Capa de Caerleon T6.1', category: 'equipment', unitWeightKg: 1.5, quantity: 15, unitCostOriginSilver: 140000, unitPriceCaerleonSilver: 235000 },
      ];
    } else {
      items = [
        { id: `bm_${Date.now()}_1`, nameEs: 'Hacha de Guerra T6.1 Excelente', category: 'equipment', unitWeightKg: 3.5, quantity: 12, unitCostOriginSilver: 85000, unitPriceCaerleonSilver: 165000 },
        { id: `bm_${Date.now()}_2`, nameEs: 'Arco de Guerra T7.0', category: 'equipment', unitWeightKg: 2.8, quantity: 15, unitCostOriginSilver: 95000, unitPriceCaerleonSilver: 178000 },
        { id: `bm_${Date.now()}_3`, nameEs: 'Chaqueta de Asesino T6.1', category: 'equipment', unitWeightKg: 2.5, quantity: 20, unitCostOriginSilver: 72000, unitPriceCaerleonSilver: 138000 },
      ];
    }
    setConfig((prev) => ({
      ...prev,
      cargoItems: items,
    }));
  }, []);

  // Importar desde los ítems del almacén si existen
  const importFromWarehouse = useCallback(() => {
    try {
      const stored = localStorage.getItem('albion_warehouse_stored_items_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: RedZoneCargoItem[] = parsed.slice(0, 15).map((w, idx) => ({
            id: `wh_${Date.now()}_${idx}`,
            nameEs: String(w.nameEs || 'Ítem de Almacén'),
            category: 'material',
            unitWeightKg: Math.max(0.1, Number(w.weightKgPerUnit) || 1),
            quantity: Math.max(1, Number(w.quantity) || 1),
            unitCostOriginSilver: 5000,
            unitPriceCaerleonSilver: 8500,
          }));
          setConfig((prev) => ({ ...prev, cargoItems: mapped }));
          return mapped.length;
        }
      }
    } catch {
      // Ignorar errores
    }
    return 0;
  }, []);

  // Restablecer por defecto
  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_RED_ZONE_CONFIG);
  }, []);

  // Resultado del cálculo puramente memoizado
  const result: RedZoneTransportResult = useMemo(() => {
    return calculateRedZoneTransport(config);
  }, [config]);

  const currentRoute = useMemo(() => {
    return RED_ZONE_ROUTES.find((r) => r.id === config.routeId) || RED_ZONE_ROUTES[0];
  }, [config.routeId]);

  const currentMount = useMemo(() => {
    return RED_ZONE_MOUNTS.find((m) => m.id === config.mountId) || RED_ZONE_MOUNTS[0];
  }, [config.mountId]);

  const currentEscapeSet = useMemo(() => {
    return PRESET_ESCAPE_SETS.find((s) => s.id === config.escapeSetId) || PRESET_ESCAPE_SETS[0];
  }, [config.escapeSetId]);

  return {
    config,
    updateConfig,
    addCargoItem,
    updateCargoItem,
    removeCargoItem,
    loadPresetBatch,
    importFromWarehouse,
    resetToDefaults,
    result,
    currentRoute,
    currentMount,
    currentEscapeSet,
    routes: RED_ZONE_ROUTES,
    mounts: RED_ZONE_MOUNTS,
    escapeSets: PRESET_ESCAPE_SETS,
  };
}
