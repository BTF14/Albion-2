import { CraftEquipmentRecipe, CraftStationType } from '../domain/models/equipmentCrafting';

/**
 * Catálogo Oficial de Fama requerida por Tier de Diario de Crafteo
 * (Blacksmith, Fletcher, Imbuer, Tinker)
 */
export const CRAFTING_JOURNAL_FAME_REQUIREMENTS: Record<number, number> = {
  2: 300,
  3: 900,
  4: 1800,
  5: 3600,
  6: 7200,
  7: 14400,
  8: 28800,
};

/**
 * Catálogo oficial de recetas de equipo para las 4 estaciones de crafteo en Albion Online
 */
export const CRAFT_EQUIPMENT_RECIPES: CraftEquipmentRecipe[] = [
  // ==========================================
  // 1. FORJA DEL GUERRERO (BLACKSMITH)
  // ==========================================
  {
    id: 'sword_broadsword',
    nameEs: 'Espada Ancha (Broadsword)',
    nameEn: 'Broadsword',
    station: 'forge',
    slot: 'one_hand_weapon',
    tier: 5,
    itemValue: 240,
    craftFame: 450,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 16, type: 'metal' },
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 8, type: 'leather' },
    ],
  },
  {
    id: 'sword_claymore',
    nameEs: 'Mandoble / Claymore',
    nameEn: 'Claymore',
    station: 'forge',
    slot: 'two_hand_weapon',
    tier: 5,
    itemValue: 320,
    craftFame: 600,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 20, type: 'metal' },
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 12, type: 'leather' },
    ],
  },
  {
    id: 'axe_battleaxe',
    nameEs: 'Hacha de Guerra (Battleaxe)',
    nameEn: 'Battleaxe',
    station: 'forge',
    slot: 'one_hand_weapon',
    tier: 5,
    itemValue: 240,
    craftFame: 450,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 16, type: 'metal' },
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 8, type: 'wood' },
    ],
  },
  {
    id: 'plate_armor_soldier',
    nameEs: 'Armadura de Soldado (Placas)',
    nameEn: "Soldier's Armor",
    station: 'forge',
    slot: 'chest',
    tier: 5,
    itemValue: 240,
    craftFame: 450,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 16, type: 'metal' },
    ],
  },
  {
    id: 'plate_helmet_soldier',
    nameEs: 'Casco de Soldado (Placas)',
    nameEn: "Soldier's Helmet",
    station: 'forge',
    slot: 'head',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 8, type: 'metal' },
    ],
  },
  {
    id: 'plate_boots_soldier',
    nameEs: 'Botas de Soldado (Placas)',
    nameEn: "Soldier's Boots",
    station: 'forge',
    slot: 'shoes',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 8, type: 'metal' },
    ],
  },
  {
    id: 'shield_standard',
    nameEs: 'Escudo de Guerrero',
    nameEn: 'Shield',
    station: 'forge',
    slot: 'offhand',
    tier: 5,
    itemValue: 60,
    craftFame: 112,
    associatedLabourer: 'blacksmith',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 4, type: 'wood' },
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 4, type: 'metal' },
    ],
  },

  // ==========================================
  // 2. CABAÑA DEL CAZADOR (FLETCHER)
  // ==========================================
  {
    id: 'bow_regular',
    nameEs: 'Arco Normal (Bow)',
    nameEn: 'Bow',
    station: 'hunter',
    slot: 'two_hand_weapon',
    tier: 5,
    itemValue: 320,
    craftFame: 600,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 32, type: 'wood' },
    ],
  },
  {
    id: 'crossbow_regular',
    nameEs: 'Ballesta (Crossbow)',
    nameEn: 'Crossbow',
    station: 'hunter',
    slot: 'two_hand_weapon',
    tier: 5,
    itemValue: 320,
    craftFame: 600,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 20, type: 'wood' },
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 12, type: 'metal' },
    ],
  },
  {
    id: 'dagger_pair',
    nameEs: 'Par de Dagas (Dagger Pair)',
    nameEn: 'Dagger Pair',
    station: 'hunter',
    slot: 'two_hand_weapon',
    tier: 5,
    itemValue: 320,
    craftFame: 600,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 16, type: 'metal' },
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 16, type: 'leather' },
    ],
  },
  {
    id: 'leather_jacket_mercenary',
    nameEs: 'Chaqueta de Mercenario (Cuero)',
    nameEn: "Mercenary's Jacket",
    station: 'hunter',
    slot: 'chest',
    tier: 5,
    itemValue: 240,
    craftFame: 450,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 16, type: 'leather' },
    ],
  },
  {
    id: 'leather_hood_mercenary',
    nameEs: 'Capucha de Mercenario (Cuero)',
    nameEn: "Mercenary's Hood",
    station: 'hunter',
    slot: 'head',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 8, type: 'leather' },
    ],
  },
  {
    id: 'leather_shoes_mercenary',
    nameEs: 'Zapatos de Mercenario (Cuero)',
    nameEn: "Mercenary's Shoes",
    station: 'hunter',
    slot: 'shoes',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 8, type: 'leather' },
    ],
  },
  {
    id: 'torch_regular',
    nameEs: 'Antorcha (Torch)',
    nameEn: 'Torch',
    station: 'hunter',
    slot: 'offhand',
    tier: 5,
    itemValue: 60,
    craftFame: 112,
    associatedLabourer: 'fletcher',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 4, type: 'wood' },
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 4, type: 'cloth' },
    ],
  },

  // ==========================================
  // 3. TORRE DEL MAGO (IMBUER)
  // ==========================================
  {
    id: 'fire_staff_regular',
    nameEs: 'Báculo de Fuego (Fire Staff)',
    nameEn: 'Fire Staff',
    station: 'mage',
    slot: 'one_hand_weapon',
    tier: 5,
    itemValue: 240,
    craftFame: 450,
    associatedLabourer: 'imbuer',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 16, type: 'wood' },
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 8, type: 'metal' },
    ],
  },
  {
    id: 'holy_staff_great',
    nameEs: 'Gran Báculo Sagrado (Great Holy Staff)',
    nameEn: 'Great Holy Staff',
    station: 'mage',
    slot: 'two_hand_weapon',
    tier: 5,
    itemValue: 320,
    craftFame: 600,
    associatedLabourer: 'imbuer',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 20, type: 'wood' },
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 12, type: 'cloth' },
    ],
  },
  {
    id: 'cloth_robe_cleric',
    nameEs: 'Hábito de Clérigo (Túnica de Tela)',
    nameEn: "Cleric's Robe",
    station: 'mage',
    slot: 'chest',
    tier: 5,
    itemValue: 240,
    craftFame: 450,
    associatedLabourer: 'imbuer',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 16, type: 'cloth' },
    ],
  },
  {
    id: 'cloth_cowl_cleric',
    nameEs: 'Hábito / Caperuza de Clérigo (Tela)',
    nameEn: "Cleric's Cowl",
    station: 'mage',
    slot: 'head',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'imbuer',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 8, type: 'cloth' },
    ],
  },
  {
    id: 'cloth_sandals_cleric',
    nameEs: 'Sandalias de Clérigo (Tela)',
    nameEn: "Cleric's Sandals",
    station: 'mage',
    slot: 'shoes',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'imbuer',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 8, type: 'cloth' },
    ],
  },
  {
    id: 'tome_of_spells',
    nameEs: 'Tomo de Hechizos (Tome of Spells)',
    nameEn: 'Tome of Spells',
    station: 'mage',
    slot: 'offhand',
    tier: 5,
    itemValue: 60,
    craftFame: 112,
    associatedLabourer: 'imbuer',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 4, type: 'cloth' },
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 4, type: 'leather' },
    ],
  },

  // ==========================================
  // 4. TALLER DE HERRAMIENTAS (TINKER)
  // ==========================================
  {
    id: 'tool_pickaxe',
    nameEs: 'Pico de Minero (Pickaxe)',
    nameEn: "Miner's Pickaxe",
    station: 'toolmaker',
    slot: 'tool',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'tinker',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 2, type: 'metal' },
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 6, type: 'wood' },
    ],
  },
  {
    id: 'tool_woodaxe',
    nameEs: 'Hacha de Leñador (Wood Axe)',
    nameEn: "Lumberjack's Axe",
    station: 'toolmaker',
    slot: 'tool',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'tinker',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'planks', nameEs: 'Tablones de Madera', tier: 5, amount: 6, type: 'wood' },
      { materialId: 'bar_metal', nameEs: 'Barra de Metal (Lingote)', tier: 5, amount: 2, type: 'metal' },
    ],
  },
  {
    id: 'bag_regular',
    nameEs: 'Bolsa de Transporte (Bag)',
    nameEn: 'Bag',
    station: 'toolmaker',
    slot: 'bag',
    tier: 5,
    itemValue: 120,
    craftFame: 225,
    associatedLabourer: 'tinker',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 8, type: 'leather' },
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 8, type: 'cloth' },
    ],
  },
  {
    id: 'cape_regular',
    nameEs: 'Capa Común (Plain Cape)',
    nameEn: 'Cape',
    station: 'toolmaker',
    slot: 'cape',
    tier: 5,
    itemValue: 60,
    craftFame: 112,
    associatedLabourer: 'tinker',
    journalFameThreshold: CRAFTING_JOURNAL_FAME_REQUIREMENTS,
    materials: [
      { materialId: 'cloth', nameEs: 'Tela Refinada', tier: 5, amount: 4, type: 'cloth' },
      { materialId: 'leather', nameEs: 'Cuero Curtido', tier: 5, amount: 4, type: 'leather' },
    ],
  },
];

/**
 * Bonificaciones oficiales de crafteo por ciudad real en Albion Online
 */
export const CITY_CRAFTING_BONUSES: Record<string, {
  nameEs: string;
  specializedItems: string[];
  description: string;
}> = {
  fort_sterling: {
    nameEs: 'Fort Sterling',
    specializedItems: ['Martillos', 'Lanzas', 'Cascos de Placas', 'Armaduras de Tela'],
    description: 'Bono en Martillos, Lanzas, Cascos de Placa y Armaduras de Tela (24.8% RRR sin foco / 47.9% con foco).',
  },
  thetford: {
    nameEs: 'Thetford',
    specializedItems: ['Mazas', 'Báculos de Naturaleza', 'Bastones de Combate', 'Armaduras de Placa', 'Capuchas de Cuero'],
    description: 'Bono en Mazas, Naturaleza, Bastones, Armaduras de Placa y Capuchas de Cuero.',
  },
  lymhurst: {
    nameEs: 'Lymhurst',
    specializedItems: ['Espadas', 'Arcos', 'Báculos Arcanos', 'Chaquetas de Cuero', 'Cascos de Tela'],
    description: 'Bono en Espadas, Arcos, Arcano, Chaquetas de Cuero y Cascos de Tela.',
  },
  bridgewatch: {
    nameEs: 'Bridgewatch',
    specializedItems: ['Ballestas', 'Dagas', 'Báculos de Fuego', 'Armaduras de Tela', 'Botas de Placa'],
    description: 'Bono en Ballestas, Dagas, Fuego, Armaduras de Tela y Botas de Placa.',
  },
  martlock: {
    nameEs: 'Martlock',
    specializedItems: ['Hachas', 'Báculos de Hielo', 'Zapatos de Cuero', 'Botas de Tela', 'Escudos'],
    description: 'Bono en Hachas, Hielo, Zapatos de Cuero, Botas de Tela y Escudos.',
  },
  caerleon: {
    nameEs: 'Caerleon',
    specializedItems: ['Armas de Tecnología', 'Herramientas', 'Comida (+15%)'],
    description: 'Retorno balanceado y mercado negro de alta demanda.',
  },
  brecilien: {
    nameEs: 'Brecilien',
    specializedItems: ['Capas de Brecilien', 'Pociones (+15%)'],
    description: 'Retorno místico y bonificación alquímica.',
  },
};
