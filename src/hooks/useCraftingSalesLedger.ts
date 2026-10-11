import { useState, useEffect } from 'react';
import { BlackMarketItemRecord } from '../domain/models/craftingSalesLedger';

const SALES_LEDGER_KEY = 'albion_crafting_sales_ledger_v1';

function parseAndValidateSalesLedger(raw: string | null): BlackMarketItemRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is BlackMarketItemRecord => {
      return (
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.itemName === 'string' &&
        Number.isFinite(item.netProfit) &&
        Number.isFinite(item.grossRevenue)
      );
    });
  } catch {
    return [];
  }
}

export function useCraftingSalesLedger() {
  const [records, setRecords] = useState<BlackMarketItemRecord[]>(() => {
    try {
      const raw = localStorage.getItem(SALES_LEDGER_KEY);
      return parseAndValidateSalesLedger(raw);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem(SALES_LEDGER_KEY);
        setRecords(parseAndValidateSalesLedger(raw));
      } catch {}
    };

    window.addEventListener('albion_sales_ledger_updated', handleSync);
    window.addEventListener('albion_backup_restored', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_sales_ledger_updated', handleSync);
      window.removeEventListener('albion_backup_restored', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const addRecord = (record: Omit<BlackMarketItemRecord, 'id' | 'timestamp' | 'dateStr'>) => {
    const newRecord: BlackMarketItemRecord = {
      ...record,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
    };
    setRecords((prev) => {
      const updated = [newRecord, ...prev];
      try {
        localStorage.setItem(SALES_LEDGER_KEY, JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('albion_sales_ledger_updated'));
        }
      } catch {}
      return updated;
    });
    return newRecord;
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(SALES_LEDGER_KEY, JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('albion_sales_ledger_updated'));
        }
      } catch {}
      return updated;
    });
  };

  const clearAllRecords = () => {
    setRecords([]);
    try {
      localStorage.setItem(SALES_LEDGER_KEY, JSON.stringify([]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('albion_sales_ledger_updated'));
      }
    } catch {}
  };

  const totalSalesSilver = records.reduce((acc, r) => acc + (r.grossRevenue || 0), 0);
  const totalNetProfitSilver = records.reduce((acc, r) => acc + (r.netProfit || 0), 0);
  const totalProductionCostSilver = records.reduce((acc, r) => acc + (r.productionCostTotal || 0), 0);
  const blackMarketSalesCount = records.filter((r) => r.destination === 'black_market').length;
  const royalCitySalesCount = records.filter((r) => r.destination === 'royal_city').length;

  return {
    records,
    addRecord,
    deleteRecord,
    clearAllRecords,
    totalSalesSilver,
    totalNetProfitSilver,
    totalProductionCostSilver,
    blackMarketSalesCount,
    royalCitySalesCount,
  };
}

