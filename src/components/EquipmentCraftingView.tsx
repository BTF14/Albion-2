import React, { useState, useEffect } from 'react';
import {
  Anvil,
  Crosshair,
  Sparkles,
  Wrench,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  Zap,
  Building,
  Award,
  HelpCircle,
  Layers,
  ArrowRight,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Target,
  Utensils,
  Crown,
  Percent,
  RotateCcw,
} from 'lucide-react';
import { CityId } from '../types';
import { CraftStationType, ItemQuality } from '../domain/models/equipmentCrafting';
import { useEquipmentCrafting } from '../hooks/useEquipmentCrafting';
import { CITY_CRAFTING_BONUSES, CRAFT_EQUIPMENT_RECIPES } from '../data/equipmentRecipes';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface EquipmentCraftingViewProps {
  cityId: CityId;
  dailyProductionBonusRRR?: number;
  onOpenAdpModal?: (itemId?: string, targetType?: 'product' | 'seed_or_baby') => void;
  onNavigateToLabourers?: (labourerType?: 'blacksmith' | 'fletcher' | 'imbuer' | 'tinker', journalTier?: number, journalsCount?: number) => void;
  targetRecipeId?: string | null;
  targetTier?: number | null;
  onClearTarget?: () => void;
}

export const EquipmentCraftingView: React.FC<EquipmentCraftingViewProps> = ({
  cityId,
  dailyProductionBonusRRR,
  onOpenAdpModal,
  onNavigateToLabourers,
  targetRecipeId,
  targetTier,
  onClearTarget,
}) => {
  const {
    config,
    updateConfig,
    prices,
    updatePrice,
    stationRecipes,
    currentRecipe,
    isCityBonusActive,
    calculationResult,
  } = useEquipmentCrafting(cityId, dailyProductionBonusRRR);

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleConfigChange = (newConfig: Parameters<typeof updateConfig>[0]) => {
    updateConfig(newConfig);
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

  // Sincronización automática si se llega desde la Cadena de Producción (Refinado)
  useEffect(() => {
    if (targetRecipeId) {
      const found = CRAFT_EQUIPMENT_RECIPES.find((r) => r.id === targetRecipeId);
      if (found) {
        updateConfig({
          station: found.station,
          selectedRecipeId: found.id,
          tier: targetTier && targetTier >= 4 && targetTier <= 8 ? targetTier : config.tier,
        });
      }
      if (onClearTarget) {
        onClearTarget();
      }
    }
  }, [targetRecipeId, targetTier]);

  const [activeTabSubView, setActiveTabSubView] = useState<'crafting' | 'mastery' | 'journal_comparison'>('crafting');

  const cityBonusInfo = CITY_CRAFTING_BONUSES[cityId] || {
    nameEs: cityId,
    specializedItems: [],
    description: 'Sin bono regional especial.',
  };

  const emptyJournalKey = `empty_journal_t${config.tier}`;
  const filledJournalKey = `filled_journal_t${config.tier}`;
  const finishedItemKey = `${currentRecipe.id}_t${config.tier}`;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Encabezado Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
              <Anvil size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">
                  Calculadora de Crafteo, Diarios y Maestría
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Combo Completo Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cálculo de ganancia/pérdida neta de equipo, maestría de foco (FCE), ensaladas de calidad y estrategia de diarios.
              </p>
            </div>
          </div>

          {/* Selector de Modo de Vista */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTabSubView('crafting')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTabSubView === 'crafting'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔨 Taller
            </button>
            <button
              type="button"
              onClick={() => setActiveTabSubView('mastery')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSubView === 'mastery'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target size={14} />
              Maestría & Foco
            </button>
            <button
              type="button"
              onClick={() => setActiveTabSubView('journal_comparison')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTabSubView === 'journal_comparison'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen size={14} />
              Diarios
            </button>
          </div>
        </div>

        {/* Selector de las 4 Estaciones de Crafteo de Albion */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <button
            type="button"
            onClick={() => updateConfig({ station: 'forge' })}
            className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
              config.station === 'forge'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Anvil size={18} className={config.station === 'forge' ? 'text-amber-400' : 'text-slate-400'} />
            <div>
              <div className="text-xs font-bold leading-tight">Forja del Guerrero</div>
              <div className="text-[10px] text-slate-400">Espadas, Placas, Hachas</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateConfig({ station: 'hunter' })}
            className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
              config.station === 'hunter'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Crosshair size={18} className={config.station === 'hunter' ? 'text-amber-400' : 'text-slate-400'} />
            <div>
              <div className="text-xs font-bold leading-tight">Cabaña del Cazador</div>
              <div className="text-[10px] text-slate-400">Arcos, Dagas, Cueros</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateConfig({ station: 'mage' })}
            className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
              config.station === 'mage'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Sparkles size={18} className={config.station === 'mage' ? 'text-amber-400' : 'text-slate-400'} />
            <div>
              <div className="text-xs font-bold leading-tight">Torre del Mago</div>
              <div className="text-[10px] text-slate-400">Báculos, Telas, Tomos</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateConfig({ station: 'toolmaker' })}
            className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
              config.station === 'toolmaker'
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md font-bold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <Wrench size={18} className={config.station === 'toolmaker' ? 'text-amber-400' : 'text-slate-400'} />
            <div>
              <div className="text-xs font-bold leading-tight">Taller Hojalatero</div>
              <div className="text-[10px] text-slate-400">Herramientas, Bolsas</div>
            </div>
          </button>
        </div>
      </div>

      {/* Banner de Bonificación de Ciudad & Evento Diario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          isCityBonusActive || (dailyProductionBonusRRR && dailyProductionBonusRRR > 0)
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <Building size={20} className={isCityBonusActive ? 'text-emerald-400 shrink-0 mt-0.5' : 'text-slate-400 shrink-0 mt-0.5'} />
          <div className="text-xs">
            <div className="font-bold flex items-center gap-2 flex-wrap">
              Bono en {cityBonusInfo.nameEs}
              {isCityBonusActive && (
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">
                  +24.8% RRR Ciudad
                </span>
              )}
              {Boolean(dailyProductionBonusRRR && dailyProductionBonusRRR > 0) && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                  <Flame size={11} /> +{dailyProductionBonusRRR}% Evento 10:00 UTC
                </span>
              )}
            </div>
            <p className="mt-0.5 text-slate-400">
              {cityBonusInfo.description}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs">
          <BookOpen size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-200 flex items-center gap-2">
              Diario Asociado: {currentRecipe.associatedLabourer === 'blacksmith' ? 'Diario de Herrero' : currentRecipe.associatedLabourer === 'fletcher' ? 'Diario de Flechero' : currentRecipe.associatedLabourer === 'imbuer' ? 'Diario de Mago' : 'Diario de Hojalatero'}
            </div>
            <p className="text-slate-400 mt-0.5">
              Craftear este ítem T{config.tier} otorga <span className="text-amber-300 font-mono font-bold">~{calculationResult.fameRequiredPerJournal > 0 ? (calculationResult.totalCraftFameEarned / config.batchCount).toFixed(0) : 0} fama</span> por unidad y llena diarios de artesanía en tu mochila.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: TALLER DE CRAFTEO */}
      {activeTabSubView === 'crafting' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y ENTRADA DE PRECIOS (7 COLUMNAS) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Selector de Ítem, Tier y Encantamiento */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers size={16} className="text-amber-400" />
                1. Selección de Receta y Parámetros
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selector de Receta */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Receta de Equipo
                  </label>
                  <select
                    value={currentRecipe.id}
                    onChange={(e) => updateConfig({ selectedRecipeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {stationRecipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nameEs}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad a Craftear */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cantidad a Fabricar (Lote)
                  </label>
                  <div className="flex items-center gap-2">
                    <NumericInput
                      min={1}
                      max={999}
                      value={config.batchCount}
                      onChange={(val) => updateConfig({ batchCount: Math.max(1, val) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-slate-400 font-semibold shrink-0">uds</span>
                  </div>
                </div>
              </div>

              {/* Selector de Tier, Encantamiento y Calidad */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tier</label>
                  <select
                    value={config.tier}
                    onChange={(e) => updateConfig({ tier: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {[4, 5, 6, 7, 8].map((t) => (
                      <option key={t} value={t}>
                        Tier {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Encantamiento</label>
                  <select
                    value={config.enchantment}
                    onChange={(e) => updateConfig({ enchantment: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value={0}>.0 Plano</option>
                    <option value={1}>.1 Runas</option>
                    <option value={2}>.2 Almas</option>
                    <option value={3}>.3 Reliquias</option>
                    <option value={4}>.4 Prístino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Calidad Promedio</label>
                  <select
                    value={config.quality}
                    onChange={(e) => updateConfig({ quality: e.target.value as ItemQuality })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="good">Bueno</option>
                    <option value="outstanding">Sobresaliente</option>
                    <option value="excellent">Excelente</option>
                    <option value="masterpiece">Obra Maestra</option>
                  </select>
                </div>
              </div>

              {/* Toggles de Foco, Premium, Tasa de Parcela y Ensalada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateConfig({ useFocus: !config.useFocus })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      config.useFocus
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Zap size={14} className={config.useFocus ? 'fill-slate-950' : ''} />
                    {config.useFocus ? 'Foco Activado (+RRR)' : 'Sin Usar Foco'}
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConfig({ hasPremium: !config.hasPremium })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      config.hasPremium
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    {config.hasPremium ? 'Premium (4% Tax)' : 'Sin Premium (8%)'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      Tasa del Taller (por 100 nutrición)
                      <span className="text-[10px] text-slate-400 font-normal">(Máx. 999 🪙)</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{config.stationTaxPer100Nutrition} 🪙</span>
                  </div>
                  <div className="relative">
                    <NumericInput
                      min={0}
                      max={1000}
                      value={config.stationTaxPer100Nutrition}
                      onChange={(val) => updateConfig({ stationTaxPer100Nutrition: Math.min(1000, Math.max(0, val)) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                      placeholder="Ej. 750 (Tope oficial: 1.000)"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>Límite oficial de Albion: 0 - 999 🪙</span>
                      <span className={config.stationTaxPer100Nutrition >= 900 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {config.stationTaxPer100Nutrition >= 900 ? '⚠️ Tasa Alta' : 'Tasa Estándar'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Ensalada de Crafteo (Buff de Calidad) */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Utensils size={13} className="text-emerald-400" />
                    Comida de Artesano (Ensaladas de Albion)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">
                    {calculationResult.qualityMetrics.saladQualityBonusPercent > 0
                      ? `+${calculationResult.qualityMetrics.saladQualityBonusPercent}% Calidad`
                      : 'Sin bono'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'none' as const, label: 'Sin Comida', bonus: '0%' },
                    { id: 'bean_t2' as const, label: 'Alubias T2', bonus: '+37.5%' },
                    { id: 'turnip_t4' as const, label: 'Nabos T4', bonus: '+75%' },
                    { id: 'potato_t6' as const, label: 'Patatas T6', bonus: '+112.5%' },
                    { id: 'kraken_t6' as const, label: 'Kraken T6', bonus: '+150%' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => updateConfig({ saladType: s.id, hasCrafterSalad: s.id !== 'none' })}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        config.saladType === s.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-semibold leading-tight truncate">{s.label}</div>
                      <div className="text-[9px] text-emerald-400 font-mono mt-0.5">{s.bonus}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ajuste Rápido de Maestría (Destiny Board) */}
              <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-xl border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Target size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Maestría de Foco en este Ítem</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTabSubView('mastery')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    Ver Tabla Completa <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Especialista Ítem (0-100):</span>
                      <span className="font-mono text-amber-300 font-bold">{config.itemSpecLevel}/100</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.itemSpecLevel}
                      onChange={(e) => updateConfig({ itemSpecLevel: Number(e.target.value) })}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Artesano General (0-100):</span>
                      <span className="font-mono text-amber-300 font-bold">{config.crafterMasteryLevel}/100</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.crafterMasteryLevel}
                      onChange={(e) => updateConfig({ crafterMasteryLevel: Number(e.target.value) })}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">
                    Foco: <span className="font-mono text-amber-400 font-bold">{calculationResult.masteryMetrics.actualFocusCostPerItem}</span> / pieza
                    {calculationResult.masteryMetrics.focusDiscountPercent > 0 && (
                      <span className="text-emerald-400 ml-1 font-bold">(-{calculationResult.masteryMetrics.focusDiscountPercent}%)</span>
                    )}
                  </span>
                  <span className="text-slate-400">
                    Piezas con 10k foco: <span className="font-mono text-cyan-300 font-bold">{calculationResult.masteryMetrics.itemsCraftableWith10k} uds/día</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Precios Manuales de Ingredientes con Botón Secundario [ADP] */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-400" />
                  2. Precios Manuales de Materiales
                </h3>
                <span className="text-[10px] text-slate-400">
                  Botón [ADP] secundario y opcional
                </span>
              </div>

              <div className="space-y-3">
                {currentRecipe.materials.map((mat) => {
                  const matKey = `${mat.materialId}_t${config.tier}`;
                  const currentPrice = prices[matKey] ?? (prices[mat.materialId] || 0);
                  const totalMatUnits = mat.amount * config.batchCount;

                  return (
                    <div
                      key={mat.materialId}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <AlbionItemBadge tier={config.tier} enchantment={config.enchantment} size="xs" />
                          <span>{mat.nameEs}</span>
                          <span className="text-amber-400 font-mono text-[11px] tabular-nums">
                            ({totalMatUnits} uds total = {mat.amount} x {config.batchCount})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Subtotal estimado: <span className="font-mono text-slate-300 tabular-nums">{formatSilver(totalMatUnits * currentPrice)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative w-36">
                          <NumericInput
                            min={0}
                            value={currentPrice || 0}
                            onChange={(val) => updatePrice(matKey, val)}
                            placeholder="0"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 pr-6 text-right tabular-nums"
                          />
                          <span className="absolute right-2 top-1.5 text-xs text-slate-500">🪙</span>
                        </div>

                        {onOpenAdpModal && (
                          <button
                            type="button"
                            onClick={() => onOpenAdpModal(mat.materialId, 'product')}
                            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="Consultar cotización referencial en Albion Data Project"
                          >
                            ADP
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Venta del Ítem Fabricado y Diarios de Crafteo */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <BookOpen size={16} className="text-emerald-400" />
                3. Venta de Ítems Terminados & Diarios
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Venta del Ítem Fabricado */}
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <AlbionItemBadge tier={config.tier} enchantment={config.enchantment} size="xs" />
                    <span>Precio Venta: {currentRecipe.nameEs}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <NumericInput
                        min={0}
                        value={prices[finishedItemKey] || 0}
                        onChange={(val) => updatePrice(finishedItemKey, val)}
                        placeholder="0"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 pr-6 text-right tabular-nums"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-500">🪙</span>
                    </div>

                    {onOpenAdpModal && (
                      <button
                        type="button"
                        onClick={() => onOpenAdpModal(currentRecipe.id, 'product')}
                        className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold"
                        title="Ver cotización de venta en Albion Data Project"
                      >
                        ADP
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ingreso bruto lote: <span className="font-mono text-slate-300 tabular-nums">{formatSilver(calculationResult.grossItemSales)}</span>
                  </div>
                </div>

                {/* Estrategia de Diarios */}
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>Estrategia con Diarios</span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold tabular-nums">
                      {calculationResult.journalsFilledCount} llenos (+{calculationResult.partialJournalProgressPercent}%)
                    </span>
                  </div>
                  <select
                    value={config.journalStrategy}
                    onChange={(e) => updateConfig({ journalStrategy: e.target.value as 'sell_filled' | 'use_labourers' | 'no_journals' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="sell_filled">Vender Diarios Llenos en Mercado</option>
                    <option value="use_labourers">Entregar a Trabajadores en Isla</option>
                    <option value="no_journals">No llevar diarios (Sin libros)</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Diario Vacío (Compra)</span>
                      <NumericInput
                        min={0}
                        value={prices[emptyJournalKey] || 0}
                        onChange={(val) => updatePrice(emptyJournalKey, val)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 tabular-nums"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Diario Lleno (Venta)</span>
                      <NumericInput
                        min={0}
                        value={prices[filledJournalKey] || 0}
                        onChange={(val) => updatePrice(filledJournalKey, val)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200 tabular-nums"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TARJETA DE VEREDICTO FINANCIERO Y RESUMEN (5 COLUMNAS) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Barra de Activación: Botón manual para Dar Resultado */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <Calculator className="text-amber-400" size={20} />
                  <span className="text-sm font-bold text-slate-100">
                    Control de Cálculo de Crafteo
                  </span>
                  {isStale && hasCalculated && (
                    <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                      Modificaciones sin recalcular
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Presiona para calcular costes de materiales, RRR ({calculationResult.effectiveReturnRatePercent}%), nutrición y diarios sin residuos de cálculos anteriores.
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
                  id="btn-calculate-equipment-crafting"
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
                    ? 'Dar Resultado / Calcular Crafteo'
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
                <h4 className="text-base font-bold text-slate-200">
                  Esperando Activación Manual
                </h4>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Configura la pieza ({currentRecipe.nameEs} T{config.tier}.{config.enchantment}), los precios de materiales y presiona el botón{' '}
                  <strong className="text-amber-300">"Dar Resultado / Calcular Crafteo"</strong> para ver el desglose financiero, RRR y balance neto.
                </p>
              </div>
            ) : (
              <>
            {/* Veredicto de Ganancia o Pérdida Neta */}
            <div className={`rounded-xl border p-5 shadow-2xl transition-all ${
              calculationResult.isProfitable
                ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/40'
                : 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/40'
            }`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Balance Limpio del Lote
                </span>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full uppercase ${
                  calculationResult.isProfitable
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {calculationResult.isProfitable ? 'Rentable' : 'Pérdida Neta'}
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="text-xs text-slate-400 mb-1">
                  Ganancia Neta Total ({config.batchCount} piezas T{config.tier}):
                </div>
                <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums ${
                  calculationResult.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {calculationResult.netProfit >= 0 ? '+' : ''}
                  {formatSilver(calculationResult.netProfit)}
                </div>
                <div className="flex items-center justify-center gap-3 mt-2 text-xs font-semibold">
                  <span className="text-slate-300">
                    Por unidad: <span className="font-mono text-amber-300 font-bold tabular-nums">{formatSilver(calculationResult.profitPerUnit)}</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    ROI: <span className="font-mono text-cyan-300 font-bold tabular-nums">{calculationResult.roiPercent}%</span>
                  </span>
                </div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Tasa Retorno RRR</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm tabular-nums">
                    {calculationResult.effectiveReturnRatePercent}%
                  </span>
                  <div className="text-[10px] text-slate-500 tabular-nums">
                    Devuelve +{formatSilver(calculationResult.returnedMaterialValue)}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Plata por Foco</span>
                  <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">
                    {config.useFocus ? `${calculationResult.silverPerFocusPoint} 🪙/foco` : 'No usado'}
                  </span>
                  <div className="text-[10px] text-slate-500">
                    {config.useFocus ? 'Eficiencia de crafteo' : 'Crafteo a mano limpia'}
                  </div>
                </div>
              </div>

              {/* Desglose Contable Transparente */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-400">
                  <span>(-) Coste Materiales Bruto:</span>
                  <span className="tabular-nums">-{formatSilver(calculationResult.grossMaterialCost)}</span>
                </div>
                <div className="flex justify-between text-cyan-400">
                  <span>(+) Materiales Devueltos (RRR):</span>
                  <span className="tabular-nums">+{formatSilver(calculationResult.returnedMaterialValue)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>(-) Tasa Parcela Nutrición:</span>
                  <span className="tabular-nums">-{formatSilver(calculationResult.stationFeeTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>(+) Venta Ítems (restando {calculationResult.marketTaxPercent + calculationResult.setupFeePercent}% tax):</span>
                  <span className="tabular-nums">+{formatSilver(calculationResult.netItemSales)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold border-t border-slate-800 pt-1">
                  <span>(+) Aporte Neto de Diarios:</span>
                  <span className="tabular-nums">+{formatSilver(calculationResult.netJournalsProfit)}</span>
                </div>
              </div>
            </div>

            {/* Comparación Rápida de Diarios en Tarjeta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <BookOpen size={15} className="text-amber-400" />
                Vía de Escape para tus {calculationResult.journalsFilledCount} Diarios
              </h4>

              <div className="space-y-2 text-xs">
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  calculationResult.journalComparison.recommendedStrategy === 'sell_filled'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div>
                    <div className="font-bold">1. Venta en Mercado</div>
                    <div className="text-[10px] text-slate-400">Plata inmediata sin casas</div>
                  </div>
                  <div className="font-mono font-bold text-right tabular-nums">
                    +{formatSilver(calculationResult.journalComparison.sellFilledNetProfit)}
                  </div>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  calculationResult.journalComparison.recommendedStrategy === 'use_labourers'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <div>
                    <div className="font-bold">2. Entregar a Trabajadores</div>
                    <div className="text-[10px] text-slate-400">Recuperas materiales (+125%)</div>
                  </div>
                  <div className="font-mono font-bold text-right tabular-nums">
                    +{formatSilver(calculationResult.journalComparison.useLabourersNetProfit)}
                  </div>
                </div>
              </div>

              {onNavigateToLabourers && (
                <button
                  type="button"
                  onClick={() => onNavigateToLabourers(
                    currentRecipe.associatedLabourer,
                    config.tier,
                    calculationResult.journalsFilledCount
                  )}
                  className="w-full mt-2 py-2.5 px-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Building size={15} className="text-emerald-400" />
                  <span>🔗 Cadena de Producción: Analizar {calculationResult.journalsFilledCount} Diarios con Trabajadores</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {/* Tarjeta de Calidad y Ensaladas */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Crown size={15} className="text-amber-400" />
                  Probabilidades de Calidad ({calculationResult.qualityMetrics.saladNameEs})
                </h4>
                {calculationResult.qualityMetrics.estimatedQualityBonusSilverPerItem > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    +~{calculationResult.qualityMetrics.estimatedQualityBonusSilverPerItem.toLocaleString()} 🪙/ud
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Normal</span>
                  <span className="font-mono text-slate-300">{calculationResult.qualityMetrics.normalPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: `${calculationResult.qualityMetrics.normalPercent}%` }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-300 font-medium">Bueno (+20 IP)</span>
                  <span className="font-mono text-slate-200">{calculationResult.qualityMetrics.goodPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${calculationResult.qualityMetrics.goodPercent}%` }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-purple-300 font-medium">Notable (+40 IP)</span>
                  <span className="font-mono text-purple-200">{calculationResult.qualityMetrics.outstandingPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${calculationResult.qualityMetrics.outstandingPercent}%` }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-amber-300 font-bold">Excelente (+60 IP)</span>
                  <span className="font-mono text-amber-200">{calculationResult.qualityMetrics.excellentPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${calculationResult.qualityMetrics.excellentPercent}%` }} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-rose-400 font-black">Obra Maestra (+100 IP)</span>
                  <span className="font-mono text-rose-300 font-bold">{calculationResult.qualityMetrics.masterpiecePercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${Math.min(100, calculationResult.qualityMetrics.masterpiecePercent * 5)}%` }} />
                </div>
              </div>
            </div>

            {/* Rendimiento Diario con 10.000 Puntos de Foco */}
            {config.useFocus && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400 fill-amber-400" />
                    Potencial con 10.000 de Foco Diario
                  </h4>
                  <span className="text-[10px] text-amber-400 font-mono font-bold tabular-nums">
                    {calculationResult.masteryMetrics.actualFocusCostPerItem} foco/ud
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Piezas Diarias</span>
                    <span className="font-mono font-bold text-cyan-300 text-sm tabular-nums">
                      {calculationResult.masteryMetrics.itemsCraftableWith10k} uds
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Ganancia Neta Diaria</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                      +{formatSilver(calculationResult.masteryMetrics.dailyFocusSilverProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recomendaciones Tácticas */}
            {calculationResult.recommendations.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Info size={14} className="text-cyan-400" />
                  Observaciones Tácticas de Albion:
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  {calculationResult.recommendations.map((rec, i) => (
                    <p key={i} className="leading-relaxed">
                      {rec}
                    </p>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SUB-VISTA: MAESTRÍA DE LA TABLA DEL DESTINO (DESTINY BOARD & FOCUS SPECS) */}
      {activeTabSubView === 'mastery' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Target size={20} className="text-amber-400" />
                  Calculadora de Maestría de Crafteo y Eficiencia de Foco
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  En Albion Online, la maestría en la Tabla del Destino no aumenta el RRR, sino que <span className="text-amber-300 font-bold">reduce drásticamente el coste de foco por pieza</span> según una curva exponencial de potencias de 2.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Eficiencia Total</div>
                  <div className="text-lg font-black font-mono text-amber-400">
                    {calculationResult.masteryMetrics.totalFCE.toLocaleString()} FCE
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Ahorro Foco</div>
                  <div className="text-lg font-black font-mono text-emerald-400">
                    -{calculationResult.masteryMetrics.focusDiscountPercent}%
                  </div>
                </div>
              </div>
            </div>

            {/* Fila de Sliders de Especializaciones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Especialización Directa del Ítem */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Crosshair size={15} className="text-amber-400" />
                    Especialista en {currentRecipe.nameEs}
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {config.itemSpecLevel} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Otorga <span className="text-amber-300 font-bold">+250 FCE directo</span> por nivel a este ítem específico (+30 a la subfamilia).
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.itemSpecLevel}
                  onChange={(e) => updateConfig({ itemSpecLevel: Number(e.target.value) })}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Nivel 0 (0 FCE)</span>
                  <span>Nivel 100 (+25.000 FCE)</span>
                </div>
              </div>

              {/* 2. Artesano General de la Rama */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Anvil size={15} className="text-cyan-400" />
                    Nivel de Artesano de la Rama
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {config.crafterMasteryLevel} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Desbloquea el crafteo de Tiers superiores (T4 a T8) y aporta <span className="text-cyan-300 font-bold">+30 FCE</span> por nivel a todas las armas/piezas de la rama.
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.crafterMasteryLevel}
                  onChange={(e) => updateConfig({ crafterMasteryLevel: Number(e.target.value) })}
                  className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Nivel 0 (0 FCE)</span>
                  <span>Nivel 100 (+3.000 FCE)</span>
                </div>
              </div>

              {/* 3. Otras Especializaciones de la Misma Familia */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Layers size={15} className="text-purple-400" />
                    Otras Specs de la Familia (Promedio)
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {config.otherSpecsAverageLevel} / 100
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tener nivel en las demás armas de la misma familia (ej. Espada Ancha, Doble, Espadón) suma <span className="text-purple-300 font-bold">+30 FCE por nivel</span> en cada una.
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={config.otherSpecsAverageLevel}
                  onChange={(e) => updateConfig({ otherSpecsAverageLevel: Number(e.target.value) })}
                  className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>0 specs (+0)</span>
                  <span>Todas a 100 (+18.000 FCE)</span>
                </div>
              </div>
            </div>

            {/* Comparador de Foco: Antes vs Ahora vs Máximo Posible */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-xs">Costo Base sin Maestría:</span>
                <div className="text-xl font-mono font-bold text-slate-300">
                  {calculationResult.masteryMetrics.baseFocusCostPerItem.toLocaleString()} foco
                </div>
                <div className="text-[11px] text-slate-500">
                  Con 10k foco sólo puedes hacer ~{Math.max(1, Math.floor(10000 / calculationResult.masteryMetrics.baseFocusCostPerItem))} unidades
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-1">
                <span className="text-amber-400 block text-xs font-bold">Tu Costo Actual con Maestría:</span>
                <div className="text-2xl font-mono font-black text-amber-400">
                  {calculationResult.masteryMetrics.actualFocusCostPerItem.toLocaleString()} foco
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  -{calculationResult.masteryMetrics.focusDiscountPercent}% reducción ({calculationResult.masteryMetrics.itemsCraftableWith10k} uds con 10k)
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-xs">Con Max Spec (700/700 en la Rama):</span>
                <div className="text-xl font-mono font-bold text-cyan-300">
                  ~{Math.max(1, Math.round(calculationResult.masteryMetrics.baseFocusCostPerItem * 0.08))} foco
                </div>
                <div className="text-[11px] text-slate-500">
                  -92% reducción (más de 12x piezas con el mismo foco)
                </div>
              </div>
            </div>

            {/* Explicación Teórica de la Fórmula de Albion Online */}
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-200 flex items-center gap-2">
                <Info size={16} className="text-cyan-400" />
                Fórmula Oficial de Reducción de Foco de Albion Online:
              </div>
              <p className="text-slate-400 leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 text-amber-300">
                Costo_Foco_Final = Costo_Base × 2^(-FCE / 10000)
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Por cada <strong className="text-slate-200">10.000 FCE</strong> acumulados, el costo de foco se reduce a la mitad (-50%).</li>
                <li>Con <strong className="text-slate-200">20.000 FCE</strong>, el costo se reduce al 25% (-75% de descuento).</li>
                <li>Con <strong className="text-slate-200">30.000 FCE</strong> (especialista 100 + artesano 100 + familia), el costo baja al 12.5% (-87.5%).</li>
                <li>Subir la maestría convierte un crafteo que apenas deja plata en una de las mayores fuentes de beneficio diario de Albion Online.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO ALTERNATIVO: COMPARADOR PROFUNDO DE DIARIOS */}
      {activeTabSubView === 'journal_comparison' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen size={18} className="text-amber-400" />
              Comparador de Destino de Diarios de Crafteo
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ¿Qué te deja más plata con los libros de este crafteo? ¿Venderlos en el mercado o entregarlos en tu casa de isla?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opción A: Venta en Mercado */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-400" />
                  Opción A: Venta Directa en Mercado
                </div>
                <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 font-mono">
                  {calculationResult.journalsFilledCount} Diarios Llenos
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-400">
                  <span>Compra Diarios Vacíos ({calculationResult.journalsFilledCount} x {formatSilver(prices[emptyJournalKey] || 0)}):</span>
                  <span className="text-rose-400 tabular-nums">-{formatSilver(calculationResult.emptyJournalsInvestmentCost)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Venta Diarios Llenos Bruta:</span>
                  <span className="tabular-nums">+{formatSilver(calculationResult.journalsFilledCount * (prices[filledJournalKey] || 0))}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Impuesto Mercado ({config.hasPremium ? '6.5%' : '10.5%'}):</span>
                  <span className="tabular-nums">-{formatSilver(Math.round(calculationResult.journalsFilledCount * (prices[filledJournalKey] || 0) * (config.hasPremium ? 0.065 : 0.105)))}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-amber-400">
                  <span>Beneficio Neto Venta:</span>
                  <span className="tabular-nums">+{formatSilver(calculationResult.journalComparison.sellFilledNetProfit)}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg text-xs text-slate-400">
                <span className="font-bold text-slate-300 block mb-1">Ventajas:</span>
                • No requiere invertir piedras en construir casas ni comprar camas/mesas.<br />
                • Plata 100% líquida e inmediata en tu bolsillo.
              </div>
            </div>

            {/* Opción B: Trabajadores en Casa */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Building size={16} className="text-emerald-400" />
                  Opción B: Enviar a Trabajadores en Isla
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  Rendimiento 125%
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-400">
                  <span>Inversión en Diarios Vacíos:</span>
                  <span className="text-rose-400 tabular-nums">-{formatSilver(calculationResult.emptyJournalsInvestmentCost)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Valor de Materiales Devueltos:</span>
                  <span className="tabular-nums">+{formatSilver(Math.round(calculationResult.journalComparison.useLabourersNetProfit + calculationResult.emptyJournalsInvestmentCost))}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-emerald-400">
                  <span>Beneficio Neto en Recursos:</span>
                  <span className="tabular-nums">+{formatSilver(calculationResult.journalComparison.useLabourersNetProfit)}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg text-xs text-slate-400">
                <span className="font-bold text-slate-300 block mb-1">Ventajas:</span>
                • Te abastece de materiales refinados para el siguiente lote sin ir al mercado.<br />
                • En casas T{config.tier + 1} con felicidad máxima, el retorno supera por mucho a la venta directa.
              </div>

              {onNavigateToLabourers && (
                <button
                  type="button"
                  onClick={() => onNavigateToLabourers()}
                  className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Building size={16} />
                  Configurar Casas y Trabajadores T{config.tier + 1}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
