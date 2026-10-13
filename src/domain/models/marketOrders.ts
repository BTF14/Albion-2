/**
 * Modelos de Dominio: Monitor de Caducidad de Órdenes de Mercado (30 Días)
 * Albion Online - Clean Architecture (Gentleman Programming)
 */

import { CityId } from '../../types';

export type OrderType = 'sell' | 'buy';

export interface MarketOrder {
  id: string;
  itemId: string;
  itemName: string;
  tier: number;
  cityId: CityId;
  orderType: OrderType;
  unitPrice: number;
  quantity: number;
  totalValue: number;
  createdAt: number; // Timestamp en ms
  expiresAt: number; // createdAt + 30 días en ms
  notes?: string;
}

export interface MarketOrderAnalysis {
  order: MarketOrder;
  daysRemaining: number;
  hoursRemaining: number;
  isExpired: boolean;
  isUrgent: boolean; // Menos de 5 días para vencer
  urgencyLabel: string;
}
