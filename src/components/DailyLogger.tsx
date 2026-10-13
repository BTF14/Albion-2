import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlbionItem, CategoryType, CityId, DailyLogEntry, PriceMemory, DestinyMasteryProfile } from '../types';
import { ALBION_ITEMS, CITIES } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { NumericInput } from './NumericInput';
import { getLocalDateString } from '../utils/date';
import { loadMasteryProfile, calculateFocusCost } from '../utils/destinyBoard';
import { getPriceCacheStatus } from '../utils/storage';
import { calculateHarvestEconomy } from '../domain/use-cases/calculateHarvestEconomy';
import { AlbionDataQuickButton } from './AlbionDataQuickButton';
import { findCookingOpportunitiesFromHarvest, CookingOpportunityFromHarvest } from '../domain/use-cases/findCookingOpportunitiesFromHarvest';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Save,
  Check,
  Zap,
  PackageCheck,
  Wheat,
  Sprout,
  Egg,
  Beef,
  Award,
  Calculator,
  AlertCircle,
  RefreshCw,
  Calendar,
  Clock,
  Utensils,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export interface CalculationResult {
  seedsCost: number;
  foodCost: number;
  totalExtraFees: number;
  totalCosts: number;
  productGross: number;
  surplusGross: number;
  surplusNet: number;
  grossRevenue: number;
  marketTaxAmount: number;
  netRevenue: number;
  netProfit: number;
  profitPerSlot: number;
  silverPerFocus: number;
  roi: number;
  isProfit: boolean;
  snapshot: {
    itemName: string;
    cityName: string;
    plotsCount: number;
    slotsCount: number;
    harvestedAmount: number;
    productUnitPrice: number;
    seedUnitPrice: number;
    reboughtSeeds: number;
    returnedSeeds: number;
    usedFocus: boolean;
    focusPoints: number;
    calculatedAt: string;
  };
}

interface DailyLoggerProps {
  selectedCityId: CityId;
  defaultPlots: number;
  defaultTaxRate: number;
  priceMemory: PriceMemory;
  onSaveEntry: (entry: DailyLogEntry) => void;
  onUpdatePrices: (itemId: string, prices: { lastSeedPrice?: number; lastProductPrice?: number; lastFoodPrice?: number }) => void;
  presetData?: { itemId?: string; plotsCount?: number; targetDate?: string } | null;
  onClearPreset?: () => void;
  onOpenAdpModal?: (itemId: string, targetType?: 'product' | 'seed_or_baby') => void;
  onNavigateToCooking?: (recipeId: string, harvestAmount: number) => void;
  onNavigateToButcher?: (animalId: string, animalCount: number) => void;
  activeCharacterId?: string;
  activeCharacterName?: string;
}

export const DailyLogger: React.FC<DailyLoggerProps> = ({
  selectedCityId,
  defaultPlots,
  defaultTaxRate,
  priceMemory,
  onSaveEntry,
  onUpdatePrices,
  presetData,
  onClearPreset,
  onOpenAdpModal,
  onNavigateToCooking,
  onNavigateToButcher,
  activeCharacterId,
  activeCharacterName,
}) => {
  // Fecha del registro
  const [logDateStr, setLogDateStr] = useState<string>(() => {
    return presetData?.targetDate || getLocalDateString();
  });

  // Categoría seleccionada
  const [activeCategory, setActiveCategory] = useState<CategoryType>('crop');

  // Items de la categoría activa
  const categoryItems = useMemo(() => {
    return ALBION_ITEMS.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  // Item seleccionado actualmente
  const [selectedItemId, setSelectedItemId] = useState<string>('crop_wheat');

  // Referencia al último item cargado para evitar sobreescritura accidental
  const lastLoadedItemIdRef = useRef<string>('');

  // Asegurar que el selectedItemId pertenezca a la categoría activa
  useEffect(() => {
    if (!categoryItems.some((i) => i.id === selectedItemId)) {
      setSelectedItemId(categoryItems[0]?.id || 'crop_wheat');
    }
  }, [categoryItems, selectedItemId]);

  const currentItem = useMemo(() => {
    return ALBION_ITEMS.find((item) => item.id === selectedItemId) || ALBION_ITEMS[0];
  }, [selectedItemId]);

  // Ciudad activa y bonificación
  const currentCity = useMemo(() => {
    return CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  }, [selectedCityId]);

  const hasCityBonus = useMemo(() => {
    if (selectedCityId === 'brecilien' && currentItem.category === 'crop') return true;
    return currentItem.bonusCityIds.includes(selectedCityId);
  }, [currentItem, selectedCityId]);

  const cityBonusMultiplier = useMemo(() => {
    if (selectedCityId === 'brecilien' && currentItem.category === 'crop') return 1.15;
    if (currentItem.bonusCityIds.includes(selectedCityId)) return 1.10;
    return 1.0;
  }, [currentItem, selectedCityId]);

  // Parcelas y casillas
  const [plotsCount, setPlotsCount] = useState<number>(defaultPlots);
  const slotsCount = plotsCount * 9;

  // Semillas / Crías devueltas y recompradas
  const [returnedSeeds, setReturnedSeeds] = useState<number>(() => Math.floor(defaultPlots * 9 * 0.8));
  const [reboughtSeeds, setReboughtSeeds] = useState<number>(() => Math.max(0, defaultPlots * 9 - Math.floor(defaultPlots * 9 * 0.8)));
  const [seedUnitPrice, setSeedUnitPrice] = useState<number>(2400);

  // Excedente de semillas (cuando returnedSeeds > slotsCount, típico con foco)
  const [monetizeSurplus, setMonetizeSurplus] = useState<boolean>(true);

  // Cantidad cosechada y precio de venta
  const [harvestedAmount, setHarvestedAmount] = useState<number>(() => defaultPlots * 9 * 9);
  const [productUnitPrice, setProductUnitPrice] = useState<number>(380);

  // Alimento (para ganadería)
  const [requiresFood, setRequiresFood] = useState<boolean>(false);
  const [foodUnits, setFoodUnits] = useState<number>(defaultPlots * 9 * 10);
  const [foodUnitPrice, setFoodUnitPrice] = useState<number>(0);
  const [usesOwnCropForFood, setUsesOwnCropForFood] = useState<boolean>(true);

  // Tasa de carnicería (para matanza)
  const [butcherFee, setButcherFee] = useState<number>(0);

  // Foco y Maestría de la Tabla del Destino sincronizada en tiempo real
  const [masteryProfile, setMasteryProfile] = useState<DestinyMasteryProfile>(() => loadMasteryProfile());

  useEffect(() => {
    const handleMasteryUpdate = () => {
      setMasteryProfile(loadMasteryProfile());
    };
    window.addEventListener('albion_mastery_updated', handleMasteryUpdate);
    window.addEventListener('storage', handleMasteryUpdate);
    return () => {
      window.removeEventListener('albion_mastery_updated', handleMasteryUpdate);
      window.removeEventListener('storage', handleMasteryUpdate);
    };
  }, []);

  const destinyFocusCost = useMemo(() => {
    return calculateFocusCost(selectedItemId, masteryProfile);
  }, [selectedItemId, masteryProfile]);

  const [usedFocus, setUsedFocus] = useState<boolean>(false);
  const [focusPoints, setFocusPoints] = useState<number>(() => {
    const prof = loadMasteryProfile();
    const eff = calculateFocusCost(selectedItemId, prof);
    return eff.focusCostPerSlot * defaultPlots * 9;
  });

  // Impuesto de mercado
  const [taxPercent, setTaxPercent] = useState<number>(defaultTaxRate);

  // Notas opcionales y estado de guardado
  const [notes, setNotes] = useState<string>('');
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  // ESTADO DE CÁLCULO CONTROLADO (NO AUTOMÁTICO AL INSTANTE PARA EVITAR CONFLICTOS CON MEMORIAS PREVIAS)
  const [calculatedResult, setCalculatedResult] = useState<CalculationResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const markStale = () => {
    setIsStale(true);
  };

  // Resetear resultado calculado al cambiar de categoría o de ítem para evitar conflicto con memoria anterior
  const handleCategoryChange = (cat: CategoryType) => {
    setActiveCategory(cat);
    setCalculatedResult(null);
    setIsStale(false);
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    setCalculatedResult(null);
    setIsStale(false);
  };

  // CARGA SEGURA DE PRECIOS Y VALORES BASE AL CAMBIAR DE ÍTEM
  useEffect(() => {
    if (lastLoadedItemIdRef.current === selectedItemId) {
      return;
    }
    lastLoadedItemIdRef.current = selectedItemId;

    // Resetear cálculo de pantalla para no mezclar con el ítem anterior
    setCalculatedResult(null);
    setIsStale(false);

    const mem = priceMemory[selectedItemId];
    if (mem) {
      if (mem.lastSeedPrice !== undefined) setSeedUnitPrice(mem.lastSeedPrice);
      if (mem.lastProductPrice !== undefined) setProductUnitPrice(mem.lastProductPrice);
      if (mem.lastFoodPrice !== undefined) {
        setFoodUnitPrice(mem.lastFoodPrice);
        setUsesOwnCropForFood(mem.lastFoodPrice === 0);
      }
    } else {
      // Valores por defecto estimados sensatos según Tier
      if (currentItem.category === 'crop') {
        setSeedUnitPrice(2000 + currentItem.tier * 400);
        setProductUnitPrice(300 + currentItem.tier * 60);
      } else if (currentItem.category === 'herb') {
        setSeedUnitPrice(2500 + currentItem.tier * 500);
        setProductUnitPrice(380 + currentItem.tier * 70);
      } else if (currentItem.category === 'animal_produce') {
        setSeedUnitPrice(0);
        setProductUnitPrice(280 + currentItem.tier * 50);
      } else if (currentItem.category === 'animal_meat') {
        setSeedUnitPrice(3000 + currentItem.tier * 1000);
        setProductUnitPrice(400 + currentItem.tier * 80);
      }
    }

    const isAnimal = currentItem.category === 'animal_produce' || currentItem.category === 'animal_meat';
    setRequiresFood(isAnimal);

    // Ajustar cantidades iniciales según tipo y bono de ciudad
    const curSlots = plotsCount * 9;
    const bonusMultiplier = cityBonusMultiplier;

    if (currentItem.category === 'animal_produce') {
      setReturnedSeeds(curSlots);
      setReboughtSeeds(0);
      setHarvestedAmount(Math.round(curSlots * (currentItem.defaultYieldPerSlot || 8) * bonusMultiplier));
    } else if (currentItem.category === 'animal_meat') {
      setReturnedSeeds(0);
      setReboughtSeeds(curSlots);
      setHarvestedAmount(Math.round(curSlots * (currentItem.defaultYieldPerSlot || 18) * bonusMultiplier));
    } else {
      const targetRate = usedFocus ? currentItem.defaultSeedReturnWithFocus : currentItem.defaultSeedReturnWithoutFocus;
      const returnRatio = (typeof targetRate === 'number' ? targetRate : 80) / 100;
      const estReturn = Math.round(curSlots * returnRatio);
      setReturnedSeeds(estReturn);
      setReboughtSeeds(Math.max(0, curSlots - estReturn));
      setHarvestedAmount(Math.round(curSlots * (currentItem.defaultYieldPerSlot || 9) * bonusMultiplier));
    }

    setFoodUnits(curSlots * (currentItem.foodPerCycle || 10));
  }, [selectedItemId, currentItem, cityBonusMultiplier, plotsCount, usedFocus, priceMemory]);

  // Sincronización reactiva inmediata cuando se aplica un precio desde el modal de ADP para el ítem actual
  const prevItemMemoryRef = useRef(priceMemory[selectedItemId]);
  useEffect(() => {
    const currMem = priceMemory[selectedItemId];
    const prevMem = prevItemMemoryRef.current;
    prevItemMemoryRef.current = currMem;

    if (currMem && lastLoadedItemIdRef.current === selectedItemId) {
      let updated = false;
      if (currMem.lastSeedPrice !== undefined && currMem.lastSeedPrice !== prevMem?.lastSeedPrice) {
        setSeedUnitPrice(currMem.lastSeedPrice);
        updated = true;
      }
      if (currMem.lastProductPrice !== undefined && currMem.lastProductPrice !== prevMem?.lastProductPrice) {
        setProductUnitPrice(currMem.lastProductPrice);
        updated = true;
      }
      if (currMem.lastFoodPrice !== undefined && currMem.lastFoodPrice !== prevMem?.lastFoodPrice) {
        setFoodUnitPrice(currMem.lastFoodPrice);
        setUsesOwnCropForFood(currMem.lastFoodPrice === 0);
        updated = true;
      }
      if (updated) {
        setIsStale(true);
      }
    }
  }, [priceMemory, selectedItemId]);

  // Estado de frescura TTL (6h) del precio guardado en LocalStorage
  const itemPriceCacheStatus = useMemo(() => {
    const mem = priceMemory[selectedItemId];
    return mem?.updatedAt ? getPriceCacheStatus(mem.updatedAt) : null;
  }, [priceMemory, selectedItemId]);

  // Restablecer valores de cantidades sugeridos por el juego
  const handleResetToDefaults = () => {
    const curSlots = Math.max(1, plotsCount) * 9;
    const bonusMultiplier = cityBonusMultiplier;

    if (currentItem.category === 'animal_produce') {
      setReturnedSeeds(curSlots);
      setReboughtSeeds(0);
      setHarvestedAmount(Math.round(curSlots * (currentItem.defaultYieldPerSlot || 8) * bonusMultiplier));
    } else if (currentItem.category === 'animal_meat') {
      setReturnedSeeds(0);
      setReboughtSeeds(curSlots);
      setHarvestedAmount(Math.round(curSlots * (currentItem.defaultYieldPerSlot || 18) * bonusMultiplier));
    } else {
      const targetRate = usedFocus ? currentItem.defaultSeedReturnWithFocus : currentItem.defaultSeedReturnWithoutFocus;
      const returnRatio = (typeof targetRate === 'number' ? targetRate : 80) / 100;
      const estReturn = Math.round(curSlots * returnRatio);
      setReturnedSeeds(estReturn);
      setReboughtSeeds(Math.max(0, curSlots - estReturn));
      setHarvestedAmount(Math.round(curSlots * (currentItem.defaultYieldPerSlot || 9) * bonusMultiplier));
    }

    setFoodUnits(curSlots * (currentItem.foodPerCycle || 10));
    markStale();
  };

  // Actualizar valores al cambiar el número de parcelas
  const handlePlotsChange = (newPlots: number) => {
    setPlotsCount(newPlots);
    const validPlots = newPlots <= 0 ? 1 : Math.min(30, newPlots);
    const newSlots = validPlots * 9;
    markStale();

    const bonusMultiplier = cityBonusMultiplier;

    if (currentItem.category === 'animal_produce') {
      setReturnedSeeds(newSlots);
      setReboughtSeeds(0);
    } else if (currentItem.category === 'animal_meat') {
      setReturnedSeeds(0);
      setReboughtSeeds(newSlots);
    } else {
      const targetRate = usedFocus ? currentItem.defaultSeedReturnWithFocus : currentItem.defaultSeedReturnWithoutFocus;
      const returnRatio = (typeof targetRate === 'number' ? targetRate : 80) / 100;
      const estReturn = Math.round(newSlots * returnRatio);
      setReturnedSeeds(estReturn);
      setReboughtSeeds(Math.max(0, newSlots - estReturn));
    }

    setHarvestedAmount(Math.round(newSlots * (currentItem.defaultYieldPerSlot || 9) * bonusMultiplier));
    setFoodUnits(newSlots * (currentItem.foodPerCycle || 10));
    if (usedFocus) {
      setFocusPoints(destinyFocusCost.focusCostPerSlot * newSlots);
    }
  };

  // Cargar datos preestablecidos si se navega desde el Calendario o Temporizadores
  useEffect(() => {
    if (presetData) {
      if (presetData.targetDate) {
        setLogDateStr(presetData.targetDate);
      }
      if (presetData.itemId) {
        const item = ALBION_ITEMS.find((i) => i.id === presetData.itemId);
        if (item) {
          setActiveCategory(item.category);
          setSelectedItemId(item.id);
        }
      }
      if (presetData.plotsCount && presetData.plotsCount > 0) {
        setPlotsCount(presetData.plotsCount);
        if (usedFocus) {
          setFocusPoints(destinyFocusCost.focusCostPerSlot * (presetData.plotsCount * 9));
        }
      }
      if (onClearPreset) {
        onClearPreset();
      }
    }
  }, [presetData, onClearPreset, usedFocus, destinyFocusCost]);

  // Cambio dinámico de uso de foco con recálculo automático de semillas devueltas
  const handleToggleFocus = (enabled: boolean) => {
    setUsedFocus(enabled);
    markStale();
    if (enabled) {
      setFocusPoints(destinyFocusCost.focusCostPerSlot * slotsCount);
    }
    if (currentItem.category !== 'animal_produce') {
      const targetRate = enabled ? currentItem.defaultSeedReturnWithFocus : currentItem.defaultSeedReturnWithoutFocus;
      const returnRatio = (typeof targetRate === 'number' ? targetRate : 80) / 100;
      const estReturn = Math.round(slotsCount * returnRatio);
      setReturnedSeeds(estReturn);
      setReboughtSeeds(Math.max(0, slotsCount - estReturn));
    }
  };

  // Al cambiar semillas devueltas manualmente
  const handleReturnedSeedsChange = (val: number) => {
    const num = Math.max(0, val);
    setReturnedSeeds(num);
    markStale();
    if (currentItem.category !== 'animal_produce') {
      setReboughtSeeds(Math.max(0, slotsCount - num));
    }
  };

  // Excedente de semillas (cuando cosechas con foco y te dan > 100% de semillas)
  const surplusSeeds = Math.max(0, returnedSeeds - slotsCount);

  // Función que evalúa las finanzas delegando en el Caso de Uso de Dominio Puro
  const computeFinancials = (): CalculationResult => {
    const econ = calculateHarvestEconomy({
      category: currentItem.category,
      tier: currentItem.tier,
      plotsCount,
      slotsCount,
      returnedSeeds,
      reboughtSeeds,
      seedUnitPrice,
      surplusSeeds,
      monetizeSurplus,
      harvestedAmount,
      productUnitPrice,
      requiresFood,
      foodUnits,
      foodUnitPrice,
      usesOwnCropForFood,
      butcherFee,
      usedFocus,
      focusPointsSpent: focusPoints,
      taxPercent,
    });

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      seedsCost: econ.seedsCost,
      foodCost: econ.foodCost,
      totalExtraFees: econ.totalExtraFees,
      totalCosts: econ.totalCosts,
      productGross: econ.productGross,
      surplusGross: econ.surplusGross,
      surplusNet: econ.surplusNet,
      grossRevenue: econ.grossRevenue,
      marketTaxAmount: econ.marketTaxAmount,
      netRevenue: econ.netRevenue,
      netProfit: econ.netProfit,
      profitPerSlot: econ.profitPerSlot,
      silverPerFocus: econ.silverPerFocus,
      roi: Number(econ.roiPercent.toFixed(1)),
      isProfit: econ.isProfitable,
      snapshot: {
        itemName: currentItem.nameEs,
        cityName: currentCity.name,
        plotsCount,
        slotsCount,
        harvestedAmount,
        productUnitPrice,
        seedUnitPrice,
        reboughtSeeds,
        returnedSeeds,
        usedFocus,
        focusPoints,
        calculatedAt: timeStr,
      },
    };
  };

  // Trigger manual del usuario: procesa y muestra los resultados solo cuando se presiona el botón
  const handleCalculateResult = () => {
    const result = computeFinancials();
    setCalculatedResult(result);
    setIsStale(false);

    // Desplazamiento suave para visualizar el veredicto
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const box = document.getElementById('profit-verdict-box');
      if (box) {
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  };

  // Guardar entrada diaria
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Asegurar que el cálculo sea fresco y verificado con los datos actuales
    const activeCalcs = (!calculatedResult || isStale) ? computeFinancials() : calculatedResult;
    if (!calculatedResult || isStale) {
      setCalculatedResult(activeCalcs);
      setIsStale(false);
    }

    const newEntry: DailyLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      dateStr: logDateStr || getLocalDateString(),
      cityId: selectedCityId,
      category: activeCategory,
      itemId: currentItem.id,
      itemName: currentItem.nameEs,
      tier: currentItem.tier,
      characterId: activeCharacterId,
      characterName: activeCharacterName,
      plotsCount,
      slotsCount,
      returnedSeedsOrBabies: returnedSeeds,
      reboughtSeedsOrBabies: reboughtSeeds,
      seedOrBabyUnitPrice: seedUnitPrice,
      surplusSeedsCount: surplusSeeds,
      surplusSeedsRevenue: monetizeSurplus ? activeCalcs.surplusNet : 0,
      harvestedAmount,
      productUnitPrice,
      foodConsumedUnits: requiresFood ? foodUnits : undefined,
      foodUnitPrice: requiresFood && !usesOwnCropForFood ? foodUnitPrice : 0,
      extraFees: butcherFee,
      usedFocus,
      focusPointsSpent: usedFocus ? focusPoints : 0,
      marketTaxPercent: taxPercent,
      seedsRebuyCost: activeCalcs.seedsCost,
      foodCost: activeCalcs.foodCost,
      totalCosts: activeCalcs.totalCosts,
      grossRevenue: activeCalcs.grossRevenue,
      marketTaxAmount: activeCalcs.marketTaxAmount,
      netRevenue: activeCalcs.netRevenue,
      netProfit: activeCalcs.netProfit,
      profitPerSlot: activeCalcs.profitPerSlot,
      silverPerFocus: activeCalcs.silverPerFocus,
      notes: notes.trim() || undefined,
    };

    // Guardar precios en memoria
    onUpdatePrices(currentItem.id, {
      lastSeedPrice: seedUnitPrice,
      lastProductPrice: productUnitPrice,
      lastFoodPrice: usesOwnCropForFood ? 0 : foodUnitPrice,
    });

    onSaveEntry(newEntry);
    setJustSaved(true);
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
    savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div id="daily-logger-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header con información de la isla */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <PackageCheck className="text-amber-400" size={24} />
            Registro Diario de Cosecha & Recompra
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresa lo que obtuviste hoy y los precios actuales del mercado para auditar tu <strong>ganancia o pérdida real</strong>.
          </p>
        </div>

        {/* Selector de fecha e Indicador de ciudad activa */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <Calendar size={14} className="text-amber-400" />
            <span className="text-slate-400">Fecha:</span>
            <input
              type="date"
              value={logDateStr}
              onChange={(e) => setLogDateStr(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer text-xs"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Isla:</span>
            <span className="font-bold text-amber-400">{currentCity.name}</span>
            {hasCityBonus && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-emerald-500/30 flex items-center gap-1">
                <Sparkles size={12} /> {selectedCityId === 'brecilien' && currentItem.category === 'crop' ? '+15% Bono' : '+10% Bono'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selector de categoría */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <button
          type="button"
          id="tab-category-crop"
          onClick={() => handleCategoryChange('crop')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
            activeCategory === 'crop'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-1 ring-amber-400/40'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Wheat size={16} />
          Cultivos (Vegetales)
        </button>

        <button
          type="button"
          id="tab-category-herb"
          onClick={() => handleCategoryChange('herb')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
            activeCategory === 'herb'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md ring-1 ring-purple-400/40'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Sprout size={16} />
          Huerto de Hierbas
        </button>

        <button
          type="button"
          id="tab-category-animal-produce"
          onClick={() => handleCategoryChange('animal_produce')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
            activeCategory === 'animal_produce'
              ? 'bg-sky-600 text-white border-sky-500 shadow-md ring-1 ring-sky-400/40'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Egg size={16} />
          Huevos & Leche (Vivo)
        </button>

        <button
          type="button"
          id="tab-category-animal-meat"
          onClick={() => handleCategoryChange('animal_meat')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 border cursor-pointer ${
            activeCategory === 'animal_meat'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-1 ring-rose-400/40'
              : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Beef size={16} />
          Matanza (Carne Cruda)
        </button>
      </div>

      {/* Selector de ítems específicos de la categoría */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Selecciona lo que sembraste / criaste:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2">
          {categoryItems.map((item) => {
            const isSelected = item.id === selectedItemId;
            const itemHasBonus =
              (selectedCityId === 'brecilien' && item.category === 'crop') ||
              item.bonusCityIds.includes(selectedCityId);

            return (
              <button
                key={item.id}
                id={`select-item-${item.id}`}
                type="button"
                onClick={() => handleItemChange(item.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-amber-400 shadow-sm ring-1 ring-amber-400/50'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  <ItemIcon name={item.iconName} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs text-slate-100 truncate">{item.nameEs}</span>
                    <AlbionItemBadge tier={item.tier} size="xs" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                    <span className="truncate">{item.nameEn}</span>
                    {itemHasBonus && (
                      <span className="text-[10px] font-bold text-emerald-400 shrink-0 flex items-center gap-0.5">
                        <Sparkles size={10} /> {selectedCityId === 'brecilien' && item.category === 'crop' ? '+15%' : '+10%'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario de Registro Diario */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Fila 1: Configuración de Parcelas y Semillas devueltas/recompradas */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              1. Configuración de Terreno & Semillas de {currentItem.nameEs}
            </span>
            {/* Accesos rápidos de parcelas y restablecer */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 mr-1">Rápido:</span>
                {[1, 2, 4, 5, 10].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePlotsChange(p)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      plotsCount === p
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p}p ({p * 9})
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-slate-400 hover:text-amber-300 underline text-[11px] cursor-pointer"
                title="Restablecer estimaciones recomendadas del juego para este ítem"
              >
                ↺ Valores recomendados
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Parcelas */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Parcelas sembradas:
              </label>
              <div className="flex items-center gap-2">
                <NumericInput
                  id="input-plots-count"
                  min={1}
                  max={30}
                  value={plotsCount}
                  onChange={handlePlotsChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400 font-mono shrink-0">
                  = {slotsCount} slots
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">1 parcela = 9 casillas de cultivo.</p>
            </div>

            {/* Semillas recuperadas hoy */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {currentItem.category === 'animal_meat'
                  ? 'Crías recuperadas:'
                  : currentItem.category === 'animal_produce'
                  ? 'Animales vivos en corrales:'
                  : 'Semillas recuperadas en cosecha:'}
              </label>
              <NumericInput
                id="input-returned-seeds"
                min={0}
                value={returnedSeeds}
                onChange={handleReturnedSeedsChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                De {slotsCount} casillas sembradas.
              </p>
            </div>

            {/* Semillas que tienes que recomprar para resembrar */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                {currentItem.category === 'animal_meat'
                  ? 'Crías a comprar para reponer:'
                  : currentItem.category === 'animal_produce'
                  ? 'Animales a reponer:'
                  : 'Semillas a recomprar para resembrar:'}
              </label>
              <NumericInput
                id="input-rebought-seeds"
                min={0}
                value={reboughtSeeds}
                onChange={(val) => {
                  setReboughtSeeds(val);
                  markStale();
                }}
                className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-sm text-amber-200 font-bold focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Faltan para completar {slotsCount} casillas.
              </p>
            </div>

            {/* Precio unitario de la semilla / cría */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Precio unitario semilla / cría:
                </label>
                <div className="flex items-center gap-1.5">
                  {onOpenAdpModal && (
                    <AlbionDataQuickButton
                      itemId={selectedItemId}
                      targetType="seed_or_baby"
                      onOpenModal={onOpenAdpModal}
                      label="ADP"
                    />
                  )}
                  {itemPriceCacheStatus && (
                    <span
                      className={`text-[10px] flex items-center gap-1 font-medium ${
                        itemPriceCacheStatus.isExpired ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                      title={
                        itemPriceCacheStatus.isExpired
                          ? `Guardado hace más de 6h (${itemPriceCacheStatus.formattedAge}). Se recomienda actualizar en mercado.`
                          : `Guardado en memoria (${itemPriceCacheStatus.formattedAge}). Vigente por ${itemPriceCacheStatus.formattedRemaining}.`
                      }
                    >
                      <Clock size={10} />
                      {itemPriceCacheStatus.isExpired ? 'Expirado (>6h)' : itemPriceCacheStatus.formattedAge}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <NumericInput
                  id="input-seed-unit-price"
                  min={0}
                  value={seedUnitPrice}
                  onChange={(val) => {
                    setSeedUnitPrice(val);
                    markStale();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">🪙</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Costo estimado: <strong className="text-rose-400 font-mono">-{(reboughtSeeds * seedUnitPrice).toLocaleString()}</strong>
              </p>
            </div>
          </div>

          {/* Banner de Excedente de Semillas (Típico con Foco) */}
          {surplusSeeds > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-950/50 border border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-300">
                    ¡Cosecha con excedente! Tienes {surplusSeeds} semillas extras por encima de tus {slotsCount} casillas.
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Valor de venta estimado en el mercado: ~{(surplusSeeds * seedUnitPrice).toLocaleString()} Plata
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded border border-emerald-800/80 shrink-0">
                <input
                  type="checkbox"
                  checked={monetizeSurplus}
                  onChange={(e) => {
                    setMonetizeSurplus(e.target.checked);
                    markStale();
                  }}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-200 font-semibold text-xs">
                  Sumar valor estimado (+{Math.round(surplusSeeds * seedUnitPrice * (1 - taxPercent / 100)).toLocaleString()} 🪙) a ganancia
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Fila 2: Cosecha y Precio de Venta */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              2. Producción Cosechada & Precios de Venta
            </span>
            {hasCityBonus && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles size={12} /> Bono de {currentCity.name} aplicado a la producción
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cantidad cosechada */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {currentItem.category === 'animal_meat'
                  ? 'Carne cruda total obtenida:'
                  : currentItem.category === 'animal_produce'
                  ? 'Huevos / Leche recolectados:'
                  : 'Cantidad total de producto cosechado:'}
              </label>
              <NumericInput
                id="input-harvested-amount"
                min={0}
                value={harvestedAmount}
                onChange={(val) => {
                  setHarvestedAmount(val);
                  markStale();
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Promedio: {slotsCount > 0 ? (harvestedAmount / slotsCount).toFixed(1) : 0} unidades/casilla.
              </p>
            </div>

            {/* Precio de venta unitario */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Precio venta mercado (Plata/u):
                </label>
                <div className="flex items-center gap-1.5">
                  {onOpenAdpModal && (
                    <AlbionDataQuickButton
                      itemId={selectedItemId}
                      targetType="product"
                      onOpenModal={onOpenAdpModal}
                      label="ADP"
                    />
                  )}
                  {itemPriceCacheStatus && (
                    <span
                      className={`text-[10px] flex items-center gap-1 font-medium ${
                        itemPriceCacheStatus.isExpired ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                      title={
                        itemPriceCacheStatus.isExpired
                          ? `Guardado hace más de 6h (${itemPriceCacheStatus.formattedAge}). Se recomienda actualizar en mercado.`
                          : `Guardado en memoria (${itemPriceCacheStatus.formattedAge}). Vigente por ${itemPriceCacheStatus.formattedRemaining}.`
                      }
                    >
                      <Clock size={10} />
                      {itemPriceCacheStatus.isExpired ? 'Expirado (>6h)' : itemPriceCacheStatus.formattedAge}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <NumericInput
                  id="input-product-unit-price"
                  min={0}
                  value={productUnitPrice}
                  onChange={(val) => {
                    setProductUnitPrice(val);
                    markStale();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">🪙</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Ingreso bruto est: <strong className="text-emerald-400">{(harvestedAmount * productUnitPrice).toLocaleString()}</strong>
              </p>
            </div>

            {/* Impuestos de mercado */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tasa de impuestos de mercado:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '4% (Directa)', val: 4 },
                  { label: '8% (Orden Setup)', val: 8 },
                  { label: '10.5% (Sin Prem)', val: 10.5 },
                ].map((tax) => (
                  <button
                    key={tax.val}
                    type="button"
                    onClick={() => {
                      setTaxPercent(tax.val);
                      markStale();
                    }}
                    className={`py-2 px-1 text-center rounded border text-xs font-medium transition-colors cursor-pointer ${
                      taxPercent === tax.val
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {tax.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Impuesto est: <span className="text-slate-300">-{Math.round(harvestedAmount * productUnitPrice * (taxPercent / 100)).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Fila 3: Sección específica para Ganadería (Alimentación y Tasas de Carnicero) */}
        {requiresFood && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-900/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Wheat size={16} /> Alimentación del Ganado ({currentItem.nameEs})
              </span>
              <div className="flex items-center gap-2 text-xs">
                {currentItem.favoriteFoodNameEs && (
                  <span className="bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/40 text-[11px] flex items-center gap-1">
                    ⭐ Comida favorita: <strong>{currentItem.favoriteFoodNameEs}</strong>
                  </span>
                )}
                <span className="text-slate-400">10 vegetales por animal adulto al día</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Vegetales consumidos:
                </label>
                <NumericInput
                  id="input-food-units"
                  min={0}
                  value={foodUnits}
                  onChange={(val) => {
                    setFoodUnits(val);
                    markStale();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  ¿Cómo obtuviste la comida?
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUsesOwnCropForFood(true);
                      setFoodUnitPrice(0);
                      markStale();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border cursor-pointer ${
                      usesOwnCropForFood
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    🌱 Mi propio cultivo (Costo 0)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsesOwnCropForFood(false);
                      markStale();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border cursor-pointer ${
                      !usesOwnCropForFood
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    🪙 Comprada en mercado
                  </button>
                </div>
              </div>

              {!usesOwnCropForFood && (
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Precio por vegetal comprado:
                  </label>
                  <NumericInput
                    id="input-food-unit-price"
                    min={0}
                    value={foodUnitPrice}
                    onChange={(val) => {
                      setFoodUnitPrice(val);
                      markStale();
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                  />
                  <span className="text-[11px] text-rose-400 block mt-0.5 font-mono">
                    Gasto comida est: -{(foodUnits * foodUnitPrice).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {currentItem.category === 'animal_meat' && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-xs text-slate-300 flex-1">
                  <span className="font-semibold text-rose-300">Tasa de Carnicería (Nutrición):</span> Si usaste un carnicero de la ciudad que cobra tasa de usuario.
                </div>
                <div className="w-full sm:w-48">
                  <NumericInput
                    id="input-butcher-fee"
                    min={0}
                    placeholder="Tasa en plata (ej. 1500)"
                    value={butcherFee}
                    onChange={(val) => {
                      setButcherFee(val);
                      markStale();
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fila 4: Puntos de Foco y Notas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          {/* Puntos de foco */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usedFocus}
                  onChange={(e) => handleToggleFocus(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <Zap size={14} className={usedFocus ? 'text-amber-400 fill-amber-400' : 'text-slate-500'} />
                ¿Usaste Foco para regar / nutrir hoy?
              </label>
              {usedFocus && calculatedResult && (
                <span className="text-[11px] font-bold text-amber-400 font-mono">
                  {calculatedResult.silverPerFocus} Plata / Foco
                </span>
              )}
            </div>

            {usedFocus && (
              <div>
                <NumericInput
                  id="input-focus-points"
                  min={0}
                  value={focusPoints}
                  onChange={(val) => {
                    setFocusPoints(val);
                    markStale();
                  }}
                  placeholder="Puntos de foco gastados (ej: 4500)"
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>
                    Según Tabla del Destino: <strong className="text-amber-400 font-mono">{destinyFocusCost.focusCostPerSlot} pts/casilla</strong> ({destinyFocusCost.focusCostPerSlot * slotsCount} total)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusPoints(destinyFocusCost.focusCostPerSlot * slotsCount);
                      markStale();
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline ml-2"
                  >
                    Auto-asignar
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  En Albion Online, rendimientos superiores a <strong>40-50 Plata/Foco</strong> son altamente rentables.
                </p>
              </div>
            )}
          </div>

          {/* Notas de la sesión */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas adicionales (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Vendido en Caerleon con buey T6 / Día con retorno alto"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Barra de Activación: Botón manual para Dar Resultado */}
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="text-amber-400" size={20} />
              <span className="text-sm font-bold text-slate-100">
                Control de Cálculo Manual
              </span>
              {isStale && calculatedResult && (
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                  Modificaciones sin recalcular
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Presiona el botón para procesar tus números actuales y ver el balance exacto sin interferencias de memoria previa.
            </p>
          </div>

          <button
            type="button"
            id="btn-calculate-result"
            onClick={handleCalculateResult}
            className={`flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-lg text-sm shadow-md transition-all duration-150 cursor-pointer shrink-0 ${
              !calculatedResult
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-amber-500/20 transform hover:-translate-y-0.5'
                : isStale
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            }`}
          >
            <Calculator size={18} />
            {!calculatedResult
              ? 'Dar Resultado / Calcular Balance'
              : isStale
              ? 'Recalcular con Nuevos Datos'
              : 'Volver a Calcular'}
          </button>
        </div>

        {/* Desglose Financiero & Veredicto: Condicional a la acción del usuario */}
        {calculatedResult ? (
          <div
            id="profit-verdict-box"
            className={`p-5 rounded-xl border transition-all ${
              calculatedResult.isProfit
                ? 'bg-emerald-950/40 border-emerald-700/60 shadow-lg shadow-emerald-950/40'
                : 'bg-rose-950/40 border-rose-700/60 shadow-lg shadow-rose-950/40'
            }`}
          >
            {/* Alerta de datos obsoletos si el usuario modificó inputs tras calcular */}
            {isStale && (
              <div className="mb-4 p-2.5 rounded-lg bg-amber-950/60 border border-amber-600/60 flex items-center justify-between gap-2 text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  <span>Modificaste valores en el formulario. Este resultado corresponde al cálculo anterior.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCalculateResult}
                  className="font-bold underline text-amber-300 hover:text-amber-100 cursor-pointer shrink-0"
                >
                  Actualizar ahora
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-400">
                  <span>Balance calculado: {calculatedResult.snapshot.itemName}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Hora: {calculatedResult.snapshot.calculatedAt}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {calculatedResult.isProfit ? (
                    <TrendingUp className="text-emerald-400" size={28} />
                  ) : (
                    <TrendingDown className="text-rose-400" size={28} />
                  )}
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                      calculatedResult.isProfit ? 'text-emerald-300' : 'text-rose-400'
                    }`}
                  >
                    {calculatedResult.isProfit ? '+' : ''}
                    {formatSilver(calculatedResult.netProfit)}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      calculatedResult.isProfit
                        ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600'
                        : 'bg-rose-900/60 text-rose-300 border-rose-600'
                    }`}
                  >
                    {calculatedResult.isProfit ? '¡ESTÁS GANANDO DINERO!' : '¡ESTÁS PERDIENDO DINERO!'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-right">
                  <div className="text-slate-400">Por Casilla:</div>
                  <div
                    className={`font-mono tabular-nums font-bold text-sm ${
                      calculatedResult.isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatSilver(calculatedResult.profitPerSlot)}
                  </div>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-right">
                  <div className="text-slate-400">ROI:</div>
                  <div
                    className={`font-mono tabular-nums font-bold text-sm ${
                      calculatedResult.isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calculatedResult.roi}%
                  </div>
                </div>
                {usedFocus && (
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-right">
                    <div className="text-slate-400">Plata / Foco:</div>
                    <div className="font-mono tabular-nums font-bold text-sm text-amber-400">
                      {calculatedResult.silverPerFocus}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desglose de Gastos e Ingresos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono tabular-nums">
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Ingreso Bruto:</span>
                <span className="text-emerald-400 font-semibold">
                  +{formatSilver(calculatedResult.grossRevenue)}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Recompra Semillas:</span>
                <span className="text-rose-400 font-semibold">
                  -{formatSilver(calculatedResult.seedsCost)}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Comida / Tasas:</span>
                <span className="text-amber-400 font-semibold">
                  -{formatSilver(calculatedResult.foodCost + calculatedResult.totalExtraFees)}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Impuesto Mercado:</span>
                <span className="text-slate-300 font-semibold">
                  -{formatSilver(calculatedResult.marketTaxAmount)}
                </span>
              </div>
            </div>

            {/* BOTÓN CADENA DE PRODUCCIÓN: ¿Qué cocinar o elaborar con esta Cosecha? */}
            {(() => {
              const harvestAmount = harvestedAmount || (slotsCount * currentItem.defaultYieldPerSlot);
              const cookingOps = findCookingOpportunitiesFromHarvest(currentItem.id, harvestAmount);
              if (cookingOps.length === 0) return null;
              const topOp = cookingOps[0];

              return (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="p-3.5 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                        <Utensils size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-100">
                            🔗 Cadena de Producción: ¿Qué Cocinar con tu Cosecha?
                          </span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-1.5 py-0.2 rounded font-mono">
                            {cookingOps.length} recetas posibles
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Con tus <strong>{harvestAmount.toLocaleString()} de {currentItem.nameEs}</strong> puedes elaborar{' '}
                          <strong className="text-amber-300">{topOp.totalOutputUnits}x {topOp.recipe.nameEs}</strong> ({topOp.batchesPossible} lotes) y ganar hasta{' '}
                          <strong className="text-emerald-400 font-mono">+{topOp.totalEstimatedNetProfit.toLocaleString()} 🪙</strong> netos.
                        </p>
                      </div>
                    </div>

                    {onNavigateToCooking && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCooking(topOp.recipe.id, harvestAmount)}
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow"
                      >
                        <Utensils size={14} />
                        <span>Cocinar en Valor Agregado</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Oportunidad de Cadena: Sacrificar Animales en Carnicería */}
            {(() => {
              const animalMap: Record<string, { id: string; name: string }> = {
                animal_meat_chicken: { id: 'animal_chicken', name: 'Pollo Adulto' },
                animal_prod_chicken: { id: 'animal_chicken', name: 'Pollo Adulto' },
                animal_meat_goat: { id: 'animal_goat', name: 'Cabra Adulta' },
                animal_prod_goat: { id: 'animal_goat', name: 'Cabra Adulta' },
                animal_meat_goose: { id: 'animal_goose', name: 'Ganso Adulto' },
                animal_prod_goose: { id: 'animal_goose', name: 'Ganso Adulto' },
                animal_meat_sheep: { id: 'animal_sheep', name: 'Oveja Adulta' },
                animal_prod_sheep: { id: 'animal_sheep', name: 'Oveja Adulta' },
                animal_meat_pig: { id: 'animal_pig', name: 'Cerdo Adulto' },
                animal_meat_cow: { id: 'animal_cow', name: 'Vaca Adulta' },
                animal_prod_cow: { id: 'animal_cow', name: 'Vaca Adulta' },
              };
              const target = animalMap[currentItem.id];
              if (!target) return null;
              const animalSlots = Math.max(1, plotsCount * 9);

              return (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="p-3.5 bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
                        <Beef size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-100">
                            🥩 Cadena de Producción: ¿Faenar o Sacrificar en Carnicería?
                          </span>
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-1.5 py-0.2 rounded font-mono">
                            Rendimiento de Carne
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Con tus <strong>{animalSlots} animales criados</strong> ({target.name}) puedes calcular el rendimiento del sacrificio a carne cruda (20 u. base + bonos de ciudad de hasta 24.8% RRR o 47.9% con foco).
                        </p>
                      </div>
                    </div>

                    {onNavigateToButcher && (
                      <button
                        type="button"
                        onClick={() => onNavigateToButcher(target.id, animalSlots)}
                        className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow"
                      >
                        <Beef size={14} />
                        <span>Abrir en Carnicería</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div
            id="profit-verdict-box"
            className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400">
              <Calculator size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                Esperando orden de cálculo
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Ingresa tus datos con tranquilidad. Para evitar conflictos de memoria anterior o cálculos apresurados, presiona el botón para auditar tu cosecha de <strong>{currentItem.nameEs}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCalculateResult}
              className="mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Calculator size={16} />
              Dar Resultado Ahora
            </button>
          </div>
        )}

        {/* Botón de acción Guardar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {justSaved && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
              <Check size={16} /> ¡Registro guardado en el historial con éxito!
            </span>
          )}
          <button
            type="submit"
            id="btn-save-daily-log"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6 py-3 rounded-lg text-sm shadow-md transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Save size={18} />
            Guardar Registro de Cosecha de Hoy
          </button>
        </div>
      </form>
    </div>
  );
};
