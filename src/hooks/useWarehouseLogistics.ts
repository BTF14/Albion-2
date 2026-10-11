import { useState, useMemo, useEffect, useCallback } from 'react';
import { WarehouseStoredItem, WarehouseLogisticsReport } from '../domain/models/warehouseLogistics';
import { TRANSPORT_MOUNTS, TransportMount } from '../domain/models/transport';
import { calculateWarehouseLogistics } from '../domain/use-cases/calculateWarehouseLogistics';

const STORAGE_KEY_WAREHOUSE_ITEMS = 'albion_warehouse_stored_items_v1';
const STORAGE_KEY_WAREHOUSE_MOUNT_ID = 'albion_warehouse_mount_id_v1';

const DEFAULT_ITEMS: WarehouseStoredItem[] = [
  { id: 'wh_crop_wheat', nameEs: 'Trigo Cosechado (T4)', category: 'crop', quantity: 1800, weightKgPerUnit: 0.1, estimatedUnitPrice: 380 },
  { id: 'wh_bar_metal_t5', nameEs: 'Lingotes de Metal T5', category: 'refined_resource', quantity: 450, weightKgPerUnit: 0.8, estimatedUnitPrice: 1850 },
  { id: 'wh_mount_ox_t4', nameEs: 'Bueyes Ensillados T4', category: 'mount', quantity: 6, weightKgPerUnit: 45.0, estimatedUnitPrice: 32000 },
];

function sanitizeWarehouseItems(raw: unknown): WarehouseStoredItem[] {
  if (!Array.isArray(raw)) return DEFAULT_ITEMS;
  const clean: WarehouseStoredItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== 'object') continue;
    const safeObj = it as Record<string, unknown>;
    const id = typeof safeObj.id === 'string' && safeObj.id ? safeObj.id.replace(/[^\w-]/g, '') : `wh_${Date.now()}_${clean.length}`;
    const nameEs = typeof safeObj.nameEs === 'string' ? safeObj.nameEs.slice(0, 100) : 'Ítem Desconocido';
    const quantity = Math.max(0, Math.floor(Number(safeObj.quantity) || 0));
    const weightKgPerUnit = Math.max(0.01, Number(safeObj.weightKgPerUnit) || 0.1);
    const estimatedUnitPrice = Math.max(0, Math.floor(Number(safeObj.estimatedUnitPrice) || 0));
    const category = typeof safeObj.category === 'string' ? (safeObj.category as WarehouseStoredItem['category']) : 'other';

    clean.push({
      id,
      nameEs,
      category,
      quantity,
      weightKgPerUnit,
      estimatedUnitPrice,
    });
  }
  return clean.length > 0 ? clean : DEFAULT_ITEMS;
}

export function useWarehouseLogistics() {
  const [items, setItems] = useState<WarehouseStoredItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WAREHOUSE_ITEMS);
      if (raw) {
        return sanitizeWarehouseItems(JSON.parse(raw));
      }
    } catch {}
    return DEFAULT_ITEMS;
  });

  const [selectedMountId, setSelectedMountId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WAREHOUSE_MOUNT_ID);
      if (saved && TRANSPORT_MOUNTS.some((m) => m.id === saved)) return saved;
    } catch {}
    return 'ox_t5';
  });

  const [bagBonusKg, setBagBonusKg] = useState<number>(150);
  const [usePorkPie, setUsePorkPie] = useState<boolean>(true);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_WAREHOUSE_ITEMS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setItems(sanitizeWarehouseItems(parsed));
        } catch {}
      } else if (e.key === STORAGE_KEY_WAREHOUSE_MOUNT_ID && e.newValue) {
        if (TRANSPORT_MOUNTS.some((m) => m.id === e.newValue)) {
          setSelectedMountId(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const saveItems = useCallback((newItems: WarehouseStoredItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY_WAREHOUSE_ITEMS, JSON.stringify(newItems));
    } catch {}
  }, []);

  const setMount = useCallback((mountId: string) => {
    setSelectedMountId(mountId);
    try {
      localStorage.setItem(STORAGE_KEY_WAREHOUSE_MOUNT_ID, mountId);
    } catch {}
  }, []);

  const addItem = useCallback((item: WarehouseStoredItem) => {
    setItems((prev) => {
      const next = [...prev, item];
      try {
        localStorage.setItem(STORAGE_KEY_WAREHOUSE_ITEMS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_WAREHOUSE_ITEMS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateItemQuantity = useCallback((id: string, qty: number) => {
    const safeQty = Math.max(0, Math.floor(Number(qty) || 0));
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, quantity: safeQty } : i));
      try {
        localStorage.setItem(STORAGE_KEY_WAREHOUSE_ITEMS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const selectedMount: TransportMount = useMemo(() => {
    return TRANSPORT_MOUNTS.find((m) => m.id === selectedMountId) || TRANSPORT_MOUNTS[3];
  }, [selectedMountId]);

  const logisticsReport: WarehouseLogisticsReport = useMemo(() => {
    return calculateWarehouseLogistics({
      items,
      selectedMount,
      bagBonusKg,
      porkPieBonusPercent: usePorkPie ? 30 : 0,
    });
  }, [items, selectedMount, bagBonusKg, usePorkPie]);

  return {
    items,
    saveItems,
    addItem,
    removeItem,
    updateItemQuantity,
    availableMounts: TRANSPORT_MOUNTS,
    selectedMount,
    setMount,
    bagBonusKg,
    setBagBonusKg,
    usePorkPie,
    setUsePorkPie,
    logisticsReport,
  };
}
