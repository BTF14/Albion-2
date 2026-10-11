/**
 * Custom Hook: useAlbionDataProject
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Desacopla la lógica de consulta de mercado referencial, persistencia de servidor
 * preferido y control de caché en memoria para prevenir abusos de tasa (rate-limits).
 * 
 * Regla Inquebrantable #1: Los datos jamás sobreescriben precios manuales a menos
 * que el jugador haga clic expresamente en "Aplicar a precio manual".
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlbionDataServerRegion,
  AlbionLookupItem,
  ItemMarketQuote,
  ALBION_LOOKUP_CATALOGUE,
} from '../domain/models/albionDataProject';
import {
  fetchAlbionDataProjectPrice,
  FetchPriceResult,
} from '../domain/use-cases/fetchAlbionDataProjectPrice';

const ADP_SERVER_STORAGE_KEY = 'albion_adp_server_region';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutos de caché en memoria

interface CacheEntry {
  timestamp: number;
  quote: ItemMarketQuote;
}

export function useAlbionDataProject(
  initialItemId?: string,
  initialTargetType: 'product' | 'seed_or_baby' = 'product'
) {
  const [server, setServerState] = useState<AlbionDataServerRegion>(() => {
    try {
      const saved = localStorage.getItem(ADP_SERVER_STORAGE_KEY);
      if (saved === 'europe' || saved === 'west' || saved === 'east') {
        return saved;
      }
    } catch {
      // Ignorar errores de localStorage
    }
    return 'europe';
  });

  const [selectedItem, setSelectedItem] = useState<AlbionLookupItem | null>(() => {
    if (initialItemId) {
      return (
        ALBION_LOOKUP_CATALOGUE.find((i) => i.appItemId === initialItemId) ||
        ALBION_LOOKUP_CATALOGUE[0]
      );
    }
    return ALBION_LOOKUP_CATALOGUE[0];
  });

  const [targetType, setTargetType] = useState<'product' | 'seed_or_baby'>(initialTargetType);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isThrottled, setIsThrottled] = useState<boolean>(false);
  const [quote, setQuote] = useState<ItemMarketQuote | null>(null);
  const [lastCopiedNotice, setLastCopiedNotice] = useState<string | null>(null);

  // Controladores defensivos de ciclo de vida
  const abortControllerRef = useRef<AbortController | null>(null);
  const copiedNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (copiedNoticeTimeoutRef.current) {
        clearTimeout(copiedNoticeTimeoutRef.current);
      }
    };
  }, []);

  // Sincronización reactiva cuando cambian initialItemId o initialTargetType (por ejemplo, al abrir modal desde botón [ADP])
  useEffect(() => {
    if (initialItemId) {
      const found = ALBION_LOOKUP_CATALOGUE.find((i) => i.appItemId === initialItemId);
      if (found) {
        setSelectedItem(found);
      }
    }
    if (initialTargetType) {
      setTargetType(initialTargetType);
    }
  }, [initialItemId, initialTargetType]);

  // Caché en memoria para evitar spam a la API pública
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Cambiar servidor persistiendo en localStorage
  const setServer = useCallback((newServer: AlbionDataServerRegion) => {
    setServerState(newServer);
    try {
      localStorage.setItem(ADP_SERVER_STORAGE_KEY, newServer);
    } catch {
      // Ignorar
    }
  }, []);

  // Consultar precio del ítem y tipo de objetivo
  const fetchQuote = useCallback(
    async (
      itemToFetch: AlbionLookupItem,
      typeToFetch: 'product' | 'seed_or_baby',
      forceRefresh = false
    ) => {
      const gameId =
        typeToFetch === 'seed_or_baby' && itemToFetch.seedOrBabyGameId
          ? itemToFetch.seedOrBabyGameId
          : itemToFetch.productGameId;

      const cacheKey = `${server}_${gameId}`;
      const cached = cacheRef.current.get(cacheKey);

      if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setQuote(cached.quote);
        setError(null);
        setIsThrottled(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsThrottled(false);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const displayName =
        typeToFetch === 'seed_or_baby' && itemToFetch.seedOrBabyNameEs
          ? itemToFetch.seedOrBabyNameEs
          : itemToFetch.nameEs;

      const result: FetchPriceResult = await fetchAlbionDataProjectPrice({
        server,
        gameId,
        appItemId: itemToFetch.appItemId,
        targetType: typeToFetch,
        displayName,
        tier: itemToFetch.tier,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setIsLoading(false);

      if (result.success && result.quote) {
        setQuote(result.quote);
        cacheRef.current.set(cacheKey, {
          timestamp: Date.now(),
          quote: result.quote,
        });
      } else {
        setError(result.errorMessage || 'No se pudo obtener la cotización de mercado.');
        setIsThrottled(Boolean(result.isThrottled));
      }
    },
    [server]
  );

  // Trigger automático cuando cambia el ítem, servidor o tipo de objetivo
  useEffect(() => {
    if (selectedItem) {
      fetchQuote(selectedItem, targetType);
    }
  }, [selectedItem, targetType, server, fetchQuote]);

  // Selección manual de ítem
  const selectItemByAppId = useCallback(
    (appId: string, defaultTarget: 'product' | 'seed_or_baby' = 'product') => {
      const found = ALBION_LOOKUP_CATALOGUE.find((i) => i.appItemId === appId);
      if (found) {
        setSelectedItem(found);
        setTargetType(defaultTarget);
      }
    },
    []
  );

  // Copia controlada al portapapeles o callback de aplicación a precios manuales
  const copyPriceToClipboard = useCallback(
    (price: number, label: string) => {
      if (!Number.isFinite(price) || price <= 0) return;
      try {
        navigator.clipboard.writeText(String(price));
        setLastCopiedNotice(`¡Precio de ${price.toLocaleString()} 🪙 (${label}) copiado al portapapeles!`);
        if (copiedNoticeTimeoutRef.current) {
          clearTimeout(copiedNoticeTimeoutRef.current);
        }
        copiedNoticeTimeoutRef.current = setTimeout(() => setLastCopiedNotice(null), 3000);
      } catch {
        setLastCopiedNotice(`Valor: ${price.toLocaleString()} 🪙`);
      }
    },
    []
  );

  return {
    server,
    setServer,
    selectedItem,
    setSelectedItem,
    targetType,
    setTargetType,
    isLoading,
    error,
    isThrottled,
    quote,
    catalogue: ALBION_LOOKUP_CATALOGUE,
    selectItemByAppId,
    refreshQuote: () => selectedItem && fetchQuote(selectedItem, targetType, true),
    copyPriceToClipboard,
    lastCopiedNotice,
  };
}
