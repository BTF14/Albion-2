import { CityId } from '../../types';

export type FocusActivityCategory = 'crop' | 'herb' | 'animal' | 'cooking' | 'alchemy';

export interface FocusActivityItem {
  id: string;
  nameEs: string;
  nameEn: string;
  category: FocusActivityCategory;
  tier: number;
  iconName: string;
  cityBonusIds: CityId[];
  isCityBonusActive: boolean;

  // Eficiencia de foco
  fce: number; // Focus Cost Efficiency
  focusCostPerAction: number; // Foco por casilla (plantas/animales) o por lote (crafteo)
  focusCostPerUnit: number; // Foco por unidad final producida
  actionsPer10kFocus: number; // Cantidad de acciones posibles con 10.000 de foco
  plotsOrBatchesPer10kFocus: number; // Parcelas de 9 casillas o lotes de crafteo

  // Métricas de plata
  silverPerFocus: number; // Plata neta ganada por cada 1 punto de foco gastado (Key Metric)
  dailyNetProfitWith10k: number; // Plata neta estimada ganada al gastar los 10.000 de foco en esta actividad
  profitWithoutFocus: number; // Ganancia base de la acción sin gastar foco
  profitWithFocus: number; // Ganancia mejorada de la acción con foco
  extraSilverFromFocus: number; // Diferencia directa atribuible al uso del foco

  // Precios y fuentes
  unitSellPrice: number;
  hasManualPrice: boolean;
  notes: string;
}

export interface FocusOptimizerSummary {
  bestOverall: FocusActivityItem | null;
  bestFarming: FocusActivityItem | null;
  bestCrafting: FocusActivityItem | null;
  topRanked: FocusActivityItem[];
}
