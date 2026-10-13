/**
 * Caso de Uso Puro: Cálculo de Progreso de Metas Financieras e Hitos de Albion
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Función matemática pura, determinista y 100% agnóstica de React y del DOM.
 */

import { FinancialGoal, GoalProgressAnalysis } from '../models/goals';
import { DailyLogEntry } from '../../types';

export interface GoalCalculationOptions {
  goals: FinancialGoal[];
  logs: DailyLogEntry[];
  manualSavedSilver?: number; // Si el jugador ingresa plata líquida de su banco
}

export function calculateGoalProgress(options: GoalCalculationOptions): GoalProgressAnalysis[] {
  const { goals, logs, manualSavedSilver } = options;

  if (!Array.isArray(goals) || goals.length === 0) {
    return [];
  }

  // 1. Calcular balance total acumulado en el sistema
  let totalNetProfitFromLogs = 0;
  const daysSet = new Set<string>();

  if (Array.isArray(logs) && logs.length > 0) {
    for (const log of logs) {
      if (log && typeof log === 'object' && Number.isFinite(log.netProfit)) {
        totalNetProfitFromLogs += log.netProfit;
        if (log.dateStr) {
          daysSet.add(log.dateStr);
        }
      }
    }
  }

  // Si el usuario especificó plata manual ahorrada, usar el mayor o la suma
  const effectiveCurrentSilver = Number.isFinite(manualSavedSilver) && manualSavedSilver! > 0
    ? Math.max(0, manualSavedSilver!)
    : Math.max(0, totalNetProfitFromLogs);

  // 2. Calcular velocidad diaria histórica (plata neta por día)
  const activeDaysCount = Math.max(1, daysSet.size);
  const rawVelocity = totalNetProfitFromLogs > 0 ? totalNetProfitFromLogs / activeDaysCount : 0;
  const safeDailyVelocity = Number.isFinite(rawVelocity) && rawVelocity > 0 ? Math.round(rawVelocity) : 0;

  // 3. Evaluar cada meta
  return goals.map((goal): GoalProgressAnalysis => {
    const target = Math.max(1, Number.isFinite(goal.targetSilver) ? goal.targetSilver : 1);
    const progress = Math.min(target, Math.max(0, effectiveCurrentSilver));
    const percentage = Number(Math.min(100, Math.max(0, (progress / target) * 100)).toFixed(1));
    const remainingSilver = Math.max(0, target - progress);
    const isCompleted = progress >= target;

    let daysRemaining: number | null = null;
    let statusMessage = '';

    if (isCompleted) {
      daysRemaining = 0;
      statusMessage = '¡Meta cumplida con éxito! 🎉';
    } else if (safeDailyVelocity > 0) {
      daysRemaining = Math.ceil(remainingSilver / safeDailyVelocity);
      statusMessage = `Faltan aproximadamente ${daysRemaining} día(s) a tu ritmo de +${safeDailyVelocity.toLocaleString()} 🪙/día.`;
    } else {
      daysRemaining = null;
      statusMessage = 'Registra cosechas o ganancias diarias para calcular los días estimados de llegada.';
    }

    return {
      goalId: goal.id,
      title: goal.title,
      targetSilver: target,
      category: goal.category,
      icon: goal.icon,
      currentProgressSilver: progress,
      percentage,
      remainingSilver,
      dailySilverVelocity: safeDailyVelocity,
      daysRemaining,
      isCompleted,
      statusMessage,
    };
  });
}
