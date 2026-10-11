import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CityId, DailyChecklistItem, PriceMemory, PriceMemoryItem } from '../types';
import { CITIES, ALBION_ITEMS } from '../data/items';
import { RECIPES } from '../data/recipes';
import {
  TRANSPORT_MOUNTS,
  ITEM_WEIGHTS,
  TransportMount,
} from '../domain/models/transport';
import {
  calculateTransportArbitrage,
  TransportCalculationResult,
} from '../domain/use-cases/calculateTransportArbitrage';
import { useCraftingSalesLedger } from '../hooks/useCraftingSalesLedger';
import {
  Truck,
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Coins,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Plus,
  Compass,
  Search,
  BookOpen,
  Crosshair,
  Info,
  Layers,
  RotateCcw,
  Calculator,
} from 'lucide-react';
import { NumericInput } from './NumericInput';
import { formatSilver } from '../utils/albionColors';

interface TransportCalculatorProps {
  currentCityId: CityId;
  priceMemory?: PriceMemory | Record<string, number>;
  hasPremium?: boolean;
  onAddTodoTask?: (task: DailyChecklistItem) => void;
  onOpenAdpModal?: (itemId: string, itemName: string) => void;
}

// Bolsas de viaje oficiales de Albion Online
const BAG_OPTIONS = [
  { label: 'Sin bolsa adicional', capacity: 0 },
  { label: 'Bolsa de Aprendiz (T4) +120 kg', capacity: 120 },
  { label: 'Bolsa de Oficial (T5) +210 kg', capacity: 210 },
  { label: 'Bolsa de Gran Maestro (T6) +360 kg', capacity: 360 },
  { label: 'Bolsa de Maestro (T7) +580 kg', capacity: 580 },
  { label: 'Bolsa de Sabio (T8) +890 kg', capacity: 890 },
];

type CategoryFilter = 'all' | 'crops_herbs' | 'farm_animals' | 'food_potions' | 'refined_mats' | 'mounts';

export const TransportCalculator: React.FC<TransportCalculatorProps> = ({
  currentCityId,
  priceMemory = {},
  hasPremium = true,
  onAddTodoTask,
  onOpenAdpModal,
}) => {
  const { addRecord } = useCraftingSalesLedger();

  // Ciudades de la ruta
  const [originCity, setOriginCity] = useState<CityId>(
    currentCityId !== 'caerleon' ? currentCityId : 'martlock'
  );
  const [destinationCity, setDestinationCity] = useState<CityId>(
    currentCityId !== 'caerleon' ? 'caerleon' : 'fort_sterling'
  );

  // Tipo de orden y destino en Caerleon
  const [orderType, setOrderType] = useState<'sell_order' | 'buy_order'>('sell_order');
  const [destinationMarket, setDestinationMarket] = useState<'royal_market' | 'black_market'>('royal_market');

  // Filtro y búsqueda de mercancía
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItemId, setSelectedItemId] = useState<string>('crop_wheat');

  // Peso personalizado (opcional)
  const [isCustomWeight, setIsCustomWeight] = useState<boolean>(false);
  const [customWeightInput, setCustomWeightInput] = useState<number>(0.15);

  // Precios manuales
  const [originPrice, setOriginPrice] = useState<number>(340);
  const [destinationPrice, setDestinationPrice] = useState<number>(450);

  // Configuración de Montura y Carga
  const [selectedMountId, setSelectedMountId] = useState<string>('ox_t4');
  const [hasPorkPie, setHasPorkPie] = useState<boolean>(true);
  const [selectedBagCapacity, setSelectedBagCapacity] = useState<number>(210);

  // Modo de cantidad
  const [isCustomQuantity, setIsCustomQuantity] = useState<boolean>(false);
  const [customUnits, setCustomUnits] = useState<number>(5000);

  // Estado de activación manual para evitar mezclas con cuentas anteriores
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleCalculate = () => {
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  // Toast de notificación
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  };

  // Intercambiar ciudades (Swap)
  const handleSwapCities = () => {
    const tempOrigin = originCity;
    const tempDest = destinationCity;
    setOriginCity(tempDest);
    setDestinationCity(tempOrigin);

    // También intercambiar los precios para agilizar la comparación
    const tempOriginP = originPrice;
    setOriginPrice(destinationPrice);
    setDestinationPrice(tempOriginP);
  };

  // Catálogo unificado y enriquecido de Albion Online
  const fullCatalog = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      categoryKey: CategoryFilter;
      categoryLabel: string;
      tier: number;
      defaultWeight: number;
    }> = [];

    // 1. Cultivos y Granja
    ALBION_ITEMS.forEach((item) => {
      const isCropOrHerb = item.category === 'crop' || item.category === 'herb';
      const catKey: CategoryFilter = isCropOrHerb ? 'crops_herbs' : 'farm_animals';
      const catLabel =
        item.category === 'crop'
          ? 'Cultivos'
          : item.category === 'herb'
          ? 'Hierbas'
          : item.category === 'animal_produce'
          ? 'Granja (Huevos/Leche)'
          : 'Carne Cruda';

      list.push({
        id: item.id,
        name: `${item.nameEs} (T${item.tier})`,
        categoryKey: catKey,
        categoryLabel: catLabel,
        tier: item.tier,
        defaultWeight: ITEM_WEIGHTS[item.id] || 0.15,
      });
    });

    // 2. Comidas y Pociones
    RECIPES.forEach((r) => {
      list.push({
        id: r.id,
        name: `${r.nameEs} (T${r.tier})`,
        categoryKey: 'food_potions',
        categoryLabel: r.category === 'cooking' ? 'Comida Elaborada' : 'Pociones',
        tier: r.tier,
        defaultWeight: ITEM_WEIGHTS[r.id] || 0.20,
      });
    });

    // 3. Recursos Refinados (Planks, Bars, Leather, Cloth, Stone)
    const resourceTypes = [
      { prefix: 'mat_plank', name: 'Tablas de Madera', cat: 'refined_mats' as CategoryFilter },
      { prefix: 'mat_bar', name: 'Lingotes de Metal', cat: 'refined_mats' as CategoryFilter },
      { prefix: 'mat_leather', name: 'Cuero Trabajado', cat: 'refined_mats' as CategoryFilter },
      { prefix: 'mat_cloth', name: 'Rollos de Tela', cat: 'refined_mats' as CategoryFilter },
      { prefix: 'mat_stone', name: 'Bloques de Piedra', cat: 'refined_mats' as CategoryFilter },
    ];

    resourceTypes.forEach((res) => {
      for (let t = 2; t <= 8; t++) {
        const id = `${res.prefix}_t${t}`;
        list.push({
          id,
          name: `${res.name} (T${t})`,
          categoryKey: res.cat,
          categoryLabel: 'Recurso Refinado',
          tier: t,
          defaultWeight: ITEM_WEIGHTS[id] || 0.50,
        });
      }
    });

    // 4. Monturas Ensilladas de transporte o combate
    const mountItems = [
      { id: 'mount_horse_t3', name: 'Caballo de Montar (T3)', tier: 3 },
      { id: 'mount_horse_t4', name: 'Caballo de Montar (T4)', tier: 4 },
      { id: 'mount_horse_t5', name: 'Caballo de Montar (T5)', tier: 5 },
      { id: 'mount_horse_t6', name: 'Caballo Blindado (T6)', tier: 6 },
      { id: 'mount_horse_t7', name: 'Caballo Blindado (T7)', tier: 7 },
      { id: 'mount_horse_t8', name: 'Caballo Blindado (T8)', tier: 8 },
      { id: 'mount_ox_t3', name: 'Buey del Conjurador (T3)', tier: 3 },
      { id: 'mount_ox_t4', name: 'Buey del Transportista (T4)', tier: 4 },
      { id: 'mount_ox_t5', name: 'Buey del Transportista (T5)', tier: 5 },
      { id: 'mount_ox_t6', name: 'Buey del Transportista (T6)', tier: 6 },
      { id: 'mount_ox_t7', name: 'Buey del Transportista (T7)', tier: 7 },
      { id: 'mount_ox_t8', name: 'Buey del Transportista (T8)', tier: 8 },
      { id: 'mount_stag_t4', name: 'Ciervo Gigante (T4)', tier: 4 },
      { id: 'mount_boar_t7', name: 'Jabalí Ensillado (T7)', tier: 7 },
      { id: 'mount_bear_t7', name: 'Oso Pardo Ensillado (T7)', tier: 7 },
    ];

    mountItems.forEach((m) => {
      list.push({
        id: m.id,
        name: m.name,
        categoryKey: 'mounts',
        categoryLabel: 'Monturas',
        tier: m.tier,
        defaultWeight: ITEM_WEIGHTS[m.id] || 45.0,
      });
    });

    return list;
  }, []);

  // Filtrado de catálogo por categoría y texto
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return fullCatalog.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.categoryKey === selectedCategory;
      const matchQuery = !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [fullCatalog, selectedCategory, searchQuery]);

  const selectedItemInfo = useMemo(() => {
    return (
      fullCatalog.find((i) => i.id === selectedItemId) ||
      fullCatalog[0]
    );
  }, [fullCatalog, selectedItemId]);

  const selectedMount = useMemo<TransportMount>(() => {
    return (
      TRANSPORT_MOUNTS.find((m) => m.id === selectedMountId) || TRANSPORT_MOUNTS[1]
    );
  }, [selectedMountId]);

  // Autocarga de precios guardados en memoria de la app
  const handleLoadSavedPrices = () => {
    if (!priceMemory) {
      showToast('No hay precios en memoria.');
      return;
    }
    const originKey = `price_${originCity}_${selectedItemId}`;
    const destKey = `price_${destinationCity}_${selectedItemId}`;

    const rawOrigin = priceMemory[originKey] ?? priceMemory[selectedItemId];
    const rawDest = priceMemory[destKey] ?? priceMemory[selectedItemId];

    const extractPrice = (val: PriceMemoryItem | number | undefined): number | undefined => {
      if (typeof val === 'number') return val;
      if (val && typeof val === 'object') return val.lastProductPrice ?? val.sellPrice ?? val.buyPrice;
      return undefined;
    };

    const savedOrigin = extractPrice(rawOrigin);
    const savedDest = extractPrice(rawDest);

    let loadedCount = 0;
    if (savedOrigin !== undefined && savedOrigin > 0) {
      setOriginPrice(savedOrigin);
      loadedCount++;
    }
    if (savedDest !== undefined && savedDest > 0) {
      setDestinationPrice(savedDest);
      loadedCount++;
    }

    if (loadedCount === 2) {
      showToast('¡Precios de origen y destino cargados desde tu memoria de precios!');
    } else if (loadedCount === 1) {
      showToast('Se cargó uno de los precios guardados.');
    } else {
      showToast('No hay precios guardados en memoria para este ítem en estas ciudades.');
    }
  };

  // Cálculo de Arbitraje y Transporte mediante Caso de Uso Puro
  const result = useMemo<TransportCalculationResult>(() => {
    return calculateTransportArbitrage({
      originCity,
      destinationCity,
      itemId: selectedItemId,
      originUnitPrice: originPrice,
      destinationUnitPrice: destinationPrice,
      mount: selectedMount,
      hasPorkPie,
      bagCapacityKg: selectedBagCapacity,
      hasPremium: hasPremium ?? true,
      customQuantity: isCustomQuantity ? customUnits : undefined,
      orderType,
      destinationMarket: destinationCity === 'caerleon' ? destinationMarket : 'royal_market',
      customItemWeightKg: isCustomWeight ? customWeightInput : undefined,
    });
  }, [
    originCity,
    destinationCity,
    selectedItemId,
    originPrice,
    destinationPrice,
    selectedMount,
    hasPorkPie,
    selectedBagCapacity,
    hasPremium,
    isCustomQuantity,
    customUnits,
    orderType,
    destinationMarket,
    isCustomWeight,
    customWeightInput,
  ]);

  // Agregar la ruta como tarea a la lista de cosas por hacer
  const handleSendToTodoList = () => {
    if (!onAddTodoTask) return;

    const originName = CITIES.find((c) => c.id === originCity)?.name || originCity;
    const destName = CITIES.find((c) => c.id === destinationCity)?.name || destinationCity;
    const destLabel = destinationCity === 'caerleon' && destinationMarket === 'black_market' ? 'Mercado Negro de Caerleon' : destName;

    const taskTitle = `Transportar ${result.transportUnits.toLocaleString()}x ${selectedItemInfo.name} de ${originName} a ${destLabel}`;
    const taskNotes = `Montura: ${selectedMount.name} | Carga: ${result.totalWeightKg.toLocaleString()} kg (${result.capacityPercentage}%) | Beneficio neto: +${result.netProfit.toLocaleString()} Plata (${result.profitPerKg} Plata/kg) | Modalidad: ${orderType === 'buy_order' ? 'Venta Directa' : 'Orden de Venta'}`;

    const now = Date.now();
    const newTask: DailyChecklistItem = {
      id: `transport_${now}_${Math.random().toString(36).substring(2, 6)}`,
      title: taskTitle,
      cityId: originCity,
      category: 'transport',
      isCustomTask: true,
      plotsCount: 1,
      itemId: selectedItemId,
      harvested: false,
      replanted: false,
      usedFocus: false,
      completed: false,
      priority: result.routeInfo.dangerLevel === 'dangerous_red' ? 'high' : 'normal',
      notes: taskNotes,
      createdAt: now,
    };

    onAddTodoTask(newTask);
    showToast('¡Ruta agregada a tu Lista de Cosas por Hacer!');
  };

  // Registrar directamente la venta del transporte en el Libro Mayor de Ventas
  const handleRegisterInSalesLedger = () => {
    const originName = CITIES.find((c) => c.id === originCity)?.name || originCity;
    const destName = CITIES.find((c) => c.id === destinationCity)?.name || destinationCity;
    const isBlackMarket = destinationCity === 'caerleon' && destinationMarket === 'black_market';
    const destCityLabel = isBlackMarket ? 'Caerleon (Mercado Negro)' : destName;

    addRecord({
      itemId: selectedItemId,
      itemName: selectedItemInfo.name,
      tier: selectedItemInfo.tier || 4,
      enchantment: 0,
      quality: 'normal',
      batchCount: result.transportUnits,
      destination: isBlackMarket ? 'black_market' : 'royal_city',
      destinationCityName: destCityLabel,
      unitProductionCost: result.originUnitPrice,
      unitSalePrice: result.destinationUnitPrice,
      productionCostTotal: result.totalInvestmentCost,
      grossRevenue: result.grossRevenue,
      marketTaxPercent: Math.round(result.marketTaxRate * 100),
      setupFeePercent: Math.round(result.setupFeeRate * 1000) / 10,
      totalMarketFees: result.totalMarketFees,
      netRevenue: result.netRevenue,
      netProfit: result.netProfit,
      profitPerUnit: result.profitPerUnit,
      roiPercent: result.roiPercentage,
      notes: `Arbitraje de Transporte: ${originName} ➔ ${destCityLabel} en ${result.mountName} (${result.profitPerKg} Plata/kg)`,
    });

    showToast('¡Operación de transporte registrada exitosamente en el Libro Mayor de Ventas!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500 text-amber-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 size={18} className="text-amber-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Truck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-100">
                  Calculadora de Rutas de Transporte, Carga & Arbitraje
                </h1>
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Arbitraje Albion
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Optimiza tus viajes entre Ciudades Reales y Caerleon. Calcula el beneficio neto, peso por unidad, capacidad de montura y relación Plata / kg.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {onAddTodoTask && (
              <button
                type="button"
                onClick={handleSendToTodoList}
                className="bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Añadir esta ruta a tu lista de tareas diarias"
              >
                <Plus size={14} className="text-amber-400" />
                <span>Añadir a Tareas</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRegisterInSalesLedger}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer transition-all"
              title="Registrar este lote en el Libro Mayor de Ventas"
            >
              <BookOpen size={14} />
              <span>Registrar en Libro Mayor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Configuración de Ruta, Mercancía y Montura (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card: Ruta Comercial & Modalidad de Mercado */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Compass size={16} className="text-amber-400" />
                <span>Ruta Comercial & Modalidad de Mercado</span>
              </h3>

              <button
                type="button"
                onClick={handleSwapCities}
                className="text-xs text-amber-400 hover:text-amber-300 bg-slate-950 border border-slate-800 hover:border-amber-500/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Intercambiar ciudad origen y destino"
              >
                <ArrowLeftRight size={13} />
                <span>Invertir Ruta</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Ciudad Origen */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Ciudad Origen (Compra / Producción):</span>
                </label>
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value as CityId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.id === 'caerleon' ? '(Zona Roja)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ciudad Destino */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Ciudad Destino (Punto de Venta):</span>
                </label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value as CityId)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.id === 'caerleon' ? '(Zona Roja)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configuración de Destino en Caerleon y Tipo de Orden */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
              {/* Selector si el destino es Caerleon */}
              {destinationCity === 'caerleon' ? (
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold flex items-center gap-1">
                    <Crosshair size={12} className="text-rose-400" />
                    <span>Mercado Destino en Caerleon:</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDestinationMarket('royal_market')}
                      className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                        destinationMarket === 'royal_market'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Mercado Real
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinationMarket('black_market')}
                      className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                        destinationMarket === 'black_market'
                          ? 'bg-rose-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Mercado Negro
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Info size={14} className="text-amber-400 shrink-0" />
                  <span>Venta en Mercado de Ciudad Real. Impuestos: {hasPremium ? '4%' : '8%'}</span>
                </div>
              )}

              {/* Selector de Tipo de Orden */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Tipo de Venta en Destino:</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOrderType('sell_order')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                      orderType === 'sell_order'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Orden de Venta (+2.5%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('buy_order')}
                    className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center cursor-pointer ${
                      orderType === 'buy_order'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Venta Inmediata (0% fee)
                  </button>
                </div>
              </div>
            </div>

            {/* Aviso Táctico y de Seguridad de la Ruta */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3.5 text-xs ${
                result.routeInfo.dangerLevel === 'dangerous_red'
                  ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                  : result.routeInfo.dangerLevel === 'mists'
                  ? 'bg-purple-950/25 border-purple-500/40 text-purple-200'
                  : 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {result.routeInfo.dangerLevel === 'dangerous_red' ? (
                <ShieldAlert size={20} className="text-rose-400 shrink-0 mt-0.5" />
              ) : result.routeInfo.dangerLevel === 'mists' ? (
                <AlertTriangle size={20} className="text-purple-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {result.routeInfo.dangerLevel === 'dangerous_red'
                      ? '⚠️ Ruta de Alto Riesgo: Zona Roja hacia Caerleon'
                      : result.routeInfo.dangerLevel === 'mists'
                      ? '🌀 Ruta por Nieblas / Caminos de Avalon'
                      : '🛡️ Ruta Segura por Ciudades Reales'}
                  </span>
                  {result.routeInfo.redZonesCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                      {result.routeInfo.redZonesCount} zonas rojas
                    </span>
                  )}
                </div>

                <p className="opacity-90 leading-relaxed text-slate-300">
                  {result.routeInfo.dangerDescription}
                </p>

                <div className="pt-1 text-[11px] text-amber-300/90 font-medium">
                  <span className="font-bold text-amber-400">Consejo Táctico: </span>
                  {result.routeInfo.tacticalAdvice}
                </div>

                <div className="text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">Montura Recomendada: </span>
                  {result.routeInfo.recommendedMountCategory}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Mercancía, Búsqueda y Cotizaciones */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Scale size={16} className="text-amber-400" />
                <span>Mercancía & Cotizaciones</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSavedPrices}
                  className="text-xs text-amber-400 hover:text-amber-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cargar precios guardados en memoria"
                >
                  <Sparkles size={12} />
                  <span>Usar Precios Guardados</span>
                </button>

                {onOpenAdpModal && (
                  <button
                    type="button"
                    onClick={() => onOpenAdpModal(selectedItemId, selectedItemInfo.name)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Consultar cotizaciones en Albion Data Project"
                  >
                    <span>ADP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Categorías y Barra de Búsqueda Rápida */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'crops_herbs', label: 'Cultivos & Hierbas' },
                  { id: 'farm_animals', label: 'Granja & Animales' },
                  { id: 'food_potions', label: 'Comidas & Pociones' },
                  { id: 'refined_mats', label: 'Recursos Refinados' },
                  { id: 'mounts', label: 'Monturas' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
                    className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ítem (ej: trigo, buey, tabla, pastel)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Selector de Ítem */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Producto a Transportar ({filteredCatalog.length} disponibles):</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  Peso: {result.itemWeightKg} kg / unidad
                </span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
              >
                {filteredCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.categoryLabel}] {item.name} — {item.defaultWeight} kg
                  </option>
                ))}
              </select>
            </div>

            {/* Opción de Peso Personalizado */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={isCustomWeight}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCustomWeight(checked);
                    if (checked) {
                      setCustomWeightInput(result.itemWeightKg);
                    }
                  }}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Personalizar peso unitario (para equipos o ítems no listados)</span>
              </label>

              {isCustomWeight && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Peso:</span>
                  <NumericInput
                    allowDecimals={true}
                    step={0.05}
                    min={0.01}
                    value={customWeightInput}
                    onChange={(v) => setCustomWeightInput(Math.max(0.01, v))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[11px]">kg</span>
                </div>
              )}
            </div>

            {/* Inputs de Precios Origen y Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Precio Origen ({CITIES.find((c) => c.id === originCity)?.name}):</span>
                  <span className="text-slate-400 text-[11px]">Coste Unitario</span>
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={originPrice}
                    onChange={(val) => setOriginPrice(val)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm font-mono font-bold focus:border-amber-500 focus:outline-none pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-amber-400 font-bold">
                    Plata
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Precio Destino ({CITIES.find((c) => c.id === destinationCity)?.name}):</span>
                  <span className="text-slate-400 text-[11px]">Venta Estimada</span>
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={destinationPrice}
                    onChange={(val) => setDestinationPrice(val)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm font-mono font-bold focus:border-amber-500 focus:outline-none pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-amber-400 font-bold">
                    Plata
                  </span>
                </div>
              </div>
            </div>

            {/* Indicador de Umbral de Equilibrio (Break-Even) */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Precio Mínimo de Equilibrio:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  {result.breakEvenSellPrice.toLocaleString()} Plata / u
                </span>
              </div>
              <div>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-full border text-[11px] ${
                    destinationPrice >= result.breakEvenSellPrice
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {destinationPrice >= result.breakEvenSellPrice
                    ? `+${(destinationPrice - result.breakEvenSellPrice).toLocaleString()} Plata sobre coste`
                    : `-${(result.breakEvenSellPrice - destinationPrice).toLocaleString()} Plata bajo coste`}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Montura de Transporte y Modificadores de Peso */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Truck size={16} className="text-amber-400" />
              <span>Montura y Capacidad de Carga</span>
            </h3>

            {/* Selector de Montura */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Selecciona tu Montura de Transporte:</span>
                {selectedMount.courierPassive && (
                  <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                    <ShieldCheck size={13} /> Carga Pasiva Retenida
                  </span>
                )}
              </label>
              <select
                value={selectedMountId}
                onChange={(e) => setSelectedMountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
              >
                {TRANSPORT_MOUNTS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.baseCapacityKg.toLocaleString()} kg ({m.speedBonus})
                    {m.courierPassive ? ' [Carga Pasiva]' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 italic">
                {selectedMount.description}
              </p>
            </div>

            {/* Modificadores: Pastel de Cerdo y Bolsa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Pastel de Cerdo */}
              <label className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={hasPorkPie}
                  onChange={(e) => setHasPorkPie(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-200 block">Pastel de Cerdo (+30%)</span>
                  <span className="text-slate-400 text-[11px]">Multiplica la carga total (montura + bolsa)</span>
                </div>
              </label>

              {/* Bolsa de Viaje */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Bolsa de Viaje:
                </label>
                <select
                  value={selectedBagCapacity}
                  onChange={(e) => setSelectedBagCapacity(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                >
                  {BAG_OPTIONS.map((b, idx) => (
                    <option key={idx} value={b.capacity}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modo de Cantidad */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Modo de Carga:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomQuantity(false)}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      !isCustomQuantity
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Llenar Montura (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomQuantity(true);
                      if (customUnits <= 0) setCustomUnits(result.maxUnitsByWeight);
                    }}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      isCustomQuantity
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Cantidad Manual
                  </button>
                </div>
              </div>

              {isCustomQuantity && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400 shrink-0">
                    Unidades a llevar:
                  </label>
                  <NumericInput
                    min={1}
                    value={customUnits}
                    onChange={(val) => setCustomUnits(Math.max(1, val))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomUnits(result.maxUnitsByWeight)}
                    className="shrink-0 text-xs text-amber-400 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-lg hover:border-amber-500/50 cursor-pointer"
                  >
                    Máx ({result.maxUnitsByWeight.toLocaleString()})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Monitor de Carga y Resultados Financieros (5 columnas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-amber-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Cálculo de Transporte
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para calcular capacidad de montura ({result.effectiveCapacityKg.toLocaleString()} kg), beneficio neto y plata/kg sin residuos de rutas previas.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasCalculated && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Limpiar cálculo de pantalla"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}

              <button
                type="button"
                id="btn-calculate-transport-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-amber-500/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Transporte'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Esperando Activación Manual
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Selecciona la ciudad de origen y destino, la mercancía y la montura. Presiona el botón{' '}
                <strong className="text-amber-300">"Dar Resultado / Calcular Transporte"</strong> para ver el desglose de peso, arbitraje y beneficio neto.
              </p>
            </div>
          ) : (
            <>
          {/* Card: Monitor de Carga y Peso */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scale size={16} className="text-amber-400" />
                <span>Capacidad y Peso de Carga</span>
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  result.capacityPercentage > 100
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : result.capacityPercentage > 85
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {result.capacityPercentage}% de carga
              </span>
            </h3>

            {/* Barra de progreso de peso */}
            <div className="space-y-1.5">
              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    result.capacityPercentage > 100
                      ? 'bg-rose-500'
                      : result.capacityPercentage > 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, result.capacityPercentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{result.totalWeightKg.toLocaleString()} kg transportados</span>
                <span>Máx seguro: {result.effectiveCapacityKg.toLocaleString()} kg</span>
              </div>
            </div>

            {/* Estado de sobrecarga */}
            {result.isOverloaded && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">¡Advertencia de Sobrecarga!</span>
                  <span>
                    {result.isSeverelyOverloaded
                      ? 'Excedes el 200% de la capacidad. Tu personaje quedará totalmente inmovilizado en el suelo.'
                      : 'Excedes el 100% de tu capacidad. Tu velocidad se reducirá drásticamente, haciéndote presa fácil de gankers.'}
                  </span>
                </div>
              </div>
            )}

            {/* Resumen de Unidades */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Unidades en Montura:</span>
                <span className="text-base font-mono font-bold text-slate-100 tabular-nums">
                  {result.transportUnits.toLocaleString()} u
                </span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Capacidad Máx (100%):</span>
                <span className="text-base font-mono font-bold text-amber-400 tabular-nums">
                  {result.maxUnitsByWeight.toLocaleString()} u
                </span>
              </div>
            </div>
          </div>

          {/* Card: Métricas Financieras y Ganancia Neta */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Coins size={16} className="text-amber-400" />
                <span>Rendimiento del Viaje</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {result.destinationMarket === 'black_market' && result.orderType === 'buy_order'
                  ? 'Mercado Negro (0% fee)'
                  : hasPremium
                  ? 'Premium (4% tax)'
                  : 'Sin Premium (8% tax)'}
              </span>
            </div>

            {/* Métrica Destacada: Plata ganada por Kilogramo */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 text-center space-y-1">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Eficiencia de Carga (Métrica Clave)
              </span>
              <div className="text-3xl font-black font-mono tabular-nums text-slate-100">
                {result.profitPerKg.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
                <span className="text-sm font-bold text-amber-400">Plata / kg</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Indica cuánto ganas por cada kilogramo de carga en esta ruta.
              </p>
            </div>

            {/* Ganancia Neta Total */}
            <div
              className={`p-4 rounded-xl border text-center space-y-1 ${
                result.netProfit > 0
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <span className="text-xs font-semibold text-slate-400 block">
                Beneficio Neto Estimado del Viaje:
              </span>
              <div
                className={`text-2xl font-black font-mono tabular-nums ${
                  result.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.netProfit > 0 ? '+' : ''}
                {formatSilver(result.netProfit)} Plata
              </div>
              <div className="flex items-center justify-center gap-3 text-xs font-mono font-bold text-slate-300 pt-1">
                <span className="tabular-nums">ROI: {result.roiPercentage}%</span>
                <span>•</span>
                <span className="tabular-nums">Margen: {result.netMarginPercentage}%</span>
                <span>•</span>
                <span className="tabular-nums">
                  {result.profitPerUnit > 0 ? '+' : ''}
                  {formatSilver(result.profitPerUnit)} Plata/u
                </span>
              </div>
            </div>

            {/* Desglose Detallado de Costes e Impuestos */}
            <div className="space-y-2 text-xs pt-1 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Inversión Requerida (Compra/Coste):</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatSilver(result.totalInvestmentCost)} Plata
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Ingreso Bruto de Venta:</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatSilver(result.grossRevenue)} Plata
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>
                  Tasas de Mercado ({Math.round(result.marketTaxRate * 100)}% impuesto +{' '}
                  {Math.round(result.setupFeeRate * 1000) / 10}% publicación):
                </span>
                <span className="font-mono text-rose-400 tabular-nums">
                  -{formatSilver(result.totalMarketFees)} Plata
                </span>
              </div>

              <div className="flex justify-between font-bold text-slate-200 pt-1.5 border-t border-slate-800">
                <span>Ingreso Neto Recibido:</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {formatSilver(result.netRevenue)} Plata
                </span>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
