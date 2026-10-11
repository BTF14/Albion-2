import { useState, useMemo, useEffect } from 'react';
import { CharacterProfile } from '../domain/models/character';
import { FocusPortfolioReport } from '../domain/models/focusPortfolio';
import { calculateFocusPortfolio } from '../domain/use-cases/calculateFocusPortfolio';
import { loadCharacters } from '../utils/storage';

export function useFocusPortfolio() {
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => loadCharacters());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Actualizar reloj cada 10 segundos para ver regeneración
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setCharacters(loadCharacters());
    };
    window.addEventListener('albion_characters_updated', handleSync);
    window.addEventListener('albion_storage_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_characters_updated', handleSync);
      window.removeEventListener('albion_storage_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const portfolioReport: FocusPortfolioReport = useMemo(() => {
    return calculateFocusPortfolio(characters, currentTime);
  }, [characters, currentTime]);

  return {
    characters,
    portfolioReport,
    refreshPortfolio: () => {
      setCharacters(loadCharacters());
      setCurrentTime(Date.now());
    },
  };
}
