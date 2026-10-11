import { useState, useEffect, useCallback, useMemo } from 'react';
import { CharacterProfile, PlayerIsland, FocusRegenCalculation } from '../domain/models/character';
import {
  calculateCharacterFocus,
  upsertIslandInCharacter,
  removeIslandFromCharacter,
  MAX_FOCUS_POINTS,
} from '../domain/use-cases/calculateCharacterFocus';
import {
  loadCharacters,
  saveCharacters,
  getActiveCharacterId,
  setActiveCharacterId as saveActiveCharacterId,
} from '../utils/storage';
import { DestinyMasteryProfile, CityId } from '../types';

/**
 * Custom Hook (Gentleman Programming - Clean Architecture):
 * Administra de forma reactiva la lista de personajes (Alts), el personaje activo,
 * sus islas asociadas y el reloj de regeneración continua de foco (10.000 pts / 24h).
 */
export function useCharacterProfiles() {
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => loadCharacters());
  const [activeId, setActiveId] = useState<string>(() => getActiveCharacterId());
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());

  // Actualizador en tiempo real para el segundero de regeneración de foco
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000); // Cada segundo para máxima fidelidad

    return () => clearInterval(timer);
  }, []);

  // Sincronización multidispositivo / multi-pestaña
  const reloadFromStorage = useCallback(() => {
    setCharacters(loadCharacters());
    setActiveId(getActiveCharacterId());
  }, []);

  useEffect(() => {
    window.addEventListener('albion_characters_updated', reloadFromStorage);
    window.addEventListener('albion_active_character_changed', reloadFromStorage);
    window.addEventListener('storage', reloadFromStorage);

    return () => {
      window.removeEventListener('albion_characters_updated', reloadFromStorage);
      window.removeEventListener('albion_active_character_changed', reloadFromStorage);
      window.removeEventListener('storage', reloadFromStorage);
    };
  }, [reloadFromStorage]);

  // Personaje Activo
  const activeCharacter = useMemo(() => {
    return characters.find((c) => c.id === activeId) || characters[0] || null;
  }, [characters, activeId]);

  // Selección de personaje activo
  const selectActiveCharacter = useCallback((id: string) => {
    saveActiveCharacterId(id);
    setActiveId(id);
  }, []);

  // Cálculos de regeneración de foco para el personaje activo
  const activeFocusRegen = useMemo<FocusRegenCalculation>(() => {
    if (!activeCharacter) {
      return {
        currentFocus: 10000,
        maxFocus: MAX_FOCUS_POINTS,
        dailyRegenRate: 10000,
        isFull: false,
        timeUntilFullMs: 0,
        formattedTimeUntilFull: '10.000 ⚡',
        fullAtTimestamp: Date.now(),
        focusPerHour: 417,
        percentage: 33,
      };
    }
    return calculateCharacterFocus(activeCharacter, currentTimeMs);
  }, [activeCharacter, currentTimeMs]);

  // Cálculos de regeneración de foco para todos los personajes (vista resumen)
  const allCharactersWithRegen = useMemo(() => {
    return characters.map((char) => ({
      character: char,
      regen: calculateCharacterFocus(char, currentTimeMs),
    }));
  }, [characters, currentTimeMs]);

  // Total de foco acumulado en todo el imperio de personajes
  const imperialFocusSummary = useMemo(() => {
    let totalFocus = 0;
    let fullCharactersCount = 0;
    let totalIslands = 0;
    let totalPlots = 0;

    characters.forEach((char) => {
      const regen = calculateCharacterFocus(char, currentTimeMs);
      totalFocus += regen.currentFocus;
      if (regen.isFull) fullCharactersCount++;
      totalIslands += char.islands.length;
      totalPlots += char.islands.reduce((acc, isl) => acc + isl.plotsCount, 0);
    });

    return {
      totalFocus,
      maxPossibleFocus: characters.length * MAX_FOCUS_POINTS,
      fullCharactersCount,
      totalCharacters: characters.length,
      totalIslands,
      totalPlots,
    };
  }, [characters, currentTimeMs]);

  // Crear un nuevo personaje
  const addCharacter = useCallback(
    (params: {
      name: string;
      avatarColor?: string;
      hasPremium?: boolean;
      currentFocus?: number;
      roleNotes?: string;
      initialIslandName?: string;
      initialIslandCity?: string;
      initialIslandPlots?: number;
    }) => {
      const newId = `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newChar: CharacterProfile = {
        id: newId,
        name: params.name.trim() || 'Nuevo Personaje',
        isMain: characters.length === 0,
        avatarColor: params.avatarColor || '#38bdf8', // Celeste por defecto
        hasPremium: params.hasPremium !== undefined ? params.hasPremium : true,
        currentFocus: typeof params.currentFocus === 'number' ? Math.min(MAX_FOCUS_POINTS, Math.max(0, params.currentFocus)) : 10000,
        lastFocusUpdatedAt: Date.now(),
        islands: params.initialIslandName
          ? [
              {
                id: `isl_${Date.now()}`,
                name: params.initialIslandName.trim(),
                cityId: (params.initialIslandCity || 'martlock') as CityId,
                level: 6,
                plotsCount: params.initialIslandPlots || 5,
                createdAt: Date.now(),
              },
            ]
          : [],
        roleNotes: params.roleNotes,
        createdAt: Date.now(),
      };

      const updated = [...characters, newChar];
      saveCharacters(updated);
      setCharacters(updated);
      selectActiveCharacter(newId);
      return newChar;
    },
    [characters, selectActiveCharacter]
  );

  // Actualizar un personaje existente
  const updateCharacter = useCallback(
    (id: string, updates: Partial<CharacterProfile>) => {
      const updated = characters.map((char) => {
        if (char.id !== id) return char;
        return {
          ...char,
          ...updates,
        };
      });
      saveCharacters(updated);
      setCharacters(updated);
    },
    [characters]
  );

  // Ajustar el foco actual del personaje (por ejemplo tras gastarlo en cosechas o crafteo)
  const setCharacterFocusValue = useCallback(
    (id: string, newFocusPoints: number) => {
      const clamped = Math.min(MAX_FOCUS_POINTS, Math.max(0, Math.round(newFocusPoints)));
      const updated = characters.map((char) => {
        if (char.id !== id) return char;
        return {
          ...char,
          currentFocus: clamped,
          lastFocusUpdatedAt: Date.now(),
        };
      });
      saveCharacters(updated);
      setCharacters(updated);
    },
    [characters]
  );

  // Gastar foco en el personaje activo
  const spendActiveFocus = useCallback(
    (amountToSpend: number) => {
      if (!activeCharacter) return;
      const currentReal = calculateCharacterFocus(activeCharacter, Date.now()).currentFocus;
      const finalVal = Math.max(0, currentReal - amountToSpend);
      setCharacterFocusValue(activeCharacter.id, finalVal);
    },
    [activeCharacter, setCharacterFocusValue]
  );

  // Eliminar un personaje
  const deleteCharacter = useCallback(
    (id: string) => {
      if (characters.length <= 1) {
        return;
      }
      const updated = characters.filter((c) => c.id !== id);
      saveCharacters(updated);
      setCharacters(updated);
      if (activeId === id) {
        selectActiveCharacter(updated[0].id);
      }
    },
    [characters, activeId, selectActiveCharacter]
  );

  // Guardar o actualizar una isla en el personaje activo
  const upsertIsland = useCallback(
    (charId: string, island: PlayerIsland) => {
      const targetChar = characters.find((c) => c.id === charId);
      if (!targetChar) return;
      const updatedChar = upsertIslandInCharacter(targetChar, island);
      const updatedList = characters.map((c) => (c.id === charId ? updatedChar : c));
      saveCharacters(updatedList);
      setCharacters(updatedList);
    },
    [characters]
  );

  // Eliminar una isla
  const deleteIsland = useCallback(
    (charId: string, islandId: string) => {
      const targetChar = characters.find((c) => c.id === charId);
      if (!targetChar) return;
      const updatedChar = removeIslandFromCharacter(targetChar, islandId);
      const updatedList = characters.map((c) => (c.id === charId ? updatedChar : c));
      saveCharacters(updatedList);
      setCharacters(updatedList);
    },
    [characters]
  );

  return {
    characters,
    activeCharacter,
    activeId,
    activeFocusRegen,
    allCharactersWithRegen,
    imperialFocusSummary,
    selectActiveCharacter,
    addCharacter,
    updateCharacter,
    setCharacterFocusValue,
    spendActiveFocus,
    deleteCharacter,
    upsertIsland,
    deleteIsland,
  };
}
