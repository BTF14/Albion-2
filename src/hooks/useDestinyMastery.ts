import { useState, useEffect, useCallback } from 'react';
import { DestinyMasteryProfile, FocusEfficiencyResult, CraftFocusEfficiencyResult, AlbionRecipe } from '../types';
import {
  loadMasteryProfile,
  saveMasteryProfile,
  calculateFocusCost,
  calculateRecipeFocusCost,
} from '../utils/destinyBoard';

/**
 * Custom Hook (Clean Architecture):
 * Encapsula la gestión reactiva de la Tabla del Destino y cálculo de Eficiencia de Coste de Foco (FCE).
 */
export function useDestinyMastery() {
  const [profile, setProfile] = useState<DestinyMasteryProfile>(() => loadMasteryProfile());

  const refreshMastery = useCallback(() => {
    setProfile(loadMasteryProfile());
  }, []);

  useEffect(() => {
    window.addEventListener('albion_mastery_updated', refreshMastery);
    window.addEventListener('storage', refreshMastery);

    return () => {
      window.removeEventListener('albion_mastery_updated', refreshMastery);
      window.removeEventListener('storage', refreshMastery);
    };
  }, [refreshMastery]);

  const updateProfile = useCallback((updated: DestinyMasteryProfile) => {
    saveMasteryProfile(updated);
    setProfile(updated);
  }, []);

  const calculateItemFocus = useCallback(
    (itemId: string, customSeedPrice?: number, customProductPrice?: number): FocusEfficiencyResult => {
      return calculateFocusCost(itemId, profile, customSeedPrice, customProductPrice);
    },
    [profile]
  );

  const calculateRecipeFocus = useCallback(
    (
      recipe: AlbionRecipe,
      totalRawCost = 0,
      returnRateWithoutFocus = 24.8,
      returnRateWithFocus = 47.9
    ): CraftFocusEfficiencyResult => {
      return calculateRecipeFocusCost(recipe, profile, totalRawCost, returnRateWithoutFocus, returnRateWithFocus);
    },
    [profile]
  );

  return {
    profile,
    updateProfile,
    refreshMastery,
    calculateItemFocus,
    calculateRecipeFocus,
  };
}
