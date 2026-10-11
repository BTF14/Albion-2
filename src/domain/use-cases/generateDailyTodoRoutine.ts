import { DailyChecklistItem, CityId, TodoTaskCategory } from '../../types';
import { CharacterProfile, PlayerIsland } from '../models/character';

/**
 * Plantillas predefinidas de rutinas comunes de Albion Online
 */
export interface AlbionTodoTemplate {
  id: string;
  title: string;
  category: TodoTaskCategory;
  cityId: CityId;
  priority: 'normal' | 'high';
  notes: string;
  defaultItemId?: string;
  defaultPlots?: number;
}

export const ALBION_ROUTINE_TEMPLATES: AlbionTodoTemplate[] = [
  {
    id: 'tpl_focus_dump',
    title: 'Gastar los 10.000 Puntos de Foco Diarios',
    category: 'island',
    cityId: 'martlock',
    priority: 'high',
    notes: 'No dejar que el foco supere los 25.000 para evitar desperdicio por tope de 30k.',
    defaultPlots: 5,
  },
  {
    id: 'tpl_buy_seeds',
    title: 'Comprar Semillas / Crías en Mercado Central',
    category: 'market',
    cityId: 'martlock',
    priority: 'normal',
    notes: 'Aprovechar órdenes de compra para abaratar costes o consultar Albion Data Project.',
  },
  {
    id: 'tpl_feed_pastures',
    title: 'Alimentar Pastizales y Criaderos de Monturas',
    category: 'island',
    cityId: 'martlock',
    priority: 'high',
    notes: '10 unidades de grano/hierba para herbívoros, o carne cruda para garrasprestas/lobos.',
    defaultPlots: 3,
  },
  {
    id: 'tpl_labourers_cycle',
    title: 'Entregar y Recoger Diarios de Trabajadores (Ciclo 22h)',
    category: 'island',
    cityId: 'martlock',
    priority: 'high',
    notes: 'Entregar diarios llenos de recolector/crafteo y recoger recursos procesados + diarios vacíos devueltos.',
    defaultPlots: 1,
  },
  {
    id: 'tpl_transport_caerleon',
    title: 'Transporte de Cosechas a Caerleon (+15% RRR Cocina)',
    category: 'transport',
    cityId: 'caerleon',
    priority: 'normal',
    notes: 'Llevar buey o jabalí blindado por zona roja con scout o en horarios de baja población.',
  },
  {
    id: 'tpl_check_market_orders',
    title: 'Reclamar y Renovar Órdenes de Mercado Expiradas',
    category: 'market',
    cityId: 'martlock',
    priority: 'normal',
    notes: 'Revisar si los precios cambiaron y retirar depósitos de plata devueltos.',
  },
  {
    id: 'tpl_craft_daily_bonus',
    title: 'Aprovechar Bono Diario de Producción del Día (10:00 UTC)',
    category: 'crafting',
    cityId: 'martlock',
    priority: 'high',
    notes: 'Craftear comida o pociones coincidiendo con el evento diario activo para maximizar el retorno de recursos.',
  },
  {
    id: 'tpl_craft_equipment_journals',
    title: 'Crafteo de Equipo & Llenar Diarios de Artesanía',
    category: 'crafting',
    cityId: 'martlock',
    priority: 'normal',
    notes: 'Forjar armas/armaduras con bono de ciudad o evento diario llevando diarios de crafteo vacíos en mochila para reventa o trabajadores.',
  },
  {
    id: 'tpl_guild_hall_cycle',
    title: 'Visita a Casa Gremial (Guild Hall - 15 Trabajadores)',
    category: 'island',
    cityId: 'martlock',
    priority: 'high',
    notes: 'Alimentar a los 15 artesanos/recolectores de la Casa Gremial con diarios llenos y recoger el botín diario de 22h.',
  },
  {
    id: 'tpl_red_zone_convoy',
    title: 'Envío Masivo por Zona Roja (Caerleon / Mercado Negro)',
    category: 'transport',
    cityId: 'caerleon',
    priority: 'high',
    notes: 'Preparar montura de mensajero (Courier) o buey con scout para cruzar mapas de Zona Roja y vender en subasta o Mercado Negro.',
  },
  {
    id: 'tpl_audit_alchemy_cooking_recipes',
    title: 'Revisión & Auditoría de Recetas de Alquimia y Cocina',
    category: 'crafting',
    cityId: 'brecilien',
    priority: 'high',
    notes: 'Verificar inventario de licores destilados (Aguardiente de Patata, Licor de Maíz, Licor de Calabaza), salsas .1-.3 y hierbas para elaborar pociones T6-T8 con bonos de RRR.',
  },
  {
    id: 'tpl_distill_crop_spirits',
    title: 'Destilar Licores de Cultivos en Cocina (Patata, Maíz, Calabaza)',
    category: 'crafting',
    cityId: 'caerleon',
    priority: 'normal',
    notes: 'Procesar cosechas de patatas, maíz y calabazas en el cocinero (+15% RRR en Caerleon) para generar Aguardiente de Patatas T6, Licor de Maíz T7 y Licor de Calabaza T8.',
  },
];

/**
 * Genera y fusiona tareas para la lista de pendientes a partir de los personajes e islas registradas.
 * No duplica islas que ya existan en la lista actual.
 */
export function generateRoutineFromCharacterProfiles(
  existingItems: DailyChecklistItem[],
  profiles: CharacterProfile[]
): {
  updatedList: DailyChecklistItem[];
  addedCount: number;
} {
  const safeExisting = Array.isArray(existingItems) ? existingItems : [];
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return { updatedList: safeExisting, addedCount: 0 };
  }

  const existingKeys = new Set(
    safeExisting.map((item) => `${item.cityId}_${item.title.trim().toLowerCase()}`)
  );

  const newItems: DailyChecklistItem[] = [];
  const now = Date.now();

  for (const profile of profiles) {
    if (!profile.islands || !Array.isArray(profile.islands) || profile.islands.length === 0) continue;

    for (const island of profile.islands) {
      const islandTitle = `${island.name} (${profile.name})`;
      const dedupeKey = `${island.cityId}_${islandTitle.trim().toLowerCase()}`;

      if (existingKeys.has(dedupeKey)) {
        continue;
      }

      existingKeys.add(dedupeKey);

      newItems.push({
        id: `auto_island_${profile.id}_${island.id}_${now}_${Math.random().toString(36).substring(2, 7)}`,
        title: islandTitle,
        cityId: island.cityId,
        itemId: 'crop_wheat',
        plotsCount: Math.max(1, island.plotsCount || 5),
        harvested: false,
        replanted: false,
        usedFocus: !!profile.hasPremium,
        category: 'island',
        isCustomTask: false,
        priority: profile.isMain ? 'high' : 'normal',
        notes: island.notes || `Isla de ${profile.name} en ${island.cityId.toUpperCase()}`,
        createdAt: now,
      });
    }
  }

  return {
    updatedList: [...safeExisting, ...newItems],
    addedCount: newItems.length,
  };
}

/**
 * Reinicia la rutina para un nuevo día de recolección (ej. tras el reinicio de las 10:00 UTC).
 * Desmarca cosechas, siembras y estado de completado, preservando notas y configuración.
 */
export function resetRoutineForNewCycle(items: DailyChecklistItem[]): DailyChecklistItem[] {
  const safeItems = Array.isArray(items) ? items : [];
  return safeItems.map((item) => ({
    ...item,
    harvested: false,
    replanted: false,
    completed: false,
    completedDate: undefined,
  }));
}
