/**
 * Caso de Uso Puro: Cálculo de Caducidad de Órdenes de Mercado (30 Días)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * En Albion Online las órdenes de compra y venta expiran exactamente a los 30 días de su emisión.
 */

import { MarketOrder, MarketOrderAnalysis } from '../models/marketOrders';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function calculateMarketOrderExpirations(
  orders: MarketOrder[],
  currentTimestamp: number = Date.now()
): MarketOrderAnalysis[] {
  if (!Array.isArray(orders) || orders.length === 0) {
    return [];
  }

  return orders.map((order): MarketOrderAnalysis => {
    const expiresAt = order.expiresAt || (order.createdAt + THIRTY_DAYS_MS);
    const msRemaining = expiresAt - currentTimestamp;

    const isExpired = msRemaining <= 0;
    const daysRemaining = isExpired ? 0 : Math.floor(msRemaining / (24 * 60 * 60 * 1000));
    const hoursRemaining = isExpired ? 0 : Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const isUrgent = !isExpired && daysRemaining <= 5;

    let urgencyLabel = '';
    if (isExpired) {
      urgencyLabel = 'Orden Caducada (Reclamar en Subasta)';
    } else if (daysRemaining === 0) {
      urgencyLabel = `Vence hoy (${hoursRemaining}h restantes)`;
    } else if (isUrgent) {
      urgencyLabel = `¡Atención! Vence en ${daysRemaining}d ${hoursRemaining}h`;
    } else {
      urgencyLabel = `Activa (${daysRemaining} días restantes)`;
    }

    return {
      order: {
        ...order,
        expiresAt,
      },
      daysRemaining,
      hoursRemaining,
      isExpired,
      isUrgent,
      urgencyLabel,
    };
  });
}
