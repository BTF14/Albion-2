/**
 * Caso de Uso Puro: Consulta de Cotizaciones en Albion Data Project
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inquebrantable #1: Consulta 100% referencial e independiente.
 * No modifica ni altera los precios manuales del jugador de forma automática.
 */

import {
  AlbionDataServerRegion,
  ALBION_DATA_SERVERS,
  RawAlbionDataPriceRecord,
  NormalizedCityPriceRecord,
  ItemMarketQuote,
  formatReportRelativeTime,
} from '../models/albionDataProject';

export interface FetchPriceOptions {
  server: AlbionDataServerRegion;
  gameId: string;
  appItemId: string;
  targetType: 'product' | 'seed_or_baby';
  displayName: string;
  tier: number;
  locations?: string[];
  signal?: AbortSignal;
}

export interface FetchPriceResult {
  success: boolean;
  quote?: ItemMarketQuote;
  errorMessage?: string;
  isThrottled?: boolean;
}

const DEFAULT_LOCATIONS = [
  'Martlock',
  'Lymhurst',
  'Bridgewatch',
  'Fort Sterling',
  'Thetford',
  'Caerleon',
  'Brecilien',
];

/**
 * Consulta de precios en vivo a los servidores de Albion Data Project con código defensivo y timeouts controlados.
 */
export async function fetchAlbionDataProjectPrice(
  options: FetchPriceOptions
): Promise<FetchPriceResult> {
  const {
    server,
    gameId,
    appItemId,
    targetType,
    displayName,
    tier,
    locations = DEFAULT_LOCATIONS,
    signal,
  } = options;

  const serverConfig = ALBION_DATA_SERVERS[server] || ALBION_DATA_SERVERS.europe;
  const locParam = encodeURIComponent(locations.join(','));
  const url = `${serverConfig.apiBaseUrl}/${encodeURIComponent(gameId)}.json?locations=${locParam}&qualities=1`;

  // Timeout defensivo de 7.5 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500);

  const abortHandler = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 429) {
      return {
        success: false,
        isThrottled: true,
        errorMessage:
          'El servidor de Albion Data Project ha limitado las solicitudes temporalmente (Rate Limit / Throttled). Por favor, intenta de nuevo en unos minutos.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        errorMessage: `El servidor de Albion Data Project respondió con error HTTP ${response.status} (${response.statusText}).`,
      };
    }

    const rawText = await response.text();

    if (rawText.toLowerCase().includes('throttled')) {
      return {
        success: false,
        isThrottled: true,
        errorMessage:
          'El servidor público de Albion Data Project está temporalmente ocupado. Recuerda que tus precios manuales continúan funcionando con total normalidad.',
      };
    }

    let parsedData: RawAlbionDataPriceRecord[];
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        errorMessage: 'Respuesta con formato no válido de Albion Data Project.',
      };
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return {
        success: true,
        quote: {
          appItemId,
          gameId,
          targetType,
          displayName,
          tier,
          server,
          serverLabel: serverConfig.name,
          fetchedAt: Date.now(),
          records: [],
          hasRecentData: false,
          notes: 'No hay cotizaciones reportadas para este ítem en el servidor seleccionado.',
        },
      };
    }

    // Normalizar registros por ciudad consolidando mejores órdenes de venta y compra
    const recordsByCity = new Map<string, NormalizedCityPriceRecord>();

    for (const item of parsedData) {
      const city = item.city;
      if (!city || city === 'Black Market') continue; // En economía agrícola/criadero el mercado negro no aplica

      const sellTimeInfo = formatReportRelativeTime(item.sell_price_min_date);
      const buyTimeInfo = formatReportRelativeTime(item.buy_price_max_date);

      const sellPrice = Number.isFinite(item.sell_price_min) && item.sell_price_min > 0 ? item.sell_price_min : 0;
      const buyPrice = Number.isFinite(item.buy_price_max) && item.buy_price_max > 0 ? item.buy_price_max : 0;

      if (!recordsByCity.has(city)) {
        recordsByCity.set(city, {
          city,
          quality: item.quality || 1,
          sellPriceMin: sellPrice,
          sellPriceMinDate: item.sell_price_min_date,
          sellPriceAgeMs: sellTimeInfo.ageMs,
          sellPriceAgeFormatted: sellTimeInfo.formattedAge,
          isSellPriceStale: sellTimeInfo.isStale,
          buyPriceMax: buyPrice,
          buyPriceMaxDate: item.buy_price_max_date,
          buyPriceAgeMs: buyTimeInfo.ageMs,
          buyPriceAgeFormatted: buyTimeInfo.formattedAge,
          isBuyPriceStale: buyTimeInfo.isStale,
        });
      } else {
        // Fusión inteligente: combinar la mejor cotización activa para cada tipo de orden
        const existing = recordsByCity.get(city)!;

        // Actualizar precio de venta mínimo (sell order)
        if (sellPrice > 0) {
          if (existing.sellPriceMin === 0 || sellTimeInfo.ageMs < existing.sellPriceAgeMs || sellPrice < existing.sellPriceMin) {
            existing.sellPriceMin = sellPrice;
            existing.sellPriceMinDate = item.sell_price_min_date;
            existing.sellPriceAgeMs = sellTimeInfo.ageMs;
            existing.sellPriceAgeFormatted = sellTimeInfo.formattedAge;
            existing.isSellPriceStale = sellTimeInfo.isStale;
          }
        }

        // Actualizar precio de compra máximo (buy order)
        if (buyPrice > 0) {
          if (existing.buyPriceMax === 0 || buyTimeInfo.ageMs < existing.buyPriceAgeMs || buyPrice > existing.buyPriceMax) {
            existing.buyPriceMax = buyPrice;
            existing.buyPriceMaxDate = item.buy_price_max_date;
            existing.buyPriceAgeMs = buyTimeInfo.ageMs;
            existing.buyPriceAgeFormatted = buyTimeInfo.formattedAge;
            existing.isBuyPriceStale = buyTimeInfo.isStale;
          }
        }
      }
    }

    // Orden canónico consistente para las ciudades de Albion Online
    const CANONICAL_CITY_ORDER = [
      'Martlock',
      'Thetford',
      'Fort Sterling',
      'Lymhurst',
      'Bridgewatch',
      'Caerleon',
      'Brecilien',
    ];

    const normalizedRecords = Array.from(recordsByCity.values()).sort((a, b) => {
      const indexA = CANONICAL_CITY_ORDER.indexOf(a.city);
      const indexB = CANONICAL_CITY_ORDER.indexOf(b.city);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.city.localeCompare(b.city);
    });

    // Identificar mejor precio de venta (más barato para comprar) y mejor orden de compra (más alto para vender)
    let cheapestSellCity: string | undefined;
    let cheapestSellPrice: number | undefined;
    let highestBuyCity: string | undefined;
    let highestBuyPrice: number | undefined;

    for (const rec of normalizedRecords) {
      if (rec.sellPriceMin > 0) {
        if (cheapestSellPrice === undefined || rec.sellPriceMin < cheapestSellPrice) {
          cheapestSellPrice = rec.sellPriceMin;
          cheapestSellCity = rec.city;
        }
      }
      if (rec.buyPriceMax > 0) {
        if (highestBuyPrice === undefined || rec.buyPriceMax > highestBuyPrice) {
          highestBuyPrice = rec.buyPriceMax;
          highestBuyCity = rec.city;
        }
      }
    }

    const hasRecentData = normalizedRecords.some(
      (r) => (r.sellPriceMin > 0 && !r.isSellPriceStale) || (r.buyPriceMax > 0 && !r.isBuyPriceStale)
    );

    return {
      success: true,
      quote: {
        appItemId,
        gameId,
        targetType,
        displayName,
        tier,
        server,
        serverLabel: serverConfig.name,
        fetchedAt: Date.now(),
        records: normalizedRecords,
        cheapestSellCity,
        cheapestSellPrice,
        highestBuyCity,
        highestBuyPrice,
        hasRecentData,
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        errorMessage: 'Tiempo de espera agotado al consultar Albion Data Project (timeout 7.5s).',
      };
    }
    return {
      success: false,
      errorMessage:
        err instanceof Error
          ? `No se pudo conectar a la API de Albion Data Project: ${err.message}`
          : 'Error desconocido al conectar con Albion Data Project.',
    };
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
}
