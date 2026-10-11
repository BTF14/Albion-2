import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Utensils,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Building2,
  Copy,
  Check,
  RotateCcw,
  Store,
  Wheat,
  Info,
  Layers,
  ArrowRight,
  Flame,
  Shield,
  HelpCircle,
  Award,
  Zap,
  Sliders,
  ShieldCheck,
  BookOpen,
  MapPin,
  ChevronDown,
  ChevronUp,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Clock,
  Gauge,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { RECIPES } from '../data/recipes';
import {
  PriceMemory,
  AlbionRecipe,
  StationLocation,
  EnchantmentLevel,
  DestinyMasteryProfile,
  CraftFocusEfficiencyResult,
  PriceCacheStatus,
} from '../types';
import { NumericInput } from './NumericInput';
import { ItemIcon } from './ItemIcon';
import {
  loadRecipePrices,
  updateRecipePrice,
  getPriceCacheStatus,
  clearExpiredPrices,
  PRICE_CACHE_TTL_MS,
} from '../utils/storage';
import {
  getEnchantmentIngredient,
  getSuggestedEnchantedPrice,
  FOOD_ENCHANTMENT_CONFIG,
  POTION_ENCHANTMENT_CONFIG,
} from '../utils/enchantments';
import {
  loadMasteryProfile,
  saveMasteryProfile,
  calculateRecipeFocusCost,
  CHEF_SPECS,
  ALCHEMIST_SPECS,
} from '../utils/destinyBoard';
import { EnchantmentComparator } from './EnchantmentComparator';
import { MarketVelocityRadar } from './MarketVelocityRadar';
import { RECIPE_MARKET_PROFILES, evaluateMarketVelocity } from '../utils/marketVelocity';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

export interface CraftCalculationResult {
  recipeId: string;
  recipeName: string;
  tier: number;
  enchantmentLevel: EnchantmentLevel;
  batches: number;
  totalOutputUnits: number;
  totalNutritionNeeded: number;
  stationFeeTotal: number;
  totalFocusCost: number;
  totalRawValueGross: number;
  totalValueReturned: number;
  totalValueConsumedNet: number;
  totalFocusGainValue: number;
  ingredientsBreakdown: Array<{
    itemId: string;
    nameEs: string;
    nameEn: string;
    amount: number;
    unitPrice: number;
    requiredGross: number;
    returnedAmount: number;
    netAmountConsumed: number;
    grossCost: number;
    valueReturned: number;
    netCostConsumed: number;
    extraItemsSavedByFocus: number;
    focusSilverSaved: number;
    source?: 'custom' | 'memory' | 'default';
    cacheStatus?: PriceCacheStatus;
  }>;
  productGrossRevenue: number;
  productMarketTax: number;
  productNetRevenue: number;
  returnedIngredientsNetLiquidation: number;
  farmerOptionA_SellRawNet: number;
  farmerOptionB_CraftNet: number;
  farmerProfitDelta: number;
  farmerValueAddedPercent: number;
  crafterTotalInvestment: number;
  crafterTotalLiquidation: number;
  crafterNetProfit: number;
  crafterROI: number;
  silverPerFocus: number;
  profitPerUnitCrafted: number;
  returnRatePercent: number;
  userMode: 'farmer' | 'crafter';
  useFocus: boolean;
  calculatedAt: string;
}

interface ValueAddedCalculatorProps {
  priceMemory: PriceMemory;
  onUpdatePrices?: (itemId: string, updates: { lastProductPrice?: number; lastSeedPrice?: number }) => void;
  initialRecipeId?: string;
  dailyBonusCookingRRR?: number;
  dailyBonusAlchemyRRR?: number;
  onNavigateToTransport?: () => void;
}

type UserRoleMode = 'farmer' | 'crafter';
type CategoryFilter = 'all' | 'cooking' | 'alchemy' | 'dragon' | 'special';

export const ValueAddedCalculator: React.FC<ValueAddedCalculatorProps> = ({
  priceMemory,
  onUpdatePrices,
  initialRecipeId,
  dailyBonusCookingRRR = 0,
  dailyBonusAlchemyRRR = 0,
  onNavigateToTransport,
}) => {
  // Modo de usuario:
  // - 'farmer': Tiene su propia cosecha/carne y decide si vender crudo o elaborar
  // - 'crafter': Compra los ingredientes en el mercado y calcula su margen neto comercial
  const [userMode, setUserMode] = useState<UserRoleMode>('farmer');

  // Filtros de recetas
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    initialRecipeId && RECIPES.some((r) => r.id === initialRecipeId)
      ? initialRecipeId
      : 'cook_drake_biscuits_t8'
  );

  // Sincronizar si cambia initialRecipeId externamente
  useEffect(() => {
    if (initialRecipeId && RECIPES.some((r) => r.id === initialRecipeId)) {
      setSelectedRecipeId(initialRecipeId);
    }
  }, [initialRecipeId]);

  // Nivel de Encantamiento / Subtier (.0 plano, .1, .2, .3)
  const [enchantmentLevel, setEnchantmentLevel] = useState<EnchantmentLevel>(0);

  // Vista activa: Calculadora de Lote individual vs Comparador Directo (.0 a .3) vs Radar de Liquidez
  const [calculatorView, setCalculatorView] = useState<'batch' | 'comparator' | 'velocity_radar'>('batch');

  // Parámetros de elaboración
  const [batches, setBatches] = useState<number>(10);
  const [stationLocation, setStationLocation] = useState<StationLocation>('bonus_city');
  const [useFocus, setUseFocus] = useState<boolean>(true);
  const [stationFeePer100Nutrition, setStationFeePer100Nutrition] = useState<number>(450); // Tasa en plata típica de talleres
  const [hasPremium, setHasPremium] = useState<boolean>(true); // Impuesto de mercado: 6.5% vs 10.5%

  // Perfil de Maestría en la Tabla del Destino (Destiny Board)
  const [masteryProfile, setMasteryProfile] = useState<DestinyMasteryProfile>(() => loadMasteryProfile());
  const [showMasteryPanel, setShowMasteryPanel] = useState<boolean>(true);
  const [showOtherSpecs, setShowOtherSpecs] = useState<boolean>(false);
  const [showCityBonusExplainer, setShowCityBonusExplainer] = useState<boolean>(false);

  // Sincronizar automáticamente si se modifica la maestría en otra pestaña o componente
  useEffect(() => {
    const handleMasteryUpdate = () => {
      setMasteryProfile(loadMasteryProfile());
    };
    window.addEventListener('albion_mastery_updated', handleMasteryUpdate);
    return () => window.removeEventListener('albion_mastery_updated', handleMasteryUpdate);
  }, []);

  // Sincronización automática de precios de recetas terminadas con LocalStorage
  useEffect(() => {
    const handleSync = () => {
      setRecipePrices(loadRecipePrices());
    };
    window.addEventListener('albion_storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Precios personalizados de productos terminados e ingredientes
  const [recipePrices, setRecipePrices] = useState<Record<string, number>>(() => loadRecipePrices());
  const [customRawPrices, setCustomRawPrices] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  const cacheNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recipeSelectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cacheNoticeTimeoutRef.current) clearTimeout(cacheNoticeTimeoutRef.current);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (recipeSelectTimeoutRef.current) clearTimeout(recipeSelectTimeoutRef.current);
    };
  }, []);

  const handleClearExpiredCache = () => {
    const { clearedItemsCount, clearedRecipesCount } = clearExpiredPrices();
    const total = clearedItemsCount + clearedRecipesCount;
    if (total > 0) {
      setCacheNotice(`Se purgaron ${total} registros de precios expirados (> 6 horas).`);
    } else {
      setCacheNotice('Todos los precios guardados en LocalStorage están vigentes (< 6 horas).');
    }
    if (cacheNoticeTimeoutRef.current) {
      clearTimeout(cacheNoticeTimeoutRef.current);
    }
    cacheNoticeTimeoutRef.current = setTimeout(() => setCacheNotice(null), 4000);
  };

  // ESTADO DE CÁLCULO MANUAL (Patrón DailyLogger para control total y cero errores de memoria)
  const [calculatedResult, setCalculatedResult] = useState<CraftCalculationResult | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const markStale = () => {
    if (calculatedResult) {
      setIsStale(true);
    }
  };

  const handleSelectRecipe = (id: string) => {
    if (id !== selectedRecipeId) {
      setSelectedRecipeId(id);
      setCalculatedResult(null);
      setIsStale(false);
    }
  };

  const handleCategoryFilter = (cat: CategoryFilter) => {
    setSelectedCategory(cat);
    setCalculatedResult(null);
    setIsStale(false);
    if (cat !== 'all') {
      const isMatch =
        (cat === 'cooking' && activeRecipe.category === 'cooking') ||
        (cat === 'alchemy' && activeRecipe.category === 'alchemy') ||
        (cat === 'dragon' && activeRecipe.isDragonUpdate) ||
        (cat === 'special' && (activeRecipe.isAvalonian || activeRecipe.isTracking));
      if (!isMatch) {
        const first = RECIPES.find((r) => {
          if (cat === 'cooking') return r.category === 'cooking';
          if (cat === 'alchemy') return r.category === 'alchemy';
          if (cat === 'dragon') return r.isDragonUpdate;
          if (cat === 'special') return r.isAvalonian || r.isTracking;
          return true;
        });
        if (first) {
          setSelectedRecipeId(first.id);
        }
      }
    }
  };

  const handleTierFilter = (tier: number | 'all') => {
    setSelectedTier(tier);
    setCalculatedResult(null);
    setIsStale(false);
    if (tier !== 'all' && activeRecipe.tier !== tier) {
      const match = RECIPES.find((r) => {
        if (selectedCategory === 'cooking' && r.category !== 'cooking') return false;
        if (selectedCategory === 'alchemy' && r.category !== 'alchemy') return false;
        if (selectedCategory === 'dragon' && !r.isDragonUpdate) return false;
        if (selectedCategory === 'special' && !r.isAvalonian && !r.isTracking) return false;
        return r.tier === tier;
      });
      if (match) {
        setSelectedRecipeId(match.id);
      }
    }
  };

  const handleClearResult = () => {
    setCalculatedResult(null);
    setIsStale(false);
  };

  const handleResetIngredientsToDefault = () => {
    setCustomRawPrices((prev) => {
      const next = { ...prev };
      effectiveIngredients.forEach((ing) => {
        delete next[ing.itemId];
      });
      return next;
    });
    markStale();
  };

  // Receta seleccionada activa
  const activeRecipe: AlbionRecipe = useMemo(() => {
    return RECIPES.find((r) => r.id === selectedRecipeId) || RECIPES[0];
  }, [selectedRecipeId]);

  // Filtrado reactivo de recetas por categoría, tier y término de búsqueda
  const filteredRecipes = useMemo(() => {
    return RECIPES.filter((r) => {
      if (selectedCategory === 'cooking' && r.category !== 'cooking') return false;
      if (selectedCategory === 'alchemy' && r.category !== 'alchemy') return false;
      if (selectedCategory === 'dragon' && !r.isDragonUpdate) return false;
      if (selectedCategory === 'special' && !r.isAvalonian && !r.isTracking) return false;

      if (selectedTier !== 'all' && r.tier !== selectedTier) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName =
          r.nameEs.toLowerCase().includes(query) || r.nameEn.toLowerCase().includes(query);
        const matchesIng = r.ingredients.some((ing) => ing.nameEs.toLowerCase().includes(query));
        if (!matchesName && !matchesIng) return false;
      }

      return true;
    });
  }, [selectedCategory, selectedTier, searchQuery]);

  // Ciudad bonificada para la receta activa
  const isCooking = activeRecipe.category === 'cooking';
  const optimalCityName = isCooking ? 'Caerleon' : 'Brecilien';
  const optimalCitySpecialty = isCooking ? 'Comida (+15% Cocina)' : 'Pociones (+15% Alquimia)';
  const alternativeCities = isCooking ? 'Brecilien, Martlock, Thetford' : 'Caerleon, Fort Sterling, Lymhurst';

  // Fórmulas oficiales de Albion Online para Tasa de Retorno de Recursos (RRR)
  // Cocina (Comida) en Caerleon / Alquimia (Pociones) en Brecilien:
  // - Ciudad Real con bono (+15% especialidad +18% ciudad = +33% producción): 24.8% sin foco / 47.9% con foco
  // - Ciudad Real sin bono (+18% ciudad únicamente): 15.2% sin foco / 43.5% con foco
  // - Isla en ciudad bonificada (+15% base local): 13.0% sin foco / 39.9% con foco
  // - Isla personal común sin bono (0% base): 0.0% sin foco / 37.1% con foco
  const isCookingCategory = activeRecipe.category === 'cooking';
  const activeDailyBonus = isCookingCategory ? dailyBonusCookingRRR : dailyBonusAlchemyRRR;

  const returnRatePercent = useMemo(() => {
    let base = 0;
    if (stationLocation === 'caerleon_city' || stationLocation === 'bonus_city') {
      base = useFocus ? 47.9 : 24.8;
    } else if (stationLocation === 'non_bonus_city') {
      base = useFocus ? 43.5 : 15.2;
    } else if (stationLocation === 'bonus_island') {
      base = useFocus ? 39.9 : 13.0;
    } else {
      base = useFocus ? 37.1 : 0.0;
    }
    return Math.min(58.0, Number((base + activeDailyBonus).toFixed(1)));
  }, [stationLocation, useFocus, activeDailyBonus]);

  const returnRatePercentWithoutFocus = useMemo(() => {
    let base = 0;
    if (stationLocation === 'caerleon_city' || stationLocation === 'bonus_city') base = 24.8;
    else if (stationLocation === 'non_bonus_city') base = 15.2;
    else if (stationLocation === 'bonus_island') base = 13.0;
    else base = 0.0;
    return Math.min(58.0, Number((base + activeDailyBonus).toFixed(1)));
  }, [stationLocation, activeDailyBonus]);

  const returnRatePercentWithFocus = useMemo(() => {
    let base = 0;
    if (stationLocation === 'caerleon_city' || stationLocation === 'bonus_city') base = 47.9;
    else if (stationLocation === 'non_bonus_city') base = 43.5;
    else if (stationLocation === 'bonus_island') base = 39.9;
    else base = 37.1;
    return Math.min(58.0, Number((base + activeDailyBonus).toFixed(1)));
  }, [stationLocation, activeDailyBonus]);

  // Impuesto de mercado: Premium = 4% de tasa + 2.5% de orden = 6.5%. Sin premium = 8% + 2.5% = 10.5%.
  const marketTaxRate = hasPremium ? 0.065 : 0.105;

  // Clave única de almacenamiento del precio del producto terminado considerando su subtier
  const recipePriceKey = `${activeRecipe.id}_enc_${enchantmentLevel}`;

  // Precio unitario de venta del producto final según su encantamiento (.0, .1, .2, .3)
  const productSellPrice = useMemo(() => {
    if (recipePrices[recipePriceKey] !== undefined) {
      return recipePrices[recipePriceKey];
    }
    return getSuggestedEnchantedPrice(activeRecipe.defaultSellPrice, activeRecipe.category, enchantmentLevel);
  }, [recipePrices, recipePriceKey, activeRecipe, enchantmentLevel]);

  const handleUpdateProductPrice = (val: number) => {
    const cleanVal = Math.max(0, val);
    const updated = { ...recipePrices, [recipePriceKey]: cleanVal };
    setRecipePrices(updated);
    updateRecipePrice(recipePriceKey, cleanVal);
    markStale();
  };

  // Obtener el precio unitario de una materia prima (prioridad: customRawPrices -> priceMemory -> defaultUnitPrice)
  const getIngredientUnitPrice = (ingredientId: string, defaultVal: number = 300): number => {
    if (customRawPrices[ingredientId] !== undefined) {
      return customRawPrices[ingredientId];
    }
    const memory = priceMemory[ingredientId];
    if (memory?.lastProductPrice && memory.lastProductPrice > 0) {
      return memory.lastProductPrice;
    }
    return defaultVal;
  };

  const handleUpdateIngredientPrice = (ingredientId: string, val: number) => {
    const cleanVal = Math.max(0, val);
    setCustomRawPrices((prev) => ({
      ...prev,
      [ingredientId]: cleanVal,
    }));
    if (onUpdatePrices) {
      onUpdatePrices(ingredientId, { lastProductPrice: cleanVal });
    }
    markStale();
  };

  const handleResetRecipePrices = () => {
    const suggested = getSuggestedEnchantedPrice(activeRecipe.defaultSellPrice, activeRecipe.category, enchantmentLevel);
    const updated = { ...recipePrices, [recipePriceKey]: suggested };
    setRecipePrices(updated);
    updateRecipePrice(recipePriceKey, suggested);
    markStale();
  };

  // Lista de ingredientes incluyendo el ingrediente de encantamiento (.1, .2, .3) si está activo
  const effectiveIngredients = useMemo(() => {
    const baseList = [...activeRecipe.ingredients];
    const enchantItem = getEnchantmentIngredient(activeRecipe.category, enchantmentLevel);
    if (enchantItem) {
      baseList.push(enchantItem);
    }
    return baseList;
  }, [activeRecipe, enchantmentLevel]);

  // Nombre formateado con subtier
  const fullItemDisplayName = `${activeRecipe.nameEs} .${enchantmentLevel}`;

  // Determinar la procedencia del precio unitario para máxima transparencia al usuario
  const getIngredientPriceSource = (ingredientId: string): 'custom' | 'memory' | 'default' => {
    if (customRawPrices[ingredientId] !== undefined) {
      return 'custom';
    }
    const memory = priceMemory[ingredientId];
    if (memory?.lastProductPrice && memory.lastProductPrice > 0) {
      return 'memory';
    }
    return 'default';
  };

  // Desglose reactivo continuo de insumos para la receta activa (visible antes y después del cálculo)
  const previewIngredientsBreakdown = useMemo(() => {
    const safeBatches = Math.max(1, Number(batches) || 1);
    const rrrRatio = returnRatePercent / 100;
    return effectiveIngredients.map((ing) => {
      const requiredGross = ing.amount * safeBatches;
      const unitPrice = getIngredientUnitPrice(ing.itemId, ing.defaultUnitPrice || 300);
      const returnedAmount = Math.round(requiredGross * rrrRatio);
      const netAmountConsumed = Math.max(0, requiredGross - returnedAmount);
      const grossCost = requiredGross * unitPrice;
      const netCostConsumed = netAmountConsumed * unitPrice;
      const source = getIngredientPriceSource(ing.itemId);
      const cacheStatus = getPriceCacheStatus(priceMemory[ing.itemId]?.updatedAt);
      return {
        itemId: ing.itemId,
        nameEs: ing.nameEs,
        requiredGross,
        returnedAmount,
        netAmountConsumed,
        unitPrice,
        grossCost,
        netCostConsumed,
        source,
        cacheStatus,
      };
    });
  }, [effectiveIngredients, batches, returnRatePercent, customRawPrices, priceMemory]);

  const previewTotalRawGross = useMemo(() => {
    return previewIngredientsBreakdown.reduce((sum, ing) => sum + ing.grossCost, 0);
  }, [previewIngredientsBreakdown]);

  const previewTotalSavedByRRR = useMemo(() => {
    return previewIngredientsBreakdown.reduce((sum, ing) => sum + (ing.returnedAmount * ing.unitPrice), 0);
  }, [previewIngredientsBreakdown]);

  const previewTotalNetConsumed = useMemo(() => {
    return previewIngredientsBreakdown.reduce((sum, ing) => sum + ing.netCostConsumed, 0);
  }, [previewIngredientsBreakdown]);

  // =========================================================================
  // EFICIENCIA DE FOCO BASADA EN LA TABLA DEL DESTINO (DESTINY BOARD)
  // =========================================================================
  const recipeFocusEfficiency: CraftFocusEfficiencyResult = useMemo(() => {
    const singleBatchGross = effectiveIngredients.reduce((sum, ing) => {
      const unitPrice = getIngredientUnitPrice(ing.itemId, ing.defaultUnitPrice || 300);
      return sum + ing.amount * unitPrice;
    }, 0);

    return calculateRecipeFocusCost(
      activeRecipe,
      masteryProfile,
      singleBatchGross,
      returnRatePercentWithoutFocus,
      returnRatePercentWithFocus
    );
  }, [
    activeRecipe,
    masteryProfile,
    effectiveIngredients,
    customRawPrices,
    priceMemory,
    returnRatePercentWithoutFocus,
    returnRatePercentWithFocus,
  ]);

  const currentBranchSpecs = isCooking ? CHEF_SPECS : ALCHEMIST_SPECS;
  const currentSpecDef = currentBranchSpecs.find((s) => s.id === activeRecipe.specKey) || currentBranchSpecs[0];
  const currentBranchMastery = isCooking
    ? (masteryProfile.chefMastery ?? 0)
    : (masteryProfile.alchemistMastery ?? 0);
  const currentSpecLevel = (masteryProfile.craftSpecs || {})[activeRecipe.specKey] ?? 0;

  const handleUpdateBranchMastery = (level: number) => {
    const clean = Math.min(100, Math.max(0, level));
    const updated = isCooking
      ? { ...masteryProfile, chefMastery: clean }
      : { ...masteryProfile, alchemistMastery: clean };
    setMasteryProfile(updated);
    saveMasteryProfile(updated);
    markStale();
  };

  const handleUpdateCraftSpec = (key: string, level: number) => {
    const clean = Math.min(100, Math.max(0, level));
    const updatedSpecs = { ...(masteryProfile.craftSpecs || {}), [key]: clean };
    const updated = { ...masteryProfile, craftSpecs: updatedSpecs };
    setMasteryProfile(updated);
    saveMasteryProfile(updated);
    markStale();
  };

  const handleMaxCurrentBranch = () => {
    const updatedSpecs = { ...(masteryProfile.craftSpecs || {}) };
    currentBranchSpecs.forEach((s) => {
      updatedSpecs[s.id] = 100;
    });
    const updated = isCooking
      ? { ...masteryProfile, chefMastery: 100, craftSpecs: updatedSpecs }
      : { ...masteryProfile, alchemistMastery: 100, craftSpecs: updatedSpecs };
    setMasteryProfile(updated);
    saveMasteryProfile(updated);
    markStale();
  };

  const handleResetCurrentBranch = () => {
    const updatedSpecs = { ...(masteryProfile.craftSpecs || {}) };
    currentBranchSpecs.forEach((s) => {
      updatedSpecs[s.id] = 0;
    });
    const updated = isCooking
      ? { ...masteryProfile, chefMastery: 0, craftSpecs: updatedSpecs }
      : { ...masteryProfile, alchemistMastery: 0, craftSpecs: updatedSpecs };
    setMasteryProfile(updated);
    saveMasteryProfile(updated);
    markStale();
  };

  // =========================================================================
  // MOTOR DE CÁLCULO FINANCIERO MANUAL (PATRÓN DAILY LOGGER)
  // =========================================================================
  const computeCraftFinancials = (): CraftCalculationResult => {
    // Protección estricta contra batches <= 0 o NaN
    const safeBatches = Math.max(1, Number(batches) || 1);
    const totalOutputUnits = safeBatches * activeRecipe.outputAmount;
    const totalNutritionNeeded = safeBatches * activeRecipe.nutritionCost;
    const stationFeeTotal = Math.round((totalNutritionNeeded / 100) * (Number(stationFeePer100Nutrition) || 0));
    const focusCostPerBatch = recipeFocusEfficiency.actualFocusCostPerBatch;
    const totalFocusCost = useFocus ? safeBatches * focusCostPerBatch : 0;

    // Desglose de cada ingrediente (bruto, devuelto por RRR, consumido neto y valoraciones)
    let totalRawValueGross = 0;
    let totalValueReturned = 0;
    let totalValueConsumedNet = 0;
    let totalFocusGainValue = 0;

    const ingredientsBreakdown = effectiveIngredients.map((ing) => {
      const requiredGross = ing.amount * safeBatches;
      const unitPrice = getIngredientUnitPrice(ing.itemId, ing.defaultUnitPrice || 300);
      const grossCost = requiredGross * unitPrice;

      // Devolución por RRR
      const returnedAmount = Math.round(requiredGross * (returnRatePercent / 100));
      const netAmountConsumed = Math.max(0, requiredGross - returnedAmount);
      const valueReturned = returnedAmount * unitPrice;
      const netCostConsumed = netAmountConsumed * unitPrice;

      // Retorno incremental exclusivo por el uso del foco
      const returnedWithFocus = Math.round(requiredGross * (returnRatePercentWithFocus / 100));
      const returnedWithoutFocus = Math.round(requiredGross * (returnRatePercentWithoutFocus / 100));
      const extraItemsSavedByFocus = Math.max(0, returnedWithFocus - returnedWithoutFocus);
      const focusSilverSaved = extraItemsSavedByFocus * unitPrice;

      totalRawValueGross += grossCost;
      totalValueReturned += valueReturned;
      totalValueConsumedNet += netCostConsumed;
      totalFocusGainValue += focusSilverSaved;

      return {
        ...ing,
        nameEn: ing.nameEs,
        unitPrice,
        requiredGross,
        returnedAmount,
        netAmountConsumed,
        grossCost,
        valueReturned,
        netCostConsumed,
        extraItemsSavedByFocus,
        focusSilverSaved,
        source: getIngredientPriceSource(ing.itemId),
        cacheStatus: getPriceCacheStatus(priceMemory[ing.itemId]?.updatedAt),
      };
    });

    // Ingreso por venta del producto terminado
    const safeProductSellPrice = Math.max(0, Number(productSellPrice) || 0);
    const productGrossRevenue = totalOutputUnits * safeProductSellPrice;
    const productMarketTax = Math.round(productGrossRevenue * marketTaxRate);
    const productNetRevenue = productGrossRevenue - productMarketTax;

    // Venta de ingredientes devueltos por RRR en el mercado (líquido)
    const returnedIngredientsTax = Math.round(totalValueReturned * marketTaxRate);
    const returnedIngredientsNetLiquidation = totalValueReturned - returnedIngredientsTax;

    // Perspectiva 1: Granjero / Ganadero
    const rawMarketTax = Math.round(totalRawValueGross * marketTaxRate);
    const farmerOptionA_SellRawNet = totalRawValueGross - rawMarketTax;
    const farmerOptionB_CraftNet = productNetRevenue - stationFeeTotal + returnedIngredientsNetLiquidation;
    const farmerProfitDelta = farmerOptionB_CraftNet - farmerOptionA_SellRawNet;
    const farmerValueAddedPercent = farmerOptionA_SellRawNet > 0
      ? ((farmerProfitDelta / farmerOptionA_SellRawNet) * 100)
      : 0;

    // Perspectiva 2: Artesano / Comerciante
    const crafterTotalInvestment = totalRawValueGross + stationFeeTotal;
    const crafterTotalLiquidation = productNetRevenue + returnedIngredientsNetLiquidation;
    const crafterNetProfit = crafterTotalLiquidation - crafterTotalInvestment;
    const crafterROI = crafterTotalInvestment > 0
      ? ((crafterNetProfit / crafterTotalInvestment) * 100)
      : 0;

    const silverPerFocus = totalFocusCost > 0
      ? Number((totalFocusGainValue / totalFocusCost).toFixed(1))
      : 0;

    const profitPerUnitCrafted = totalOutputUnits > 0
      ? Math.round((userMode === 'farmer' ? farmerProfitDelta : crafterNetProfit) / totalOutputUnits)
      : 0;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    return {
      recipeId: activeRecipe.id,
      recipeName: fullItemDisplayName,
      tier: activeRecipe.tier,
      enchantmentLevel,
      batches: safeBatches,
      totalOutputUnits,
      totalNutritionNeeded,
      stationFeeTotal,
      totalFocusCost,
      totalRawValueGross,
      totalValueReturned,
      totalValueConsumedNet,
      totalFocusGainValue,
      ingredientsBreakdown,
      productGrossRevenue,
      productMarketTax,
      productNetRevenue,
      returnedIngredientsNetLiquidation,
      farmerOptionA_SellRawNet,
      farmerOptionB_CraftNet,
      farmerProfitDelta,
      farmerValueAddedPercent,
      crafterTotalInvestment,
      crafterTotalLiquidation,
      crafterNetProfit,
      crafterROI,
      silverPerFocus,
      profitPerUnitCrafted,
      returnRatePercent,
      userMode,
      useFocus,
      calculatedAt: timeStr,
    };
  };

  // Disparador manual de resultados
  const handleCalculateResult = () => {
    const result = computeCraftFinancials();
    setCalculatedResult(result);
    setIsStale(false);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const box = document.getElementById('craft-verdict-box');
      if (box) {
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  };

  // Copiar resumen de análisis al portapapeles con soporte para sandboxes / iframes
  const handleCopySummary = async () => {
    const safeBatchesCount = Math.max(1, Number(batches) || 1);
    const data = calculatedResult || computeCraftFinancials();

    const farmerVerdict =
      data.farmerProfitDelta > 0
        ? '✅ ¡CONVIENE COCINAR / ALQUIMIZAR!'
        : data.farmerProfitDelta === 0
        ? '⚖️ RENTABILIDAD IDÉNTICA (0 🪙 DIFERENCIA)'
        : '⚠️ MEJOR VENDER MATERIA PRIMA CRUDA';

    const crafterVerdict =
      data.crafterNetProfit > 0
        ? '✅ CRAFTEO RENTABLE'
        : data.crafterNetProfit === 0
        ? '⚖️ PUNTO DE EQUILIBRIO (0 🪙)'
        : '❌ PÉRDIDA COMERCIAL';

    const summary = `🍲 [ALBION TRACKER - ANÁLISIS DE VALOR AGREGADO]
Producto: ${fullItemDisplayName} (Tier ${activeRecipe.tier})
Modo: ${userMode === 'farmer' ? 'Granjero (Cosecha propia)' : 'Artesano (Compra en mercado)'}
Lotes: ${safeBatchesCount} (${data.totalOutputUnits} unidades)
Ubicación Taller: ${
      stationLocation === 'caerleon_city' || stationLocation === 'bonus_city'
        ? `Ciudad Bonificada (${optimalCityName} - RRR 24.8% / 47.9%)`
        : stationLocation === 'non_bonus_city'
        ? `Ciudad Real sin Bono (${alternativeCities} - RRR 15.2% / 43.5%)`
        : stationLocation === 'bonus_island'
        ? `Isla Bonificada (${optimalCityName} - RRR 13% / 39.9%)`
        : 'Isla Estándar (0% / 37.1%)'
    }
Foco Utilizado: ${useFocus ? `${data.totalFocusCost.toLocaleString()} pts (${recipeFocusEfficiency.actualFocusCostPerBatch} pts/lote, FCE: +${recipeFocusEfficiency.fce})` : 'No'}
Tasa Estación: ${stationFeePer100Nutrition} 🪙/100u (${data.stationFeeTotal.toLocaleString()} 🪙 total)
Precio Venta: ${productSellPrice.toLocaleString()} 🪙 c/u (Neto: ${data.productNetRevenue.toLocaleString()} 🪙)
${
  userMode === 'farmer'
    ? `Vender Crudo: ${data.farmerOptionA_SellRawNet.toLocaleString()} 🪙
Elaborar Producto: ${data.farmerOptionB_CraftNet.toLocaleString()} 🪙
Diferencia / Ganancia Extra: ${data.farmerProfitDelta >= 0 ? '+' : ''}${data.farmerProfitDelta.toLocaleString()} 🪙 (${data.farmerValueAddedPercent.toFixed(1)}%)
Veredicto: ${farmerVerdict}`
    : `Inversión Insumos: ${data.crafterTotalInvestment.toLocaleString()} 🪙
Ingreso Neto Total: ${data.crafterTotalLiquidation.toLocaleString()} 🪙
Beneficio Comercial: ${data.crafterNetProfit >= 0 ? '+' : ''}${data.crafterNetProfit.toLocaleString()} 🪙 (ROI: ${data.crafterROI.toFixed(1)}%)
Veredicto: ${crafterVerdict}`
}
Eficiencia de Foco: ${data.silverPerFocus} 🪙/⚡ punto`;

    let success = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
        success = true;
      }
    } catch {
      // Fallback
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header y Selector de Modo */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-bold shadow">
              <Utensils size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              Valor Agregado: Cocina & Alquimia
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Catálogo Completo & .1, .2, .3
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Simulador de rentabilidad oficial con tasas de retorno de recursos (RRR), impuestos y cálculo de
            subtiers (.0 plano, .1 verde, .2 azul, .3 morado) para comidas y pociones.
          </p>
        </div>

        {/* Selector de Herramienta: Lote Individual vs Comparador .0 a .3 */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setCalculatorView('batch')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                calculatorView === 'batch'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Utensils size={14} />
              <span>Calculadora de Lote</span>
            </button>
            <button
              type="button"
              onClick={() => setCalculatorView('comparator')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                calculatorView === 'comparator'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={14} className={calculatorView === 'comparator' ? 'text-slate-950' : 'text-amber-400'} />
              <span>Comparador .0 / .1 / .2 / .3</span>
            </button>
            <button
              type="button"
              onClick={() => setCalculatorView('velocity_radar')}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                calculatorView === 'velocity_radar'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge size={14} className={calculatorView === 'velocity_radar' ? 'text-slate-950' : 'text-amber-400'} />
              <span>Radar de Liquidez & Ventas 🚀</span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full border border-amber-400/30">
                Meta
              </span>
            </button>
          </div>

          {/* Toggle de Modo: Granjero vs Artesano */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setUserMode('farmer');
                markStale();
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                userMode === 'farmer'
                  ? 'bg-slate-700 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wheat size={14} />
              <span>Cosecha Propia</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUserMode('crafter');
                markStale();
              }}
              className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                userMode === 'crafter'
                  ? 'bg-slate-700 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store size={14} />
              <span>Compro en Mercado</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar Análisis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selector de Recetas, Categorías & Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Filtros de Categoría */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({RECIPES.length})
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter('cooking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategory === 'cooking'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Utensils size={13} />
              Cocina ({RECIPES.filter((r) => r.category === 'cooking').length})
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter('alchemy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategory === 'alchemy'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlaskConical size={13} />
              Alquimia ({RECIPES.filter((r) => r.category === 'alchemy').length})
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter('dragon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategory === 'dragon'
                  ? 'bg-red-500 text-white shadow ring-1 ring-red-400'
                  : 'bg-slate-800 text-red-400 hover:bg-slate-700'
              }`}
            >
              <Flame size={13} />
              Dragón 2026 ({RECIPES.filter((r) => r.isDragonUpdate).length})
            </button>
            <button
              type="button"
              onClick={() => handleCategoryFilter('special')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedCategory === 'special'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-slate-800 text-indigo-300 hover:bg-slate-700'
              }`}
            >
              <Shield size={13} />
              Avalonianas & Rastreo ({RECIPES.filter((r) => r.isAvalonian || r.isTracking).length})
            </button>
          </div>

          {/* Filtro de Tier y Búsqueda */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedTier}
              onChange={(e) =>
                handleTierFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos los Tiers</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
              <option value="4">Tier 4</option>
              <option value="5">Tier 5</option>
              <option value="6">Tier 6</option>
              <option value="7">Tier 7</option>
              <option value="8">Tier 8</option>
            </select>

            <input
              type="text"
              placeholder="Buscar pastel, dragón, veneno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 w-48 sm:w-56 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Carrusel / Grid de Tarjetas de Recetas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {filteredRecipes.map((recipe) => {
            const isSelected = recipe.id === activeRecipe.id;
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => handleSelectRecipe(recipe.id)}
                className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Badges superiores */}
                <div className="flex items-center justify-between w-full mb-1">
                  <AlbionItemBadge tier={recipe.tier} size="sm" />
                  <div className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    <ItemIcon name={recipe.iconName} size={15} />
                  </div>
                </div>

                <div className="font-bold text-xs text-slate-200 line-clamp-1 mb-0.5">
                  {recipe.nameEs}
                </div>

                <div className="flex items-center justify-between w-full mt-1">
                  <div className="text-[10px] text-slate-400 font-mono">
                    {recipe.outputAmount} u. / lote
                  </div>
                  {(() => {
                    const speed = RECIPE_MARKET_PROFILES[recipe.id]?.baseSpeed;
                    if (speed === 'ultra_fast') {
                      return (
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/70 px-1 rounded border border-emerald-800" title="Venta ultrarrápida (1-4 horas)">
                          ⚡ Rápido
                        </span>
                      );
                    }
                    if (speed === 'fast') {
                      return (
                        <span className="text-[9px] font-semibold text-sky-400 bg-sky-950/70 px-1 rounded border border-sky-800" title="Venta rápida (4-12 horas)">
                          ⏱️ Fluido
                        </span>
                      );
                    }
                    if (speed === 'slow_niche') {
                      return (
                        <span className="text-[9px] font-semibold text-purple-400 bg-purple-950/70 px-1 rounded border border-purple-800" title="Mercado de nicho / Lujo">
                          💎 Nicho
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista Activa: Radar de Liquidez vs Comparador Directo vs Calculadora de Lote */}
      {calculatorView === 'velocity_radar' ? (
        <MarketVelocityRadar
          recipePrices={recipePrices}
          priceMemory={priceMemory}
          masteryProfile={masteryProfile}
          hasPremium={hasPremium}
          onSelectRecipeAndLevel={(rec, lvl) => {
            setSelectedRecipeId(rec.id);
            setEnchantmentLevel(lvl);
            setCalculatorView('batch');
            markStale();
            if (recipeSelectTimeoutRef.current) {
              clearTimeout(recipeSelectTimeoutRef.current);
            }
            recipeSelectTimeoutRef.current = setTimeout(() => {
              handleCalculateResult();
            }, 50);
          }}
          onOpenComparatorForRecipe={(rec) => {
            setSelectedRecipeId(rec.id);
            setCalculatorView('comparator');
          }}
        />
      ) : calculatorView === 'comparator' ? (
        <EnchantmentComparator
          activeRecipe={activeRecipe}
          recipePrices={recipePrices}
          onUpdateRecipePrice={(key, price) => {
            setRecipePrices((prev) => ({ ...prev, [key]: price }));
            updateRecipePrice(key, price);
          }}
          priceMemory={priceMemory}
          batches={batches}
          onBatchesChange={(b) => {
            setBatches(b);
            markStale();
          }}
          stationLocation={stationLocation}
          onStationLocationChange={(loc) => {
            setStationLocation(loc);
            markStale();
          }}
          useFocus={useFocus}
          onUseFocusChange={(f) => {
            setUseFocus(f);
            markStale();
          }}
          stationFeePer100Nutrition={stationFeePer100Nutrition}
          onStationFeeChange={(fee) => {
            setStationFeePer100Nutrition(fee);
            markStale();
          }}
          hasPremium={hasPremium}
          onHasPremiumChange={(p) => {
            setHasPremium(p);
            markStale();
          }}
          customRawPrices={customRawPrices}
          onUpdateIngredientPrice={(ingId, price) => {
            handleUpdateIngredientPrice(ingId, price);
          }}
          masteryProfile={masteryProfile}
          onSelectEnchantmentInParent={(lvl) => {
            setEnchantmentLevel(lvl);
            setCalculatorView('batch');
            markStale();
            if (recipeSelectTimeoutRef.current) {
              clearTimeout(recipeSelectTimeoutRef.current);
            }
            recipeSelectTimeoutRef.current = setTimeout(() => {
              handleCalculateResult();
            }, 50);
          }}
        />
      ) : (
        /* Receta Activa & Configuración del Taller */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Parámetros del Taller, Subtier & Precios (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-4">
            {/* Header de la Receta Activa */}
            <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-md">
                <ItemIcon name={activeRecipe.iconName} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-100 truncate">
                    {activeRecipe.nameEs}
                  </h3>
                  <AlbionItemBadge tier={activeRecipe.tier} enchantment={enchantmentLevel} size="md" />
                  {activeRecipe.isDragonUpdate && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      Actualización del Dragón
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 italic mt-0.5">
                  {activeRecipe.buffDescription}
                </p>
                <div className="text-[11px] text-amber-400 font-medium mt-1">
                  Rendimiento: {activeRecipe.outputAmount} unidades por crafteo
                </div>
              </div>
            </div>

            {/* Selector de Subtier / Encantamiento (.0, .1, .2, .3) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Nivel de Encantamiento (Subtier):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {enchantmentLevel === 0 ? 'Sin Encantar' : `Tier ${activeRecipe.tier}.${enchantmentLevel}`}
                </span>
              </div>

              {/* Botones de selección de subtier */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEnchantmentLevel(0);
                    markStale();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    enchantmentLevel === 0
                      ? 'bg-slate-700 text-white border-slate-500 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ● .0 Plano
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnchantmentLevel(1);
                    markStale();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    enchantmentLevel === 1
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow ring-1 ring-emerald-400'
                      : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🟢 .1 Verde
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnchantmentLevel(2);
                    markStale();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    enchantmentLevel === 2
                      ? 'bg-sky-600 text-white border-sky-400 shadow ring-1 ring-sky-400'
                      : 'bg-slate-900 text-sky-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🔵 .2 Azul
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEnchantmentLevel(3);
                    markStale();
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                    enchantmentLevel === 3
                      ? 'bg-purple-600 text-white border-purple-400 shadow ring-1 ring-purple-400'
                      : 'bg-slate-900 text-purple-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  🟣 .3 Morado
                </button>
              </div>

              {/* Aclaración técnica sénior sobre .4 */}
              <div className="flex items-start gap-1.5 text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <HelpCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {enchantmentLevel > 0 ? (
                    <>
                      Requiere{' '}
                      <strong className="text-amber-300">
                        {activeRecipe.category === 'cooking'
                          ? FOOD_ENCHANTMENT_CONFIG[enchantmentLevel as 1 | 2 | 3].nameEs
                          : POTION_ENCHANTMENT_CONFIG[enchantmentLevel as 1 | 2 | 3].nameEs}
                      </strong>{' '}
                      (incluido en la tabla de insumos).
                    </>
                  ) : (
                    'Receta base estándar sin salsas de pescado ni extractos arcanos.'
                  )}{' '}
                  <span className="text-slate-500 italic">
                    (Nota: Albion Online solo admite hasta .3 para consumibles; .4 es exclusivo de armas y armaduras).
                  </span>
                </span>
              </div>

              {/* Botón rápido al comparador directo */}
              <button
                type="button"
                onClick={() => setCalculatorView('comparator')}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>⚖️ Comparar simultáneamente .0 vs .1 vs .2 vs .3</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Parámetros de Fabricación */}
            <div className="space-y-3.5">
              {/* Lotes a Fabricar */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Cantidad de Lotes (Batches):</span>
                  <span className="font-mono text-amber-400 font-bold">
                    = {batches * activeRecipe.outputAmount} unidades finales
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <NumericInput
                    value={batches}
                    onChange={(val) => {
                      setBatches(val);
                      markStale();
                    }}
                    min={1}
                    step={1}
                    className="w-24 bg-slate-950 border border-slate-700 font-mono text-sm py-1.5"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 5, 10, 25, 50, 100].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setBatches(b);
                          markStale();
                        }}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          batches === b
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ubicación del Taller (Determina RRR) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-400" />
                    Ubicación de la Estación (RRR):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCityBonusExplainer(!showCityBonusExplainer)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  >
                    <BookOpen size={11} />
                    <span>¿Por qué {optimalCityName}?</span>
                  </button>
                </div>

                <select
                  value={stationLocation}
                  onChange={(e) => {
                    setStationLocation(e.target.value as StationLocation);
                    markStale();
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="bonus_city">
                    🏛️ Ciudad con Bono ({optimalCityName} - {optimalCitySpecialty}) — RRR 24.8% (47.9% c/foco)
                  </option>
                  <option value="non_bonus_city">
                    🏙️ Otra Ciudad Real sin Bono ({alternativeCities}) — RRR 15.2% (43.5% c/foco)
                  </option>
                  <option value="bonus_island">
                    🏝️ Isla en Ciudad Bonificada ({optimalCityName}) — RRR 13.0% (39.9% c/foco)
                  </option>
                  <option value="regular_island">
                    🏕️ Isla Personal Común (Sin Bono) — RRR 0.0% (37.1% c/foco)
                  </option>
                </select>

                {/* Explicador Educativo de Retorno de Recursos y Ciudades */}
                {showCityBonusExplainer && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-xs space-y-2 text-slate-300">
                    <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Info size={14} />
                        Mecánica Oficial de Albion Online: Retorno de Recursos
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCityBonusExplainer(false)}
                        className="text-slate-500 hover:text-slate-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-300">
                      Sandbox Interactive asigna a cada Ciudad Real una bonificación exclusiva del <strong className="text-amber-300">+15% de producción</strong> para especializar la economía:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <div className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                          <Utensils size={12} /> Caerleon: Capital de la Comida
                        </div>
                        <p className="text-slate-400">
                          Ubicada en el corazón del Continente Real junto al Mercado Negro. Tiene el <strong>bono exclusivo del +15% en Cocina (Cooked Food)</strong>.
                        </p>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <div className="font-bold text-emerald-300 flex items-center gap-1 mb-1">
                          <FlaskConical size={12} /> Brecilien: Santuario de Pociones
                        </div>
                        <p className="text-slate-400">
                          La ciudad de las Nieblas (The Mists) introducida en <em>Beyond the Veil</em>. Posee el <strong>bono exclusivo del +15% en Alquimia (Potions)</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="bg-amber-950/30 p-2 rounded border border-amber-800/50 text-[10px] space-y-1">
                      <div className="font-semibold text-amber-300">Matemática del Retorno de Recursos (RRR):</div>
                      <div className="font-mono text-slate-400">
                        • Con Bono ({optimalCityName}): +18% ciudad + 15% especialidad = <strong>+33% prod.</strong> ➔ RRR = 33/133 = <strong className="text-amber-300">24.8%</strong> (47.9% c/foco).
                      </div>
                      <div className="font-mono text-slate-400">
                        • Fuera de {optimalCityName}: Solo +18% base ➔ RRR = 18/118 = <strong className="text-red-400">15.2%</strong> (43.5% c/foco).
                      </div>
                      <p className="text-slate-400 italic mt-1">
                        ⚠️ Craftear {isCooking ? 'comida fuera de Caerleon' : 'pociones fuera de Brecilien'} te hace perder hasta un <strong>9.6% de todos los ingredientes</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle de Foco de Crafteo */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={18}
                    className={useFocus ? 'text-amber-400 animate-pulse' : 'text-slate-600'}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Usar Foco de Crafteo ⚡
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {useFocus
                        ? `Coste: ${(batches * recipeFocusEfficiency.actualFocusCostPerBatch).toLocaleString()} pts (${recipeFocusEfficiency.actualFocusCostPerBatch.toLocaleString()} pts/lote)`
                        : 'Elaborar sin foco (ahorra tu foco diario)'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUseFocus(!useFocus);
                    markStale();
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                    useFocus
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {useFocus ? 'ACTIVO' : 'APAGADO'}
                </button>
              </div>

              {/* Panel de Maestría de la Tabla del Destino (Destiny Board) */}
              <div className="bg-slate-950 rounded-xl border border-amber-500/40 p-3 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Award size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Tabla del Destino: {isCooking ? 'Cocina' : 'Alquimia'}</span>
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        +{recipeFocusEfficiency.fce.toLocaleString()} FCE Total | Ahorro: -{recipeFocusEfficiency.focusSavedPercent}% Foco
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleMaxCurrentBranch}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                      title="Poner rama al 100"
                    >
                      Max 100
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCurrentBranch}
                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                      title="Restablecer rama a 0"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Resumen de Métricas de Foco para esta Receta */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Coste / Lote</div>
                    <div className="font-mono text-sm font-black text-amber-400 mt-0.5">
                      {recipeFocusEfficiency.actualFocusCostPerBatch.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-500 line-through">
                      Base: {recipeFocusEfficiency.baseFocusCost}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Capacidad / 10k</div>
                    <div className="font-mono text-sm font-black text-emerald-400 mt-0.5">
                      {recipeFocusEfficiency.batchesPer10kFocus} lotes
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {recipeFocusEfficiency.batchesPer10kFocus * activeRecipe.outputAmount} unidades
                    </div>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Silver / Foco</div>
                    <div className="font-mono text-sm font-black text-sky-400 mt-0.5">
                      {calculatedResult ? `+${calculatedResult.silverPerFocus}` : '⚡'} 🪙
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {calculatedResult ? 'Ganancia/pt' : 'Por calcular'}
                    </div>
                  </div>
                </div>

                {/* Nodo 1: Rama General (Chef o Alquimista) */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      {isCooking ? 'Cocinero Maestro (Chef)' : 'Alquimista Maestro (Alchemist)'}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      Nvl {currentBranchMastery} / 100 (+{currentBranchMastery * 30} FCE)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Aporta +30 FCE a todas las recetas de {isCooking ? 'cocina' : 'alquimia'}.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentBranchMastery}
                      onChange={(e) => handleUpdateBranchMastery(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded"
                    />
                    <NumericInput
                      value={currentBranchMastery}
                      onChange={(val) => handleUpdateBranchMastery(val)}
                      min={0}
                      max={100}
                      className="w-14 bg-slate-950 border border-slate-700 font-mono text-xs py-0.5 text-center"
                    />
                  </div>
                </div>

                {/* Nodo 2: Especialidad Específica del Ítem */}
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      Especialidad: {currentSpecDef.nameEs}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      Nvl {currentSpecLevel} / 100 (+{currentSpecLevel * 250} FCE)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Aporta +250 FCE directo a esta receta y +30 FCE cruzado al resto.
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={currentSpecLevel}
                      onChange={(e) => handleUpdateCraftSpec(activeRecipe.specKey, Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded"
                    />
                    <NumericInput
                      value={currentSpecLevel}
                      onChange={(val) => handleUpdateCraftSpec(activeRecipe.specKey, val)}
                      min={0}
                      max={100}
                      className="w-14 bg-slate-950 border border-slate-700 font-mono text-xs py-0.5 text-center"
                    />
                  </div>
                </div>

                {/* Acordeón de Especializaciones Cruzadas de la Rama */}
                <div className="border-t border-slate-800/80 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowOtherSpecs(!showOtherSpecs)}
                    className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-amber-400 transition-colors py-1"
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sliders size={12} />
                      Otras Especializaciones Cruzadas de {isCooking ? 'Cocina' : 'Alquimia'} ({currentBranchSpecs.length - 1})
                    </span>
                    <span className="text-amber-400 font-mono text-[10px]">
                      {showOtherSpecs ? 'Ocultar ▲' : 'Configurar ▼'}
                    </span>
                  </button>

                  {showOtherSpecs && (
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {currentBranchSpecs
                        .filter((s) => s.id !== activeRecipe.specKey)
                        .map((sibling) => {
                          const lvl = (masteryProfile.craftSpecs || {})[sibling.id] ?? 0;
                          return (
                            <div
                              key={sibling.id}
                              className="bg-slate-900 p-2 rounded border border-slate-800/80 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-slate-300 font-medium truncate max-w-[180px]">
                                  {sibling.nameEs}
                                </span>
                                <span className="font-mono text-amber-400 font-bold">
                                  {lvl} / 100
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={lvl}
                                  onChange={(e) => handleUpdateCraftSpec(sibling.id, Number(e.target.value))}
                                  className="w-full accent-amber-500 cursor-pointer h-1 bg-slate-950 rounded"
                                />
                                <NumericInput
                                  value={lvl}
                                  onChange={(val) => handleUpdateCraftSpec(sibling.id, val)}
                                  min={0}
                                  max={100}
                                  className="w-12 bg-slate-950 border border-slate-700 font-mono text-[10px] py-0.5 text-center"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* Tasa de Estación (Nutrition Fee) */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    Tasa de la Estación (por 100 de Nutrición):
                    <span className="text-[10px] text-slate-400 font-normal">(Máx. 999 🪙)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStationFeePer100Nutrition(0);
                      markStale();
                    }}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Taller propio (0 🪙)
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <NumericInput
                    value={stationFeePer100Nutrition}
                    onChange={(val) => {
                      setStationFeePer100Nutrition(Math.min(1000, Math.max(0, val)));
                      markStale();
                    }}
                    className="w-full bg-slate-950 border border-slate-700 font-mono text-xs py-1.5"
                    step={50}
                    max={1000}
                  />
                  <span className="text-xs text-slate-500 font-mono">🪙/100u</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>
                    Nutrición estimada: {batches * activeRecipe.nutritionCost} u. | Tarifa:{' '}
                    <span className="font-mono text-slate-300 font-bold">
                      {Math.round(((batches * activeRecipe.nutritionCost) / 100) * (Number(stationFeePer100Nutrition) || 0)).toLocaleString()} 🪙
                    </span>
                  </span>
                  <span className={stationFeePer100Nutrition >= 900 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {stationFeePer100Nutrition >= 900 ? '⚠️ Tasa Alta' : 'Tope: 0 - 999 🪙'}
                  </span>
                </div>
              </div>

              {/* Impuesto de Mercado (Premium) */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-slate-400">Cuenta Premium activa:</span>
                <button
                  type="button"
                  onClick={() => {
                    setHasPremium(!hasPremium);
                    markStale();
                  }}
                  className={`text-xs px-2.5 py-1 rounded border font-bold transition-all ${
                    hasPremium
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {hasPremium ? '6.5% Impuestos (Premium)' : '10.5% Impuestos (Sin Premium)'}
                </button>
              </div>

              {/* Precio de Venta del Producto Final */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-200">
                    Precio Venta ({fullItemDisplayName}):
                  </label>
                  <button
                    type="button"
                    onClick={handleResetRecipePrices}
                    className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                    title="Restaurar precio base estimado"
                  >
                    <RotateCcw size={11} />
                    <span>Restaurar</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <NumericInput
                    value={productSellPrice}
                    onChange={handleUpdateProductPrice}
                    className="w-full bg-slate-950 border border-slate-700 font-mono text-xs py-1.5 text-amber-300 font-bold"
                    step={100}
                  />
                  <span className="text-xs text-slate-400 font-mono">🪙 c/u</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>
                    Venta bruta est.: {(batches * activeRecipe.outputAmount * productSellPrice).toLocaleString()} 🪙
                  </span>
                  <span>
                    Neto est.:{' '}
                    <span className="text-emerald-400 font-mono font-bold">
                      {Math.round(batches * activeRecipe.outputAmount * productSellPrice * (1 - marketTaxRate)).toLocaleString()} 🪙
                    </span>
                  </span>
                </div>
              </div>

              {/* Botón de Acción Principal para Calcular Resultados (Patrón DailyLogger) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  id="btn-calculate-craft"
                  onClick={handleCalculateResult}
                  className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                    isStale || !calculatedResult
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/60 shadow-amber-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Calculator size={18} />
                  <span>
                    {!calculatedResult
                      ? 'Calcular Resultados'
                      : isStale
                      ? 'Recalcular Resultados'
                      : 'Resultados al Día ✓'}
                  </span>
                </button>

                {isStale && calculatedResult && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>Parámetros modificados. Haz clic en "Recalcular" para refrescar el análisis.</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={handleResetIngredientsToDefault}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={11} />
                    <span>Restaurar Insumos</span>
                  </button>

                  {calculatedResult && (
                    <button
                      type="button"
                      onClick={handleClearResult}
                      className="text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <span>Limpiar Vista</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Tabla de Ingredientes & Comparativa Financiera (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Banner de Sincronización y Origen de Precios */}
          <div className="bg-slate-900 border border-slate-800/80 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-start sm:items-center gap-2.5 text-slate-300">
              <Info size={16} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong className="text-slate-100">Sincronización de Recursos:</strong> Los precios de tus cosechas se cargan automáticamente desde tu <strong className="text-emerald-400">Registro Diario</strong> (vigencia de 6h). Puedes modificarlos en la tabla y se guardarán en memoria.
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleClearExpiredCache}
                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Purgar registros de precios con más de 6 horas de antigüedad"
              >
                <Clock size={11} />
                <span>Purgar Expirados (&gt;6h)</span>
              </button>
              <button
                type="button"
                onClick={handleResetIngredientsToDefault}
                className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                title="Restablecer precios de insumos"
              >
                <RotateCcw size={11} />
                <span>Restablecer Insumos</span>
              </button>
            </div>
          </div>

          {cacheNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{cacheNotice}</span>
            </div>
          )}

          {/* Alerta de Desactualización si los inputs cambiaron */}
          {isStale && calculatedResult && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-amber-400 shrink-0" />
                <span>
                  Modificaste parámetros del crafteo después del último cálculo ({calculatedResult.calculatedAt}). Haz clic en <strong className="text-amber-300">Recalcular</strong> para actualizar.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCalculateResult}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Calculator size={13} />
                <span>Recalcular</span>
              </button>
            </div>
          )}

          {/* Encabezado de la Receta Activa */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">
                Receta: <span className="text-amber-300">{fullItemDisplayName}</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 font-mono">
                {batches} {batches === 1 ? 'lote' : 'lotes'} ({batches * activeRecipe.outputAmount} u. producidas)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>
                RRR: <strong className="text-emerald-400 font-mono">{returnRatePercent}%</strong> en{' '}
                <strong className="text-slate-300">{optimalCityName}</strong>
                {activeDailyBonus > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    🔥 +{activeDailyBonus}% Bono Diario
                  </span>
                )}
              </span>
              {calculatedResult && (
                <>
                  <span>•</span>
                  <span>Calculado a las <strong className="font-mono text-slate-300">{calculatedResult.calculatedAt}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Tabla Desglosada de Ingredientes (Siempre Visible) */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} className="text-amber-400" />
                Materias Primas Requeridas ({batches} lotes | RRR: {returnRatePercent}%)
              </h4>
              <span className="text-[11px] text-slate-400">
                Valor bruto insumos:{' '}
                <strong className="text-amber-300 font-mono tabular-nums">
                  {formatSilver(calculatedResult ? calculatedResult.totalRawValueGross : previewTotalRawGross)}
                </strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 pb-1">
                    <th className="py-1">Ingrediente & Origen</th>
                    <th className="py-1 text-center">Requerido</th>
                    <th className="py-1 text-center text-emerald-400">Devuelto (RRR)</th>
                    <th className="py-1 text-center text-amber-300">Neto Consumido</th>
                    <th className="py-1 text-right">Precio Mercado</th>
                    <th className="py-1 text-right">Costo Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums text-slate-300">
                  {(calculatedResult ? calculatedResult.ingredientsBreakdown : previewIngredientsBreakdown).map((ing) => (
                    <tr key={ing.itemId} className="hover:bg-slate-800/30">
                      <td className="py-2 pr-2 font-sans font-medium flex items-center gap-2">
                        <span className="text-slate-200">{ing.nameEs}</span>
                        {ing.source === 'memory' ? (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-semibold shrink-0 flex items-center gap-1 ${
                              ing.cacheStatus?.isExpired
                                ? 'text-amber-400 bg-amber-950/80 border border-amber-800/80'
                                : 'text-emerald-400 bg-emerald-950/70 border border-emerald-800/60'
                            }`}
                            title={
                              ing.cacheStatus?.isExpired
                                ? `Precio de cosecha con más de 6 horas de antigüedad (${ing.cacheStatus.formattedAge}). Se recomienda actualizar.`
                                : `Precio sincronizado de tu granja (${ing.cacheStatus?.formattedAge}). Válido durante ${ing.cacheStatus?.formattedRemaining}.`
                            }
                          >
                            <Clock size={10} />
                            🌾 Granja {ing.cacheStatus?.isExpired ? '(>6h)' : ''}
                          </span>
                        ) : ing.source === 'custom' ? (
                          <span
                            className="text-[9px] text-amber-300 bg-amber-950/70 border border-amber-800/60 px-1.5 py-0.5 rounded font-sans font-semibold shrink-0"
                            title="Precio editado manualmente en esta sesión"
                          >
                            ✏️ Editado
                          </span>
                        ) : (
                          <span
                            className="text-[9px] text-slate-400 bg-slate-800/80 border border-slate-700/80 px-1.5 py-0.5 rounded font-sans font-medium shrink-0"
                            title="Precio base estimado del catálogo de Albion"
                          >
                            📦 Catálogo
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center text-slate-300">
                        {ing.requiredGross} u.
                      </td>
                      <td className="py-2 text-center text-emerald-400 font-bold">
                        +{ing.returnedAmount} u.
                      </td>
                      <td className="py-2 text-center text-amber-300 font-bold">
                        {ing.netAmountConsumed} u.
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <NumericInput
                            value={ing.unitPrice}
                            onChange={(val) => handleUpdateIngredientPrice(ing.itemId, val)}
                            className="w-16 bg-slate-950 border border-slate-700 text-right py-0.5 px-1 text-xs"
                            step={50}
                          />
                          <span className="text-[10px] text-slate-500">🪙</span>
                        </div>
                      </td>
                      <td className="py-2 text-right text-slate-200 font-bold">
                        {formatSilver(ing.netCostConsumed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <span>
                Insumos devueltos salvados por RRR:{' '}
                <strong className="text-emerald-400 font-mono tabular-nums font-bold">
                  +{formatSilver(calculatedResult ? calculatedResult.totalValueReturned : previewTotalSavedByRRR)}
                </strong>
              </span>
              <span>
                Costo real consumido en estación:{' '}
                <strong className="text-amber-300 font-mono tabular-nums font-bold">
                  {formatSilver(calculatedResult ? calculatedResult.totalValueConsumedNet : previewTotalNetConsumed)}
                </strong>
              </span>
            </div>
          </div>

          {!calculatedResult ? (
            /* Estado Inicial: Sin Resultados Calculados Aún (Acción Clara) */
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Calculator size={24} />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-sm font-bold text-slate-100">
                  Análisis Financiero de {fullItemDisplayName} Listo
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Los insumos y precios están configurados en la tabla superior. Presiona el botón <strong className="text-amber-300">"Calcular Resultados"</strong> para comparar opciones (Vender crudo vs Procesar), deducir tarifas de taller y obtener el veredicto comercial exacto.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCalculateResult}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-1"
              >
                <Calculator size={18} />
                <span>Calcular Resultados Ahora</span>
              </button>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Modo seguro manual: previene cálculos desactualizados o inconsistencias de mercado</span>
              </div>
            </div>
          ) : (
            /* Panel de Resultados Financieros Calculados */
            <>
              <div id="craft-verdict-box" />

              {/* Tarjeta de Veredicto Financiero según el Modo */}
              {userMode === 'farmer' ? (
                /* =========================================================================
                   MODO GRANJERO / GANADERO (Dueño de la Materia Prima)
                   ========================================================================= */
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Modo Granjero / Ganadero
                      </span>
                      <h3 className="text-base font-black text-slate-100 mt-1">
                        ¿Qué deja más plata hoy en tu monedero?
                      </h3>
                    </div>
                    <div
                      className={`text-right px-3 py-1.5 rounded-xl border font-black text-sm ${
                        calculatedResult.farmerProfitDelta > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : calculatedResult.farmerProfitDelta === 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {calculatedResult.farmerProfitDelta > 0
                        ? '¡PROCESAR EN TALLER! 🍲'
                        : calculatedResult.farmerProfitDelta === 0
                        ? 'TABLAS / EQUILIBRIO ⚖️'
                        : '¡VENDER CRUDO! 🌾'}
                    </div>
                  </div>

                  {/* Comparativa A vs B */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Opción A: Vender Crudo */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Opción A: Vender Materias Primas Crudas
                      </div>
                      <div className="text-2xl font-black text-slate-200 font-mono tabular-nums">
                        {formatSilver(calculatedResult.farmerOptionA_SellRawNet)}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Vendes tu cosecha cruda en el mercado de Caerleon tras pagar la tasa del{' '}
                        {(marketTaxRate * 100).toFixed(1)}%. Cero costos de taller ni foco.
                      </p>
                    </div>

                    {/* Opción B: Procesar en Taller */}
                    <div
                      className={`p-4 rounded-xl border space-y-2 ${
                        calculatedResult.farmerProfitDelta > 0
                          ? 'bg-emerald-950/20 border-emerald-500/50'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Opción B: Procesar en Taller</span>
                        {calculatedResult.farmerProfitDelta > 0 && (
                          <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold text-emerald-300">
                            RECOMENDADO
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                        {formatSilver(calculatedResult.farmerOptionB_CraftNet)}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Vendes las {calculatedResult.totalOutputUnits} unidades terminadas + liquidas las materias primas
                        devueltas por el RRR ({formatSilver(calculatedResult.returnedIngredientsNetLiquidation)})
                        menos la tarifa del taller ({formatSilver(calculatedResult.stationFeeTotal)}).
                      </p>
                    </div>
                  </div>

                  {/* Resultado del Valor Agregado */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        Ganancia Adicional Neta por Fabricar ({calculatedResult.recipeName}):
                      </div>
                      <div
                        className={`text-xl font-black font-mono tabular-nums flex items-center gap-1.5 ${
                          calculatedResult.farmerProfitDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {calculatedResult.farmerProfitDelta >= 0 ? (
                          <TrendingUp size={20} />
                        ) : (
                          <TrendingDown size={20} />
                        )}
                        <span>
                          {calculatedResult.farmerProfitDelta >= 0 ? '+' : ''}
                          {formatSilver(calculatedResult.farmerProfitDelta)}
                        </span>
                        <span className="text-xs font-normal text-slate-400">
                          ({calculatedResult.farmerValueAddedPercent.toFixed(1)}% más plata en mano)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Plata Extra por Unidad:</div>
                      <div className="text-sm font-black font-mono tabular-nums text-amber-300">
                        +{formatSilver(calculatedResult.profitPerUnitCrafted)} / unidad
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* =========================================================================
                   MODO ARTESANO / COMERCIANTE (Compra Materia Prima en Mercado)
                   ========================================================================= */
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Modo Artesano / Comerciante
                      </span>
                      <h3 className="text-base font-black text-slate-100 mt-1">
                        Balance Comercial & Retorno de Inversión (ROI)
                      </h3>
                    </div>
                    <div
                      className={`text-right px-3 py-1.5 rounded-xl border font-black text-sm ${
                        calculatedResult.crafterNetProfit > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : calculatedResult.crafterNetProfit === 0
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {calculatedResult.crafterNetProfit > 0
                        ? '¡CRAFTEO RENTABLE! 📈'
                        : calculatedResult.crafterNetProfit === 0
                        ? 'PUNTO DE EQUILIBRIO ⚖️'
                        : 'PÉRDIDA 📉'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Inversión Insumos</div>
                      <div className="text-lg font-black text-slate-200 font-mono tabular-nums mt-0.5">
                        {formatSilver(calculatedResult.crafterTotalInvestment)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Materiales + Tarifa estación
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Retorno Neto Total</div>
                      <div className="text-lg font-black text-emerald-400 font-mono tabular-nums mt-0.5">
                        {formatSilver(calculatedResult.crafterTotalLiquidation)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Venta comida + Insumos RRR
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Margen Comercial</div>
                      <div
                        className={`text-lg font-black font-mono tabular-nums mt-0.5 ${
                          calculatedResult.crafterNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {calculatedResult.crafterNetProfit >= 0 ? '+' : ''}
                        {formatSilver(calculatedResult.crafterNetProfit)}
                      </div>
                      <div className="text-[10px] text-amber-300 font-mono tabular-nums font-bold mt-1">
                        ROI: {calculatedResult.crafterROI.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjeta de Eficiencia de Foco (🪙 / ⚡) */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      Eficiencia de Foco de Crafteo:
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {calculatedResult.useFocus ? (
                        <>
                          Ahorro por foco:{' '}
                          <strong className="text-amber-300 font-mono tabular-nums font-bold">
                            +{formatSilver(calculatedResult.totalFocusGainValue)}
                          </strong>{' '}
                          en insumos adicionales devueltos
                        </>
                      ) : (
                        'Foco inactivo en este cálculo. Actívalo y recalcula para ver la tasa de plata por foco.'
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black font-mono tabular-nums text-amber-400">
                    {calculatedResult.silverPerFocus} <span className="text-xs font-semibold">🪙/⚡</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {calculatedResult.silverPerFocus >= 40
                      ? '🌟 Excelente uso de foco'
                      : calculatedResult.silverPerFocus >= 20
                      ? '👍 Uso aceptable'
                      : calculatedResult.silverPerFocus > 0
                      ? '⚠️ Foco poco eficiente'
                      : 'Sin consumo de foco'}
                  </div>
                </div>
              </div>

              {/* Tarjeta de Velocidad de Mercado & Capacidad de Absorción */}
              {(() => {
                const velocity = evaluateMarketVelocity(
                  activeRecipe,
                  enchantmentLevel,
                  calculatedResult.profitPerUnitCrafted,
                  calculatedResult.crafterROI
                );
                const totalUnits = batches * activeRecipe.outputAmount;
                const safeUnits = velocity.recommendedBatchLimit * activeRecipe.outputAmount;
                const isOversaturated = totalUnits > safeUnits * 1.5;
                const isModerate = totalUnits > safeUnits;

                return (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">
                            Liquidez y Tiempo Estimado de Venta
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            ¿Se venderá rápido este lote en el mercado de la ciudad?
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${velocity.quadrantBadgeClass}`}>
                        {velocity.quadrantTitleEs}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Tiempo de Salida:</span>
                        <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
                          {velocity.saleTimeEst}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          En órdenes de venta normales
                        </span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Volumen Diario Estimado:</span>
                        <span className="text-sm font-bold text-slate-100 font-mono mt-0.5 block">
                          {velocity.dailyVolumeEst}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Demanda: {velocity.demandLabelEs}
                        </span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-medium">Límite Seguro Sugerido:</span>
                        <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">
                          {velocity.recommendedBatchLimit} lotes ({safeUnits} uds)
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Para no saturar el mercado
                        </span>
                      </div>
                    </div>

                    {/* Advertencia de sobre-saturación o trampa de liquidez */}
                    {isOversaturated ? (
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Alerta de Saturación ({totalUnits} uds):</strong> Estás fabricando más unidades de las que el mercado de una ciudad suele consumir en 24h. Corres el riesgo de que tus órdenes se estanquen o de tener que rebajar el precio agresivamente. Considera reducir el lote a {velocity.recommendedBatchLimit} lotes o diversificar en otras ciudades.
                        </div>
                      </div>
                    ) : isModerate ? (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 flex items-start gap-2">
                        <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Lote considerable ({totalUnits} uds):</strong> Tardará aproximadamente entre 24 y 48 horas en venderse por completo. No te impacientes ni vendas a precio de orden de compra.
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Absorción Rápida Garantizada:</strong> Tu lote de {totalUnits} unidades está por debajo del límite seguro ({safeUnits} uds). El mercado de la ciudad lo digerirá de manera fluida y orgánica sin romper los precios.
                        </div>
                      </div>
                    )}

                    {velocity.velocityTrapWarning && (
                      <div className="text-[11px] text-amber-300/90 leading-tight flex items-center gap-1.5 pt-1">
                        <span className="text-amber-400 font-bold">💡 Consejo:</span>
                        <span>{velocity.velocityTrapWarning}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Botón de Enlace a Rutas de Transporte & Arbitraje de Mercado */}
              {onNavigateToTransport && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg shrink-0 mt-0.5">
                      <Truck size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          🔗 Cadena de Producción: ¿Transportar y Vender Alimentos/Pociones?
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Lleva tu producción de <strong>{calculatedResult.recipeName}</strong> a ciudades con mayor demanda o a Caerleon (Mercado Negro / Mercado Real) con cálculo exacto de peso y capacidad de carga.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onNavigateToTransport}
                    className="w-full sm:w-auto px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-md cursor-pointer"
                  >
                    <span>Calcular Ruta & Transporte</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
