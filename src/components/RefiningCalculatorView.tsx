import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  TrendingUp,
  MapPin,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  Layers,
  Coins,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Hammer,
  BookOpen,
  ShoppingBag,
  ExternalLink,
  Calculator,
  RotateCcw,
} from 'lucide-react';
import { CityId } from '../types';
import { RefiningCalculationMode, RefiningResourceType } from '../domain/models/refining';
import { useRefiningCalculator } from '../hooks/useRefiningCalculator';
import { RefiningCraftingPipelineView } from './RefiningCraftingPipelineView';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface RefiningCalculatorViewProps {
  cityId: CityId;
  dailyProductionBonusRRR?: number;
  onOpenAdpModal?: (itemId: string, targetType?: 'product' | 'seed_or_baby') => void;
  onSelectCity?: (cityId: CityId) => void;
  onNavigateToCrafting?: (recipeId?: string, tier?: number) => void;
}

const RESOURCE_TYPES: { id: RefiningResourceType; nameEs: string; icon: string; rawNameEs: string; refinedNameEs: string; bonusCity: string; bonusCityId: CityId; color: string }[] = [
  { id: 'ore', nameEs: 'Mineral / Lingotes', icon: '⛏️', rawNameEs: 'Mineral de Hierro', refinedNameEs: 'Barras de Metal (Lingotes)', bonusCity: 'Thetford', bonusCityId: 'thetford', color: 'border-purple-500/30' },
  { id: 'wood', nameEs: 'Madera / Tablas', icon: '🌲', rawNameEs: 'Troncos de Madera', refinedNameEs: 'Tablas de Madera', bonusCity: 'Fort Sterling', bonusCityId: 'fort_sterling', color: 'border-cyan-500/30' },
  { id: 'hide', nameEs: 'Pieles / Cuero', icon: '🐺', rawNameEs: 'Pieles de Animales', refinedNameEs: 'Cueros Curtidos', bonusCity: 'Martlock', bonusCityId: 'martlock', color: 'border-blue-500/30' },
  { id: 'fiber', nameEs: 'Fibra / Telas', icon: '🌾', rawNameEs: 'Fibras de Lino/Algodón', refinedNameEs: 'Telas Tejidas', bonusCity: 'Lymhurst', bonusCityId: 'lymhurst', color: 'border-emerald-500/30' },
  { id: 'stone', nameEs: 'Piedra / Bloques', icon: '🪨', rawNameEs: 'Rocas de Piedra', refinedNameEs: 'Bloques de Piedra', bonusCity: 'Bridgewatch', bonusCityId: 'bridgewatch', color: 'border-amber-500/30' },
];

export const RefiningCalculatorView: React.FC<RefiningCalculatorViewProps> = ({
  cityId,
  dailyProductionBonusRRR = 0,
  onOpenAdpModal,
  onSelectCity,
  onNavigateToCrafting,
}) => {
  const {
    config,
    updateConfig,
    rawKey,
    prevKey,
    finishedKey,
    albionItemIds,
    currentRawPrice,
    currentPrevPrice,
    currentFinishedPrice,
    updatePrice,
    calculationResult,
    pipelineResult,
    cityBonus,
  } = useRefiningCalculator(cityId, dailyProductionBonusRRR);

  const [activeSubTab, setActiveSubTab] = useState<'calculator' | 'pipeline' | 'mastery'>('calculator');
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleConfigChange = (changes: Parameters<typeof updateConfig>[0]) => {
    updateConfig(changes);
    if (hasCalculated) setIsStale(true);
  };

  const handlePriceChange = (key: string, val: number) => {
    updatePrice(key, val);
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

  const [copiedShoppingList, setCopiedShoppingList] = useState(false);
  const [selectedPipelineRecipeId, setSelectedPipelineRecipeId] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const currentResourceMeta = RESOURCE_TYPES.find((r) => r.id === config.resourceType) || RESOURCE_TYPES[0];

  const handleCopyShoppingList = () => {
    if (calculationResult.shoppingListText) {
      navigator.clipboard.writeText(calculationResult.shoppingListText);
      setCopiedShoppingList(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => setCopiedShoppingList(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                <Flame size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  Calculadora de Refinado de Recursos
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Tiers 2 a 8
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Procesamiento de materias primas a materiales refinados con bonos de Ciudad Real (hasta 53.9% RRR), devolución de recursos y reducción de foco.
                </p>
              </div>
            </div>
          </div>

          {/* Selector de Sub-Pestaña */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveSubTab('calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'calculator'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins size={14} />
              Refinado & Rentabilidad
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'pipeline'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Hammer size={14} />
              Cadena de Crafteo
              {pipelineResult.topOpportunity && pipelineResult.topOpportunity.isCraftingMoreProfitable && (
                <span className="bg-emerald-950/80 text-emerald-300 text-[9px] px-1 py-0.2 rounded font-black border border-emerald-500/40">
                  ¡Más Rentable!
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('mastery')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'mastery'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target size={14} />
              Maestría en Refinado (FCE)
            </button>
          </div>
        </div>

        {/* Banner de Ciudad y RRR */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin size={15} className="text-amber-400" />
            <span className="text-slate-400">Ciudad de la Estación:</span>
            <span className="font-bold text-slate-200 uppercase">{cityId}</span>
            {calculationResult.isCityBonusActive ? (
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> Bono Activo en {currentResourceMeta.refinedNameEs} ({calculationResult.effectiveRRR}% RRR)
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-medium border border-slate-700">
                  Sin bono local ({calculationResult.effectiveRRR}% RRR). Bono óptimo en {currentResourceMeta.bonusCity}.
                </span>
                {onSelectCity && (
                  <button
                    type="button"
                    onClick={() => onSelectCity(currentResourceMeta.bonusCityId)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30 transition-all flex items-center gap-1"
                  >
                    <ArrowRight size={11} />
                    Viajar a {currentResourceMeta.bonusCity}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Tasa de Estación:</span>
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <NumericInput
                min={0}
                max={9999}
                value={config.stationTaxPer100Nutrition}
                onChange={(val) => handleConfigChange({ stationTaxPer100Nutrition: val })}
                className="w-16 bg-transparent font-mono font-bold text-amber-300 text-right focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 font-mono">🪙/100 nut.</span>
            </div>
          </div>
        </div>
      </div>

      {activeSubTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA 1: SELECTORES Y PRECIOS MANUALES */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Layers size={16} className="text-amber-400" />
              1. Configuración del Recurso
            </h3>

            {/* Selector de Recurso */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium block">Tipo de Recurso:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESOURCE_TYPES.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleConfigChange({ resourceType: res.id })}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                      config.resourceType === res.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{res.icon}</span>
                    <div className="truncate">
                      <div className="font-bold">{res.nameEs}</div>
                      <div className="text-[10px] text-slate-400">Bono: {res.bonusCity}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Tier y Encantamiento */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Tier del Material:</label>
                <select
                  value={config.tier}
                  onChange={(e) => handleConfigChange({ tier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>Tier {t} (T{t})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Encantamiento:</label>
                <select
                  value={config.enchantment}
                  onChange={(e) => handleConfigChange({ enchantment: Number(e.target.value) })}
                  disabled={config.tier < 4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                >
                  <option value={0}>.0 Plano</option>
                  <option value={1}>.1 Poco Común</option>
                  <option value={2}>.2 Raro</option>
                  <option value={3}>.3 Excepcional</option>
                  <option value={4}>.4 Prístino</option>
                </select>
              </div>
            </div>

            {/* Selector de Modo de Refinado: Lote Simple vs Cascada Completa */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-slate-400 font-medium block">Modo de Simulación:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleConfigChange({ calculationMode: 'single_batch' })}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all text-center ${
                    config.calculationMode !== 'cascade_full'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Lote Directo (1 Ciclo)
                </button>
                <button
                  type="button"
                  onClick={() => handleConfigChange({ calculationMode: 'cascade_full' })}
                  className={`p-2 rounded-lg border text-xs font-bold transition-all text-center ${
                    config.calculationMode === 'cascade_full'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cascada Total (x{calculationResult.cascadeMultiplier})
                </button>
              </div>
            </div>

            {/* Cantidad de Unidades a Procesar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-400 font-medium">Lote Inicial a Refinar:</label>
                <span className="text-[11px] font-mono text-amber-400 font-bold">{config.batchCount} unidades</span>
              </div>
              <input
                type="range"
                min={10}
                max={2000}
                step={10}
                value={config.batchCount}
                onChange={(e) => handleConfigChange({ batchCount: Number(e.target.value) })}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Toggles: Foco y Premium */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfigChange({ useFocus: !config.useFocus })}
                className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  config.useFocus
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap size={14} className={config.useFocus ? 'fill-slate-950' : ''} />
                {config.useFocus ? 'Con Foco' : 'Sin Foco'}
              </button>

              <button
                type="button"
                onClick={() => handleConfigChange({ hasPremium: !config.hasPremium })}
                className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  config.hasPremium
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                👑 {config.hasPremium ? 'Premium (4% tax)' : 'Sin Premium (8%)'}
              </button>
            </div>

            {/* Tasa de la Estación de Refinado (Tope oficial 999 🪙 / 100 nutrición) */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  Tasa de la Estación (por 100 nutrición)
                  <span className="text-[10px] text-slate-400 font-normal">(Máx. 999 🪙)</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">{config.stationTaxPer100Nutrition} 🪙</span>
              </div>
              <NumericInput
                min={0}
                max={1000}
                value={config.stationTaxPer100Nutrition}
                onChange={(val) => updateConfig({ stationTaxPer100Nutrition: Math.min(1000, Math.max(0, val)) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="Ej. 750 (Tope oficial: 1.000)"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Límite oficial de Albion: 0 - 999 🪙</span>
                <span className={config.stationTaxPer100Nutrition >= 900 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {config.stationTaxPer100Nutrition >= 900 ? '⚠️ Tasa Alta' : 'Tasa Estándar'}
                </span>
              </div>
            </div>

            {/* Precios Manuales de Entrada con botones ADP directos */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Precios Manuales de Mercado
                </h4>
              </div>

              {/* Precio Materia Prima Bruta */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                    <span>{currentResourceMeta.rawNameEs}</span>
                    <AlbionItemBadge tier={config.tier} enchantment={config.enchantment} size="sm" />
                  </label>
                  {onOpenAdpModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAdpModal(albionItemIds.rawItemId, 'product')}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20"
                    >
                      <TrendingUp size={10} />
                      ADP
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <NumericInput
                    min={0}
                    value={currentRawPrice}
                    onChange={(val) => updatePrice(rawKey, val)}
                    className="w-full bg-transparent font-mono font-bold text-slate-100 text-sm focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-slate-500">🪙/ud</span>
                </div>
              </div>

              {/* Precio Material Refinado Previo T(n-1) */}
              {config.tier > 2 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                      <span>Material Previo</span>
                      <AlbionItemBadge tier={config.tier - 1} enchantment={0} size="sm" />
                    </label>
                    {onOpenAdpModal && albionItemIds.prevTierItemId && (
                      <button
                        type="button"
                        onClick={() => onOpenAdpModal(albionItemIds.prevTierItemId, 'product')}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20"
                      >
                        <TrendingUp size={10} />
                        ADP
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <NumericInput
                      min={0}
                      value={currentPrevPrice}
                      onChange={(val) => updatePrice(prevKey, val)}
                      className="w-full bg-transparent font-mono font-bold text-slate-100 text-sm focus:outline-none tabular-nums"
                    />
                    <span className="text-xs text-slate-500">🪙/ud</span>
                  </div>
                </div>
              )}

              {/* Precio Venta Producto Final Refinado */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-amber-300 font-semibold truncate flex items-center gap-1.5">
                    <span>Venta de {currentResourceMeta.refinedNameEs}</span>
                    <AlbionItemBadge tier={config.tier} enchantment={config.enchantment} size="sm" />
                  </label>
                  {onOpenAdpModal && (
                    <button
                      type="button"
                      onClick={() => onOpenAdpModal(albionItemIds.refinedItemId, 'product')}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20"
                    >
                      <TrendingUp size={10} />
                      ADP
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/30">
                  <NumericInput
                    min={0}
                    value={currentFinishedPrice}
                    onChange={(val) => updatePrice(finishedKey, val)}
                    className="w-full bg-transparent font-mono font-bold text-amber-400 text-sm focus:outline-none tabular-nums"
                  />
                  <span className="text-xs text-amber-500/70">🪙/ud</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNAS 2 & 3: CONTROL DE CÁLCULO Y RESULTADOS */}
          <div className="lg:col-span-2 space-y-4">
            {/* Barra de Activación: Botón manual para Dar Resultado */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="text-amber-400" size={20} />
                  <span className="text-sm font-bold text-slate-100">
                    Control de Cálculo de Refinado
                  </span>
                  {isStale && hasCalculated && (
                    <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                      Modificaciones sin recalcular
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Presiona para calcular el retorno en cascada ({calculationResult.effectiveRRR}% RRR), consumo real y plata/foco sin interferencias de sesiones previas.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {hasCalculated && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Limpiar cálculo de pantalla"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden sm:inline">Limpiar</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-calculate-refining-result"
                  onClick={handleCalculate}
                  className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                    !hasCalculated
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-amber-500/20 transform hover:-translate-y-0.5'
                      : isStale
                      ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                  }`}
                >
                  <Calculator size={16} />
                  {!hasCalculated
                    ? 'Dar Resultado / Calcular Refinado'
                    : isStale
                    ? 'Recalcular con Nuevos Datos'
                    : 'Volver a Calcular'}
                </button>
              </div>
            </div>

            {!hasCalculated ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Calculator size={28} />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-base font-bold text-slate-100">
                    Refinado de {currentResourceMeta.nameEs} T{config.tier}.{config.enchantment} ({config.batchCount} u.) Listo para Calcular
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ajusta tus precios de materia prima y producto terminado en la izquierda. Presiona el botón{' '}
                    <strong className="text-amber-400">"Dar Resultado / Calcular Refinado"</strong> para procesar la cascada RRR, los materiales devueltos y la rentabilidad neta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-1"
                >
                  <Calculator size={18} />
                  <span>Calcular Resultados Ahora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUMNA 2: DEVOLUCIÓN DE MATERIALES (RRR EN CASCADA) */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <RefreshCw size={16} className="text-cyan-400" />
              Retorno de Recursos (RRR: {calculationResult.effectiveRRR}%)
            </h3>

            {/* Tarjeta de Materiales Brutos */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Materia Prima en Bruto:</span>
                <span className="font-mono font-bold text-slate-200 tabular-nums">{calculationResult.totalRawMaterialsRequired} uds</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>Devueltos por RRR ({calculationResult.effectiveRRR}%):</span>
                <span className="font-mono font-bold tabular-nums">+{calculationResult.rawMaterialsReturned} uds</span>
              </div>
              <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between font-bold text-slate-200">
                <span>Consumo Efectivo Real:</span>
                <span className="font-mono text-amber-400 tabular-nums">{calculationResult.effectiveRawMaterialsUsed} uds</span>
              </div>
            </div>

            {/* Tarjeta de Material Refinado Anterior T(n-1) */}
            {config.tier > 2 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Material Previo T{config.tier - 1}:</span>
                  <span className="font-mono font-bold text-slate-200 tabular-nums">{calculationResult.totalPreviousTierRequired} uds</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Devueltos por RRR:</span>
                  <span className="font-mono font-bold tabular-nums">+{calculationResult.previousTierReturned} uds</span>
                </div>
                <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between font-bold text-slate-200">
                  <span>Consumo Efectivo Previo:</span>
                  <span className="font-mono text-cyan-300 tabular-nums">{calculationResult.effectivePreviousTierUsed} uds</span>
                </div>
              </div>
            )}

            {/* Valor Aportado por el Retorno */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-1">
              <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Ahorro por Retorno de Recursos (RRR):
              </div>
              <div className="text-lg font-mono font-black text-emerald-400 tabular-nums">
                +{formatSilver(calculationResult.returnedValueTotal)}
              </div>
              <p className="text-[11px] text-slate-400">
                {config.calculationMode === 'cascade_full'
                  ? `Modo cascada activo: Produces ${calculationResult.cascadeTotalUnitsProduced} unidades finales (multiplicador x${calculationResult.cascadeMultiplier}).`
                  : 'Valor recuperado directamente en materiales que no necesitas volver a comprar para el siguiente lote.'}
              </p>
            </div>

            {/* Rendimiento con Foco */}
            {config.useFocus && (
              <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Zap size={14} className="fill-amber-400" />
                    Potencial con 10.000 Foco Diario
                  </span>
                  <span className="font-mono font-bold text-slate-200 tabular-nums">
                    {calculationResult.actualFocusCostPerUnit} foco/ud
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Capacidad Diaria:</span>
                    <span className="font-mono font-bold text-cyan-300 tabular-nums">{calculationResult.unitsWith10kFocus} uds</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Plata / Foco:</span>
                    <span className="font-mono font-bold text-emerald-400 tabular-nums">{calculationResult.silverPerFocusPoint} 🪙/foco</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA 3: BALANCE FINANCIERO Y RESULTADO */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-400" />
                  Balance Financiero del Lote
                </h3>
                <button
                  type="button"
                  onClick={handleCopyShoppingList}
                  className={`text-[11px] px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1 border ${
                    copiedShoppingList
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-amber-300'
                  }`}
                  title="Copiar lista de compras para el portapapeles"
                >
                  {copiedShoppingList ? <Check size={12} /> : <Copy size={12} />}
                  {copiedShoppingList ? '¡Copiado!' : 'Copiar Compra'}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Inversión Bruta Materiales:</span>
                  <span className="font-mono text-slate-300 tabular-nums">{formatSilver(calculationResult.grossRawMaterialCost + calculationResult.grossPreviousTierCost)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Valor Devuelto por RRR:</span>
                  <span className="font-mono tabular-nums">-{formatSilver(calculationResult.returnedValueTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Tasa de Estación ({calculationResult.totalNutritionUsed} nut.):</span>
                  <span className="font-mono text-slate-300 tabular-nums">+{formatSilver(calculationResult.stationFeeTotal)}</span>
                </div>
                <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between font-bold text-slate-200">
                  <span>Coste Total Efectivo:</span>
                  <span className="font-mono text-rose-300 tabular-nums">{formatSilver(calculationResult.totalExpenditure)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Venta Bruta ({calculationResult.totalUnitsProduced} uds {config.calculationMode === 'cascade_full' ? 'en cascada' : ''}):</span>
                  <span className="font-mono text-slate-200 tabular-nums">{formatSilver(calculationResult.grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Impuestos ({calculationResult.marketTaxPercent}% + 2.5% orden):</span>
                  <span className="font-mono tabular-nums">-{formatSilver(calculationResult.marketDeductions)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span>Ingreso Neto de Venta:</span>
                  <span className="font-mono text-cyan-300 tabular-nums">{formatSilver(calculationResult.netRevenue)}</span>
                </div>
              </div>

              {/* Resultado Neto */}
              <div
                className={`p-4 rounded-xl border space-y-1 ${
                  calculationResult.isProfitable
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <span className="text-xs text-slate-400 font-medium">Ganancia Neta Limpia:</span>
                <div
                  className={`text-2xl font-mono font-black tabular-nums ${
                    calculationResult.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {calculationResult.netProfit >= 0 ? '+' : ''}
                  {formatSilver(calculationResult.netProfit)}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                  <span>Por unidad: <strong className="text-slate-200 font-mono tabular-nums">{formatSilver(calculationResult.profitPerUnit)}</strong></span>
                  <span>ROI: <strong className="text-slate-200 font-mono tabular-nums">{calculationResult.roiPercent}%</strong></span>
                </div>
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
              {/* Acceso directo a la Cadena de Crafteo */}
              {pipelineResult.topOpportunity && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                      <Hammer size={18} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        🔗 Cadena de Producción: Forja con tus {pipelineResult.refinedUnitsAvailable.toLocaleString()} uds de {currentResourceMeta.refinedNameEs} T{config.tier}
                        {pipelineResult.topOpportunity.isCraftingMoreProfitable && (
                          <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/40">
                            +{pipelineResult.topOpportunity.advantageOverRawSale.toLocaleString()} 🪙 vs Vender Crudo
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Puedes craftear <strong>{pipelineResult.topOpportunity.craftableItemCount.toLocaleString()} {pipelineResult.topOpportunity.recipe.nameEs}</strong> y llenar <strong>{pipelineResult.topOpportunity.journalsFilledCount} diarios</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('pipeline')}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Ver Opciones
                    </button>
                    {onNavigateToCrafting && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCrafting(pipelineResult.topOpportunity?.recipe.id, config.tier)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Craftear Ahora</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {calculationResult.recommendations.map((rec, i) => (
                <div key={i} className="p-2 bg-slate-950 rounded border border-slate-800 leading-relaxed">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
    )}
  </div>
</div>
)}

      {/* SUB-PESTAÑA: CADENA DE CRAFTEO SINCRONIZADA */}
      {activeSubTab === 'pipeline' && (
        <RefiningCraftingPipelineView
          pipeline={pipelineResult}
          currentCityId={cityId}
          onNavigateToCrafting={onNavigateToCrafting}
          onSelectCity={onSelectCity}
          onOpenAdpModal={onOpenAdpModal}
        />
      )}

      {/* SUB-PESTAÑA: MAESTRÍA EN REFINADO */}
      {activeSubTab === 'mastery' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Target size={20} className="text-amber-400" />
                Maestría del Refinador en la Tabla del Destino
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                La maestría en refinado reduce de forma exponencial el coste de foco por unidad según la fórmula de potencias de 2 de Albion Online.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Descuento de Foco</div>
              <div className="text-lg font-black font-mono text-emerald-400">
                -{calculationResult.focusDiscountPercent}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Especialista del Tier */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Especialista en {currentResourceMeta.nameEs} T{config.tier}</span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {config.resourceSpecLevel} / 100
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Otorga <strong className="text-amber-300">+250 FCE directo</strong> por nivel al tier seleccionado.
              </p>
              <input
                type="range"
                min={0}
                max={100}
                value={config.resourceSpecLevel}
                onChange={(e) => updateConfig({ resourceSpecLevel: Number(e.target.value) })}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Refinador General */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Nivel General de Refinador</span>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {config.refinerMasteryLevel} / 100
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Otorga <strong className="text-cyan-300">+30 FCE</strong> por nivel a todos los tiers del recurso.
              </p>
              <input
                type="range"
                min={0}
                max={100}
                value={config.refinerMasteryLevel}
                onChange={(e) => updateConfig({ refinerMasteryLevel: Number(e.target.value) })}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Otros Tiers */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">Otros Tiers (Promedio)</span>
                <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {config.otherTiersAverageSpec} / 100
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aporta <strong className="text-purple-300">+30 FCE por nivel</strong> en cada uno de los 4 tiers restantes.
              </p>
              <input
                type="range"
                min={0}
                max={100}
                value={config.otherTiersAverageSpec}
                onChange={(e) => updateConfig({ otherTiersAverageSpec: Number(e.target.value) })}
                className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Costo Base sin Maestría:</span>
              <span className="font-mono font-bold text-slate-300 text-lg">{calculationResult.baseFocusCostPerUnit} foco/ud</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40">
              <span className="text-amber-400 block text-[11px] font-bold">Tu Costo Reducido Actual:</span>
              <span className="font-mono font-bold text-amber-400 text-lg">{calculationResult.actualFocusCostPerUnit} foco/ud</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

