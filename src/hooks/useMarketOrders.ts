import { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketOrder, MarketOrderAnalysis, OrderType } from '../domain/models/marketOrders';
import { calculateMarketOrderExpirations } from '../domain/use-cases/calculateMarketOrderExpirations';
import { CityId } from '../types';

const STORAGE_KEY_ORDERS = 'albion_market_orders_v1';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function useMarketOrders() {
  const [orders, setOrders] = useState<MarketOrder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (o) =>
              o &&
              typeof o === 'object' &&
              o.id &&
              o.itemId &&
              Number.isFinite(o.unitPrice) &&
              Number.isFinite(o.quantity)
          );
        }
      }
    } catch {
      // Fallback
    }

    // Datos de muestra si está vacío para arrancar
    const now = Date.now();
    return [
      {
        id: 'order_sample_1',
        itemId: 'weapon_broadsword_t4',
        itemName: 'Espada Ancha T4.1',
        tier: 4,
        cityId: 'fort_sterling' as CityId,
        orderType: 'sell' as OrderType,
        unitPrice: 18500,
        quantity: 10,
        totalValue: 185000,
        createdAt: now - 22 * 24 * 60 * 60 * 1000, // Creada hace 22 días (quedan 8 días)
        expiresAt: now + 8 * 24 * 60 * 60 * 1000,
        notes: 'Orden de venta en subasta de Fort Sterling',
      },
      {
        id: 'order_sample_2',
        itemId: 'food_pork_pie_t7',
        itemName: 'Pastel de Cerdo T7',
        tier: 7,
        cityId: 'caerleon' as CityId,
        orderType: 'sell' as OrderType,
        unitPrice: 12400,
        quantity: 50,
        totalValue: 620000,
        createdAt: now - 27 * 24 * 60 * 60 * 1000, // Creada hace 27 días (quedan 3 días -> URGENTE)
        expiresAt: now + 3 * 24 * 60 * 60 * 1000,
        notes: 'Lote de pasteles para transporte a zona roja',
      },
    ];
  });

  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());

  // Actualizar segundero cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Persistencia local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (err) {
      console.warn('Error al guardar órdenes de mercado:', err);
    }
  }, [orders]);

  const addOrder = useCallback(
    (orderData: Omit<MarketOrder, 'id' | 'createdAt' | 'expiresAt' | 'totalValue'>) => {
      const createdAt = Date.now();
      const expiresAt = createdAt + THIRTY_DAYS_MS;
      const totalValue = Math.max(0, orderData.unitPrice * orderData.quantity);

      const newOrder: MarketOrder = {
        ...orderData,
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        createdAt,
        expiresAt,
        totalValue,
      };

      setOrders((prev) => [newOrder, ...prev]);
    },
    []
  );

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const analyzedOrders: MarketOrderAnalysis[] = useMemo(() => {
    return calculateMarketOrderExpirations(orders, currentTimeMs);
  }, [orders, currentTimeMs]);

  const urgentOrdersCount = useMemo(() => {
    return analyzedOrders.filter((a) => a.isUrgent || a.isExpired).length;
  }, [analyzedOrders]);

  const totalLockedSilver = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.totalValue || 0), 0);
  }, [orders]);

  return {
    orders,
    analyzedOrders,
    urgentOrdersCount,
    totalLockedSilver,
    addOrder,
    deleteOrder,
  };
}
