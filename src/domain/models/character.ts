import { CityId, DestinyMasteryProfile } from '../../types';

/**
 * Entidad de Isla de Personaje (Albion Online)
 */
export interface PlayerIsland {
  id: string;
  name: string;
  cityId: CityId;
  level: number; // Nivel de la isla (1 a 6)
  plotsCount: number; // Parcelas agrícolas fértiles (hasta 16 en nivel 6)
  herbPlotsCount?: number; // Parcelas dedicadas
  pasturePlotsCount?: number;
  notes?: string;
  createdAt: number;
}

/**
 * Entidad de Perfil de Personaje (Alt / Principal)
 * Con regeneración y acumulación oficial de Albion Online:
 * - Regeneración: 10.000 pts en 24h = ~416.66 foco/hora (con Premium activo)
 * - Capacidad Máxima Acumulable: 30.000 pts de foco
 */
export interface CharacterProfile {
  id: string;
  name: string;
  isMain: boolean; // ¿Es el personaje principal?
  avatarColor: string; // Color distintivo para UI
  hasPremium: boolean; // Con Premium regenera 10k/24h (sin Premium no genera foco en Albion)
  
  // Foco y regeneración
  currentFocus: number; // 0 a 30.000 (Tope máximo en Albion Online)
  lastFocusUpdatedAt: number; // Timestamp en ms de la última lectura o actualización
  
  // Islas pertenecientes a este personaje
  islands: PlayerIsland[];
  
  // Perfil de Maestría individual en la Tabla del Destino
  masteryProfile?: DestinyMasteryProfile;
  
  // Notas y tags
  roleNotes?: string; // ej. "Criador de Caballos Caerleon", "Chef Brecilien"
  createdAt: number;
}

export interface FocusRegenCalculation {
  currentFocus: number; // Foco real actual al segundo (0 a 30.000)
  maxFocus: number; // 30.000 (Tope oficial de Albion Online)
  dailyRegenRate: number; // 10.000 pts/día
  isFull: boolean; // true si llegó al tope de 30.000
  timeUntilFullMs: number; // Milisegundos hasta llegar a 30.000
  formattedTimeUntilFull: string; // ej. "12h 45m" o "¡Tope Máximo (30.000)!"
  fullAtTimestamp: number; // Timestamp exacto de cuando alcanzará 30.000
  focusPerHour: number; // ~416.67 con Premium, 0 sin Premium
  percentage: number; // 0-100% relativo a los 30.000 puntos
}
