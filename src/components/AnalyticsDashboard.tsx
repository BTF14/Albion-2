import React, { useState, useMemo } from 'react';
import { DailyLogEntry, CityId, PriceMemory } from '../types';
import { CITIES } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import {
  calculateMarketOpportunities,
  MarketOpportunityItem,
  OpportunityCategory,
} from '../utils/analyticsEngine';
import { calculateHistoryAnalytics } from '../domain/use-cases/calculateHistoryAnalytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Zap,
  Coins,
  Award,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  MapPin,
  ArrowRight,
  Info,
  Clock,
  Search,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Wheat,
  Utensils,
  FlaskConical,
  Sprout,
  Package,
  Layers,
  Flame,
} from 'lucide-react';

interface Props {
  logs: DailyLogEntry[];
  priceMemory?: PriceMemory;
  recipePrices?: Record<string, number>;
  currentCityId?: CityId;
  onNavigateToLogger: () => void;
  onNavigateToSimulator?: (itemId: string, cityId?: CityId) => void;
  onNavigateToCrafting?: (recipeId: string) => void;
  onLoadSampleData?: () => void;
}

export const AnalyticsDashboard: React.FC<Props> = ({
  logs,
  priceMemory = {},
  recipePrices = {},
  currentCityId = 'martlock',
  onNavigateToLogger,
  onNavigateToSimulator,
  onNavigateToCrafting,
  onLoadSampleData,
}) => {
  // Pestaña interna: Oportunidades de Mercado vs Ranking de Rotación vs Métricas Históricas
  const [activeSubTab, setActiveSubTab] = useState<
    'opportunities' | 'rotation_ranking' | 'charts'
  >('opportunities');

  // Filtros
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'all' | OpportunityCategory
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'profit' | 'roi' | 'speed' | 'daily'>('profit');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');

  // Modal para detalle de montura o producto
  const [selectedOpportunityModal, setSelectedOpportunityModal] =
    useState<MarketOpportunityItem | null>(null);

  // Calcular la matriz completa de oportunidades
  const opportunitiesSummary = useMemo(() => {
    const activeCity = (selectedCityFilter !== 'all'
      ? selectedCityFilter
      : currentCityId || 'martlock') as CityId;
    return calculateMarketOpportunities(
      logs,
      priceMemory,
      recipePrices,
      activeCity,
      true
    );
  }, [logs, priceMemory, recipePrices, currentCityId, selectedCityFilter]);

  // Lista de oportunidades filtrada y ordenada
  const displayedOpportunities = useMemo(() => {
    let list = [...opportunitiesSummary.allOpportunities];

    // Filtro por categoría
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((item) => item.category === selectedCategoryFilter);
    }

    // Filtro por texto de búsqueda
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.nameEs.toLowerCase().includes(q) ||
          item.productionFacilityEs.toLowerCase().includes(q) ||
          item.categoryLabelEs.toLowerCase().includes(q)
      );
    }

    // Ordenación
    list.sort((a, b) => {
      if (sortBy === 'profit') {
        return b.estimatedNetProfit - a.estimatedNetProfit;
      }
      if (sortBy === 'roi') {
        return b.roiPercent - a.roiPercent;
      }
      if (sortBy === 'daily') {
        return b.profitPerDay22h - a.profitPerDay22h;
      }
      if (sortBy === 'speed') {
        const speedWeight = {
          ultra_fast: 4,
          fast: 3,
          moderate: 2,
          slow_niche: 1,
        };
        return speedWeight[b.rotationSpeed] - speedWeight[a.rotationSpeed];
      }
      return 0;
    });

    return list;
  }, [opportunitiesSummary, selectedCategoryFilter, searchQuery, sortBy]);

  // Logs filtrados para los gráficos históricos
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (selectedCityFilter !== 'all') {
      result = result.filter((l) => l.cityId === selectedCityFilter);
    }
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : 30;
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      result = result.filter((l) => l.timestamp >= cutoffTime);
    }
    return result.sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, timeRange, selectedCityFilter]);

  // Cálculo de analítica histórica mediante caso de uso de dominio desacoplado (Gentleman Programming)
  const historyAnalytics = useMemo(() => {
    return calculateHistoryAnalytics(filteredLogs);
  }, [filteredLogs]);

  const kpis = historyAnalytics.kpis;
  const timelineData = historyAnalytics.timeline;
  const categoryDistributionData = historyAnalytics.categoryDistribution;
  const totalPositiveCategoryProfit = historyAnalytics.totalPositiveProfit;

  // Datos para gráfico de distribución por isla
  const cityDistributionData = useMemo(() => {
    const map: { [cityId: string]: number } = {};
    filteredLogs.forEach((log) => {
      map[log.cityId] = (map[log.cityId] || 0) + Math.max(0, log.netProfit);
    });

    return Object.entries(map).map(([cityId, profit]) => {
      const city = CITIES.find((c) => c.id === cityId);
      return {
        name: city?.name || cityId,
        value: profit,
        color: city?.color || '#f59e0b',
      };
    });
  }, [filteredLogs]);

  const totalPositiveCityProfit = useMemo(() => {
    return cityDistributionData.reduce((sum, item) => sum + item.value, 0);
  }, [cityDistributionData]);

  // Formateador amigable para plata de Albion
  const formatSilver = (val: number) => {
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M 🪙`;
    }
    if (Math.abs(val) >= 10_000) {
      return `${(val / 1_000).toFixed(1)}k 🪙`;
    }
    return `${val.toLocaleString()} 🪙`;
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 2:
        return 'bg-amber-900/60 text-amber-300 border-amber-800';
      case 3:
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
      case 4:
        return 'bg-blue-950/70 text-blue-300 border-blue-800';
      case 5:
        return 'bg-red-950/70 text-red-300 border-red-800';
      case 6:
        return 'bg-amber-950/80 text-amber-300 border-amber-700';
      case 7:
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-700';
      case 8:
        return 'bg-slate-800 text-slate-100 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div id="analytics-dashboard-main" className="space-y-6">
      {/* Cabecera Principal del AnalyticsDashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-900/30">
              <Sparkles size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100 tracking-tight">
                  Analytics & Oportunidades de Mercado
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Inteligencia Económica
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Identifica qué sembrar, cocinar, destilar o criar según rotación real y tus beneficios netos guardados.
              </p>
            </div>
          </div>

          {/* Selector de Ciudad para Filtrar Análisis */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <MapPin size={14} className="text-amber-400" />
            <span className="text-slate-400 font-medium">Ciudad de Referencia:</span>
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">Todas las Islas</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.biome})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Sub-Navegación Interna */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs font-bold">
          <button
            type="button"
            id="subtab-opportunities"
            onClick={() => setActiveSubTab('opportunities')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'opportunities'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles size={15} />
            🚀 Oportunidades de Mercado (Sugerencias Top)
          </button>

          <button
            type="button"
            id="subtab-rotation-ranking"
            onClick={() => setActiveSubTab('rotation_ranking')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'rotation_ranking'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Layers size={15} />
            🔄 Matriz de Rotación vs Margen
          </button>

          <button
            type="button"
            id="subtab-charts"
            onClick={() => setActiveSubTab('charts')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'charts'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 size={15} />
            📈 Métricas Históricas & Gráficos
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: OPORTUNIDADES DE MERCADO (SUGERENCIAS DIRECTAS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Tarjetas de Sugerencias Destacadas por Especialidad */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                  <Award size={18} className="text-amber-400" />
                  Sugerencias Top: ¿Qué Sembrar o Producir Hoy?
                </h3>
                <p className="text-xs text-slate-400">
                  Selección estratégica basada en tus mayores beneficios netos y rotación rápida en el mercado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Mejor Cultivo */}
              {opportunitiesSummary.bestCrop && (
                <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-xl shadow-lg flex flex-col justify-between transition-all space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                        <Wheat size={12} /> Mejor Cultivo
                      </span>
                      <AlbionItemBadge tier={opportunitiesSummary.bestCrop.tier} size="xs" />
                    </div>
                    <h4 className="text-sm font-black text-slate-100">
                      {opportunitiesSummary.bestCrop.nameEs}
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {opportunitiesSummary.bestCrop.productionFacilityEs}
                    </span>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Beneficio Neto:</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums">
                          +{formatSilver(opportunitiesSummary.bestCrop.estimatedNetProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Retorno ROI:</span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">
                          +{opportunitiesSummary.bestCrop.roiPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Velocidad:</span>
                        <span className="font-bold text-emerald-400">
                          {opportunitiesSummary.bestCrop.saleTimeEst}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToSimulator) {
                        onNavigateToSimulator(opportunitiesSummary.bestCrop!.id);
                      } else {
                        onNavigateToLogger();
                      }
                    }}
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    Sembrar / Simular <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* 2. Mejor Hierba */}
              {opportunitiesSummary.bestHerb && (
                <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-xl shadow-lg flex flex-col justify-between transition-all space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                        <Sprout size={12} /> Mejor Hierba
                      </span>
                      <AlbionItemBadge tier={opportunitiesSummary.bestHerb.tier} size="xs" />
                    </div>
                    <h4 className="text-sm font-black text-slate-100">
                      {opportunitiesSummary.bestHerb.nameEs}
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {opportunitiesSummary.bestHerb.productionFacilityEs}
                    </span>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Beneficio Neto:</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums">
                          +{formatSilver(opportunitiesSummary.bestHerb.estimatedNetProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Retorno ROI:</span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">
                          +{opportunitiesSummary.bestHerb.roiPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Velocidad:</span>
                        <span className="font-bold text-sky-400">
                          {opportunitiesSummary.bestHerb.saleTimeEst}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToSimulator) {
                        onNavigateToSimulator(opportunitiesSummary.bestHerb!.id);
                      } else {
                        onNavigateToLogger();
                      }
                    }}
                    className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    Plantar en Jardín <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* 3. Mejor Comida */}
              {opportunitiesSummary.bestFood && (
                <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-xl shadow-lg flex flex-col justify-between transition-all space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                        <Utensils size={12} /> Mejor Comida
                      </span>
                      <AlbionItemBadge tier={opportunitiesSummary.bestFood.tier} size="xs" />
                    </div>
                    <h4 className="text-sm font-black text-slate-100">
                      {opportunitiesSummary.bestFood.nameEs}
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {opportunitiesSummary.bestFood.productionFacilityEs}
                    </span>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Beneficio / Lote:</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums">
                          +{formatSilver(opportunitiesSummary.bestFood.estimatedNetProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Retorno ROI:</span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">
                          +{opportunitiesSummary.bestFood.roiPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Velocidad:</span>
                        <span className="font-bold text-emerald-400">
                          {opportunitiesSummary.bestFood.saleTimeEst}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToCrafting && opportunitiesSummary.bestFood?.targetRecipeId) {
                        onNavigateToCrafting(opportunitiesSummary.bestFood.targetRecipeId);
                      }
                    }}
                    className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    Cocinar Receta <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* 4. Mejor Poción */}
              {opportunitiesSummary.bestPotion && (
                <div className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-3.5 rounded-xl shadow-lg flex flex-col justify-between transition-all space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-sky-400 flex items-center gap-1">
                        <FlaskConical size={12} /> Mejor Poción
                      </span>
                      <AlbionItemBadge tier={opportunitiesSummary.bestPotion.tier} size="xs" />
                    </div>
                    <h4 className="text-sm font-black text-slate-100">
                      {opportunitiesSummary.bestPotion.nameEs}
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {opportunitiesSummary.bestPotion.productionFacilityEs}
                    </span>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Beneficio / Lote:</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums">
                          +{formatSilver(opportunitiesSummary.bestPotion.estimatedNetProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Retorno ROI:</span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">
                          +{opportunitiesSummary.bestPotion.roiPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Velocidad:</span>
                        <span className="font-bold text-sky-400">
                          {opportunitiesSummary.bestPotion.saleTimeEst}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToCrafting && opportunitiesSummary.bestPotion?.targetRecipeId) {
                        onNavigateToCrafting(opportunitiesSummary.bestPotion.targetRecipeId);
                      }
                    }}
                    className="w-full py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    Destilar Poción <ArrowRight size={12} />
                  </button>
                </div>
              )}

              {/* 5. Mejor Montura */}
              {opportunitiesSummary.bestMount && (
                <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-3.5 rounded-xl shadow-lg flex flex-col justify-between transition-all space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-1">
                        <Package size={12} /> Mejor Montura
                      </span>
                      <AlbionItemBadge tier={opportunitiesSummary.bestMount.tier} size="xs" />
                    </div>
                    <h4 className="text-sm font-black text-slate-100">
                      {opportunitiesSummary.bestMount.nameEs}
                    </h4>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {opportunitiesSummary.bestMount.productionFacilityEs}
                    </span>

                    <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Plata / Día (22h):</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums">
                          +{formatSilver(opportunitiesSummary.bestMount.profitPerDay22h)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Beneficio Neto:</span>
                        <span className="font-mono font-bold text-emerald-300 tabular-nums">
                          +{formatSilver(opportunitiesSummary.bestMount.estimatedNetProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Velocidad:</span>
                        <span className="font-bold text-purple-400">
                          {opportunitiesSummary.bestMount.saleTimeEst}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOpportunityModal(opportunitiesSummary.bestMount)}
                    className="w-full py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    Ver Ficha de Crianza <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filtros Avanzados y Buscador del Radar de Oportunidades */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Filtros de Categoría */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-bold mr-1">Filtrar:</span>
              {([
                { id: 'all', label: 'Todos' },
                { id: 'crop', label: '🌾 Cultivos' },
                { id: 'herb', label: '🌿 Hierbas' },
                { id: 'food', label: '🍲 Comida' },
                { id: 'potion', label: '🧪 Pociones' },
                { id: 'mount', label: '🐎 Monturas' },
              ] as const).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Selector de Orden y Buscador */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                <Search size={13} className="text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar producto o montura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-slate-200 placeholder-slate-500 text-xs focus:outline-none w-36 sm:w-48"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'profit' | 'roi' | 'speed' | 'daily')}
                  className="bg-slate-900 text-slate-200 font-bold rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                >
                  <option value="profit">Mayor Beneficio Neto (🪙)</option>
                  <option value="roi">Mayor Margen (ROI %)</option>
                  <option value="speed">Mayor Rotación (Salida ⚡)</option>
                  <option value="daily">Mayor Plata / Día (22h)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla / Grid de Oportunidades de Mercado */}
          <div className="space-y-3">
            {displayedOpportunities.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
                <p className="text-slate-400 text-sm font-semibold">
                  No se encontraron oportunidades con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedOpportunities.map((op) => (
                  <div
                    key={op.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl shadow-lg flex flex-col justify-between space-y-3 transition-all"
                  >
                    {/* Cabecera de la Oportunidad */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 shrink-0">
                            <ItemIcon name={op.iconName} size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <AlbionItemBadge tier={op.tier} size="xs" />
                              <h4 className="text-sm font-bold text-slate-100 truncate">
                                {op.nameEs}
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {op.productionFacilityEs}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${op.quadrantBadgeClass}`}
                        >
                          {op.rotationSpeedLabelEs}
                        </span>
                      </div>

                      {/* Métricas Financieras Clave */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">Beneficio Neto:</span>
                          <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                            +{formatSilver(op.estimatedNetProfit)}
                          </span>
                          <span className="text-[9px] text-slate-500 block truncate">
                            {op.profitUnitLabelEs}
                          </span>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 block">Margen de Retorno:</span>
                          <span className="font-mono font-bold text-sm text-emerald-300 tabular-nums">
                            +{op.roiPercent}% ROI
                          </span>
                          <span className="text-[9px] text-slate-500 block">
                            Sobre inversión
                          </span>
                        </div>
                      </div>

                      {/* Datos de Rotación y Demanda */}
                      <div className="mt-2.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/40 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Tiempo de Venta:</span>
                          <span className="font-bold text-slate-200">{op.saleTimeEst}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="text-slate-400">Demanda Estimada:</span>
                          <span className="font-mono text-slate-200">{op.dailyDemandEst}</span>
                        </div>
                        {op.recommendedCityNameEs && (
                          <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/50">
                            <span className="text-slate-400">Bono Recomendado:</span>
                            <span className="font-bold text-amber-300">{op.recommendedCityNameEs}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-2">
                        💡 {op.strategicTip}
                      </p>
                    </div>

                    {/* Botón de Acción según el tipo */}
                    <div className="pt-2 border-t border-slate-800">
                      {op.actionType === 'simulator' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToSimulator) {
                              onNavigateToSimulator(op.id);
                            } else {
                              onNavigateToLogger();
                            }
                          }}
                          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                        >
                          Simular Cosecha & Retorno <ArrowRight size={13} />
                        </button>
                      )}

                      {op.actionType === 'crafting' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToCrafting && op.targetRecipeId) {
                              onNavigateToCrafting(op.targetRecipeId);
                            }
                          }}
                          className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                        >
                          Calcular en Cocina / Alquimia <ArrowRight size={13} />
                        </button>
                      )}

                      {op.actionType === 'mount_info' && (
                        <button
                          type="button"
                          onClick={() => setSelectedOpportunityModal(op)}
                          className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                        >
                          Ver Guía de Crianza & Ensillado <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MATRIZ DE ROTACIÓN VS MARGEN */}
      {/* ========================================================================= */}
      {activeSubTab === 'rotation_ranking' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 uppercase tracking-wide">
              <Layers size={18} className="text-amber-400" />
              Matriz de Rotación de Capital vs Margen de Beneficio
            </h3>
            <p className="text-xs text-slate-400">
              Comprende el equilibrio entre fabricar ítems masivos que se venden en 1 hora vs productos de lujo que tardan días en salir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/60 space-y-1">
                <span className="text-xs font-black text-emerald-400 block">
                  🏆 Oro Líquido
                </span>
                <p className="text-[11px] text-slate-400">
                  Alto beneficio neto + Venta ultrarrápida. Los mejores ítems para reinvertir todo tu foco y capital.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-sky-900/60 space-y-1">
                <span className="text-xs font-black text-sky-400 block">
                  ⚡ Pan Caliente (Flujo Rápido)
                </span>
                <p className="text-[11px] text-slate-400">
                  Margen moderado pero salida en 1 a 3 horas. Mueve millones de plata al día sin riesgo de devaluación.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-900/60 space-y-1">
                <span className="text-xs font-black text-purple-400 block">
                  💎 Mercado de Nicho / Lujo
                </span>
                <p className="text-[11px] text-slate-400">
                  Margen altísimo unitario pero venta lenta (3 a 7 días). Fabrica solo lotes pequeños.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-rose-900/60 space-y-1">
                <span className="text-xs font-black text-rose-400 block">
                  ⚠️ Riesgo / Estancamiento
                </span>
                <p className="text-[11px] text-slate-400">
                  Poco margen y rotación lenta. No compensa congelar plata ni ocupar slots de venta.
                </p>
              </div>
            </div>
          </div>

          {/* Tabla Completa de Clasificación */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Producto / Actividad</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5 text-right">Beneficio Neto</th>
                    <th className="p-3.5 text-right">Margen ROI</th>
                    <th className="p-3.5 text-right">Plata / Día (22h)</th>
                    <th className="p-3.5 text-center">Velocidad</th>
                    <th className="p-3.5">Tiempo Est. Venta</th>
                    <th className="p-3.5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedOpportunities.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <AlbionItemBadge tier={op.tier} size="xs" />
                          <div>
                            <span className="font-bold text-slate-200 block">{op.nameEs}</span>
                            <span className="text-[10px] text-slate-400 block">
                              {op.productionFacilityEs}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-300 font-medium">{op.categoryLabelEs}</span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        +{formatSilver(op.estimatedNetProfit)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-300 tabular-nums">
                        +{op.roiPercent}%
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-amber-300 tabular-nums">
                        +{formatSilver(op.profitPerDay22h)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${op.quadrantBadgeClass}`}
                        >
                          {op.rotationSpeedLabelEs}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                        {op.saleTimeEst}
                      </td>
                      <td className="p-3.5 text-center">
                        {op.actionType === 'crafting' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToCrafting && op.targetRecipeId) {
                                onNavigateToCrafting(op.targetRecipeId);
                              }
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                          >
                            Cocinar
                          </button>
                        ) : op.actionType === 'mount_info' ? (
                          <button
                            type="button"
                            onClick={() => setSelectedOpportunityModal(op)}
                            className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                          >
                            Crianza
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToSimulator) {
                                onNavigateToSimulator(op.id);
                              } else {
                                onNavigateToLogger();
                              }
                            }}
                            className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                          >
                            Sembrar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: MÉTRICAS HISTÓRICAS Y GRÁFICOS */}
      {/* ========================================================================= */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          {/* Tarjetas KPI de Rendimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins size={14} className="text-amber-400" /> Beneficio Neto Histórico
              </span>
              <div
                className={`text-2xl font-black font-mono tabular-nums ${
                  kpis.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {kpis.totalNetProfit >= 0 ? '+' : ''}
                {formatSilver(kpis.totalNetProfit)}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="tabular-nums">Ingresos: {formatSilver(kpis.totalGrossRevenue)}</span>
                <span className="text-rose-400 tabular-nums">Costes: {formatSilver(kpis.totalCosts)}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-400" /> Retorno (ROI) & Margen
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
                  +{kpis.averageROI}%
                </span>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  (Margen: {kpis.netMarginPercentage}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                Ganancia neta sobre inversión en semillas, crías e insumos.
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" /> Eficiencia de Foco
              </span>
              <div className="text-2xl font-black font-mono text-amber-300 tabular-nums">
                {kpis.averageSilverPerFocus} 🪙/⚡
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="tabular-nums">{kpis.focusUsageCount} cosechas regadas</span>
                <span className="text-emerald-400 font-bold">
                  {kpis.averageSilverPerFocus >= 30 ? '🚀 Alta' : 'Aceptable'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-amber-400" /> Mayor Generador
              </span>
              <div className="text-lg font-black text-slate-100 truncate">
                {kpis.bestItem?.name || 'N/A'}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-emerald-400 font-mono font-bold tabular-nums">
                  +{formatSilver(kpis.bestItem?.profit || 0)}
                </span>
                <span className="tabular-nums">{kpis.bestItem?.count || 0} registros</span>
              </div>
            </div>
          </div>

          {/* Gráficos de Evolución y Distribuciones */}
          <div className="space-y-6">
            {/* Fila 1: Evolución Diaria (Ancho Completo) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <LineIcon size={16} className="text-emerald-400" />
                    Evolución Diaria: Beneficio Neto vs Costos
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Historial de plata neta ganada en comparación con la inversión requerida.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 self-start sm:self-auto tabular-nums">
                  Promedio: {formatSilver(kpis.avgDailyProfit)} / día
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="costsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      formatter={(val: unknown) => [`${Number(val || 0).toLocaleString()} 🪙`, '']}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      formatter={(value) => (value === 'netProfit' ? 'Beneficio Neto (🪙)' : 'Costos Totales (🪙)')}
                    />
                    <Area
                      type="monotone"
                      dataKey="netProfit"
                      name="netProfit"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#profitGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="costs"
                      name="costs"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#costsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fila 2: Distribuciones lado a lado (Categorías vs Islas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribución por Categoría de Actividad Económica */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Layers size={16} className="text-emerald-400" />
                    Beneficio por Categoría
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Distribución de ganancias entre cultivos, hierbas y productos de granja.
                  </p>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  {categoryDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="profit"
                          nameKey="label"
                        >
                          {categoryDistributionData.map((entry, index) => (
                            <Cell key={`cat-cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: unknown) => [`${Number(val || 0).toLocaleString()} 🪙`, 'Ganancia']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-500">Sin datos registrados aún</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  {categoryDistributionData.map((c) => (
                    <div key={c.category} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-300 truncate">{c.label}:</span>
                      <span className="font-mono font-bold text-slate-100 ml-auto">
                        {c.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distribución por Isla / Ciudad */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <PieIcon size={16} className="text-amber-400" />
                    Beneficio por Isla / Ciudad
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Distribución porcentual de plata generada en cada bioma insular.
                  </p>
                </div>

                <div className="h-56 w-full flex items-center justify-center">
                  {cityDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={cityDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {cityDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: unknown) => [`${Number(val || 0).toLocaleString()} 🪙`, 'Ganancia']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-slate-500">Sin datos registrados aún</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  {cityDistributionData.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-slate-300 truncate">{c.name}:</span>
                      <span className="font-mono font-bold text-slate-100 ml-auto">
                        {totalPositiveCityProfit > 0
                          ? Math.round((c.value / totalPositiveCityProfit) * 100)
                          : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETALLE DE MONTURA / OPORTUNIDAD */}
      {/* ========================================================================= */}
      {selectedOpportunityModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlbionItemBadge tier={selectedOpportunityModal.tier} size="sm" />
                  <h3 className="text-base font-black text-slate-100">
                    {selectedOpportunityModal.nameEs}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 mt-0.5 block">
                  {selectedOpportunityModal.productionFacilityEs}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpportunityModal(null)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400 text-xs">
                  Mecánica Oficial de Producción en Albion Online:
                </h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedOpportunityModal.strategicTip}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Tiempo de Venta Estimado:</span>
                    <strong className="text-slate-200 font-mono">
                      {selectedOpportunityModal.saleTimeEst}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Demanda de la Ciudad:</span>
                    <strong className="text-slate-200 font-mono">
                      {selectedOpportunityModal.dailyDemandEst}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Beneficio Neto:</span>
                  <span className="font-mono font-bold text-base text-emerald-400 tabular-nums">
                    +{selectedOpportunityModal.estimatedNetProfit.toLocaleString()} 🪙
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {selectedOpportunityModal.profitUnitLabelEs}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Retorno sobre Inversión:</span>
                  <span className="font-mono font-bold text-base text-emerald-300 tabular-nums">
                    +{selectedOpportunityModal.roiPercent}% ROI
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Margen de ganancia neta
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOpportunityModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
