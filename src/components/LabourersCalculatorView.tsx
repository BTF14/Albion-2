import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Hammer,
  TrendingUp,
  Sparkles,
  Info,
  Clock,
  Layers,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Package,
  Anvil,
  ArrowRight,
  Truck,
  Calculator,
} from 'lucide-react';
import { useLabourersEconomy } from '../hooks/useLabourersEconomy';
import { LabourerType } from '../domain';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface LabourersCalculatorViewProps {
  onNavigateToEquipmentCrafting?: () => void;
  onNavigateToTransport?: () => void;
  targetLabourerType?: LabourerType | null;
  targetJournalTier?: number | null;
  targetJournalsCount?: number | null;
  onClearTarget?: () => void;
}

export const LabourersCalculatorView: React.FC<LabourersCalculatorViewProps> = ({
  onNavigateToEquipmentCrafting,
  onNavigateToTransport,
  targetLabourerType,
  targetJournalTier,
  targetJournalsCount,
  onClearTarget,
}) => {
  const {
    config,
    updateConfig,
    resetToDefaults,
    labourerDef,
    houseTierInfo,
    calculatedHouseCost,
    totalFurnitureCost,
    totalContractCost,
    economicResult,
    catalog,
    houseTiers,
  } = useLabourersEconomy();

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleConfigChange = (newConfig: Parameters<typeof updateConfig>[0]) => {
    updateConfig(newConfig);
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

  // Sincronización cuando se llega desde la Cadena de Crafteo
  useEffect(() => {
    if (targetLabourerType) {
      updateConfig({
        labourerType: targetLabourerType,
        journalTier: targetJournalTier && targetJournalTier >= 4 && targetJournalTier <= 8 ? targetJournalTier : config.journalTier,
        labourerTier: targetJournalTier && targetJournalTier >= 4 && targetJournalTier <= 8 ? Math.min(8, targetJournalTier + 1) : config.labourerTier,
        houseTier: targetJournalTier && targetJournalTier >= 4 && targetJournalTier <= 8 ? Math.min(8, targetJournalTier + 1) : config.houseTier,
        labourersCount: targetJournalsCount && targetJournalsCount > 0 ? Math.min(30, targetJournalsCount) : config.labourersCount,
      });
      if (onClearTarget) {
        onClearTarget();
      }
    }
  }, [targetLabourerType, targetJournalTier, targetJournalsCount]);

  const isTierOptimal = config.houseTier > config.journalTier && config.labourerTier > config.journalTier;
  const isTierEqual = config.houseTier === config.journalTier && config.labourerTier === config.journalTier;
  const isTierMismatched = config.labourerTier < config.journalTier;

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
          <Home size={180} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
              <Users size={14} /> Sistema de Casas & Trabajadores (Labourers)
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Calculadora de Inversión y Retorno de Trabajadores
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Simula la rentabilidad de tus trabajadores de recolección (Leñador, Cantero, etc.) y crafteo (Herrero, Flechero, etc.).
              Calcula el impacto de la felicidad de la casa, los diarios llenos vs vacíos y el tiempo de amortización con tus propios precios.
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition self-start md:self-auto"
            title="Restablecer valores por defecto"
          >
            <RotateCcw size={14} /> Restablecer
          </button>
        </div>

        {/* Aviso de Fidelidad de Albion Online */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2.5">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>
            <strong>Mecánica oficial de Albion:</strong> No existen trabajadores de granja ni cocina. Los trabajadores se alimentan con{' '}
            <strong>diarios de recolección, crafteo o mercenario</strong> llenados por el jugador o comprados en el mercado.
            Retornan recursos en <strong>22 horas</strong> con un rendimiento de hasta <strong>150%</strong> si la casa y el trabajador superan en 1 tier al diario.
          </span>
        </div>
      </div>

      {/* Grid de Configuración y Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configuración del Trabajador y la Casa (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Selección de Trabajador y Tier */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users size={18} className="text-emerald-400" />
              1. Selección de Especialización
            </h3>

            {/* Selector de Profesión */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Tipo de Trabajador (Labourer)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catalog.map((l) => {
                  const isSelected = l.id === config.labourerType;
                  return (
                    <button
                      key={l.id}
                      onClick={() => updateConfig({ labourerType: l.id })}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-100">{l.nameEs}</span>
                      <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        {l.category === 'gathering' ? '⛏️ Recolección' : l.category === 'crafting' ? '🔨 Crafteo' : '⚔️ Combate'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ficha técnica del trabajador seleccionado */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Diario requerido:</span>
                <span className="font-bold text-amber-400">{labourerDef.journalNameEs}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Recursos devueltos:</span>
                <span className="font-mono text-emerald-400">{labourerDef.primaryReturnsEs}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Trofeo de especialidad:</span>
                <span className="text-cyan-400">{labourerDef.specialistTrophyNameEs}</span>
              </div>
            </div>

            {/* Tiers: Casa vs Trabajador vs Diario */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Home size={14} className="text-amber-400" /> Tier de Casa
                </label>
                <select
                  value={config.houseTier}
                  onChange={(e) => updateConfig({ houseTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {houseTiers.map((h) => (
                    <option key={h.tier} value={h.tier}>
                      T{h.tier} - {h.nameEs}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Users size={14} className="text-emerald-400" /> Tier Trabajador
                </label>
                <select
                  value={config.labourerTier}
                  onChange={(e) => updateConfig({ labourerTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Tier {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Award size={14} className="text-cyan-400" /> Tier de Diario
                </label>
                <select
                  value={config.journalTier}
                  onChange={(e) => updateConfig({ journalTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Diario Tier {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cantidad de Trabajadores */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Cantidad de Trabajadores a Simular
                </label>
                <span className="text-xs text-slate-400">
                  (Máx {houseTierInfo.maxLabourers} por casa personal / 15 en Guild Hall)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={config.labourersCount}
                  onChange={(e) => updateConfig({ labourersCount: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <span className="font-mono font-bold text-emerald-400 text-base bg-slate-950 px-3 py-1 rounded border border-slate-800 min-w-[3rem] text-center">
                  {config.labourersCount}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Precios Manuales de Mercado de Diarios y Retornos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign size={18} className="text-amber-400" />
              2. Precios Manuales de Diarios y Recursos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Diario Lleno T{config.journalTier} (Compra)
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={config.filledJournalPrice || 0}
                    onChange={(val) => updateConfig({ filledJournalPrice: val })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500 pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">🪙</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Si lo llenas tú mismo, pon 0.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Diario Vacío (Reventa)
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={config.emptyJournalResellPrice || 0}
                    onChange={(val) => updateConfig({ emptyJournalResellPrice: val })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500 pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">🪙</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">El trabajador te lo devuelve vacío.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor Estimado de Retorno (Base)
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={config.estimatedReturnSilverValue || 0}
                    onChange={(val) => updateConfig({ estimatedReturnSilverValue: val })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">🪙</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Plata al vender los recursos que trae.</span>
              </div>
            </div>
          </div>

          {/* 3. Costes de Construcción e Instalación (Amortización Opcional) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Hammer size={18} className="text-cyan-400" />
              3. Coste de Construcción y Mobiliario (Amortización)
            </h3>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span>Materiales de la Casa T{houseTierInfo.tier}:</span>
                <span className="font-semibold text-slate-200">
                  {houseTierInfo.stoneBlocksNeeded} {houseTierInfo.stoneTypeEs} + {houseTierInfo.roughLogsNeeded} Troncos + {houseTierInfo.roughStoneNeeded} Piedra
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Coste calculado de la estructura:</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">{formatSilver(calculatedHouseCost)} 🪙</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Precio Bloque de Piedra T{houseTierInfo.tier}</label>
                <NumericInput
                  min={0}
                  value={config.stoneBlockUnitPrice || 0}
                  onChange={(val) => updateConfig({ stoneBlockUnitPrice: val })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Muebles por Trabajador (Cama + Mesa + Trofeos)</label>
                <NumericInput
                  min={0}
                  value={config.furnitureCostPerLabourer || 0}
                  onChange={(val) => updateConfig({ furnitureCostPerLabourer: val })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Contrato por Trabajador (Contratar/Comprar)</label>
                <NumericInput
                  min={0}
                  value={config.contractCostPerLabourer || 0}
                  onChange={(val) => updateConfig({ contractCostPerLabourer: val })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Métricas Económicas, Rendimiento y ROI (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-emerald-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Cálculo de Trabajadores
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para calcular rendimiento ({economicResult.returnYieldPercent}%), balance diario y amortización sin interferencias de sesiones previas.
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
                id="btn-calculate-labourers-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 ring-2 ring-emerald-400/40 shadow-emerald-500/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Trabajadores'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Calculator size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Esperando Activación Manual
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Configura el tipo de trabajador ({labourerDef.nameEs}), el tier de casa/diario y presiona el botón{' '}
                <strong className="text-emerald-300">"Dar Resultado / Calcular Trabajadores"</strong> para ver el rendimiento, beneficios netos y amortización.
              </p>
            </div>
          ) : (
            <>
          {/* Panel de Felicidad y Rendimiento */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                Felicidad & Rendimiento
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isTierOptimal
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isTierEqual
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isTierOptimal ? 'Óptimo (+1 Tier)' : isTierEqual ? 'Mismo Tier' : 'Tier Incompatible'}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Rendimiento de Recursos</span>
                <span className={`text-3xl font-black font-mono tabular-nums ${
                  economicResult.returnYieldPercent >= 125
                    ? 'text-emerald-400'
                    : economicResult.returnYieldPercent > 0
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {economicResult.returnYieldPercent}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Multiplicador de botín</span>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Ciclo de Trabajo</span>
                <span className="text-3xl font-black font-mono tabular-nums text-cyan-400">
                  {economicResult.cycleDurationHours}h
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Sincronizado a cosechas</span>
              </div>
            </div>

            {/* Barra de progreso visual de felicidad */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Puntuación de Felicidad:</span>
                <span className="font-mono font-bold text-amber-400">
                  {economicResult.happinessScore} / {economicResult.maxHappinessPossible} pts
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    economicResult.returnYieldPercent >= 125
                      ? 'bg-emerald-500'
                      : economicResult.returnYieldPercent > 0
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((economicResult.happinessScore / (economicResult.maxHappinessPossible || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de Ganancias y Balance Neto */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Proyección de Ganancias ({config.labourersCount} Trabajadores)
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Ingreso Bruto por Ciclo (22h):</span>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  +{formatSilver(economicResult.totalDailyGross)} 🪙
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Coste Neto de Diarios ({config.labourersCount} un):</span>
                <span className="font-mono font-bold text-rose-400 tabular-nums">
                  -{formatSilver(economicResult.dailyJournalNetCost * config.labourersCount)} 🪙
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-emerald-950/30 rounded-lg border border-emerald-500/40">
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">Ganancia Neta por Ciclo (22h)</span>
                  <span className="text-[10px] text-emerald-400/80">Para los {config.labourersCount} trabajadores</span>
                </div>
                <span className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
                  +{formatSilver(economicResult.totalDailyNetProfit)} 🪙
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">Proyección Mensual (30 ciclos)</span>
                  <span className="font-mono font-bold text-emerald-400 text-base tabular-nums">
                    +{formatSilver(economicResult.totalMonthlyNetProfit)} 🪙
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block mb-1">Retorno sobre Diario (ROI)</span>
                  <span className="font-mono font-bold text-cyan-400 text-base tabular-nums">
                    +{economicResult.roiPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Amortización de Inversión */}
            {economicResult.initialSetupInvestment > 0 && (
              <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Inversión Inicial Total:</span>
                  <span className="font-mono font-bold text-slate-200 tabular-nums">
                    {formatSilver(economicResult.initialSetupInvestment)} 🪙
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Tiempo de Amortización:</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {economicResult.daysToAmortize > 0 ? `~${economicResult.daysToAmortize} días` : 'Inmediato / Sin ganancia'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Recomendaciones Tácticas */}
          {economicResult.recommendations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Consejos Tácticos
              </h4>
              <div className="space-y-2">
                {economicResult.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón de Enlace al Taller de Crafteo */}
          {onNavigateToEquipmentCrafting && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Anvil size={15} /> ¿Fabricas tu propio equipo para llenar estos diarios?
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Calcula el coste de materiales, bonos de ciudad y RRR en la Calculadora de Crafteo.
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigateToEquipmentCrafting}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-md cursor-pointer"
              >
                Ir a Crafteo
                <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Botón de Enlace a Rutas de Transporte & Arbitraje de Mercado */}
          {onNavigateToTransport && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 via-slate-900 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Truck size={15} /> 🔗 Cadena de Producción: ¿Transportar y Vender Recursos Devueltos?
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Calcula capacidad de carga de bueyes/mamuts y arbitraje de precios hacia Caerleon u otras Ciudades Reales.
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigateToTransport}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-md cursor-pointer"
              >
                Rutas de Transporte
                <ArrowRight size={13} />
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
