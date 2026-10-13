import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LoadoutProfile,
  LoadoutSlot,
  LoadoutItem,
  RegearBudgetAnalysis,
  LoadoutCategory,
} from '../domain/models/loadouts';
import { calculateLoadoutRegear } from '../domain/use-cases/calculateLoadoutRegear';

const STORAGE_KEY_LOADOUTS = 'albion_loadouts_regear_v1';

const DEFAULT_SAMPLE_LOADOUT: LoadoutProfile = {
  id: 'loadout_sample_zvz',
  name: 'Brujo de Asedio ZvZ (T8.1)',
  category: 'pvp_zvz',
  items: {
    main_hand: { slot: 'main_hand', name: 'Bastón Maldito del Ocaso', tier: 8, enchantment: 1, unitPrice: 380000, quantity: 1 },
    off_hand: null,
    head: { slot: 'head', name: 'Caperuza de Clérigo', tier: 8, enchantment: 1, unitPrice: 145000, quantity: 1 },
    chest: { slot: 'chest', name: 'Túnica de Erudito', tier: 8, enchantment: 1, unitPrice: 210000, quantity: 1 },
    shoes: { slot: 'shoes', name: 'Sandalias Reales', tier: 8, enchantment: 1, unitPrice: 280000, quantity: 1 },
    cape: { slot: 'cape', name: 'Capa de Fort Sterling', tier: 8, enchantment: 1, unitPrice: 320000, quantity: 1 },
    mount: { slot: 'mount', name: 'Caballo Blindado T7', tier: 7, enchantment: 0, unitPrice: 195000, quantity: 1 },
    food: { slot: 'food', name: 'Tortilla de Cerdo .1', tier: 7, enchantment: 1, unitPrice: 18000, quantity: 2 },
    potion: { slot: 'potion', name: 'Poción de Resistencia Mayor .1', tier: 7, enchantment: 1, unitPrice: 14000, quantity: 5 },
  },
  totalCost: 1616000,
  notes: 'Set estándar de clan para castillos y vórtices',
  createdAt: Date.now(),
};

export function useLoadoutManager() {
  const [loadouts, setLoadouts] = useState<LoadoutProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOADOUTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((l) => l && typeof l === 'object' && l.id && l.items);
        }
      }
    } catch {
      // Fallback
    }
    return [DEFAULT_SAMPLE_LOADOUT];
  });

  const [activeLoadoutId, setActiveLoadoutId] = useState<string>(() => {
    return loadouts[0]?.id || DEFAULT_SAMPLE_LOADOUT.id;
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOADOUTS, JSON.stringify(loadouts));
    } catch (err) {
      console.warn('Error al guardar loadouts:', err);
    }
  }, [loadouts]);

  const activeLoadout = useMemo(() => {
    return loadouts.find((l) => l.id === activeLoadoutId) || loadouts[0] || DEFAULT_SAMPLE_LOADOUT;
  }, [loadouts, activeLoadoutId]);

  const analysis: RegearBudgetAnalysis = useMemo(() => {
    return calculateLoadoutRegear(activeLoadout);
  }, [activeLoadout]);

  const updateItemInActiveLoadout = useCallback(
    (slot: LoadoutSlot, item: LoadoutItem | null) => {
      setLoadouts((prev) =>
        prev.map((l) => {
          if (l.id !== activeLoadoutId) return l;
          const updatedItems = { ...l.items, [slot]: item };
          const analyzed = calculateLoadoutRegear({ ...l, items: updatedItems });
          return analyzed.loadout;
        })
      );
    },
    [activeLoadoutId]
  );

  const createLoadout = useCallback((name: string, category: LoadoutCategory, notes?: string) => {
    const newId = `loadout_${Date.now()}`;
    const newProfile: LoadoutProfile = {
      id: newId,
      name: name.trim() || 'Nuevo Set',
      category,
      items: {
        main_hand: null,
        off_hand: null,
        head: null,
        chest: null,
        shoes: null,
        cape: null,
        mount: null,
        food: null,
        potion: null,
      },
      totalCost: 0,
      notes,
      createdAt: Date.now(),
    };
    setLoadouts((prev) => [newProfile, ...prev]);
    setActiveLoadoutId(newId);
  }, []);

  const deleteLoadout = useCallback(
    (id: string) => {
      setLoadouts((prev) => {
        const filtered = prev.filter((l) => l.id !== id);
        if (filtered.length === 0) return [DEFAULT_SAMPLE_LOADOUT];
        return filtered;
      });
      if (activeLoadoutId === id) {
        setActiveLoadoutId(loadouts[0]?.id || DEFAULT_SAMPLE_LOADOUT.id);
      }
    },
    [activeLoadoutId, loadouts]
  );

  return {
    loadouts,
    activeLoadout,
    setActiveLoadoutId,
    analysis,
    updateItemInActiveLoadout,
    createLoadout,
    deleteLoadout,
  };
}
