import { CharacterProfile, FocusRegenCalculation, PlayerIsland } from '../models/character';

// Constantes oficiales de Albion Online
export const MAX_FOCUS_POINTS = 30000; // Capacidad máxima acumulable en Albion Online
export const DAILY_FOCUS_REGEN = 10000; // Regeneración oficial en 24h con Premium
export const MS_PER_DAY = 24 * 60 * 60 * 1000; // 86,400,000 ms
export const FOCUS_PER_MS = DAILY_FOCUS_REGEN / MS_PER_DAY; // ~0.00011574 pts/ms (~416.666 foco/hora)
export const FOCUS_PER_HOUR = DAILY_FOCUS_REGEN / 24; // ~416.66666

/**
 * Caso de Uso Puro:
 * Calcula la regeneración pasiva de foco oficial de Albion Online
 * para un personaje en un instante de tiempo dado.
 * Genera 10.000 pts cada 24 horas y acumula hasta un tope máximo de 30.000 pts.
 */
export function calculateCharacterFocus(
  character: CharacterProfile,
  currentTimeMs: number = Date.now()
): FocusRegenCalculation {
  const safeCurrentTime = Math.max(currentTimeMs, character.lastFocusUpdatedAt || 0);
  const baseFocus = Math.min(MAX_FOCUS_POINTS, Math.max(0, character.currentFocus || 0));

  // Sin Premium activo, Albion Online no regenera puntos de foco diarios
  if (!character.hasPremium) {
    const isFull = baseFocus >= MAX_FOCUS_POINTS;
    return {
      currentFocus: Math.round(baseFocus),
      maxFocus: MAX_FOCUS_POINTS,
      dailyRegenRate: DAILY_FOCUS_REGEN,
      isFull,
      timeUntilFullMs: isFull ? 0 : Infinity,
      formattedTimeUntilFull: isFull ? 'Tope (30.000)' : 'Sin Premium (Pausado)',
      fullAtTimestamp: isFull ? safeCurrentTime : Infinity,
      focusPerHour: 0,
      percentage: Math.min(100, Math.max(0, Math.round((baseFocus / MAX_FOCUS_POINTS) * 100))),
    };
  }

  // Si ya estaba en 30.000, permanece en el tope absoluto
  if (baseFocus >= MAX_FOCUS_POINTS) {
    return {
      currentFocus: MAX_FOCUS_POINTS,
      maxFocus: MAX_FOCUS_POINTS,
      dailyRegenRate: DAILY_FOCUS_REGEN,
      isFull: true,
      timeUntilFullMs: 0,
      formattedTimeUntilFull: '¡Tope Máximo! (30.000 ⚡)',
      fullAtTimestamp: character.lastFocusUpdatedAt,
      focusPerHour: Math.round(FOCUS_PER_HOUR),
      percentage: 100,
    };
  }

  // Milisegundos transcurridos desde el último registro
  const elapsedMs = Math.max(0, safeCurrentTime - (character.lastFocusUpdatedAt || safeCurrentTime));
  const generatedPoints = elapsedMs * FOCUS_PER_MS;
  const currentTotal = Math.min(MAX_FOCUS_POINTS, baseFocus + generatedPoints);
  const isFull = currentTotal >= MAX_FOCUS_POINTS;

  const pointsNeeded = Math.max(0, MAX_FOCUS_POINTS - currentTotal);
  const timeUntilFullMs = isFull ? 0 : Math.round(pointsNeeded / FOCUS_PER_MS);
  const fullAtTimestamp = safeCurrentTime + timeUntilFullMs;

  // Formato legible de tiempo hasta llegar a 30.000
  let formattedTimeUntilFull = '';
  if (isFull) {
    formattedTimeUntilFull = '¡Tope Máximo! (30.000 ⚡)';
  } else {
    const totalHours = Math.floor(timeUntilFullMs / (60 * 60 * 1000));
    const mins = Math.floor((timeUntilFullMs % (60 * 60 * 1000)) / (60 * 1000));
    const days = Math.floor(totalHours / 24);
    const remHours = totalHours % 24;

    if (days > 0) {
      formattedTimeUntilFull = `${days}d ${remHours}h ${mins}m`;
    } else if (remHours > 0) {
      formattedTimeUntilFull = `${remHours}h ${mins}m`;
    } else {
      formattedTimeUntilFull = `${mins} min`;
    }
  }

  const percentage = Math.min(100, Math.max(0, Math.round((currentTotal / MAX_FOCUS_POINTS) * 100)));

  return {
    currentFocus: Math.floor(currentTotal),
    maxFocus: MAX_FOCUS_POINTS,
    dailyRegenRate: DAILY_FOCUS_REGEN,
    isFull,
    timeUntilFullMs,
    formattedTimeUntilFull,
    fullAtTimestamp,
    focusPerHour: Math.round(FOCUS_PER_HOUR),
    percentage,
  };
}

/**
 * Caso de Uso Puro:
 * Agrega o actualiza una isla en un personaje dado sin mutar el objeto original.
 */
export function upsertIslandInCharacter(
  character: CharacterProfile,
  island: PlayerIsland
): CharacterProfile {
  const existingIdx = character.islands.findIndex((i) => i.id === island.id);
  const updatedIslands = [...character.islands];

  if (existingIdx >= 0) {
    updatedIslands[existingIdx] = island;
  } else {
    updatedIslands.push(island);
  }

  return {
    ...character,
    islands: updatedIslands,
  };
}

/**
 * Caso de Uso Puro:
 * Remueve una isla de un personaje.
 */
export function removeIslandFromCharacter(
  character: CharacterProfile,
  islandId: string
): CharacterProfile {
  return {
    ...character,
    islands: character.islands.filter((i) => i.id !== islandId),
  };
}
