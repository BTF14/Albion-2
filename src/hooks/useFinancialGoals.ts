import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FinancialGoal,
  CANONICAL_ALBION_GOALS,
  GoalProgressAnalysis,
  SeedBudgetInput,
  SeedBudgetResult,
} from '../domain/models/goals';
import { calculateGoalProgress } from '../domain/use-cases/calculateGoalProgress';
import { calculateSeedBudget } from '../domain/use-cases/calculateSeedBudget';
import { DailyLogEntry } from '../types';

const STORAGE_KEY_GOALS = 'albion_financial_goals_v1';
const STORAGE_KEY_MANUAL_SAVED = 'albion_goals_manual_saved_silver_v1';
const STORAGE_KEY_SEED_BUDGET = 'albion_seed_budget_input_v1';

export function useFinancialGoals(logs: DailyLogEntry[], hasPremium: boolean = true) {
  // 1. Cargar Metas
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_GOALS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (g) => g && typeof g === 'object' && g.id && Number.isFinite(g.targetSilver) && g.targetSilver > 0
          );
        }
      }
    } catch {
      // Fallback
    }

    // Inicializar con metas canónicas de Albion
    return CANONICAL_ALBION_GOALS.map((c) => ({
      id: c.id,
      title: c.title,
      targetSilver: c.targetSilver,
      category: c.category,
      icon: c.icon,
      notes: c.description,
      createdAt: Date.now(),
      isCustom: false,
    }));
  });

  // 2. Plata manual ahorrada (opcional para el banco del jugador)
  const [manualSavedSilver, setManualSavedSilver] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MANUAL_SAVED);
      if (stored) {
        const num = Number(stored);
        if (Number.isFinite(num) && num >= 0) return num;
      }
    } catch {
      // Fallback
    }
    return 0;
  });

  // 3. Parámetros para presupuesto de siembra
  const [seedBudgetInput, setSeedBudgetInput] = useState<SeedBudgetInput>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEED_BUDGET);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          return {
            itemId: typeof parsed.itemId === 'string' ? parsed.itemId : 'crop_wheat',
            tier: Number(parsed.tier) || 4,
            plotsCount: Number(parsed.plotsCount) || 5,
            slotsPerPlot: Number(parsed.slotsPerPlot) || 9,
            currentSeedsInStock: Number(parsed.currentSeedsInStock) || 0,
            seedUnitPriceManual: Number(parsed.seedUnitPriceManual) || 3200,
            expectedProductPriceManual: Number(parsed.expectedProductPriceManual) || 450,
            hasPremium,
          };
        }
      }
    } catch {
      // Fallback
    }

    return {
      itemId: 'crop_wheat',
      tier: 4,
      plotsCount: 5,
      slotsPerPlot: 9,
      currentSeedsInStock: 0,
      seedUnitPriceManual: 3200,
      expectedProductPriceManual: 450,
      hasPremium,
    };
  });

  // Persistir Metas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
    } catch (err) {
      console.warn('Error al guardar metas:', err);
    }
  }, [goals]);

  // Persistir Plata Manual
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MANUAL_SAVED, String(manualSavedSilver));
    } catch (err) {
      console.warn('Error al guardar plata manual:', err);
    }
  }, [manualSavedSilver]);

  // Persistir Parámetros de Presupuesto
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SEED_BUDGET, JSON.stringify(seedBudgetInput));
    } catch (err) {
      console.warn('Error al guardar presupuesto de siembra:', err);
    }
  }, [seedBudgetInput]);

  // Métodos
  const addCustomGoal = useCallback((title: string, targetSilver: number, notes?: string) => {
    const safeTitle = title.trim() || 'Meta Personalizada';
    const safeTarget = Math.max(1000, Number(targetSilver) || 1000000);
    const newGoal: FinancialGoal = {
      id: `goal_custom_${Date.now()}`,
      title: safeTitle,
      targetSilver: safeTarget,
      category: 'custom',
      icon: 'Target',
      notes,
      createdAt: Date.now(),
      isCustom: true,
    };
    setGoals((prev) => [newGoal, ...prev]);
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const resetToCanonicalGoals = useCallback(() => {
    const canonicals: FinancialGoal[] = CANONICAL_ALBION_GOALS.map((c) => ({
      id: c.id,
      title: c.title,
      targetSilver: c.targetSilver,
      category: c.category,
      icon: c.icon,
      notes: c.description,
      createdAt: Date.now(),
      isCustom: false,
    }));
    setGoals(canonicals);
  }, []);

  const updateSeedBudgetInput = useCallback((partial: Partial<SeedBudgetInput>) => {
    setSeedBudgetInput((prev) => ({ ...prev, ...partial }));
  }, []);

  // Evaluaciones Puras (Memorizadas)
  const goalsAnalysis: GoalProgressAnalysis[] = useMemo(() => {
    return calculateGoalProgress({
      goals,
      logs,
      manualSavedSilver,
    });
  }, [goals, logs, manualSavedSilver]);

  const seedBudgetResult: SeedBudgetResult = useMemo(() => {
    return calculateSeedBudget({
      ...seedBudgetInput,
      hasPremium,
    });
  }, [seedBudgetInput, hasPremium]);

  return {
    goals,
    manualSavedSilver,
    setManualSavedSilver,
    goalsAnalysis,
    addCustomGoal,
    deleteGoal,
    resetToCanonicalGoals,
    seedBudgetInput,
    updateSeedBudgetInput,
    seedBudgetResult,
  };
}
