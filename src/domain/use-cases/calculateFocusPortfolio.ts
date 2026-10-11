/**
 * Caso de Uso Puro: Cálculo y Orquestación del Portafolio de Foco Multi-Personaje
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inviolable: Función 100% pura y testeable.
 */

import { CharacterProfile } from '../models/character';
import { FocusPortfolioReport, AltFocusItemSummary } from '../models/focusPortfolio';

export function calculateFocusPortfolio(
  characters: CharacterProfile[],
  currentTime: number = Date.now()
): FocusPortfolioReport {
  const MAX_FOCUS = 30000;
  const DAILY_REGEN_PREMIUM = 10000;
  const HOURLY_REGEN_PREMIUM = DAILY_REGEN_PREMIUM / 24; // 416.666

  const altSummaries: AltFocusItemSummary[] = characters.map((char) => {
    const elapsedHours = Math.max(0, (currentTime - (char.lastFocusUpdatedAt || currentTime)) / (1000 * 3600));
    const regenPerHour = char.hasPremium ? HOURLY_REGEN_PREMIUM : 0;
    const addedFocus = Math.floor(elapsedHours * regenPerHour);
    const currentFocus = Math.min(MAX_FOCUS, Math.max(0, (char.currentFocus || 0) + addedFocus));

    const focusPercentage = Math.round((currentFocus / MAX_FOCUS) * 100);
    const focusRemainingToCap = MAX_FOCUS - currentFocus;
    const hoursUntilFull = regenPerHour > 0 ? Number((focusRemainingToCap / regenPerHour).toFixed(1)) : 0;

    const isNearingCap = currentFocus >= 28000;
    const isAtCap = currentFocus >= MAX_FOCUS;

    // Analizar maestría y rol sugerido
    const mastery = char.masteryProfile;
    let primarySpec = 'Agricultura General';
    let recommendedActivity = 'Riego de Cultivos en Parcela';
    let recommendedCity = char.islands[0]?.cityId || 'Martlock';
    let silverPerFocus = 40; // Base de 40 plata/foco

    if (mastery) {
      const crop = mastery.cropMastery || 0;
      const herb = mastery.herbMastery || 0;
      const animal = mastery.animalMastery || 0;
      const chef = mastery.chefMastery || 0;
      const alchemist = mastery.alchemistMastery || 0;

      if (chef >= 30 && chef >= crop && chef >= herb && chef >= alchemist) {
        primarySpec = `Chef Especializado (Nvl ${chef})`;
        recommendedActivity = 'Crafteo de Comida T7/T8 con Bono RRR';
        recommendedCity = 'caerleon';
        silverPerFocus = 65 + Math.round(chef * 0.4);
      } else if (alchemist >= 30 && alchemist >= crop && alchemist >= herb) {
        primarySpec = `Alquimista Especializado (Nvl ${alchemist})`;
        recommendedActivity = 'Crafteo de Pociones T7/T8';
        recommendedCity = 'brecilien';
        silverPerFocus = 60 + Math.round(alchemist * 0.4);
      } else if (animal >= 30 && animal >= crop) {
        primarySpec = `Criador de Animales (Nvl ${animal})`;
        recommendedActivity = 'Crianza de Monturas y Pastizales';
        recommendedCity = char.islands[0]?.cityId || 'bridgewatch';
        silverPerFocus = 50 + Math.round(animal * 0.3);
      } else if (herb >= 30 && herb >= crop) {
        primarySpec = `Herborista Maestro (Nvl ${herb})`;
        recommendedActivity = 'Cultivo de Hierbas Medicinales';
        recommendedCity = char.islands[0]?.cityId || 'thetford';
        silverPerFocus = 48 + Math.round(herb * 0.25);
      } else if (crop >= 30) {
        primarySpec = `Agricultor Maestro (Nvl ${crop})`;
        recommendedActivity = 'Riego Óptimo de Granos T7/T8';
        recommendedCity = char.islands[0]?.cityId || 'martlock';
        silverPerFocus = 45 + Math.round(crop * 0.25);
      }
    }

    const estimatedDailySilverYield = char.hasPremium ? Math.round(DAILY_REGEN_PREMIUM * silverPerFocus) : 0;

    return {
      character: char,
      currentFocus,
      maxFocus: MAX_FOCUS,
      focusPercentage,
      hoursUntilFull,
      isNearingCap,
      isAtCap,
      dailyRegenRate: char.hasPremium ? DAILY_REGEN_PREMIUM : 0,
      hourlyRegenRate: Math.round(regenPerHour),
      primarySpecialization: primarySpec,
      recommendedActivity,
      recommendedCity,
      estimatedDailySilverYield,
    };
  });

  const totalAltsCount = altSummaries.length;
  const totalAvailableFocus = altSummaries.reduce((acc, s) => acc + s.currentFocus, 0);
  const totalCapacityFocus = totalAltsCount * MAX_FOCUS;
  const totalDailyFocusRegen = altSummaries.reduce((acc, s) => acc + s.dailyRegenRate, 0);
  const totalEstimatedDailySilverYield = altSummaries.reduce((acc, s) => acc + s.estimatedDailySilverYield, 0);
  const altsAtRiskOfCap = altSummaries.filter((s) => s.isNearingCap).length;

  let strategicEmpireVerdict = 'Tu red de foco opera con balance óptimo.';
  if (altsAtRiskOfCap > 0) {
    strategicEmpireVerdict = `¡Alerta de Desperdicio! Tienes ${altsAtRiskOfCap} personaje(s) con foco próximo al tope de 30.000.`;
  } else if (totalDailyFocusRegen >= 30000) {
    strategicEmpireVerdict = `Imperio de Alta Producción: Generas ${totalDailyFocusRegen.toLocaleString()} foco diario (~${totalEstimatedDailySilverYield.toLocaleString()} 🪙/día estimados).`;
  }

  return {
    timestamp: currentTime,
    totalAltsCount,
    totalAvailableFocus,
    totalCapacityFocus,
    totalDailyFocusRegen,
    totalEstimatedDailySilverYield,
    altsAtRiskOfCap,
    altSummaries,
    strategicEmpireVerdict,
  };
}
