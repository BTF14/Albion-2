import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AlbionItem, CategoryType, CityId, DestinyMasteryProfile, AlbionRecipe } from '../types';
import { ALBION_ITEMS, CITIES } from '../data/items';
import { RECIPES } from '../data/recipes';
import { ItemIcon } from './ItemIcon';
import { NumericInput } from './NumericInput';
import {
  loadMasteryProfile,
  saveMasteryProfile,
  calculateFocusCost,
  calculateFocusRefill,
  getItemSpecKey,
  getBranchSpecKeys,
  DEFAULT_MASTERY_PROFILE,
  calculateRecipeFocusCost,
  CHEF_SPECS,
  ALCHEMIST_SPECS,
} from '../utils/destinyBoard';
import { loadPriceMemory } from '../utils/storage';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import { calculateDestinyFameTomes, DestinyMasteryCategory } from '../domain';
import {
  Zap,
  Award,
  TrendingUp,
  Sparkles,
  Sliders,
  RotateCcw,
  Clock,
  Check,
  Info,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Wheat,
  Sprout,
  Beef,
  Coins,
  Utensils,
  FlaskConical,
  Building2,
  MapPin,
  Flame,
  BookOpen,
} from 'lucide-react';

export type ExtendedMasteryCategory = CategoryType | 'cooking' | 'alchemy';

interface FocusMasteryCalculatorProps {
  currentCityId: CityId;
  onNavigateToLoggerWithPreset: (preset: {
    cityId: CityId;
    itemId?: string;
    plotsCount?: number;
  }) => void;
  onNavigateToCrafting?: (recipeId: string) => void;
  activeCharacterFocus?: number;
  activeCharacterName?: string;
  onOpenCharacterModal?: () => void;
}

export const FocusMasteryCalculator: React.FC<FocusMasteryCalculatorProps> = ({
  currentCityId,
  onNavigateToLoggerWithPreset,
  onNavigateToCrafting,
  activeCharacterFocus,
  activeCharacterName,
  onOpenCharacterModal,
}) => {
  // Perfil de maestría guardado en localStorage
  const [profile, setProfile] = useState<DestinyMasteryProfile>(() => loadMasteryProfile());

  // Categoría activa (Cultivos, Hierbas, Ganadería, Cocina, Alquimia)
  const [activeCategory, setActiveCategory] = useState<ExtendedMasteryCategory>('crop');

  // Ítem seleccionado de agricultura/ganadería
  const [selectedItemId, setSelectedItemId] = useState<string>('crop_wheat');

  // Receta seleccionada de cocina o alquimia
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('cook_pork_roast_t7');

  // Monitor de foco actual del jugador (sincronizado con el personaje activo si existe)
  const [currentFocus, setCurrentFocus] = useState<number>(() => activeCharacterFocus ?? 10000);

  // Estado de Calculadora de Tomos de Perspicacia & Fama
  const [showFameCalculator, setShowFameCalculator] = useState<boolean>(false);
  const [fameCategory, setFameCategory] = useState<DestinyMasteryCategory>('farming');
  const [fameCurrentLevel, setFameCurrentLevel] = useState<number>(1);
  const [fameTargetLevel, setFameTargetLevel] = useState<number>(100);
  const [tomeMarketPrice, setTomeMarketPrice] = useState<number>(24000);

  const fameAnalysis = useMemo(() => {
    return calculateDestinyFameTomes({
      category: fameCategory,
      currentLevel: fameCurrentLevel,
      targetLevel: fameTargetLevel,
      tomeMarketPrice,
    });
  }, [fameCategory, fameCurrentLevel, fameTargetLevel, tomeMarketPrice]);

  // Sincronizar foco si cambia el personaje activo externamente
  useEffect(() => {
    if (activeCharacterFocus !== undefined) {
      setCurrentFocus(activeCharacterFocus);
    }
  }, [activeCharacterFocus]);

  // Helper para estimar precios de mercado iniciales o guardados para cultivos
  const getItemMarketPrices = (item: AlbionItem) => {
    const mem = loadPriceMemory()[item.id];
    const defaultSeed =
      item.category === 'animal_produce'
        ? 0
        : item.category === 'animal_meat'
        ? 3000 + item.tier * 1000
        : 1500 + item.tier * 450;
    const defaultProd = 220 + item.tier * 65;
    return {
      seedPrice: mem?.lastSeedPrice ?? defaultSeed,
      productPrice: mem?.lastProductPrice ?? defaultProd,
    };
  };

  // Precios personalizados para el cálculo de plata/foco en agricultura
  const [customSeedPrice, setCustomSeedPrice] = useState<number>(() => {
    const item = ALBION_ITEMS.find((i) => i.id === 'crop_wheat') || ALBION_ITEMS[0];
    return getItemMarketPrices(item).seedPrice;
  });
  const [customProductPrice, setCustomProductPrice] = useState<number>(() => {
    const item = ALBION_ITEMS.find((i) => i.id === 'crop_wheat') || ALBION_ITEMS[0];
    return getItemMarketPrices(item).productPrice;
  });

  // Acordeón para ver especializaciones cruzadas de la misma rama
  const [showCrossSpecs, setShowCrossSpecs] = useState<boolean>(false);

  // Mensaje de feedback al guardar
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  // Sincronizar automáticamente si se modifica la maestría en otro componente
  useEffect(() => {
    const handleMasteryUpdate = () => {
      setProfile(loadMasteryProfile());
    };
    window.addEventListener('albion_mastery_updated', handleMasteryUpdate);
    window.addEventListener('storage', handleMasteryUpdate);
    return () => {
      window.removeEventListener('albion_mastery_updated', handleMasteryUpdate);
      window.removeEventListener('storage', handleMasteryUpdate);
    };
  }, []);

  // Determinar si la categoría activa es de crafteo (Cocina o Alquimia)
  const isCraftCategory = activeCategory === 'cooking' || activeCategory === 'alchemy';

  // Lista de recetas para la categoría de crafteo activa
  const craftRecipes = useMemo(() => {
    if (!isCraftCategory) return [];
    return RECIPES.filter((r) => r.category === activeCategory);
  }, [activeCategory, isCraftCategory]);

  // Receta activa seleccionada
  const activeCraftRecipe = useMemo(() => {
    if (!isCraftCategory) return RECIPES[0];
    const found = RECIPES.find((r) => r.id === selectedRecipeId && r.category === activeCategory);
    return found || craftRecipes[0] || RECIPES[0];
  }, [selectedRecipeId, activeCategory, isCraftCategory, craftRecipes]);

  // Lista de ítems para categorías de agricultura/ganadería
  const categoryItems = useMemo(() => {
    if (isCraftCategory) return [];
    return ALBION_ITEMS.filter((i) => {
      if (activeCategory === 'crop') return i.category === 'crop';
      if (activeCategory === 'herb') return i.category === 'herb';
      return i.category === 'animal_produce' || i.category === 'animal_meat';
    });
  }, [activeCategory, isCraftCategory]);

  // Ítem actualmente seleccionado para agricultura
  const currentItem = useMemo(() => {
    if (isCraftCategory) return ALBION_ITEMS[0];
    return ALBION_ITEMS.find((i) => i.id === selectedItemId) || categoryItems[0] || ALBION_ITEMS[0];
  }, [selectedItemId, categoryItems, isCraftCategory]);

  // Selección controlada de ítem con sincronización de precios
  const handleItemSelect = (newId: string) => {
    setSelectedItemId(newId);
    const item = ALBION_ITEMS.find((i) => i.id === newId);
    if (item) {
      const prices = getItemMarketPrices(item);
      setCustomSeedPrice(prices.seedPrice);
      setCustomProductPrice(prices.productPrice);
    }
  };

  // Selección de categoría
  const handleSelectCategory = (cat: ExtendedMasteryCategory) => {
    setActiveCategory(cat);
    if (cat === 'cooking') {
      const firstCook = RECIPES.find((r) => r.category === 'cooking');
      if (firstCook) setSelectedRecipeId(firstCook.id);
    } else if (cat === 'alchemy') {
      const firstAlch = RECIPES.find((r) => r.category === 'alchemy');
      if (firstAlch) setSelectedRecipeId(firstAlch.id);
    } else {
      const firstInCat = ALBION_ITEMS.find((i) => {
        if (cat === 'crop') return i.category === 'crop';
        if (cat === 'herb') return i.category === 'herb';
        return i.category === 'animal_produce' || i.category === 'animal_meat';
      });
      if (firstInCat) {
        setSelectedItemId(firstInCat.id);
        const prices = getItemMarketPrices(firstInCat);
        setCustomSeedPrice(prices.seedPrice);
        setCustomProductPrice(prices.productPrice);
      }
    }
  };

  // Guardar perfil en storage
  const handleSaveProfile = (newProfile: DestinyMasteryProfile) => {
    setProfile(newProfile);
    saveMasteryProfile(newProfile);
    setSavedSuccess(true);
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
    savedTimeoutRef.current = setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Actualizar nivel de Maestría General
  const handleBranchMasteryChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    let updated: DestinyMasteryProfile;
    if (activeCategory === 'crop') {
      updated = { ...profile, cropMastery: clamped };
    } else if (activeCategory === 'herb') {
      updated = { ...profile, herbMastery: clamped };
    } else if (activeCategory === 'cooking') {
      updated = { ...profile, chefMastery: clamped };
    } else if (activeCategory === 'alchemy') {
      updated = { ...profile, alchemistMastery: clamped };
    } else {
      updated = { ...profile, animalMastery: clamped };
    }
    handleSaveProfile(updated);
  };

  // Actualizar nivel de Especialización de agricultura
  const handleItemSpecChange = (itemId: string, val: number) => {
    const specKey = getItemSpecKey(itemId);
    const clamped = Math.min(100, Math.max(0, val));
    const updated: DestinyMasteryProfile = {
      ...profile,
      itemSpecs: {
        ...profile.itemSpecs,
        [specKey]: clamped,
      },
    };
    handleSaveProfile(updated);
  };

  // Actualizar nivel de Especialización de crafteo
  const handleCraftSpecChange = (specKey: string, val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    const updated: DestinyMasteryProfile = {
      ...profile,
      craftSpecs: {
        ...(profile.craftSpecs || {}),
        [specKey]: clamped,
      },
    };
    handleSaveProfile(updated);
  };

  // Maxear toda la rama actual (100/100)
  const handleMaxAllInBranch = () => {
    let updated: DestinyMasteryProfile;
    if (activeCategory === 'cooking') {
      const updatedCraft = { ...(profile.craftSpecs || {}) };
      CHEF_SPECS.forEach((s) => {
        updatedCraft[s.id] = 100;
      });
      updated = { ...profile, chefMastery: 100, craftSpecs: updatedCraft };
    } else if (activeCategory === 'alchemy') {
      const updatedCraft = { ...(profile.craftSpecs || {}) };
      ALCHEMIST_SPECS.forEach((s) => {
        updatedCraft[s.id] = 100;
      });
      updated = { ...profile, alchemistMastery: 100, craftSpecs: updatedCraft };
    } else {
      const branchKeys = getBranchSpecKeys(activeCategory);
      const updatedSpecs = { ...profile.itemSpecs };
      branchKeys.forEach((k) => {
        updatedSpecs[k] = 100;
      });
      if (activeCategory === 'crop') {
        updated = { ...profile, cropMastery: 100, itemSpecs: updatedSpecs };
      } else if (activeCategory === 'herb') {
        updated = { ...profile, herbMastery: 100, itemSpecs: updatedSpecs };
      } else {
        updated = { ...profile, animalMastery: 100, itemSpecs: updatedSpecs };
      }
    }
    handleSaveProfile(updated);
  };

  // Restablecer rama a 0
  const handleResetBranch = () => {
    let updated: DestinyMasteryProfile;
    if (activeCategory === 'cooking') {
      const updatedCraft = { ...(profile.craftSpecs || {}) };
      CHEF_SPECS.forEach((s) => {
        updatedCraft[s.id] = 0;
      });
      updated = { ...profile, chefMastery: 0, craftSpecs: updatedCraft };
    } else if (activeCategory === 'alchemy') {
      const updatedCraft = { ...(profile.craftSpecs || {}) };
      ALCHEMIST_SPECS.forEach((s) => {
        updatedCraft[s.id] = 0;
      });
      updated = { ...profile, alchemistMastery: 0, craftSpecs: updatedCraft };
    } else {
      const branchKeys = getBranchSpecKeys(activeCategory);
      const updatedSpecs = { ...profile.itemSpecs };
      branchKeys.forEach((k) => {
        updatedSpecs[k] = 0;
      });
      if (activeCategory === 'crop') {
        updated = { ...profile, cropMastery: 0, itemSpecs: updatedSpecs };
      } else if (activeCategory === 'herb') {
        updated = { ...profile, herbMastery: 0, itemSpecs: updatedSpecs };
      } else {
        updated = { ...profile, animalMastery: 0, itemSpecs: updatedSpecs };
      }
    }
    handleSaveProfile(updated);
  };

  // Nivel de maestría de la rama actual
  const currentBranchMastery = useMemo(() => {
    if (activeCategory === 'crop') return profile.cropMastery;
    if (activeCategory === 'herb') return profile.herbMastery;
    if (activeCategory === 'cooking') return profile.chefMastery ?? 0;
    if (activeCategory === 'alchemy') return profile.alchemistMastery ?? 0;
    return profile.animalMastery;
  }, [profile, activeCategory]);

  // Nivel de especialización del ítem seleccionado (agricultura)
  const currentItemSpec = useMemo(() => {
    const specKey = getItemSpecKey(currentItem.id);
    return profile.itemSpecs[specKey] ?? 0;
  }, [profile, currentItem.id]);

  // Cálculo de eficiencia de foco del ítem actual (agricultura)
  const farmEfficiency = useMemo(() => {
    return calculateFocusCost(currentItem.id, profile, customSeedPrice, customProductPrice);
  }, [currentItem.id, profile, customSeedPrice, customProductPrice]);

  // Nivel de especialización de la receta seleccionada (crafteo)
  const currentCraftSpecsList = useMemo(() => {
    return activeCategory === 'cooking' ? CHEF_SPECS : ALCHEMIST_SPECS;
  }, [activeCategory]);

  const activeCraftSpecDef = useMemo(() => {
    return currentCraftSpecsList.find((s) => s.id === activeCraftRecipe.specKey) || currentCraftSpecsList[0];
  }, [currentCraftSpecsList, activeCraftRecipe.specKey]);

  const currentCraftSpecLevel = useMemo(() => {
    return (profile.craftSpecs || {})[activeCraftRecipe.specKey] ?? 0;
  }, [profile.craftSpecs, activeCraftRecipe.specKey]);

  // Cálculo de eficiencia de foco para la receta de crafteo (Cocina / Alquimia)
  const craftEfficiency = useMemo(() => {
    return calculateRecipeFocusCost(activeCraftRecipe, profile, 2000, 24.8, 47.9);
  }, [activeCraftRecipe, profile]);

  // Información de recarga de foco actual
  const refillInfo = useMemo(() => {
    return calculateFocusRefill(currentFocus);
  }, [currentFocus]);

  // Capacidad con foco actual
  const waterableWithCurrentFocus = useMemo(() => {
    const slots = Math.floor(currentFocus / Math.max(1, farmEfficiency.focusCostPerSlot));
    const plots = Number((slots / 9).toFixed(1));
    return { slots, plots };
  }, [currentFocus, farmEfficiency.focusCostPerSlot]);

  const craftableWithCurrentFocus = useMemo(() => {
    return Math.floor(currentFocus / Math.max(1, craftEfficiency.actualFocusCostPerBatch));
  }, [currentFocus, craftEfficiency.actualFocusCostPerBatch]);

  // Especializaciones hermanas de la misma rama (agricultura)
  const siblingFarmSpecs = useMemo(() => {
    if (isCraftCategory) return [];
    const branchKeys = getBranchSpecKeys(activeCategory as CategoryType);
    const currentSpecKey = getItemSpecKey(currentItem.id);
    return branchKeys
      .filter((k) => k !== currentSpecKey)
      .map((k) => {
        const repItem = ALBION_ITEMS.find((i) => getItemSpecKey(i.id) === k);
        return {
          key: k,
          name: repItem ? repItem.nameEs : k,
          tier: repItem?.tier || 4,
          level: profile.itemSpecs[k] ?? 0,
        };
      });
  }, [activeCategory, currentItem.id, profile.itemSpecs, isCraftCategory]);

  // Especializaciones hermanas de la misma rama (crafteo)
  const siblingCraftSpecs = useMemo(() => {
    if (!isCraftCategory) return [];
    return currentCraftSpecsList
      .filter((s) => s.id !== activeCraftRecipe.specKey)
      .map((s) => ({
        id: s.id,
        nameEs: s.nameEs,
        level: (profile.craftSpecs || {})[s.id] ?? 0,
      }));
  }, [isCraftCategory, currentCraftSpecsList, activeCraftRecipe.specKey, profile.craftSpecs]);

  return (
    <div className="space-y-6">
      {/* Barra de Monitoreo de Foco Actual & Recarga */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Foco Actual y Tiempo de Recarga */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">
                  {activeCharacterName ? `Foco de ${activeCharacterName}:` : 'Puntos de Foco Actuales:'}
                </span>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {currentFocus.toLocaleString()} / 30.000
                </span>
                {refillInfo.isFull && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                    ¡Tope Alcanzado!
                  </span>
                )}
                {onOpenCharacterModal && (
                  <button
                    type="button"
                    onClick={onOpenCharacterModal}
                    className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer ml-1"
                  >
                    Cambiar Alt
                  </button>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock size={12} className="text-slate-500" />
                <span>{refillInfo.timeString}</span>
                <span className="text-slate-500 font-mono">(+416 pts/hora)</span>
              </div>
            </div>
          </div>

          {/* Slider de Foco Actual y Capacidad Inmediata */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-full sm:w-48">
              <input
                type="range"
                min={0}
                max={30000}
                step={250}
                value={currentFocus}
                onChange={(e) => setCurrentFocus(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-950 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0</span>
                <span>10.000</span>
                <span>20.000</span>
                <span>30.000</span>
              </div>
            </div>

            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              {isCraftCategory ? (
                <>
                  <span className="text-slate-400">Elaboras ahora: </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {craftableWithCurrentFocus} lotes
                  </span>
                  <span className="text-slate-500 text-[11px] tabular-nums">
                    {' '}
                    ({craftableWithCurrentFocus * activeCraftRecipe.outputAmount} u.)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-slate-400">Riegas ahora: </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {waterableWithCurrentFocus.plots} parcelas
                  </span>
                  <span className="text-slate-500 text-[11px] tabular-nums">
                    {' '}
                    ({waterableWithCurrentFocus.slots} casillas)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Categoría (Tabla del Destino Integral: 5 ramas) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectCategory('crop')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeCategory === 'crop'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wheat size={15} />
            Cultivos
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('herb')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeCategory === 'herb'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sprout size={15} />
            Hierbas
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('animal_produce')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeCategory === 'animal_produce' || activeCategory === 'animal_meat'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Beef size={15} />
            Ganadería
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('cooking')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeCategory === 'cooking'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Utensils size={15} />
            Cocina (Chef)
          </button>

          <button
            type="button"
            onClick={() => handleSelectCategory('alchemy')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeCategory === 'alchemy'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FlaskConical size={15} />
            Alquimia (Pociones)
          </button>
        </div>

        {/* Acciones de Lote para la Rama */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowFameCalculator(!showFameCalculator)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
              showFameCalculator
                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                : 'bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-slate-800'
            }`}
          >
            <Award size={14} />
            <span>⭐ Tomos & Fama (Subir a 100)</span>
          </button>

          {savedSuccess && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/50 px-2.5 py-1 rounded-lg">
              <Check size={13} /> Guardado
            </span>
          )}

          <button
            type="button"
            onClick={handleMaxAllInBranch}
            className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold"
            title="Poner al nivel 100 todos los nodos de esta rama"
          >
            <Sparkles size={13} /> Maxear Rama (100/100)
          </button>

          <button
            type="button"
            onClick={handleResetBranch}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            title="Restablecer todos los niveles de esta rama a 0"
          >
            <RotateCcw size={13} /> Reiniciar
          </button>
        </div>
      </div>

      {/* Panel Desplegable: Calculadora de Tomos & Fama de la Tabla del Destino */}
      {showFameCalculator && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <span>Calculadora de Fama & Tomos de la Perspicacia (Curva Oficial de Albion)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Calcula la fama restante entre niveles y el coste de comprar Tomos de 10.000 para maximizar tu FCE y reducir el foco.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFameCalculator(false)}
              className="text-xs text-slate-400 hover:text-slate-200 self-end sm:self-auto"
            >
              Cerrar
            </button>
          </div>

          {/* Controles de Entrada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Categoría de Especialización
              </label>
              <select
                value={fameCategory}
                onChange={(e) => setFameCategory(e.target.value as DestinyMasteryCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="farming">🌾 Agricultura / Ganadería</option>
                <option value="refining">🪓 Refinado de Recursos</option>
                <option value="crafting">🔨 Crafteo / Forja de Equipo</option>
                <option value="combat">⚔️ Combate (Armas & Armaduras)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Nivel Actual (1..100): <span className="text-amber-400 font-bold">{fameCurrentLevel}</span>
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={fameCurrentLevel}
                onChange={(e) => setFameCurrentLevel(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Nivel Objetivo (1..100): <span className="text-emerald-400 font-bold">{fameTargetLevel}</span>
              </label>
              <input
                type="number"
                min="2"
                max="100"
                value={fameTargetLevel}
                onChange={(e) => setFameTargetLevel(Math.max(2, Math.min(100, Number(e.target.value) || 100)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Precio Tomo (10k fama 🪙)
              </label>
              <input
                type="number"
                min="1000"
                value={tomeMarketPrice}
                onChange={(e) => setTomeMarketPrice(Math.max(1000, Number(e.target.value) || 24000))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tarjetas de Resultados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">Fama Restante Necesaria:</div>
              <div className="text-base font-black text-amber-300 mt-0.5 font-mono tabular-nums">
                {fameAnalysis.fameRequiredTotal.toLocaleString()} fama
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">Tomos de 10.000 Requeridos:</div>
              <div className="text-base font-black text-slate-100 mt-0.5 font-mono tabular-nums">
                ~{fameAnalysis.tomesRequired.toLocaleString()} tomos
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">Coste Total en Plata:</div>
              <div className="text-base font-black text-rose-400 mt-0.5 font-mono tabular-nums">
                {formatSilver(fameAnalysis.totalSilverCost)}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400">FCE Ganado al Subir:</div>
              <div className="text-base font-black text-emerald-400 mt-0.5 font-mono tabular-nums">
                +{fameAnalysis.focusEfficiencyGainedFCE} FCE
              </div>
            </div>
          </div>

          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            💡 {fameAnalysis.advice}
          </div>
        </div>
      )}

      {/* Grid Principal: Configuración de Niveles vs Métricas en Tiempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================================================================= */}
        {/* COLUMNA IZQUIERDA: CONTROLES DE LA TABLA DEL DESTINO (7 COLS)     */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Nodo 1: Maestría General de la Rama */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} /> Nodo Principal
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  {activeCategory === 'crop'
                    ? 'Maestría de Agricultor'
                    : activeCategory === 'herb'
                    ? 'Maestría de Herborista'
                    : activeCategory === 'cooking'
                    ? 'Cocinero Maestro (Chef)'
                    : activeCategory === 'alchemy'
                    ? 'Alquimista Maestro (Alchemist)'
                    : 'Maestría de Criador de Animales'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Nivel:</span>
                <span className="font-mono text-lg font-black text-amber-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 tabular-nums">
                  {currentBranchMastery} / 100
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Otorga <strong className="text-slate-200">+30 de Eficiencia (FCE)</strong> por nivel a todos los ítems de esta categoría (hasta +3.000 FCE pasiva total).
            </p>

            {/* Slider de Maestría */}
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={100}
                value={currentBranchMastery}
                onChange={(e) => handleBranchMasteryChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />
              <div className="flex justify-between items-center text-xs">
                {[0, 25, 50, 75, 100].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleBranchMasteryChange(lvl)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                      currentBranchMastery === lvl
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Nvl {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECCIÓN CRAFTEO (COCINA & ALQUIMIA): NODO 2 & 3                 */}
          {/* =============================================================== */}
          {isCraftCategory ? (
            <>
              {/* Nodo 2: Receta de Crafteo & Especialización */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={14} /> Receta Analizada & Especialización
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-0.5">
                      {activeCategory === 'cooking' ? 'Comida Elaborada' : 'Poción Elaborada'}
                    </h3>
                  </div>

                  {/* Selector de Receta */}
                  <select
                    value={activeCraftRecipe.id}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold max-w-[260px]"
                  >
                    {craftRecipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        T{recipe.tier} - {recipe.nameEs}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ficha de la receta seleccionada */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ItemIcon name={activeCraftRecipe.iconName} size={36} />
                    <div>
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <AlbionItemBadge tier={activeCraftRecipe.tier} />
                        <span>{activeCraftRecipe.nameEs}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Produce {activeCraftRecipe.outputAmount} u. / lote</span>
                        <span>•</span>
                        <span className="tabular-nums">Coste base: {activeCraftRecipe.baseFocusCost} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">{activeCraftSpecDef.nameEs}:</div>
                    <div className="font-mono text-lg font-black text-amber-400 tabular-nums">
                      {currentCraftSpecLevel} / 100
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  La especialidad <strong className="text-slate-200">{activeCraftSpecDef.nameEs}</strong> otorga{' '}
                  <strong className="text-slate-200">+250 FCE directa</strong> por nivel a esta receta (hasta +25.000 FCE) y{' '}
                  <strong className="text-slate-200">+30 FCE cruzada</strong> a las demás recetas de {activeCategory === 'cooking' ? 'cocina' : 'alquimia'}.
                </p>

                {/* Slider de Especialización de la Receta */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={currentCraftSpecLevel}
                    onChange={(e) => handleCraftSpecChange(activeCraftRecipe.specKey, Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                  />
                  <div className="flex justify-between items-center text-xs">
                    {[0, 25, 50, 75, 100].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleCraftSpecChange(activeCraftRecipe.specKey, lvl)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                          currentCraftSpecLevel === lvl
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Nvl {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nodo 3: Especializaciones Cruzadas de la Rama de Crafteo */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                <button
                  type="button"
                  onClick={() => setShowCrossSpecs(!showCrossSpecs)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-400" />
                      Otras Especializaciones de {activeCategory === 'cooking' ? 'Cocina' : 'Alquimia'} ({siblingCraftSpecs.length})
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cada nivel en otras especializaciones aporta +30 FCE pasiva cruzada a esta receta.
                    </p>
                  </div>

                  <span className="text-xs text-amber-400 font-semibold underline">
                    {showCrossSpecs ? 'Ocultar' : 'Configurar'}
                  </span>
                </button>

                {showCrossSpecs && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    {siblingCraftSpecs.map((sibling) => (
                      <div
                        key={sibling.id}
                        className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs"
                      >
                        <span className="text-slate-300 font-medium">{sibling.nameEs}</span>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={sibling.level}
                            onChange={(e) => handleCraftSpecChange(sibling.id, Number(e.target.value))}
                            className="w-24 sm:w-32 accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded"
                          />
                          <span className="font-mono text-amber-400 w-12 text-right font-bold">
                            {sibling.level} / 100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* =============================================================== */}
              {/* SECCIÓN AGRICULTURA / GANADERÍA: NODO 2 & 3                      */}
              {/* =============================================================== */}
              {/* Nodo 2: Especialización Específica del Ítem */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={14} /> Especialización del Ítem
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-0.5">
                      Cultivo o Animal Analizado
                    </h3>
                  </div>

                  {/* Selector del Ítem */}
                  <select
                    value={selectedItemId}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  >
                    {categoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        T{item.tier} - {item.nameEs}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ficha del ítem seleccionado */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ItemIcon name={currentItem.iconName} size={32} />
                    <div>
                      <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <AlbionItemBadge tier={currentItem.tier} />
                        <span>{currentItem.nameEs}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {currentItem.nameEn}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Nivel de Especialización:</div>
                    <div className="font-mono text-lg font-black text-amber-400 tabular-nums">
                      {currentItemSpec} / 100
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Otorga <strong className="text-slate-200">+250 de Eficiencia</strong> directa por nivel a este cultivo (hasta +25.000 FCE) y <strong className="text-slate-200">+30 de Eficiencia pasiva</strong> a los demás cultivos de la rama.
                </p>

                {/* Slider de Especialización del Ítem */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={currentItemSpec}
                    onChange={(e) => handleItemSpecChange(currentItem.id, Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
                  />
                  <div className="flex justify-between items-center text-xs">
                    {[0, 25, 50, 75, 100].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleItemSpecChange(currentItem.id, lvl)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                          currentItemSpec === lvl
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        Nvl {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nodo 3: Especializaciones Cruzadas de la Misma Rama (Acordeón) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                <button
                  type="button"
                  onClick={() => setShowCrossSpecs(!showCrossSpecs)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-400" />
                      Especializaciones Cruzadas de la Rama ({siblingFarmSpecs.length} ítems)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cada nivel en otros cultivos aporta +30 FCE pasiva a este ítem.
                    </p>
                  </div>

                  <span className="text-xs text-amber-400 font-semibold underline">
                    {showCrossSpecs ? 'Ocultar' : 'Configurar'}
                  </span>
                </button>

                {showCrossSpecs && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    {siblingFarmSpecs.map((sibling) => (
                      <div
                        key={sibling.key}
                        className="flex items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs"
                      >
                        <span className="text-slate-300 font-medium">
                          T{sibling.tier} - {sibling.name}
                        </span>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={sibling.level}
                            onChange={(e) => {
                              const updatedSpecs = { ...profile.itemSpecs, [sibling.key]: Number(e.target.value) };
                              handleSaveProfile({ ...profile, itemSpecs: updatedSpecs });
                            }}
                            className="w-24 sm:w-32 accent-amber-500 cursor-pointer h-1.5 bg-slate-900 rounded"
                          />
                          <span className="font-mono text-amber-400 w-12 text-right font-bold">
                            {sibling.level} / 100
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ================================================================= */}
        {/* COLUMNA DERECHA: PANEL DE MÉTRICAS EN TIEMPO REAL (5 COLS)         */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          {isCraftCategory ? (
            /* MÉTRICAS DE CRAFTEO (COCINA & ALQUIMIA) */
            <>
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-xl p-5 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      FCE & Crafteo en Vivo
                    </span>
                    <h4 className="text-base font-bold text-slate-100">
                      Coste de Foco {activeCategory === 'cooking' ? 'Cocina' : 'Alquimia'}
                    </h4>
                  </div>

                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-lg">
                    -{craftEfficiency.focusSavedPercent}% Foco
                  </div>
                </div>

                {/* Números Principales */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Coste / Lote:</div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 mt-1 tabular-nums">
                      {craftEfficiency.actualFocusCostPerBatch.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                      Base: {craftEfficiency.baseFocusCost.toLocaleString()} pts
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Lotes c/ 10.000 Foco:</div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tabular-nums">
                      {craftEfficiency.batchesPer10kFocus}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                      {craftEfficiency.batchesPer10kFocus * activeCraftRecipe.outputAmount} u. producidas
                    </div>
                  </div>
                </div>

                {/* Eficiencia Acumulada (FCE) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Eficiencia Total Acumulada (FCE):</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    +{craftEfficiency.fce.toLocaleString()} FCE
                  </span>
                </div>

                {/* Capacidad Diaria con 10.000 de Foco */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Producción Diaria (10k Foco):</span>
                    <span className="font-mono font-bold text-amber-400 tabular-nums">
                      {craftEfficiency.batchesPer10kFocus * activeCraftRecipe.outputAmount} unidades
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, (craftEfficiency.batchesPer10kFocus / 50) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Sin maestría: {Math.floor(10000 / craftEfficiency.baseFocusCost)} lotes</span>
                    <span>Actual: {craftEfficiency.batchesPer10kFocus} lotes</span>
                  </div>
                </div>

                {/* Botón de enlace hacia el Calculador de Valor Agregado */}
                {onNavigateToCrafting && (
                  <button
                    type="button"
                    onClick={() => onNavigateToCrafting(activeCraftRecipe.id)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                  >
                    <ArrowRight size={15} />
                    Calcular Ganancia Neta de esta Receta en Valor Agregado
                  </button>
                )}
              </div>

              {/* Bonificación de Ciudad Recomendada */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin size={14} className="text-amber-400" />
                    Ciudad Bonificada:{' '}
                    <span className="text-amber-300">
                      {activeCategory === 'cooking' ? 'Caerleon' : 'Brecilien'}
                    </span>
                  </h5>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    +15% Producción
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {activeCategory === 'cooking' ? (
                    <>
                      <strong>Caerleon</strong> es la única ciudad real con bonificación oficial en{' '}
                      <strong>Cocina (+15%)</strong>. Al elaborar en sus talleres reales obtienes{' '}
                      <span className="text-amber-300 font-bold font-mono">24.8% RRR sin foco</span> y{' '}
                      <span className="text-emerald-400 font-bold font-mono">47.9% RRR con foco</span>.
                    </>
                  ) : (
                    <>
                      <strong>Brecilien</strong> (la ciudad de las Nieblas) es la capital oficial de{' '}
                      <strong>Alquimia (+15%)</strong>. En sus estaciones de alquimia disfrutas de{' '}
                      <span className="text-amber-300 font-bold font-mono">24.8% RRR sin foco</span> y{' '}
                      <span className="text-emerald-400 font-bold font-mono">47.9% RRR con foco</span>.
                    </>
                  )}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Impacto de Fabricar Fuera:</div>
                  <div>
                    Fuera de {activeCategory === 'cooking' ? 'Caerleon' : 'Brecilien'}, la tasa de retorno cae a{' '}
                    <strong className="text-red-400">15.2% (sin foco)</strong> y{' '}
                    <strong className="text-red-400">43.5% (con foco)</strong>. Se pierde casi un 10% de materia prima.
                  </div>
                </div>
              </div>

              {/* Explicador de la Fórmula Oficial de Albion Online */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-2 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-amber-400" />
                  Fórmula Oficial de Foco (Albion Online):
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-amber-300 text-center text-[11px]">
                  Coste = CosteBase × 0.5^(FCE / 10000)
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Cada <strong>10.000 puntos de FCE</strong> reduce el coste de foco exactamente a la mitad (50%). Con maestría 100 y todas las especializaciones completas (~28.000 FCE), el coste se reduce más de un <strong>85%</strong>.
                </p>
              </div>
            </>
          ) : (
            /* MÉTRICAS DE AGRICULTURA & GANADERÍA */
            <>
              {/* Tarjeta Destacada de Coste de Foco */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-xl p-5 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Rendimiento en Vivo
                    </span>
                    <h4 className="text-base font-bold text-slate-100">
                      Coste de Foco Optimizado
                    </h4>
                  </div>

                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-1 rounded-lg">
                    -{Math.round(((1000 - farmEfficiency.focusCostPerSlot) / 1000) * 100)}% Foco
                  </div>
                </div>

                {/* Números Principales */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Por Casilla:</div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 mt-1 tabular-nums">
                      {farmEfficiency.focusCostPerSlot.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                      Base: 1.000 pts
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400">Por Parcela (9 casillas):</div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tabular-nums">
                      {farmEfficiency.focusCostPerPlot.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                      Base: 9.000 pts
                    </div>
                  </div>
                </div>

                {/* Eficiencia Acumulada (FCE) */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Eficiencia Total Acumulada (FCE):</span>
                  <span className="font-mono font-bold text-slate-200 tabular-nums">
                    +{farmEfficiency.fce.toLocaleString()} FCE
                  </span>
                </div>

                {/* Capacidad Diaria con 10.000 de Foco */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Capacidad con 10.000 Foco Diario:</span>
                    <span className="font-mono font-bold text-amber-400 tabular-nums">
                      {farmEfficiency.plotsPer10kFocus} parcelas
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(5, (farmEfficiency.plotsPer10kFocus / 8.8) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Nivel 0: 1.1 parcelas</span>
                    <span>Actual: {farmEfficiency.plotsPer10kFocus}</span>
                    <span>Max: 8.8 parcelas</span>
                  </div>
                </div>
              </div>

              {/* Configuración de Precios para el Retorno Plata/Foco */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Coins size={14} className="text-amber-400" />
                    Precios de Mercado (Plata / Foco)
                  </span>
                  <span className="text-[10px] text-slate-400">Valores de referencia</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Costo Semilla / Cria:</label>
                    <div className="relative">
                      <NumericInput
                        min={0}
                        max={2000000}
                        value={customSeedPrice}
                        onChange={(val) => setCustomSeedPrice(val)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-amber-400 pr-6"
                      />
                      <span className="absolute right-2 top-1 text-slate-500 font-mono text-xs">🪙</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Precio Venta Cosecha:</label>
                    <div className="relative">
                      <NumericInput
                        min={1}
                        max={2000000}
                        value={customProductPrice}
                        onChange={(val) => setCustomProductPrice(val)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 font-mono text-slate-100 text-xs focus:outline-none focus:border-amber-400 pr-6"
                      />
                      <span className="absolute right-2 top-1 text-slate-500 font-mono text-xs">🪙</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimación de Retorno Plata / Foco */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-400" />
                    Retorno de Plata por Punto de Foco:
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded tabular-nums ${
                      farmEfficiency.silverPerFocusEstimate >= 35
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : farmEfficiency.silverPerFocusEstimate >= 20
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {farmEfficiency.silverPerFocusEstimate} Plata / Foco
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  {farmEfficiency.silverPerFocusEstimate >= 35
                    ? '🚀 Excelente retorno. Es altamente rentable regar este ítem con tu foco diario.'
                    : farmEfficiency.silverPerFocusEstimate >= 20
                    ? '✅ Rentable. Te permite sostener la compra de semillas y ganar plata neta.'
                    : '⚠️ Rendimiento moderado. Considera subir especialización o cultivar ítems de mayor tier.'}
                </p>
              </div>

              {/* Botón para navegar al Registro Diario con estos datos */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToLoggerWithPreset({
                      cityId: currentCityId,
                      itemId: currentItem.id,
                      plotsCount: Math.max(1, Math.floor(farmEfficiency.plotsPer10kFocus)),
                    })
                  }
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                >
                  <ArrowRight size={15} />
                  Registrar Cosecha con este Nivel ({farmEfficiency.focusCostPerSlot} Foco/Casilla)
                </button>
              </div>

              {/* Tabla Resumen de Hitos de la Tabla del Destino */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
                <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Info size={14} className="text-amber-400" />
                  Escala de Progresión de Foco (Albion Online)
                </h5>

                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-mono">Nivel 0</div>
                    <div className="font-mono font-bold text-slate-300 mt-1">1.000</div>
                    <div className="text-[9px] text-slate-600">1.1 Parc</div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-mono">Nivel 25</div>
                    <div className="font-mono font-bold text-amber-400/80 mt-1">650</div>
                    <div className="text-[9px] text-slate-500">1.7 Parc</div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-mono">Nivel 50</div>
                    <div className="font-mono font-bold text-amber-400 mt-1">395</div>
                    <div className="text-[9px] text-slate-500">2.8 Parc</div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] text-slate-500 font-mono">Nivel 75</div>
                    <div className="font-mono font-bold text-emerald-400 mt-1">240</div>
                    <div className="text-[9px] text-slate-500">4.6 Parc</div>
                  </div>

                  <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-600/40">
                    <div className="text-[10px] text-emerald-300 font-mono font-bold">100/100</div>
                    <div className="font-mono font-black text-emerald-400 mt-1">125</div>
                    <div className="text-[9px] text-emerald-300">8.8 Parc</div>
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
