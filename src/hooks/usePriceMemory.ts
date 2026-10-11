import { useState, useEffect, useCallback } from 'react';
import { PriceMemory } from '../types';
import {
  loadPriceMemory,
  updatePriceMemory,
  loadRecipePrices,
  updateRecipePrice,
  getPriceCacheStatus,
} from '../utils/storage';

/**
 * Custom Hook (Clean Architecture):
 * Encapsula la gestión de precios manuales del mercado con invalidación por TTL (6 horas),
 * sincronización reactiva multidispositivo/multiventana y mutaciones atómicas.
 */
export function usePriceMemory() {
  const [priceMemory, setPriceMemory] = useState<PriceMemory>(() => loadPriceMemory());
  const [recipePrices, setRecipePrices] = useState<Record<string, number>>(() => loadRecipePrices());

  const refreshPrices = useCallback(() => {
    setPriceMemory(loadPriceMemory());
    setRecipePrices(loadRecipePrices());
  }, []);

  useEffect(() => {
    window.addEventListener('albion_storage_sync', refreshPrices);
    window.addEventListener('storage', refreshPrices);

    // Revisar periodicamente si algún precio ha superado el TTL de 6h
    const interval = setInterval(refreshPrices, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('albion_storage_sync', refreshPrices);
      window.removeEventListener('storage', refreshPrices);
      clearInterval(interval);
    };
  }, [refreshPrices]);

  const updateItemPrice = useCallback(
    (itemId: string, updates: { lastProductPrice?: number; lastSeedPrice?: number; lastFoodPrice?: number }) => {
      updatePriceMemory(itemId, updates);
      setPriceMemory((prev) => ({
        ...prev,
        [itemId]: {
          ...(prev[itemId] || {}),
          ...updates,
          updatedAt: Date.now(),
        },
      }));
    },
    []
  );

  const updateCraftPrice = useCallback((key: string, price: number) => {
    updateRecipePrice(key, price);
    setRecipePrices((prev) => ({
      ...prev,
      [key]: price,
    }));
  }, []);

  const getPriceStatus = useCallback(
    (itemId: string) => {
      const memory = priceMemory[itemId];
      return getPriceCacheStatus(memory?.updatedAt);
    },
    [priceMemory]
  );

  return {
    priceMemory,
    recipePrices,
    refreshPrices,
    updateItemPrice,
    updateCraftPrice,
    getPriceStatus,
  };
}
