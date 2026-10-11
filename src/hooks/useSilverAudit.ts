import { useState, useMemo, useEffect } from 'react';
import { CityId, PriceMemory } from '../types';
import { CharacterProfile } from '../domain/models/character';
import { SilverAuditReport } from '../domain/models/silverAudit';
import { runSilverAudit } from '../domain/use-cases/runSilverAudit';
import { loadPriceMemory, loadRecipePrices, loadCharacters } from '../utils/storage';

export function useSilverAudit(currentCityId: CityId, stationTax: number = 450, hasPremium: boolean = true) {
  const [priceMemory, setPriceMemory] = useState<PriceMemory>(() => loadPriceMemory({ includeExpired: true }));
  const [recipePrices, setRecipePrices] = useState<Record<string, number>>(() => loadRecipePrices({ includeExpired: true }));
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => loadCharacters());

  useEffect(() => {
    const handleSync = () => {
      setPriceMemory(loadPriceMemory({ includeExpired: true }));
      setRecipePrices(loadRecipePrices({ includeExpired: true }));
      setCharacters(loadCharacters());
    };

    window.addEventListener('albion_storage_sync', handleSync);
    window.addEventListener('albion_characters_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('albion_storage_sync', handleSync);
      window.removeEventListener('albion_characters_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const auditReport: SilverAuditReport = useMemo(() => {
    return runSilverAudit({
      priceMemory,
      recipePrices,
      characters,
      currentCityId,
      stationTaxPer100Nutrition: stationTax,
      hasPremium,
    });
  }, [priceMemory, recipePrices, characters, currentCityId, stationTax, hasPremium]);

  return {
    auditReport,
    recheckAudit: () => {
      setPriceMemory(loadPriceMemory({ includeExpired: true }));
      setRecipePrices(loadRecipePrices({ includeExpired: true }));
      setCharacters(loadCharacters());
    },
  };
}
