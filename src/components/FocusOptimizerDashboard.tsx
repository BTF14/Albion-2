import React from 'react';
import { CityId, PriceMemory } from '../types';
import { useFocusOptimizer, FocusSortOption } from '../hooks/useFocusOptimizer';
import { ItemIcon } from './ItemIcon';
import {
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  Award,
  Sliders,
  AlertCircle,
  HelpCircle,
  Wheat,
  Utensils,
  FlaskConical,
  Sprout,
  CheckCircle2,
  Coins,
  RotateCcw,
} from 'lucide-react';
import { CITIES } from '../data/items';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface FocusOptimizerDashboardProps {
  currentCityId: CityId;
  priceMemory: PriceMemory;
  recipePrices?: Record<string, number>;
  dailyBonusCookingRRR?: number;
  dailyBonusAlchemyRRR?: number;
  activeCharacterFocus?: number;
  activeCharacterName?: string;
  onOpenCharacterModal?: () => void;
  onNavigateToLogger?: (itemId: string) => void;
  onNavigateToValueAdded?: (recipeId: string) => void;
  onNavigateToMastery?: () => void;
  onSelectCity?: (city: CityId) => void;
}

export const FocusOptimizerDashboard: React.FC<FocusOptimizerDashboardProps> = ({
  currentCityId,
  priceMemory,
  recipePrices,
  dailyBonusCookingRRR = 0,
  dailyBonusAlchemyRRR = 0,
  activeCharacterFocus,
  activeCharacterName,
  onOpenCharacterModal,
  onNavigateToLogger,
  onNavigateToValueAdded,
  onNavigateToMastery,
  onSelectCity,
}) => {
  const {
    dailyFocus,
    setDailyFocus,
    selectedCategory,
    setSelectedCategory,
    selectedTier,
    setSelectedTier,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    summary,
    filteredActivities,
  } = useFocusOptimizer({
    currentCityId,
    priceMemory,
    recipePrices,
    dailyBonusCookingRRR,
    dailyBonusAlchemyRRR,
  });

  // Ciclo de cálculo oficial con botón "Dar Resultado"
  const [hasCalculated, setHasCalculated] = React.useState<boolean>(false);
  const [isStale, setIsStale] = React.useState<boolean>(false);

  const handleFocusChange = (val: number) => {
    setDailyFocus(val);
    if (hasCalculated) setIsStale(true);
  };

  const handleCategoryChange = (cat: typeof selectedCategory) => {
    setSelectedCategory(cat);
    if (hasCalculated) setIsStale(true);
  };

  const handleTierChange = (t: typeof selectedTier) => {
    setSelectedTier(t);
    if (hasCalculated) setIsStale(true);
  };

  const handleSortChange = (s: typeof sortBy) => {
    setSortBy(s);
    if (hasCalculated) setIsStale(true);
  };

  const handleCalculate = () => {
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  const currentCity = CITIES.find((c) => c.id === currentCityId) || CITIES[0];
  const best = summary.bestOverall;

  return (
    <div className="space-y-6">
      {/* Header & Banner Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-900/40 shrink-0">
              <Zap size={26} className="fill-slate-950 stroke-none" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
                  Optimizador de Foco Diario
                </h2>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ¿En qué gastar mi foco hoy?
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Calcula automáticamente la <strong className="text-amber-400 font-semibold">Plata neta ganada por cada Punto de Foco (Plata / Foco)</strong>{' '}
                usando tus precios de mercado guardados y tu nivel de maestría en la Tabla del Destino.
              </p>
            </div>
          </div>

          {/* Selector de Puntos de Foco a Simular */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Foco a Simular:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-400">{dailyFocus.toLocaleString()} pts</span>
                {typeof activeCharacterFocus === 'number' && (
                  <button
                    type="button"
                    onClick={() => handleFocusChange(Math.min(30000, Math.max(1000, activeCharacterFocus)))}
                    className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded cursor-pointer font-bold"
                    title={`Usar foco actual de ${activeCharacterName || 'tu personaje'}: ${activeCharacterFocus.toLocaleString()} pts`}
                  >
                    Usar Alt ({activeCharacterFocus.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1000}
                max={30000}
                step={1000}
                value={dailyFocus}
                onChange={(e) => handleFocusChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
            <div className="flex justify-between gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => handleFocusChange(10000)}
                className={`px-2 py-0.5 rounded border ${
                  dailyFocus === 10000
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                10k (1 día)
              </button>
              <button
                type="button"
                onClick={() => handleFocusChange(20000)}
                className={`px-2 py-0.5 rounded border ${
                  dailyFocus === 20000
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                20k (2 días)
              </button>
              <button
                type="button"
                onClick={() => handleFocusChange(30000)}
                className={`px-2 py-0.5 rounded border ${
                  dailyFocus === 30000
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                30k (Tope)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Control de Cálculo Oficial "Dar Resultado" */}
      <div className="bg-slate-900 border border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {hasCalculated ? (isStale ? 'Parámetros Modificados' : 'Ranking de Foco Calculado') : 'Listo para Calcular'}
            </div>
            <div className="text-[11px] text-slate-400">
              {hasCalculated
                ? isStale
                  ? 'Cambiaste el foco o filtros. Presiona el botón para recalcular el ranking.'
                  : 'Ranking de rentabilidad optimizado para tus puntos de foco.'
                : 'Presiona "Dar Resultado" para calcular el ranking de tus actividades.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {hasCalculated && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Limpiar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCalculate}
            className={`w-full sm:w-auto px-5 py-2.5 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              !hasCalculated
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/50'
                : isStale
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>
              {!hasCalculated
                ? 'Dar Resultado / Optimizar Foco Diario'
                : isStale
                ? 'Recalcular con Nuevos Parámetros'
                : 'Resultado Actualizado ✓'}
            </span>
          </button>
        </div>
      </div>

      {!hasCalculated ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <Zap size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-200">Listo para Optimizar tus {dailyFocus.toLocaleString()} Puntos de Foco</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configura arriba la cantidad de foco diario a simular y presiona el botón{' '}
              <strong className="text-amber-400">"Dar Resultado / Optimizar Foco Diario"</strong> para calcular el ranking de rentabilidad neta por punto de foco (Plata / Foco) basado 100% en tus precios manuales.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCalculate}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={16} />
            <span>Calcular Ranking de Foco Ahora</span>
          </button>
        </div>
      ) : (
        <>

      {/* Alerta de Bono Diario de Producción Activo en Focus Optimizer */}
      {(dailyBonusCookingRRR > 0 || dailyBonusAlchemyRRR > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Bono Diario de Producción Aplicado:</strong> Las recetas de{' '}
              {dailyBonusCookingRRR > 0 && <span className="font-bold text-amber-300">Cocina (+{dailyBonusCookingRRR}% RRR)</span>}
              {dailyBonusCookingRRR > 0 && dailyBonusAlchemyRRR > 0 && ' y '}
              {dailyBonusAlchemyRRR > 0 && <span className="font-bold text-amber-300">Alquimia (+{dailyBonusAlchemyRRR}% RRR)</span>}
              {' '}tienen su rendimiento y Plata/Foco aumentados según el evento del día.
            </span>
          </div>
        </div>
      )}

      {/* Tarjetas de Recomendación Top */}
      {best && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Opción #1 Global */}
          <div className="md:col-span-2 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3">
              <span className="inline-block bg-amber-500 text-slate-950 text-xs font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-md">
                ⭐ Opción Más Rentable Hoy
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 sm:mt-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                  <ItemIcon name={best.iconName} size={36} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <AlbionItemBadge tier={best.tier} />
                    <h3 className="text-lg font-black text-slate-100">{best.nameEs}</h3>
                  </div>
                  <p className="text-xs text-slate-400 italic">{best.nameEn}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {best.category === 'crop'
                        ? '🌱 Cultivo Agrícola'
                        : best.category === 'herb'
                        ? '🌿 Jardín de Hierbas'
                        : best.category === 'animal'
                        ? '🐮 Pastizal de Animales'
                        : best.category === 'cooking'
                        ? '🍲 Cocina (Caerleon)'
                        : '🧪 Alquimia (Brecilien)'}
                    </span>
                    {best.isCityBonusActive && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-700/50">
                        {currentCity.name} (+10% Bono)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:items-end bg-slate-950/60 border border-amber-500/30 p-3 rounded-lg w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-medium">Rentabilidad Neta por Foco</span>
                <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
                  +{best.silverPerFocus} <span className="text-sm font-normal text-slate-400">🪙/foco</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Ganancia diaria con {dailyFocus.toLocaleString()} foco:{' '}
                  <strong className="text-slate-100 font-bold font-mono tabular-nums">
                    +{formatSilver(best.dailyNetProfitWith10k)} 🪙
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Coste de Foco:</span>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  {best.focusCostPerAction} pts / {best.category === 'cooking' || best.category === 'alchemy' ? 'lote' : 'casilla'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Capacidad Diaria:</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  {best.category === 'cooking' || best.category === 'alchemy'
                    ? `${best.actionsPer10kFocus} lotes`
                    : `${best.plotsOrBatchesPer10kFocus} parcelas (${best.actionsPer10kFocus} casillas)`}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Sin Foco vs Con Foco:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  +{formatSilver(best.extraSilverFromFocus)} 🪙 extra
                </span>
              </div>
              <div className="flex items-center justify-end">
                {best.category === 'cooking' || best.category === 'alchemy' ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToValueAdded && onNavigateToValueAdded(best.id)}
                    className="w-full h-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    <span>Ir a Elaborar</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigateToLogger && onNavigateToLogger(best.id)}
                    className="w-full h-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    <span>Ir a Cosechar</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opciones Secundarias (Mejor Campo vs Mejor Taller) */}
          <div className="space-y-3">
            {summary.bestFarming && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sprout size={14} /> Mejor en Islas / Granja
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400 tabular-nums">
                    +{summary.bestFarming.silverPerFocus} 🪙/foco
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                    <ItemIcon name={summary.bestFarming.iconName} size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <AlbionItemBadge tier={summary.bestFarming.tier} />
                      <span>{summary.bestFarming.nameEs}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {summary.bestFarming.plotsOrBatchesPer10kFocus} parcelas posibles
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToLogger && onNavigateToLogger(summary.bestFarming!.id)}
                  className="w-full mt-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Ver en Registro</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}

            {summary.bestCrafting && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Utensils size={14} /> Mejor en Cocina / Pociones
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400 tabular-nums">
                    +{summary.bestCrafting.silverPerFocus} 🪙/foco
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                    <ItemIcon name={summary.bestCrafting.iconName} size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <AlbionItemBadge tier={summary.bestCrafting.tier} />
                      <span>{summary.bestCrafting.nameEs}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {summary.bestCrafting.actionsPer10kFocus} lotes posibles
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToValueAdded && onNavigateToValueAdded(summary.bestCrafting!.id)}
                  className="w-full mt-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Ver Receta</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controles y Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filtros por Categoría */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todas ({summary.topRanked.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('crop')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'crop'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Wheat size={14} /> Cultivos
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('herb')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'herb'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sprout size={14} /> Hierbas
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('animal')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'animal'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            🐮 Animales
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('cooking')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'cooking'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Utensils size={14} /> Cocina
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('alchemy')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              selectedCategory === 'alchemy'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FlaskConical size={14} /> Alquimia
          </button>
        </div>

        {/* Buscador y Ordenamiento */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar actividad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as FocusSortOption)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="silverPerFocus">Mayor Plata/Foco</option>
            <option value="dailyProfit">Mayor Ganancia con {dailyFocus.toLocaleString()}</option>
            <option value="tier">Nivel Tier</option>
            <option value="focusCost">Menor Costo de Foco</option>
          </select>
        </div>
      </div>

      {/* Tabla de Clasificación de Actividades */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Rank</th>
                <th className="py-3 px-3">Actividad / Ítem</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3 text-right">Costo Foco</th>
                <th className="py-3 px-3 text-right">Capacidad ({dailyFocus.toLocaleString()})</th>
                <th className="py-3 px-3 text-right">Plata / Foco</th>
                <th className="py-3 px-3 text-right">Ganancia Diaria</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No se encontraron actividades que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act, index) => {
                  const isTop3 = index < 3;
                  const isCraft = act.category === 'cooking' || act.category === 'alchemy';

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        index === 0 ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Ranking */}
                      <td className="py-3 px-3 text-center font-bold">
                        {index === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black shadow">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 text-xs font-black">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-slate-100 text-xs font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">#{index + 1}</span>
                        )}
                      </td>

                      {/* Nombre e Icono */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
                            <ItemIcon name={act.iconName} size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <AlbionItemBadge tier={act.tier} />
                              <span className="font-bold text-slate-200">{act.nameEs}</span>
                              {act.isCityBonusActive && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800">
                                  +10% Bono
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block">{act.nameEn}</span>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                          {act.category === 'crop'
                            ? '🌱 Cultivo'
                            : act.category === 'herb'
                            ? '🌿 Hierba'
                            : act.category === 'animal'
                            ? '🐮 Ganado'
                            : act.category === 'cooking'
                            ? '🍲 Cocina'
                            : '🧪 Alquimia'}
                        </span>
                      </td>

                      {/* Costo Foco */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="text-slate-200 font-semibold">{act.focusCostPerAction} pts</span>
                        <span className="text-[10px] text-slate-500 block">
                          por {isCraft ? 'lote' : 'casilla'}
                        </span>
                      </td>

                      {/* Capacidad con 10k */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="text-amber-400 font-bold">
                          {isCraft ? `${act.actionsPer10kFocus} lotes` : `${act.plotsOrBatchesPer10kFocus} parc.`}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {isCraft ? 'producción' : `${act.actionsPer10kFocus} casillas`}
                        </span>
                      </td>

                      {/* Plata / Foco (MÉTRICA REINA) */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span
                          className={`text-sm font-black ${
                            act.silverPerFocus > 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          +{act.silverPerFocus}{' '}
                          <span className="text-[10px] font-normal text-slate-400">🪙/pt</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          +{formatSilver(act.extraSilverFromFocus)} 🪙 extra
                        </span>
                      </td>

                      {/* Ganancia Diaria Total con 10k */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <span className="text-xs font-black text-slate-100">
                          +{formatSilver(act.dailyNetProfitWith10k)} 🪙
                        </span>
                        <span className="text-[10px] text-emerald-500/80 block">
                          neto diario
                        </span>
                      </td>

                      {/* Botón de Acción */}
                      <td className="py-3 px-3 text-center">
                        {isCraft ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToValueAdded && onNavigateToValueAdded(act.id)}
                            className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold px-2.5 py-1 rounded text-[11px] transition-colors"
                          >
                            Elaborar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigateToLogger && onNavigateToLogger(act.id)}
                            className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold px-2.5 py-1 rounded text-[11px] transition-colors"
                          >
                            Sembrar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Pie de Explicación de Fórmulas y Mecánicas de Albion */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <HelpCircle size={15} className="text-amber-400" />
          <span>¿Cómo calcula Albion Online el rendimiento de tu foco?</span>
        </div>
        <p>
          1. <strong>Fórmula Oficial de Foco</strong>: El coste base (1.000 pts en cultivos o el foco base de recetas) se reduce con tu Eficiencia de Coste de Foco (FCE):{' '}
          <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">
            Coste = CosteBase × 0.5^(FCE / 10.000)
          </code>. Con maestría 100/100, el coste baja hasta un mínimo de 125 puntos por casilla.
        </p>
        <p>
          2. <strong>Métrica Plata / Foco</strong>: Representa cuánta plata extra ganas exclusivamente gracias al gasto de foco (recuperación de semillas en agricultura, retorno del 47.9% en Caerleon/Brecilien en cocina/alquimia).
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToMastery}
            className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Ver y configurar tu nivel en la Tabla del Destino</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
