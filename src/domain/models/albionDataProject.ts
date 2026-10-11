/**
 * Modelos de Dominio Puro: Albion Data Project (Consulta Referencial de Precios de Mercado)
 * Arquitectura Gentleman Programming (Clean Architecture)
 * 
 * Regla Inquebrantable #1: Los precios de esta integración son ESTRICTAMENTE REFERENCIALES.
 * El motor económico del usuario siempre opera con sus precios manuales garantizados.
 */

export type AlbionDataServerRegion = 'europe' | 'west' | 'east';

export interface AlbionDataServerConfig {
  id: AlbionDataServerRegion;
  name: string;
  shortLabel: string;
  flag: string;
  apiBaseUrl: string;
  description: string;
}

export const ALBION_DATA_SERVERS: Record<AlbionDataServerRegion, AlbionDataServerConfig> = {
  europe: {
    id: 'europe',
    name: 'Servidor Europa (Albion Europe)',
    shortLabel: 'Europa',
    flag: '🇪🇺',
    apiBaseUrl: 'https://europe.albion-online-data.com/api/v2/stats/prices',
    description: 'Servidor oficial de Europa (lanzado en 2024)',
  },
  west: {
    id: 'west',
    name: 'Servidor América / Oeste (Albion Americas)',
    shortLabel: 'América',
    flag: '🇺🇸',
    apiBaseUrl: 'https://west.albion-online-data.com/api/v2/stats/prices',
    description: 'Servidor original clásico (Washington D.C.)',
  },
  east: {
    id: 'east',
    name: 'Servidor Asia / Este (Albion Asia)',
    shortLabel: 'Asia',
    flag: '🇸🇬',
    apiBaseUrl: 'https://east.albion-online-data.com/api/v2/stats/prices',
    description: 'Servidor de Asia y Oceanía (Singapur)',
  },
};

export interface RawAlbionDataPriceRecord {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export interface NormalizedCityPriceRecord {
  city: string;
  quality: number;
  sellPriceMin: number; // Orden de venta más barata (precio de compra inmediata para el jugador)
  sellPriceMinDate: string;
  sellPriceAgeMs: number;
  sellPriceAgeFormatted: string;
  isSellPriceStale: boolean; // >24 horas
  buyPriceMax: number; // Orden de compra más alta (precio de venta inmediata)
  buyPriceMaxDate: string;
  buyPriceAgeMs: number;
  buyPriceAgeFormatted: string;
  isBuyPriceStale: boolean;
}

export interface ItemMarketQuote {
  appItemId: string;
  gameId: string;
  targetType: 'product' | 'seed_or_baby';
  displayName: string;
  tier: number;
  server: AlbionDataServerRegion;
  serverLabel: string;
  fetchedAt: number;
  records: NormalizedCityPriceRecord[];
  
  // Resumen sintético para ayuda del jugador
  cheapestSellCity?: string;
  cheapestSellPrice?: number;
  highestBuyCity?: string;
  highestBuyPrice?: number;
  hasRecentData: boolean;
  notes?: string;
}

export interface AlbionLookupItem {
  appItemId: string;
  nameEs: string;
  nameEn: string;
  category: 'crop' | 'herb' | 'animal_produce' | 'animal_meat' | 'mount' | 'sauce' | 'food';
  tier: number;
  iconName: string;
  productGameId: string;
  seedOrBabyGameId?: string;
  seedOrBabyNameEs?: string;
}

/**
 * Catálogo Maestro Oficial de Mapeo entre IDs de la Aplicación y UniqueNames del juego en Albion Online.
 * Extraído y validado directamente de los paquetes de datos binarios oficiales de Albion Data Project.
 */
export const ALBION_LOOKUP_CATALOGUE: AlbionLookupItem[] = [
  // ==================== CULTIVOS Y SEMILLAS ====================
  {
    appItemId: 'crop_carrot',
    nameEs: 'Zanahorias',
    nameEn: 'Carrots',
    category: 'crop',
    tier: 2,
    iconName: 'Carrot',
    productGameId: 'T1_CARROT',
    seedOrBabyGameId: 'T1_FARM_CARROT_SEED',
    seedOrBabyNameEs: 'Semilla de Zanahoria (T2)',
  },
  {
    appItemId: 'crop_bean',
    nameEs: 'Judías / Frijoles',
    nameEn: 'Beans',
    category: 'crop',
    tier: 3,
    iconName: 'Bean',
    productGameId: 'T2_BEAN',
    seedOrBabyGameId: 'T2_FARM_BEAN_SEED',
    seedOrBabyNameEs: 'Semilla de Judías (T3)',
  },
  {
    appItemId: 'crop_wheat',
    nameEs: 'Trigo',
    nameEn: 'Wheat',
    category: 'crop',
    tier: 4,
    iconName: 'Wheat',
    productGameId: 'T3_WHEAT',
    seedOrBabyGameId: 'T3_FARM_WHEAT_SEED',
    seedOrBabyNameEs: 'Semilla de Trigo (T4)',
  },
  {
    appItemId: 'crop_turnip',
    nameEs: 'Nabos',
    nameEn: 'Turnips',
    category: 'crop',
    tier: 5,
    iconName: 'Nut',
    productGameId: 'T4_TURNIP',
    seedOrBabyGameId: 'T4_FARM_TURNIP_SEED',
    seedOrBabyNameEs: 'Semilla de Nabo (T5)',
  },
  {
    appItemId: 'crop_cabbage',
    nameEs: 'Coles / Repollo',
    nameEn: 'Cabbage',
    category: 'crop',
    tier: 6,
    iconName: 'Apple',
    productGameId: 'T5_CABBAGE',
    seedOrBabyGameId: 'T5_FARM_CABBAGE_SEED',
    seedOrBabyNameEs: 'Semilla de Col (T6)',
  },
  {
    appItemId: 'crop_potato',
    nameEs: 'Patatas / Papas',
    nameEn: 'Potatoes',
    category: 'crop',
    tier: 7,
    iconName: 'CircleDot',
    productGameId: 'T6_POTATO',
    seedOrBabyGameId: 'T6_FARM_POTATO_SEED',
    seedOrBabyNameEs: 'Semilla de Patata (T7)',
  },
  {
    appItemId: 'crop_corn',
    nameEs: 'Maíz dulce',
    nameEn: 'Corn',
    category: 'crop',
    tier: 8,
    iconName: 'Sun',
    productGameId: 'T7_CORN',
    seedOrBabyGameId: 'T7_FARM_CORN_SEED',
    seedOrBabyNameEs: 'Semilla de Maíz (T8)',
  },
  {
    appItemId: 'crop_pumpkin',
    nameEs: 'Calabazas',
    nameEn: 'Pumpkins',
    category: 'crop',
    tier: 8,
    iconName: 'Flame',
    productGameId: 'T8_PUMPKIN',
    seedOrBabyGameId: 'T8_FARM_PUMPKIN_SEED',
    seedOrBabyNameEs: 'Semilla de Calabaza (T8)',
  },

  // ==================== HIERBAS Y SEMILLAS ALQUÍMICAS ====================
  {
    appItemId: 'herb_agaric',
    nameEs: 'Agárico arcano',
    nameEn: 'Arcane Agaric',
    category: 'herb',
    tier: 2,
    iconName: 'Flower2',
    productGameId: 'T2_AGARIC',
    seedOrBabyGameId: 'T2_FARM_AGARIC_SEED',
    seedOrBabyNameEs: 'Semilla de Agárico (T2)',
  },
  {
    appItemId: 'herb_comfrey',
    nameEs: 'Consuelda de hoja brillante',
    nameEn: 'Brightleaf Comfrey',
    category: 'herb',
    tier: 3,
    iconName: 'Leaf',
    productGameId: 'T3_COMFREY',
    seedOrBabyGameId: 'T3_FARM_COMFREY_SEED',
    seedOrBabyNameEs: 'Semilla de Consuelda (T3)',
  },
  {
    appItemId: 'herb_burdock',
    nameEs: 'Bardana almenada',
    nameEn: 'Crenellated Burdock',
    category: 'herb',
    tier: 4,
    iconName: 'Sprout',
    productGameId: 'T4_BURDOCK',
    seedOrBabyGameId: 'T4_FARM_BURDOCK_SEED',
    seedOrBabyNameEs: 'Semilla de Bardana (T4)',
  },
  {
    appItemId: 'herb_teasel',
    nameEs: 'Cardo de dragón',
    nameEn: 'Dragon Teasel',
    category: 'herb',
    tier: 5,
    iconName: 'Sparkles',
    productGameId: 'T5_TEASEL',
    seedOrBabyGameId: 'T5_FARM_TEASEL_SEED',
    seedOrBabyNameEs: 'Semilla de Cardo Dragón (T5)',
  },
  {
    appItemId: 'herb_foxglove',
    nameEs: 'Dedalera elusiva',
    nameEn: 'Elusive Foxglove',
    category: 'herb',
    tier: 6,
    iconName: 'Flower',
    productGameId: 'T6_FOXGLOVE',
    seedOrBabyGameId: 'T6_FARM_FOXGLOVE_SEED',
    seedOrBabyNameEs: 'Semilla de Dedalera (T6)',
  },
  {
    appItemId: 'herb_mullein',
    nameEs: 'Gordolobo de fuego',
    nameEn: 'Firetouched Mullein',
    category: 'herb',
    tier: 7,
    iconName: 'Flame',
    productGameId: 'T7_MULLEIN',
    seedOrBabyGameId: 'T7_FARM_MULLEIN_SEED',
    seedOrBabyNameEs: 'Semilla de Gordolobo (T7)',
  },
  {
    appItemId: 'herb_yarrow',
    nameEs: 'Milenrama espectral',
    nameEn: 'Ghoul Yarrow',
    category: 'herb',
    tier: 8,
    iconName: 'Ghost',
    productGameId: 'T8_YARROW',
    seedOrBabyGameId: 'T8_FARM_YARROW_SEED',
    seedOrBabyNameEs: 'Semilla de Milenrama (T8)',
  },

  // ==================== GANADERÍA (HUEVOS Y LECHE) ====================
  {
    appItemId: 'animal_prod_chicken',
    nameEs: 'Huevos de Gallina',
    nameEn: 'Hen Eggs',
    category: 'animal_produce',
    tier: 3,
    iconName: 'Egg',
    productGameId: 'T3_EGG',
    seedOrBabyGameId: 'T3_FARM_CHICKEN_BABY',
    seedOrBabyNameEs: 'Pollito (Cría T3)',
  },
  {
    appItemId: 'animal_prod_goat',
    nameEs: 'Leche de Cabra',
    nameEn: "Goat's Milk",
    category: 'animal_produce',
    tier: 4,
    iconName: 'Milk',
    productGameId: 'T4_MILK',
    seedOrBabyGameId: 'T4_FARM_GOAT_BABY',
    seedOrBabyNameEs: 'Cabrito (Cría T4)',
  },
  {
    appItemId: 'animal_prod_goose',
    nameEs: 'Huevos de Ganso',
    nameEn: 'Goose Eggs',
    category: 'animal_produce',
    tier: 5,
    iconName: 'EggFried',
    productGameId: 'T5_EGG',
    seedOrBabyGameId: 'T5_FARM_GOOSE_BABY',
    seedOrBabyNameEs: 'Ansaron / Cría Ganso (T5)',
  },
  {
    appItemId: 'animal_prod_sheep',
    nameEs: 'Leche de Oveja',
    nameEn: "Sheep's Milk",
    category: 'animal_produce',
    tier: 6,
    iconName: 'Milk',
    productGameId: 'T6_MILK',
    seedOrBabyGameId: 'T6_FARM_SHEEP_BABY',
    seedOrBabyNameEs: 'Cordero joven (Cría T6)',
  },
  {
    appItemId: 'animal_prod_cow',
    nameEs: 'Leche de Vaca',
    nameEn: "Cow's Milk",
    category: 'animal_produce',
    tier: 8,
    iconName: 'Milk',
    productGameId: 'T8_MILK',
    seedOrBabyGameId: 'T8_FARM_COW_BABY',
    seedOrBabyNameEs: 'Ternero (Cría T8)',
  },

  // ==================== CARNICERÍA (CARNE CRUDA) ====================
  {
    appItemId: 'animal_meat_chicken',
    nameEs: 'Pollo Crudo',
    nameEn: 'Raw Chicken',
    category: 'animal_meat',
    tier: 3,
    iconName: 'Drumstick',
    productGameId: 'T3_MEAT',
    seedOrBabyGameId: 'T3_FARM_CHICKEN_BABY',
    seedOrBabyNameEs: 'Pollito (Cría T3)',
  },
  {
    appItemId: 'animal_meat_goat',
    nameEs: 'Cabra Cruda',
    nameEn: 'Raw Goat',
    category: 'animal_meat',
    tier: 4,
    iconName: 'Beef',
    productGameId: 'T4_MEAT',
    seedOrBabyGameId: 'T4_FARM_GOAT_BABY',
    seedOrBabyNameEs: 'Cabrito (Cría T4)',
  },
  {
    appItemId: 'animal_meat_goose',
    nameEs: 'Ganso Crudo',
    nameEn: 'Raw Goose',
    category: 'animal_meat',
    tier: 5,
    iconName: 'Drumstick',
    productGameId: 'T5_MEAT',
    seedOrBabyGameId: 'T5_FARM_GOOSE_BABY',
    seedOrBabyNameEs: 'Ansaron (Cría T5)',
  },
  {
    appItemId: 'animal_meat_sheep',
    nameEs: 'Cordero Crudo',
    nameEn: 'Raw Mutton',
    category: 'animal_meat',
    tier: 6,
    iconName: 'Beef',
    productGameId: 'T6_MEAT',
    seedOrBabyGameId: 'T6_FARM_SHEEP_BABY',
    seedOrBabyNameEs: 'Cordero joven (Cría T6)',
  },
  {
    appItemId: 'animal_meat_pig',
    nameEs: 'Cerdo Crudo',
    nameEn: 'Raw Pork',
    category: 'animal_meat',
    tier: 7,
    iconName: 'Beef',
    productGameId: 'T7_MEAT',
    seedOrBabyGameId: 'T7_FARM_PIG_BABY',
    seedOrBabyNameEs: 'Lechón (Cría T7)',
  },
  {
    appItemId: 'animal_meat_cow',
    nameEs: 'Res / Ternera Cruda',
    nameEn: 'Raw Beef',
    category: 'animal_meat',
    tier: 8,
    iconName: 'Beef',
    productGameId: 'T8_MEAT',
    seedOrBabyGameId: 'T8_FARM_COW_BABY',
    seedOrBabyNameEs: 'Ternero (Cría T8)',
  },

  // ==================== MONTURAS (CABALLOS, BUEYES, SALVAJES) ====================
  {
    appItemId: 'mount_horse_t3',
    nameEs: 'Caballo de Montar (T3)',
    nameEn: 'Riding Horse (T3)',
    category: 'mount',
    tier: 3,
    iconName: 'Horse',
    productGameId: 'T3_MOUNT_HORSE',
    seedOrBabyGameId: 'T3_FARM_HORSE_BABY',
    seedOrBabyNameEs: 'Potro (Cría T3)',
  },
  {
    appItemId: 'mount_horse_t4',
    nameEs: 'Caballo de Montar (T4)',
    nameEn: 'Riding Horse (T4)',
    category: 'mount',
    tier: 4,
    iconName: 'Horse',
    productGameId: 'T4_MOUNT_HORSE',
    seedOrBabyGameId: 'T4_FARM_HORSE_BABY',
    seedOrBabyNameEs: 'Potro (Cría T4)',
  },
  {
    appItemId: 'mount_horse_t5',
    nameEs: 'Caballo de Montar (T5)',
    nameEn: 'Riding Horse (T5)',
    category: 'mount',
    tier: 5,
    iconName: 'Horse',
    productGameId: 'T5_MOUNT_HORSE',
    seedOrBabyGameId: 'T5_FARM_HORSE_BABY',
    seedOrBabyNameEs: 'Potro (Cría T5)',
  },
  {
    appItemId: 'mount_ox_t3',
    nameEs: 'Buey de Transporte (T3)',
    nameEn: 'Transport Ox (T3)',
    category: 'mount',
    tier: 3,
    iconName: 'Truck',
    productGameId: 'T3_MOUNT_OX',
    seedOrBabyGameId: 'T3_FARM_OX_BABY',
    seedOrBabyNameEs: 'Ternero de Buey (T3)',
  },
  {
    appItemId: 'mount_ox_t4',
    nameEs: 'Buey de Transporte (T4)',
    nameEn: 'Transport Ox (T4)',
    category: 'mount',
    tier: 4,
    iconName: 'Truck',
    productGameId: 'T4_MOUNT_OX',
    seedOrBabyGameId: 'T4_FARM_OX_BABY',
    seedOrBabyNameEs: 'Ternero de Buey (T4)',
  },
  {
    appItemId: 'mount_swiftclaw_t5',
    nameEs: 'Garrapresta (T5)',
    nameEn: 'Swiftclaw (T5)',
    category: 'mount',
    tier: 5,
    iconName: 'Cat',
    productGameId: 'T5_MOUNT_COUGAR_KEEPER',
    seedOrBabyGameId: 'T5_FARM_COUGAR_BABY',
    seedOrBabyNameEs: 'Cría de Garrapresta (T5)',
  },
  {
    appItemId: 'mount_direwolf_t6',
    nameEs: 'Lobo Huargo (T6)',
    nameEn: 'Direwolf (T6)',
    category: 'mount',
    tier: 6,
    iconName: 'Dog',
    productGameId: 'T6_MOUNT_DIREWOLF',
    seedOrBabyGameId: 'T6_FARM_DIREWOLF_BABY',
    seedOrBabyNameEs: 'Cachorro de Lobo Huargo (T6)',
  },
  {
    appItemId: 'mount_wildboar_t7',
    nameEs: 'Jabalí Salvaje (T7)',
    nameEn: 'Wild Boar (T7)',
    category: 'mount',
    tier: 7,
    iconName: 'Shield',
    productGameId: 'T7_MOUNT_DIREBOAR',
    seedOrBabyGameId: 'T7_FARM_DIREBOAR_BABY',
    seedOrBabyNameEs: 'Cachorro de Jabalí Salvaje (T7)',
  },
  {
    appItemId: 'mount_mammoth_t8',
    nameEs: 'Mamut de Transporte (T8)',
    nameEn: 'Transport Mammoth (T8)',
    category: 'mount',
    tier: 8,
    iconName: 'Truck',
    productGameId: 'T8_MOUNT_MAMMOTH_TRANSPORT',
    seedOrBabyGameId: 'T8_FARM_MAMMOTH_BABY',
    seedOrBabyNameEs: 'Cría de Mamut (T8)',
  },

  // ==================== TALLER DE SALSAS Y ALQUIMIA ====================
  {
    appItemId: 'mat_chopped_fish',
    nameEs: 'Pescado Picado',
    nameEn: 'Chopped Fish',
    category: 'sauce',
    tier: 1,
    iconName: 'Fish',
    productGameId: 'T1_FISHCHOPS',
  },
  {
    appItemId: 'mat_seaweed',
    nameEs: 'Algas',
    nameEn: 'Seaweed',
    category: 'sauce',
    tier: 1,
    iconName: 'Waves',
    productGameId: 'T1_SEAWEED',
  },
  {
    appItemId: 'sauce_basic',
    nameEs: 'Salsa de Pescado Básica (.1)',
    nameEn: 'Basic Fish Sauce (.1)',
    category: 'sauce',
    tier: 1,
    iconName: 'Flame',
    productGameId: 'T1_FISHSAUCE_LEVEL1',
  },
  {
    appItemId: 'sauce_fancy',
    nameEs: 'Salsa de Pescado Elegante (.2)',
    nameEn: 'Fancy Fish Sauce (.2)',
    category: 'sauce',
    tier: 1,
    iconName: 'Sparkles',
    productGameId: 'T1_FISHSAUCE_LEVEL2',
  },
  {
    appItemId: 'sauce_special',
    nameEs: 'Salsa de Pescado Especial (.3)',
    nameEn: 'Special Fish Sauce (.3)',
    category: 'sauce',
    tier: 1,
    iconName: 'Crown',
    productGameId: 'T1_FISHSAUCE_LEVEL3',
  },
];

/**
 * Calcula la antigüedad formateada en lenguaje natural a partir de una fecha ISO o timestamp.
 */
export function formatReportRelativeTime(isoOrDateStr: string | null | undefined): {
  formattedAge: string;
  ageMs: number;
  isStale: boolean;
} {
  if (!isoOrDateStr || isoOrDateStr.startsWith('0001-01-01')) {
    return {
      formattedAge: 'Sin registros recientes',
      ageMs: Infinity,
      isStale: true,
    };
  }

  try {
    const reportTime = new Date(isoOrDateStr).getTime();
    if (isNaN(reportTime)) {
      return { formattedAge: 'Fecha no disponible', ageMs: Infinity, isStale: true };
    }

    const now = Date.now();
    const diffMs = Math.max(0, now - reportTime);
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const isStale = diffHours >= 24;

    if (diffMinutes < 5) return { formattedAge: 'Hace unos minutos', ageMs: diffMs, isStale };
    if (diffMinutes < 60) return { formattedAge: `Hace ${diffMinutes} min`, ageMs: diffMs, isStale };
    if (diffHours === 1) return { formattedAge: 'Hace 1 hora', ageMs: diffMs, isStale };
    if (diffHours < 24) return { formattedAge: `Hace ${diffHours} horas`, ageMs: diffMs, isStale };
    if (diffDays === 1) return { formattedAge: 'Hace 1 día (desactualizado)', ageMs: diffMs, isStale: true };
    return { formattedAge: `Hace ${diffDays} días (desactualizado)`, ageMs: diffMs, isStale: true };
  } catch {
    return { formattedAge: 'Desconocido', ageMs: Infinity, isStale: true };
  }
}
