import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  MountDefinition,
  MOUNTS_CATALOG,
  MountBreedingInput,
  MountBreedingResult,
  calculateMountEconomy,
} from '../domain';
import { useDailyEvents } from './useDailyEvents';

export interface MountSavedPrices {
  babyPrice?: number;
  foodPrice?: number;
  saddlingMaterialPrice?: number;
  stationFee?: number;
  adultPrice?: number;
  saddledPrice?: number;
  updatedAt?: number;
}

const STORAGE_KEY_MOUNT_PRICES = 'albion_farm_mount_prices_v1';
const STORAGE_KEY_MOUNT_CONFIG = 'albion_farm_mount_config_v1';

// Precios de referencia iniciales para que el usuario no empiece de cero
const DEFAULT_MOUNT_PRICES: Record<string, MountSavedPrices> = {
  mount_horse_t3: {
    babyPrice: 6000,
    foodPrice: 220,
    saddlingMaterialPrice: 150,
    stationFee: 300,
    adultPrice: 11000,
    saddledPrice: 14500,
  },
  mount_horse_t4: {
    babyPrice: 14000,
    foodPrice: 240,
    saddlingMaterialPrice: 380,
    stationFee: 400,
    adultPrice: 24000,
    saddledPrice: 37000,
  },
  mount_horse_t5: {
    babyPrice: 32000,
    foodPrice: 260,
    saddlingMaterialPrice: 1100,
    stationFee: 500,
    adultPrice: 52000,
    saddledPrice: 82000,
  },
  mount_horse_t6: {
    babyPrice: 85000,
    foodPrice: 280,
    saddlingMaterialPrice: 3200,
    stationFee: 600,
    adultPrice: 135000,
    saddledPrice: 225000,
  },
  mount_horse_t7: {
    babyPrice: 220000,
    foodPrice: 300,
    saddlingMaterialPrice: 9500,
    stationFee: 800,
    adultPrice: 340000,
    saddledPrice: 590000,
  },
  mount_horse_t8: {
    babyPrice: 650000,
    foodPrice: 340,
    saddlingMaterialPrice: 28000,
    stationFee: 1000,
    adultPrice: 950000,
    saddledPrice: 1650000,
  },
  mount_ox_t3: {
    babyPrice: 5500,
    foodPrice: 220,
    saddlingMaterialPrice: 140,
    stationFee: 300,
    adultPrice: 10500,
    saddledPrice: 13800,
  },
  mount_ox_t4: {
    babyPrice: 13000,
    foodPrice: 240,
    saddlingMaterialPrice: 350,
    stationFee: 400,
    adultPrice: 22000,
    saddledPrice: 34000,
  },
  mount_ox_t5: {
    babyPrice: 30000,
    foodPrice: 260,
    saddlingMaterialPrice: 980,
    stationFee: 500,
    adultPrice: 48000,
    saddledPrice: 76000,
  },
  mount_ox_t6: {
    babyPrice: 80000,
    foodPrice: 280,
    saddlingMaterialPrice: 2900,
    stationFee: 600,
    adultPrice: 125000,
    saddledPrice: 210000,
  },
  mount_ox_t7: {
    babyPrice: 210000,
    foodPrice: 300,
    saddlingMaterialPrice: 8900,
    stationFee: 800,
    adultPrice: 320000,
    saddledPrice: 550000,
  },
  mount_ox_t8: {
    babyPrice: 620000,
    foodPrice: 340,
    saddlingMaterialPrice: 26000,
    stationFee: 1000,
    adultPrice: 920000,
    saddledPrice: 1580000,
  },
  mount_swiftclaw_t5: {
    babyPrice: 110000,
    foodPrice: 420, // Carne cruda / pescado picado
    saddlingMaterialPrice: 1100, // Cuero T5
    stationFee: 500,
    adultPrice: 145000,
    saddledPrice: 195000,
  },
  mount_direwolf_t6: {
    babyPrice: 280000,
    foodPrice: 480, // Carne cruda
    saddlingMaterialPrice: 3200, // Cuero T6
    stationFee: 600,
    adultPrice: 380000,
    saddledPrice: 490000,
  },
  mount_wild_boar_t7: {
    babyPrice: 450000,
    foodPrice: 300, // Maíz dulce
    saddlingMaterialPrice: 9500, // Cuero T7
    stationFee: 800,
    adultPrice: 680000,
    saddledPrice: 980000,
  },
  mount_giant_stag_t4: {
    babyPrice: 35000,
    foodPrice: 240,
    saddlingMaterialPrice: 380, // Cuero T4
    stationFee: 400,
    adultPrice: 55000,
    saddledPrice: 75000,
  },
  mount_moose_t6: {
    babyPrice: 320000,
    foodPrice: 280,
    saddlingMaterialPrice: 3200, // Cuero T6
    stationFee: 600,
    adultPrice: 450000,
    saddledPrice: 580000,
  },
  mount_swamp_salamander_t5: {
    babyPrice: 85000,
    foodPrice: 420, // Carne cruda
    saddlingMaterialPrice: 1100, // Cuero T5
    stationFee: 500,
    adultPrice: 130000,
    saddledPrice: 175000,
  },
  mount_winter_bear_t5: {
    babyPrice: 120000,
    foodPrice: 420,
    saddlingMaterialPrice: 1100,
    stationFee: 500,
    adultPrice: 160000,
    saddledPrice: 215000,
  },
  mount_bighorn_ram_t5: {
    babyPrice: 95000,
    foodPrice: 260,
    saddlingMaterialPrice: 1100,
    stationFee: 500,
    adultPrice: 140000,
    saddledPrice: 185000,
  },
  mount_moabird_t5: {
    babyPrice: 100000,
    foodPrice: 260,
    saddlingMaterialPrice: 1100,
    stationFee: 500,
    adultPrice: 150000,
    saddledPrice: 198000,
  },
  mount_mystic_owl_t5: {
    babyPrice: 150000,
    foodPrice: 420,
    saddlingMaterialPrice: 1100,
    stationFee: 500,
    adultPrice: 210000,
    saddledPrice: 290000,
  },
  mount_direbear_t8: {
    babyPrice: 1800000,
    foodPrice: 520,
    saddlingMaterialPrice: 28000,
    stationFee: 1000,
    adultPrice: 2400000,
    saddledPrice: 3500000,
  },
  mount_mammoth_t8: {
    babyPrice: 120000000, // Cría de Mamut
    foodPrice: 340,
    saddlingMaterialPrice: 28000,
    stationFee: 2000,
    adultPrice: 145000000,
    saddledPrice: 195000000,
  },
  mount_swamp_dragon_t7: {
    babyPrice: 550000,
    foodPrice: 500,
    saddlingMaterialPrice: 9500, // Cuero T7
    stationFee: 900,
    adultPrice: 850000,
    saddledPrice: 1250000,
  },
  mount_greywolf_t5: {
    babyPrice: 130000,
    foodPrice: 420,
    saddlingMaterialPrice: 1100,
    stationFee: 500,
    adultPrice: 170000,
    saddledPrice: 230000,
  },
  mount_elite_greywolf_t8: {
    babyPrice: 1900000,
    foodPrice: 520,
    saddlingMaterialPrice: 28000,
    stationFee: 1200,
    adultPrice: 2600000,
    saddledPrice: 3900000,
  },
  mount_elite_wild_boar_t8: {
    babyPrice: 1700000,
    foodPrice: 340,
    saddlingMaterialPrice: 28000,
    stationFee: 1200,
    adultPrice: 2400000,
    saddledPrice: 3600000,
  },
  mount_elite_bighorn_ram_t8: {
    babyPrice: 1600000,
    foodPrice: 340,
    saddlingMaterialPrice: 28000,
    stationFee: 1200,
    adultPrice: 2300000,
    saddledPrice: 3400000,
  },
  mount_elite_terrorbird_t8: {
    babyPrice: 1800000,
    foodPrice: 340,
    saddlingMaterialPrice: 28000,
    stationFee: 1200,
    adultPrice: 2500000,
    saddledPrice: 3700000,
  },
  mount_elite_swamp_salamander_t8: {
    babyPrice: 1750000,
    foodPrice: 520,
    saddlingMaterialPrice: 28000,
    stationFee: 1200,
    adultPrice: 2450000,
    saddledPrice: 3650000,
  },
  mount_elite_winter_bear_t8: {
    babyPrice: 2100000,
    foodPrice: 520,
    saddlingMaterialPrice: 28000,
    stationFee: 1200,
    adultPrice: 2800000,
    saddledPrice: 4200000,
  },
  mount_firewing_drake_t8: {
    babyPrice: 25000000, // Huevo de dragón (Drake Egg) de raid
    foodPrice: 8500,     // Alimentación con monturas sacrificadas / gourmet
    saddlingMaterialPrice: 28000,
    stationFee: 3500,
    adultPrice: 45000000,
    saddledPrice: 75000000,
  },
  mount_armored_horse_t5: {
    babyPrice: 32000,
    foodPrice: 260,
    saddlingMaterialPrice: 1200, // Barras de titanio T5
    stationFee: 500,
    adultPrice: 82000, // Caballo ensillado base
    saddledPrice: 135000, // Caballo blindado final
  },
};

function loadStoredMountPrices(): Record<string, MountSavedPrices> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOUNT_PRICES);
    if (!raw) return DEFAULT_MOUNT_PRICES;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_MOUNT_PRICES;

    const safePrices: Record<string, MountSavedPrices> = { ...DEFAULT_MOUNT_PRICES };
    for (const [mountId, prices] of Object.entries(parsed as Record<string, unknown>)) {
      if (mountId === '__proto__' || mountId === 'constructor' || mountId === 'prototype') continue;
      if (prices && typeof prices === 'object') {
        const p = prices as Record<string, unknown>;
        const sanitizeField = (val: unknown): number | undefined => {
          const num = Number(val);
          return Number.isFinite(num) && num >= 0 ? Math.floor(num) : undefined;
        };
        safePrices[mountId] = {
          babyPrice: sanitizeField(p.babyPrice),
          foodPrice: sanitizeField(p.foodPrice),
          saddlingMaterialPrice: sanitizeField(p.saddlingMaterialPrice),
          stationFee: sanitizeField(p.stationFee),
          adultPrice: sanitizeField(p.adultPrice),
          saddledPrice: sanitizeField(p.saddledPrice),
        };
      }
    }
    return safePrices;
  } catch {
    return DEFAULT_MOUNT_PRICES;
  }
}

export function useMountEconomy(dailyEventsHook?: ReturnType<typeof useDailyEvents>) {
  // 1. Estado de Selección y Parámetros
  const [selectedMountId, setSelectedMountId] = useState<string>('mount_horse_t4');
  const [mountCount, setMountCount] = useState<number>(9); // 9 = 1 pastizal completo
  const [hasPremium, setHasPremium] = useState<boolean>(true);
  const [useNurtureFocus, setUseNurtureFocus] = useState<boolean>(true);
  const [useSaddlerFocus, setUseSaddlerFocus] = useState<boolean>(false);
  const [isBabyRaisedOwn, setIsBabyRaisedOwn] = useState<boolean>(false);
  const [fceNurture, setFceNurture] = useState<number>(10000); // 10k FCE por defecto
  const [fceSaddler, setFceSaddler] = useState<number>(5000);

  // Estados de cálculo manual por botón (no automático)
  const [calculatedResult, setCalculatedResult] = useState<MountBreedingResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Marcar datos como desactualizados cuando se cambie un parámetro
  const markStale = useCallback(() => {
    setIsStale(true);
  }, []);

  // 2. Almacén de Precios Manuales de Monturas
  const [allPrices, setAllPrices] = useState<Record<string, MountSavedPrices>>(loadStoredMountPrices);

  // Definición de la montura activa
  const currentMount = useMemo(() => {
    return MOUNTS_CATALOG.find((m) => m.id === selectedMountId) || MOUNTS_CATALOG[1];
  }, [selectedMountId]);

  // Precios actuales para la montura seleccionada
  const activePrices = useMemo(() => {
    const p = allPrices[selectedMountId] || DEFAULT_MOUNT_PRICES[selectedMountId] || {};
    return {
      babyPrice: p.babyPrice ?? 15000,
      foodPrice: p.foodPrice ?? 250,
      saddlingMaterialPrice: p.saddlingMaterialPrice ?? 400,
      stationFee: p.stationFee ?? 400,
      adultPrice: p.adultPrice ?? 25000,
      saddledPrice: p.saddledPrice ?? 38000,
    };
  }, [allPrices, selectedMountId]);

  // Detección automática del bono oficial diario de Guarnicionero / Monturas
  const dailyMountsBonusRRR = useMemo(() => {
    if (!dailyEventsHook) return 0;
    const isMountBonusActive = dailyEventsHook.activeBonuses.some(
      (b) => b.id === 'bonus_mounts_saddler'
    );
    return isMountBonusActive ? 10 : 0;
  }, [dailyEventsHook]);

  // 3. Caso de Uso de Dominio Puro (ejecutado bajo demanda por el botón de dar resultado)
  const executeCalculation = useCallback((): MountBreedingResult => {
    const input: MountBreedingInput = {
      mountId: currentMount.id,
      mountCount,
      hasPremium,
      useNurtureFocus,
      useSaddlerFocus,
      fceNurture,
      fceSaddler,
      babyUnitPrice: activePrices.babyPrice,
      isBabyRaisedOwn,
      foodUnitPrice: activePrices.foodPrice,
      saddlingMaterialUnitPrice: activePrices.saddlingMaterialPrice,
      stationFeePer100Nutrition: activePrices.stationFee,
      adultSellPrice: activePrices.adultPrice,
      saddledSellPrice: activePrices.saddledPrice,
      marketTaxRate: hasPremium ? 6.5 : 10.5,
      dailyProductionBonusRRR: dailyMountsBonusRRR,
    };

    return calculateMountEconomy(input, currentMount);
  }, [
    currentMount,
    mountCount,
    hasPremium,
    useNurtureFocus,
    useSaddlerFocus,
    fceNurture,
    fceSaddler,
    activePrices,
    isBabyRaisedOwn,
    dailyMountsBonusRRR,
  ]);

  // Trigger manual invocado por el usuario mediante botón
  const triggerCalculation = useCallback(() => {
    const result = executeCalculation();
    setCalculatedResult(result);
    setIsStale(false);
    return result;
  }, [executeCalculation]);

  const clearResult = useCallback(() => {
    setCalculatedResult(null);
    setIsStale(false);
  }, []);

  // Al cambiar de montura seleccionada, se limpia el resultado para forzar el cálculo manual con sus nuevos precios
  const handleSelectMount = useCallback((id: string) => {
    setSelectedMountId(id);
    setCalculatedResult(null);
    setIsStale(false);
  }, []);

  // 4. Mutaciones seguras de precios (marcando desactualizado)
  const updatePrice = useCallback(
    (field: keyof MountSavedPrices, value: number) => {
      if (
        selectedMountId === '__proto__' ||
        selectedMountId === 'constructor' ||
        selectedMountId === 'prototype'
      ) {
        return;
      }
      const sanitized = Math.max(0, Number.isFinite(value) ? value : 0);
      markStale();
      setAllPrices((prev) => {
        const mountPriceEntry = prev[selectedMountId] || {};
        const updated = {
          ...prev,
          [selectedMountId]: {
            ...mountPriceEntry,
            [field]: sanitized,
            updatedAt: Date.now(),
          },
        };
        try {
          localStorage.setItem(STORAGE_KEY_MOUNT_PRICES, JSON.stringify(updated));
          window.dispatchEvent(new Event('albion_mount_prices_sync'));
        } catch (e) {
          console.error('Error saving mount prices', e);
        }
        return updated;
      });
    },
    [selectedMountId, markStale]
  );

  // Wrappers para setters que marcan estado stale si ya se calculó
  const handleSetMountCount = useCallback(
    (count: number) => {
      setMountCount(count);
      markStale();
    },
    [markStale]
  );

  const handleSetHasPremium = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setHasPremium(val);
      markStale();
    },
    [markStale]
  );

  const handleSetUseNurtureFocus = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setUseNurtureFocus(val);
      markStale();
    },
    [markStale]
  );

  const handleSetUseSaddlerFocus = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setUseSaddlerFocus(val);
      markStale();
    },
    [markStale]
  );

  const handleSetIsBabyRaisedOwn = useCallback(
    (val: boolean | ((prev: boolean) => boolean)) => {
      setIsBabyRaisedOwn(val);
      markStale();
    },
    [markStale]
  );

  const handleSetFceNurture = useCallback(
    (val: number) => {
      setFceNurture(val);
      markStale();
    },
    [markStale]
  );

  const handleSetFceSaddler = useCallback(
    (val: number) => {
      setFceSaddler(val);
      markStale();
    },
    [markStale]
  );

  // Sincronización entre ventanas
  useEffect(() => {
    const handleSync = () => {
      setAllPrices(loadStoredMountPrices());
    };
    window.addEventListener('albion_mount_prices_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_mount_prices_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  return {
    selectedMountId,
    setSelectedMountId: handleSelectMount,
    currentMount,
    availableMounts: MOUNTS_CATALOG,
    mountCount,
    setMountCount: handleSetMountCount,
    hasPremium,
    setHasPremium: handleSetHasPremium,
    useNurtureFocus,
    setUseNurtureFocus: handleSetUseNurtureFocus,
    useSaddlerFocus,
    setUseSaddlerFocus: handleSetUseSaddlerFocus,
    isBabyRaisedOwn,
    setIsBabyRaisedOwn: handleSetIsBabyRaisedOwn,
    fceNurture,
    setFceNurture: handleSetFceNurture,
    fceSaddler,
    setFceSaddler: handleSetFceSaddler,
    activePrices,
    updatePrice,
    calculationResult: calculatedResult,
    isCalculated: calculatedResult !== null,
    isStale,
    triggerCalculation,
    clearResult,
    markStale,
    dailyMountsBonusRRR,
  };
}
