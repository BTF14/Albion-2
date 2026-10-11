import React, { useState, useMemo } from 'react';
import {
  Zap,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  Gauge,
  Flame,
  Award,
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  Layers,
  Search,
  Scale,
  Compass,
} from 'lucide-react';
import { AlbionRecipe, EnchantmentLevel, PriceMemory, DestinyMasteryProfile } from '../types';
import { RECIPES } from '../data/recipes';
import { ItemIcon } from './ItemIcon';
import {
  evaluateMarketVelocity,
  TurnoverSpeed,
  OpportunityQuadrant,
  CalculatedMarketVelocity,
  RECIPE_MARKET_PROFILES,
} from '../utils/marketVelocity';
import { calculateRecipeFocusCost } from '../utils/destinyBoard';
import { getSuggestedEnchantedPrice } from '../utils/enchantments';

interface MarketVelocityRadarProps {
  recipePrices: Record<string, number>;
  priceMemory: PriceMemory;
  masteryProfile: DestinyMasteryProfile;
  hasPremium: boolean;
  onSelectRecipeAndLevel: (recipe: AlbionRecipe, level: EnchantmentLevel) => void;
  onOpenComparatorForRecipe: (recipe: AlbionRecipe) => void;
}

export const MarketVelocityRadar: React.FC<MarketVelocityRadarProps> = ({
  recipePrices,
  priceMemory,
  masteryProfile,
  hasPremium,
  onSelectRecipeAndLevel,
  onOpenComparatorForRecipe,
}) => {
  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cooking' | 'alchemy'>('all');
  const [selectedQuadrant, setSelectedQuadrant] = useState<'all' | OpportunityQuadrant>('all');
  const [selectedSpeed, setSelectedSpeed] = useState<'all' | TurnoverSpeed>('all');
  const [targetLevel, setTargetLevel] = useState<EnchantmentLevel>(0);
  const [sortBy, setSortBy] = useState<'liquidity' | 'real_velocity_silver' | 'profit' | 'roi'>('liquidity');

  // Simulador de tamaño de lote interactivo
  const [simulatedBatches, setSimulatedBatches] = useState<number>(20);

  const marketTaxRate = hasPremium ? 0.065 : 0.105;

  // Evaluar cada receta con los precios guardados del usuario
  const analyzedProducts = useMemo(() => {
    return RECIPES.map((recipe) => {
      // Precio de venta guardado para el nivel seleccionado
      const priceKey = `${recipe.id}_enc_${targetLevel}`;
      const sellUnitPrice =
        recipePrices[priceKey] ??
        getSuggestedEnchantedPrice(recipe.defaultSellPrice, recipe.category, targetLevel);

      // Estimación del coste de materias primas con RRR promedio de ciudad Caerleon/Brecilien (24.8%)
      const rrrFactor = 1 - 0.248;
      let rawCostPerBatch = 0;
      recipe.ingredients.forEach((ing) => {
        const mem = priceMemory[ing.itemId];
        const unitCost =
          mem?.lastProductPrice && mem.lastProductPrice > 0
            ? mem.lastProductPrice
            : mem?.sellPrice && mem.sellPrice > 0
            ? mem.sellPrice
            : mem?.buyPrice && mem.buyPrice > 0
            ? mem.buyPrice
            : ing.defaultUnitPrice || 100;
        rawCostPerBatch += ing.amount * unitCost * rrrFactor;
      });

      // Añadir coste estimado de salsa/extracto si es .1, .2, .3
      if (targetLevel > 0) {
        if (recipe.category === 'cooking') {
          const sauceCost = targetLevel === 1 ? 1200 : targetLevel === 2 ? 3600 : 11000;
          rawCostPerBatch += recipe.outputAmount * sauceCost;
        } else {
          const extractCost = targetLevel === 1 ? 1400 : targetLevel === 2 ? 4200 : 12500;
          rawCostPerBatch += recipe.outputAmount * extractCost;
        }
      }

      // Ingresos netos por lote
      const grossRevenue = sellUnitPrice * recipe.outputAmount;
      const netRevenue = grossRevenue * (1 - marketTaxRate);
      const netProfitPerBatch = Math.round(netRevenue - rawCostPerBatch);
      const profitPerUnit = Math.round(netProfitPerBatch / recipe.outputAmount);
      const roiPercent = rawCostPerBatch > 0 ? Math.round((netProfitPerBatch / rawCostPerBatch) * 100) : 0;

      // Foco
      const focusCostResult = calculateRecipeFocusCost(recipe, masteryProfile);
      const silverPerFocus =
        focusCostResult.actualFocusCostPerBatch > 0
          ? Math.round(netProfitPerBatch / focusCostResult.actualFocusCostPerBatch)
          : 0;

      // Evaluación de Velocidad y Liquidez
      const velocityMetrics = evaluateMarketVelocity(
        recipe,
        targetLevel,
        profitPerUnit,
        roiPercent
      );

      // Retorno Real Ponderado por Velocidad (Capital Turnover Silver Rate)
      // Si rota en 2h (12 veces/día), el beneficio se multiplica por 12
      let dailyTurnoverMultiplier = 1;
      if (velocityMetrics.turnoverSpeed === 'ultra_fast') dailyTurnoverMultiplier = 6;
      else if (velocityMetrics.turnoverSpeed === 'fast') dailyTurnoverMultiplier = 2.5;
      else if (velocityMetrics.turnoverSpeed === 'moderate') dailyTurnoverMultiplier = 0.8;
      else dailyTurnoverMultiplier = 0.2; // Rota cada 5 días

      const velocityAdjustedDailyProfit = Math.round(netProfitPerBatch * dailyTurnoverMultiplier);

      return {
        recipe,
        sellUnitPrice,
        netProfitPerBatch,
        profitPerUnit,
        roiPercent,
        silverPerFocus,
        velocityMetrics,
        velocityAdjustedDailyProfit,
      };
    });
  }, [recipePrices, priceMemory, targetLevel, marketTaxRate, masteryProfile]);

  // Filtrado y ordenación
  const filteredProducts = useMemo(() => {
    return analyzedProducts
      .filter((item) => {
        if (selectedCategory !== 'all' && item.recipe.category !== selectedCategory) return false;
        if (selectedQuadrant !== 'all' && item.velocityMetrics.quadrant !== selectedQuadrant) return false;
        if (selectedSpeed !== 'all' && item.velocityMetrics.turnoverSpeed !== selectedSpeed) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          return (
            item.recipe.nameEs.toLowerCase().includes(q) ||
            item.recipe.nameEn.toLowerCase().includes(q) ||
            item.velocityMetrics.demandLabelEs.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'liquidity') {
          return b.velocityMetrics.liquidityScore - a.velocityMetrics.liquidityScore;
        }
        if (sortBy === 'real_velocity_silver') {
          return b.velocityAdjustedDailyProfit - a.velocityAdjustedDailyProfit;
        }
        if (sortBy === 'profit') {
          return b.profitPerUnit - a.profitPerUnit;
        }
        if (sortBy === 'roi') {
          return b.roiPercent - a.roiPercent;
        }
        return 0;
      });
  }, [analyzedProducts, selectedCategory, selectedQuadrant, selectedSpeed, searchQuery, sortBy]);

  // Contadores para resumen rápido
  const counts = useMemo(() => {
    let gold = 0;
    let fast = 0;
    let luxury = 0;
    let risk = 0;

    analyzedProducts.forEach((p) => {
      if (p.velocityMetrics.quadrant === 'liquid_gold') gold++;
      else if (p.velocityMetrics.quadrant === 'fast_cash') fast++;
      else if (p.velocityMetrics.quadrant === 'high_ticket_niche') luxury++;
      else risk++;
    });

    return { gold, fast, luxury, risk };
  }, [analyzedProducts]);

  return (
    <div className="space-y-6">
      {/* BANNER EDUCATIVO VETERANO: LA TRAMPA DE LA PLATA EN PAPEL */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-5 rounded-2xl shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-1">
              <Gauge size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Radar de Liquidez y Velocidad de Mercado (Rotación Real)
                </h2>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Veterano
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                <strong>La regla de oro del comerciante de Albion:</strong> El beneficio en papel no paga las cuentas si el producto tarda 2 semanas en venderse. Un ítem con un 25% de margen que se vende en <strong>2 horas</strong> rota 12 veces en un día y genera hasta 5 veces más plata real que una comida .3 con 70% de margen bloqueada por falta de compradores.
              </p>
            </div>
          </div>

          {/* Mini Estadísticas de Mercado */}
          <div className="grid grid-cols-3 gap-2 shrink-0 self-stretch sm:self-auto">
            <div className="bg-slate-950/80 border border-amber-500/30 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">Oro Líquido</span>
              <span className="text-lg font-black text-amber-400 font-mono">{counts.gold}</span>
              <span className="text-[9px] text-slate-400 block">Top Ganancia</span>
            </div>
            <div className="bg-slate-950/80 border border-emerald-500/30 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">Pan Caliente</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{counts.fast}</span>
              <span className="text-[9px] text-slate-400 block">Venta en Horas</span>
            </div>
            <div className="bg-slate-950/80 border border-purple-500/30 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-purple-300 font-bold uppercase block">Lujo / Nicho</span>
              <span className="text-lg font-black text-purple-400 font-mono">{counts.luxury}</span>
              <span className="text-[9px] text-slate-400 block">Lotes Pequeños</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES DE FILTRO Y SELECCIÓN */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por comida, poción o uso (ej: ZvZ, Nieblas, Veneno, Omelette)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Selector de Nivel de Encantamiento analizado */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold px-2">Nivel a Evaluar:</span>
            {([0, 1, 2, 3] as EnchantmentLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setTargetLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  targetLevel === lvl
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                .{lvl}
              </button>
            ))}
          </div>

          {/* Ordenar por */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-semibold">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'liquidity' | 'real_velocity_silver' | 'profit' | 'roi')}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="liquidity">⚡ Mayor Rapidez de Venta (Liquidez)</option>
              <option value="real_velocity_silver">🚀 Mayor Ganancia Real en 24h (Plata x Velocidad)</option>
              <option value="profit">💰 Mayor Beneficio por Unidad</option>
              <option value="roi">📈 Mayor Retorno ROI %</option>
            </select>
          </div>
        </div>

        {/* Fila de Filtros Rápidos de Categoría y Cuadrante */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Categoría */}
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                selectedCategory === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({analyzedProducts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('cooking')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                selectedCategory === 'cooking' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🍳 Cocina
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('alchemy')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                selectedCategory === 'alchemy' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🧪 Alquimia
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Cuadrantes */}
          <button
            type="button"
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'liquid_gold' ? 'all' : 'liquid_gold')}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-all flex items-center gap-1 ${
              selectedQuadrant === 'liquid_gold'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award size={12} className="text-amber-400" />
            <span>Oro Líquido ({counts.gold})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'fast_cash' ? 'all' : 'fast_cash')}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-all flex items-center gap-1 ${
              selectedQuadrant === 'fast_cash'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={12} className="text-emerald-400" />
            <span>Pan Caliente ({counts.fast})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant(selectedQuadrant === 'high_ticket_niche' ? 'all' : 'high_ticket_niche')}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-all flex items-center gap-1 ${
              selectedQuadrant === 'high_ticket_niche'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={12} className="text-purple-400" />
            <span>Lujo / Nicho ({counts.luxury})</span>
          </button>
        </div>
      </div>

      {/* LISTADO DE OPORTUNIDADES AUDITADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((item) => {
          const { recipe, velocityMetrics } = item;
          const isGold = velocityMetrics.quadrant === 'liquid_gold';

          return (
            <div
              key={recipe.id}
              className={`bg-slate-900 rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-slate-700 shadow-sm ${
                isGold
                  ? 'border-amber-500/50 ring-1 ring-amber-500/20 bg-gradient-to-b from-amber-950/20 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Cabecera de la Tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      <ItemIcon name={recipe.iconName} size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
                        {recipe.nameEs}
                        <span className="font-mono text-xs px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          .{targetLevel}
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {recipe.buffDescription}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Insignias de Demanda y Velocidad */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${velocityMetrics.quadrantBadgeClass}`}>
                    {velocityMetrics.quadrantTitleEs}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                    <Clock size={11} className="text-amber-400" />
                    {velocityMetrics.saleTimeEst}
                  </span>
                </div>

                {/* Cuadrícula de Métricas Financieras y de Rotación */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Beneficio / Unidad:</span>
                    <span
                      className={`text-sm font-black ${
                        item.profitPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.profitPerUnit >= 0 ? '+' : ''}
                      {item.profitPerUnit.toLocaleString()} Ag
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      ROI {item.roiPercent}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Volumen Estimado:</span>
                    <span className="text-xs font-bold text-slate-200 block">
                      {velocityMetrics.dailyVolumeEst}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans block">
                      Uso: {velocityMetrics.demandLabelEs}
                    </span>
                  </div>
                </div>

                {/* Advertencia de Trampa de Liquidez si existe */}
                {velocityMetrics.velocityTrapWarning && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-start gap-1.5 leading-snug">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{velocityMetrics.velocityTrapWarning}</span>
                  </div>
                )}

                {/* Consejo Práctico de Producción */}
                <div className="mt-2.5 text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{velocityMetrics.practicalAdviceEs}</span>
                </div>
              </div>

              {/* Botones de Acción Inmediata */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectRecipeAndLevel(recipe, targetLevel)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <span>Calcular Lote</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenComparatorForRecipe(recipe)}
                  className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1"
                  title="Comparar las 4 variantes (.0 a .3)"
                >
                  <Scale size={13} className="text-amber-400" />
                  <span>Comparar .0-.3</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
