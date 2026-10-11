import { test, expect } from 'e2e';
import { RECIPES } from '../src/data/recipes';
import { ALBION_ITEMS } from '../src/data/items';
import { calculateCraftingEconomy } from '../src/domain/use-cases/calculateCraftingEconomy';

const itemMap = new Map(ALBION_ITEMS.map((item) => [item.id, item]));

test('E2E Audit: Todos los ingredientes referenciados existen en ALBION_ITEMS', () => {
  const missingItems: string[] = [];
  for (const recipe of RECIPES) {
    for (const ing of recipe.ingredients) {
      if (!itemMap.has(ing.itemId)) {
        missingItems.push(`${recipe.id} -> ${ing.itemId}`);
      }
    }
  }
  expect(missingItems.length).toBe(0);
});

test('E2E Audit: Galletas de Huevo de Dragón T8 cumplen la mecánica canónica (99 galletas / 1 huevo)', () => {
  const drake = RECIPES.find((r) => r.id === 'cook_drake_biscuits_t8');
  expect(drake).toBeDefined();
  expect(drake!.outputAmount).toBe(99);
  
  const eggIng = drake!.ingredients.find((i) => i.itemId === 'animal_prod_dragon_egg');
  expect(eggIng).toBeDefined();
  expect(eggIng!.amount).toBe(1);

  const wheatIng = drake!.ingredients.find((i) => i.itemId === 'crop_wheat');
  expect(wheatIng!.amount).toBe(36);

  const milkIng = drake!.ingredients.find((i) => i.itemId === 'animal_prod_cow');
  expect(milkIng!.amount).toBe(36);
});

test('E2E Audit: Poción de Guardia de Vida / Dragón T6 produce 10 unidades con 1 Sangre de Dragón', () => {
  const lifeward = RECIPES.find((r) => r.id === 'alch_lifeward_potion_t8');
  expect(lifeward).toBeDefined();
  expect(lifeward!.tier).toBe(6);
  expect(lifeward!.outputAmount).toBe(10);

  const blood = lifeward!.ingredients.find((i) => i.itemId === 'dragon_blood');
  expect(blood!.amount).toBe(1);

  const foxglove = lifeward!.ingredients.find((i) => i.itemId === 'herb_foxglove');
  expect(foxglove!.amount).toBe(48);

  const teasel = lifeward!.ingredients.find((i) => i.itemId === 'herb_teasel');
  expect(teasel!.amount).toBe(24);

  const agaric = lifeward!.ingredients.find((i) => i.itemId === 'herb_agaric');
  expect(agaric!.amount).toBe(12);
});

test('E2E Audit: Tortilla de Pez Ley T7 utiliza 1 pez aleta ley y 6 de cada hierba/huevo', () => {
  const leyfin = RECIPES.find((r) => r.id === 'cook_leyfin_omelette_t7');
  expect(leyfin).toBeDefined();
  expect(leyfin!.outputAmount).toBe(10);

  const fish = leyfin!.ingredients.find((i) => i.itemId === 'fish_leyfin');
  expect(fish!.amount).toBe(1);

  const mullein = leyfin!.ingredients.find((i) => i.itemId === 'herb_mullein');
  expect(mullein!.amount).toBe(6);

  const teasel = leyfin!.ingredients.find((i) => i.itemId === 'herb_teasel');
  expect(teasel!.amount).toBe(6);

  const eggs = leyfin!.ingredients.find((i) => i.itemId === 'animal_prod_goose');
  expect(eggs!.amount).toBe(6);
});

test('E2E Audit: Platos Avalonianos T7 y T8 tienen fórmulas e ingredientes exactos', () => {
  const stew = RECIPES.find((r) => r.id === 'cook_avalonian_beef_stew_t8');
  expect(stew).toBeDefined();
  const wheat = stew!.ingredients.find((i) => i.itemId === 'crop_wheat');
  expect(wheat).toBeDefined();
  expect(wheat!.amount).toBe(36);
  const pumpkin = stew!.ingredients.find((i) => i.itemId === 'crop_pumpkin');
  expect(pumpkin).toBeDefined();
  expect(pumpkin!.amount).toBe(36);
  const energyStew = stew!.ingredients.find((i) => i.itemId === 'avalonian_energy');
  expect(energyStew!.amount).toBe(10);

  const omelette = RECIPES.find((r) => r.id === 'cook_avalonian_pork_omelette_t7');
  expect(omelette).toBeDefined();
  const corn = omelette!.ingredients.find((i) => i.itemId === 'crop_corn');
  expect(corn).toBeDefined();
  expect(corn!.amount).toBe(36);
  const gooseEggs = omelette!.ingredients.find((i) => i.itemId === 'animal_prod_goose');
  expect(gooseEggs).toBeDefined();
  expect(gooseEggs!.amount).toBe(18);
  const energyOmelette = omelette!.ingredients.find((i) => i.itemId === 'avalonian_energy');
  expect(energyOmelette!.amount).toBe(8);
});

test('E2E Audit: Destilados de cultivos tienen relación estricta 1:1 en lotes de 10', () => {
  const potato = RECIPES.find((r) => r.id === 'cook_potato_schnapps_t6');
  expect(potato!.outputAmount).toBe(10);
  expect(potato!.ingredients[0].amount).toBe(10);
  expect(potato!.baseFocusCost).toBe(290);

  const corn = RECIPES.find((r) => r.id === 'cook_corn_schnapps_t7');
  expect(corn!.outputAmount).toBe(10);
  expect(corn!.ingredients[0].amount).toBe(10);
  expect(corn!.baseFocusCost).toBe(380);

  const pumpkin = RECIPES.find((r) => r.id === 'cook_pumpkin_schnapps_t8');
  expect(pumpkin!.outputAmount).toBe(10);
  expect(pumpkin!.ingredients[0].amount).toBe(10);
  expect(pumpkin!.baseFocusCost).toBe(500);
});

test('E2E Audit: Pasteles (Pies) tienen sus 4 ingredientes oficiales', () => {
  const porkPie = RECIPES.find((r) => r.id === 'cook_pork_pie_t7');
  expect(porkPie!.ingredients.length).toBe(4);
  expect(porkPie!.ingredients.find((i) => i.itemId === 'animal_meat_pig')!.amount).toBe(72);
  expect(porkPie!.ingredients.find((i) => i.itemId === 'crop_wheat')!.amount).toBe(36);
  expect(porkPie!.ingredients.find((i) => i.itemId === 'crop_corn')!.amount).toBe(18);
  expect(porkPie!.ingredients.find((i) => i.itemId === 'animal_prod_sheep')!.amount).toBe(18);

  const goosePie = RECIPES.find((r) => r.id === 'cook_goose_pie');
  expect(goosePie!.ingredients.length).toBe(4);
  expect(goosePie!.ingredients.find((i) => i.itemId === 'animal_meat_goose')!.amount).toBe(24);
  expect(goosePie!.ingredients.find((i) => i.itemId === 'crop_wheat')!.amount).toBe(12);
  expect(goosePie!.ingredients.find((i) => i.itemId === 'crop_cabbage')!.amount).toBe(6);
  expect(goosePie!.ingredients.find((i) => i.itemId === 'animal_prod_goat')!.amount).toBe(6);
});

test('E2E Audit: Guisos (Stews) usan Pan (Trigo) canónico en lugar de repollo', () => {
  const muttonStew = RECIPES.find((r) => r.id === 'cook_mutton_stew_t6');
  expect(muttonStew!.ingredients.find((i) => i.itemId === 'crop_wheat')!.amount).toBe(12);
  expect(muttonStew!.ingredients.find((i) => i.itemId === 'crop_cabbage')).toBeUndefined();
});

test('E2E Audit: Árbol completo de 22 Pociones de Alquimia incluye licores destilados', () => {
  const alchemyRecipes = RECIPES.filter((r) => r.category === 'alchemy');
  expect(alchemyRecipes.length).toBe(22);

  const majorHealing = alchemyRecipes.find((r) => r.id === 'alch_major_healing_t6');
  expect(majorHealing!.ingredients.some((i) => i.itemId === 'liquor_potato')).toBe(true);

  const majorRes = alchemyRecipes.find((r) => r.id === 'alch_major_resistance_t7');
  expect(majorRes!.ingredients.some((i) => i.itemId === 'liquor_corn')).toBe(true);

  const invis = alchemyRecipes.find((r) => r.id === 'alch_invisibility_t8');
  expect(invis!.ingredients.some((i) => i.itemId === 'liquor_pumpkin')).toBe(true);

  const berserk = alchemyRecipes.find((r) => r.id === 'alch_berserk_t8');
  expect(berserk!.ingredients.some((i) => i.itemId === 'liquor_potato')).toBe(true);
  expect(berserk!.ingredients.some((i) => i.itemId === 'liquor_corn')).toBe(true);
  expect(berserk!.ingredients.some((i) => i.itemId === 'liquor_pumpkin')).toBe(true);
});
