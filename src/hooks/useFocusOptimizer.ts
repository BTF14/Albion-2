import { useState, useEffect, useMemo, useCallback } from 'react';
import { CityId, PriceMemory, DestinyMasteryProfile } from '../types';
import { ALBION_ITEMS } from '../data/items';
import { RECIPES } from '../data/recipes';
import { loadMasteryProfile } from '../utils/destinyBoard';
import { loadPriceMemory, loadRecipePrices } from '../utils/storage';
import { calculateFocusRanking } from '../domain/use-cases/calculateFocusRanking';
import { FocusActivityItem, FocusActivityCategory, FocusOptimizerSummary } from '../domain/models/focus';

export type FocusSortOption = 'silverPerFocus' | 'dailyProfit' | 'tier' | 'focusCost';

export interface UseFocusOptimizerOptions {
  currentCityId: CityId;
  priceMemory?: PriceMemory;
  recipePrices?: Record<string, number>;
  dailyBonusCookingRRR?: number;
  dailyBonusAlchemyRRR?: number;
}

export function useFocusOptimizer({
  currentCityId,
  priceMemory: initialPriceMemory,
  recipePrices: initialRecipePrices,
  dailyBonusCookingRRR = 0,
  dailyBonusAlchemyRRR = 0,
}: UseFocusOptimizerOptions) {
  const [dailyFocus, setDailyFocus] = useState<number>(10000);
  const [selectedCategory, setSelectedCategory] = useState<FocusActivityCategory | 'all'>('all');
  const [selectedTier, setSelectedTier] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<FocusSortOption>('silverPerFocus');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sincronización de perfil de maestría
  const [masteryProfile, setMasteryProfile] = useState<DestinyMasteryProfile>(() => loadMasteryProfile());
  const [priceMemory, setPriceMemory] = useState<PriceMemory>(() => initialPriceMemory || loadPriceMemory());
  const [recipePrices, setRecipePrices] = useState<Record<string, number>>(() => initialRecipePrices || loadRecipePrices());

  const handleSyncData = useCallback(() => {
    setMasteryProfile(loadMasteryProfile());
    setPriceMemory(loadPriceMemory());
    setRecipePrices(loadRecipePrices());
  }, []);

  useEffect(() => {
    window.addEventListener('albion_mastery_updated', handleSyncData);
    window.addEventListener('albion_storage_sync', handleSyncData);
    window.addEventListener('storage', handleSyncData);

    return () => {
      window.removeEventListener('albion_mastery_updated', handleSyncData);
      window.removeEventListener('albion_storage_sync', handleSyncData);
      window.removeEventListener('storage', handleSyncData);
    };
  }, [handleSyncData]);

  // Actualizar si las props cambian externamente
  useEffect(() => {
    if (initialPriceMemory) setPriceMemory(initialPriceMemory);
  }, [initialPriceMemory]);

  useEffect(() => {
    if (initialRecipePrices) setRecipePrices(initialRecipePrices);
  }, [initialRecipePrices]);

  // Ejecución pura del caso de uso de Clean Architecture
  const summary: FocusOptimizerSummary = useMemo(() => {
    return calculateFocusRanking({
      items: ALBION_ITEMS,
      recipes: RECIPES,
      masteryProfile,
      priceMemory,
      recipePrices,
      currentCityId,
      dailyFocus,
      hasPremium: true,
      dailyBonusCookingRRR,
      dailyBonusAlchemyRRR,
    });
  }, [masteryProfile, priceMemory, recipePrices, currentCityId, dailyFocus, dailyBonusCookingRRR, dailyBonusAlchemyRRR]);

  // Filtrado y ordenamiento de actividades
  const filteredActivities = useMemo(() => {
    return summary.topRanked.filter((act) => {
      if (selectedCategory !== 'all' && act.category !== selectedCategory) {
        return false;
      }
      if (selectedTier !== 'all' && act.tier !== selectedTier) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return act.nameEs.toLowerCase().includes(q) || act.nameEn.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'silverPerFocus') return b.silverPerFocus - a.silverPerFocus;
      if (sortBy === 'dailyProfit') return b.dailyNetProfitWith10k - a.dailyNetProfitWith10k;
      if (sortBy === 'tier') return b.tier - a.tier;
      if (sortBy === 'focusCost') return a.focusCostPerAction - b.focusCostPerAction;
      return 0;
    });
  }, [summary.topRanked, selectedCategory, selectedTier, searchQuery, sortBy]);

  return {
    dailyFocus,
    setDailyFocus,
    selectedCategory,
    setSelectedCategory,
    selectedTier,
    setSelectedTier,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    summary,
    filteredActivities,
    masteryProfile,
  };
}
