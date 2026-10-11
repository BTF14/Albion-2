import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Castle,
  Home,
  Users,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Layers,
  Award,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Package,
  ArrowRight,
  Shield,
  Coins,
  Calculator,
  Bed,
  MapPin,
  Download,
  ClipboardList,
  Check,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { useGuildIslandEconomy } from '../hooks/useGuildIslandEconomy';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import { CityId, DailyChecklistItem } from '../types';
import { CITIES } from '../data/items';
import { loadCharacters, loadChecklist, saveChecklist } from '../utils/storage';
import { sanitizeCsvCell } from '../domain/use-cases/exportHistoryToCsv';

interface Props {
  currentCityId?: CityId;
  onNavigateToEquipmentCrafting?: () => void;
  onNavigateToLabourers?: () => void;
}

export const GuildIslandLabourersView: React.FC<Props> = ({
  currentCityId,
  onNavigateToEquipmentCrafting,
  onNavigateToLabourers,
}) => {
  const {
    config,
    updateConfig,
    resetToDefaults,
    result,
    islandLevels,
    guildHallTiers,
    labourersCatalog,
    currentIslandLevelInfo,
    currentGuildHallInfo,
    currentLabourerDef,
  } = useGuildIslandEconomy(currentCityId);

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpiar temporizador del toast para prevenir fugas de memoria
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Cargar islas pertenecientes a perfiles de personajes
  const characterIslands = useMemo(() => {
    try {
      const chars = loadCharacters();
      const list: { charName: string; islandName: string; cityId: CityId; level: number }[] = [];
      chars.forEach((char) => {
        (char.islands || []).forEach((isl) => {
          list.push({
            charName: char.name,
            islandName: isl.name || `Isla de ${char.name}`,
            cityId: isl.cityId,
            level: isl.level,
          });
        });
      });
      return list;
    } catch {
      return [];
    }
  }, []);

  const handleSelectCharacterIsland = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const selected = characterIslands[Number(val)];
    if (selected) {
      handleConfigChange({
        islandCityId: selected.cityId,
        islandLevel: Math.max(1, Math.min(6, selected.level || 1)),
      });
      showToast(`Isla "${selected.islandName}" (${selected.charName}) cargada en ${selected.cityId.toUpperCase()}`);
    }
  };

  const handleConfigChange = (changes: Parameters<typeof updateConfig>[0]) => {
    updateConfig(changes);
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

  const currentCity = CITIES.find((c) => c.id === config.islandCityId) || CITIES[0];

  // Añadir rutina a Tareas Diarias
  const handleAddTodoRoutine = () => {
    try {
      const currentList = loadChecklist();
      const newTask: DailyChecklistItem = {
        id: `guild_hall_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Entregar ${config.activeLabourersCount} diarios T${config.journalTier} (${currentLabourerDef.nameEs}) en Casa Gremial`,
        cityId: config.islandCityId,
        plotsCount: config.activeLabourersCount,
        harvested: false,
        replanted: false,
        usedFocus: false,
        category: 'island',
        isCustomTask: true,
        completed: false,
        notes: `Casa Gremial T${config.guildHallTier}. Retorno: ${result.returnYieldPercent}% RRR. Beneficio esperado: +${formatSilver(result.dailyNetProfitSilver)} 🪙.`,
        priority: 'high',
        createdAt: Date.now(),
      };
      saveChecklist([newTask, ...currentList]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('albion_storage_sync'));
      }
      showToast(`✅ Rutina de ${config.activeLabourersCount} diarios agregada a tus Tareas Diarias`);
    } catch {
      showToast('❌ Error al guardar tarea');
    }
  };

  // Exportar presupuesto gremial a CSV
  const handleExportCsv = () => {
    try {
      const headers = ['Concepto', 'Detalle / Cantidad', 'Coste Unitario (Plata)', 'Subtotal (Plata)'];
      const rows: string[][] = [
        [
          'Isla de Gremio',
          config.alreadyOwnsIsland
            ? `Nivel ${config.islandLevel} (Ya adquirida / Excluida)`
            : `Nivel ${config.islandLevel} (${currentIslandLevelInfo.nameEs}${config.includeGuildCreationCost ? ' + Gremio' : ''})`,
          '-',
          String(result.islandUpgradeCostSilver),
        ],
        ['Casa Gremial (Guild Hall)', `Tier ${config.guildHallTier} (${currentGuildHallInfo.nameEs})`, `${currentGuildHallInfo.stoneBlocksNeeded} bloques`, String(result.guildHallConstructionCostSilver)],
        ['Camas Gremiales', `${result.totalLabourersCount} camas Tier ${config.bedTier}`, String(config.bedUnitPrice), String(result.totalLabourersCount * config.bedUnitPrice)],
        ['Mesas Gremiales', `${Math.ceil(result.totalLabourersCount / 4)} mesas Tier ${config.tableTier}`, String(config.tableUnitPrice), String(Math.ceil(result.totalLabourersCount / 4) * config.tableUnitPrice)],
        ['Juegos de Trofeos', `${1 + (config.simulationScope === 'full_island' ? config.additionalHousesCount : 0)} juegos completos`, String(config.trophySetCost), String((1 + (config.simulationScope === 'full_island' ? config.additionalHousesCount : 0)) * config.trophySetCost)],
        ['Contratos de Trabajadores', `${result.totalLabourersCount} trabajadores Tier ${config.labourerTier}`, String(config.contractCostPerLabourer), String(result.contractsTotalCostSilver)],
        ['INVERSION TOTAL INICIAL', 'Presupuesto completo de habilitacion', '-', String(result.totalInitialInvestmentSilver)],
        ['INGRESOS BRUTOS DIARIOS', `${result.totalLabourersCount} trabajadores (${result.returnYieldPercent}% retorno)`, '-', String(result.dailyGrossRevenueSilver)],
        ['COSTES DIARIOS DE DIARIOS', 'Compra de llenos menos reventa de vacios', '-', String(result.dailyJournalsNetCostSilver)],
        ['BENEFICIO NETO DIARIO (22H)', 'Plata neta por ciclo', '-', String(result.dailyNetProfitSilver)],
        ['BENEFICIO NETO MENSUAL (30 CICLOS)', 'Plata neta acumulada en 30 ciclos', '-', String(result.monthlyNetProfitSilver)],
        ['TIEMPO DE AMORTIZACION (PAYBACK)', 'Recuperacion de inversion', '-', Number.isFinite(result.paybackDays) ? `${result.paybackDays} dias` : 'Inviable'],
        ['ROI ANUALIZADO ESTIMADO', 'Rentabilidad porcentual anual', '-', `${result.annualRoiPercent}%`],
      ];

      const csvContent = [
        headers.map(sanitizeCsvCell).join(','),
        ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `presupuesto_isla_gremio_${config.islandCityId}_n${config.islandLevel}_t${config.guildHallTier}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📊 Presupuesto descargado en CSV compatible con Excel');
    } catch {
      showToast('❌ Error al exportar archivo');
    }
  };

  return (
    <div id="guild-island-calculator-container" className="space-y-6">
      {/* Notificación Toast Temporal */}
      {toastMessage && (
        <div className="bg-purple-950/90 border border-purple-500 text-purple-100 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between text-xs font-semibold backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-purple-300 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-purple-400 hover:text-purple-200 ml-4 p-1 rounded hover:bg-purple-900/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
          <Castle size={200} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-2">
              <Castle size={14} /> Imperio de Gremios & Casas Gremiales
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>Isla del Gremio & Casa Gremial (Guild Hall)</span>
              <span className="text-xs bg-purple-950/80 text-purple-300 border border-purple-700/60 font-mono font-bold px-2 py-0.5 rounded-full">
                15 Trabajadores / Isla N1-N6
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Calcula los costes de compra y expansión de tu isla de gremio, construcción de la Casa Gremial (T2 a T8),
              equipamiento de 15 camas, mesas y trofeos, y el tiempo exacto de amortización (ROI) con tus precios de mercado.
            </p>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition self-start md:self-auto cursor-pointer"
            title="Restablecer valores por defecto"
          >
            <RotateCcw size={14} /> Restablecer
          </button>
        </div>

        {/* Aviso de Fidelidad Oficial de Albion Online */}
        <div className="mt-4 p-3 bg-purple-950/40 border border-purple-500/30 rounded-lg text-xs text-purple-200 flex items-start gap-2.5">
          <Info size={16} className="text-purple-400 shrink-0 mt-0.5" />
          <span>
            <strong>Mecánica oficial de Albion:</strong> Las islas de gremio poseen una <strong>parcela especial de Casa Gremial</strong> que admite hasta <strong>15 trabajadores</strong> bajo un mismo techo (frente a los 3 de una casa normal).
            Además, una isla Nivel 6 dispone de <strong>14 parcelas estándar</strong> permitiendo construir hasta 14 casas adicionales (42 trabajadores extra = 57 trabajadores totales).
          </span>
        </div>
      </div>

      {/* Grid de Configuración y Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configuración de la Isla y Casa Gremial (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Nivel de Isla de Gremio y Alcance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Castle size={18} className="text-purple-400" />
              1. Isla del Gremio & Alcance de Expansión
            </h3>

            {/* Selector de Isla de Personaje si existen en Alts */}
            {characterIslands.length > 0 && (
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg">
                <label className="block text-xs font-semibold text-purple-300 mb-1.5 flex items-center gap-1.5">
                  <Castle size={14} className="text-purple-400" />
                  Cargar Isla Registrada de tus Personajes (Alts):
                </label>
                <select
                  defaultValue=""
                  onChange={handleSelectCharacterIsland}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
                >
                  <option value="" disabled>Selecciona una isla registrada en tu imperio...</option>
                  {characterIslands.map((isl, idx) => (
                    <option key={idx} value={String(idx)}>
                      {isl.islandName} ({isl.charName} - {isl.cityId.toUpperCase()} Nivel {isl.level})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <MapPin size={14} className="text-amber-400" /> Sede de la Isla de Gremio
                </label>
                <select
                  value={config.islandCityId}
                  onChange={(e) => handleConfigChange({ islandCityId: e.target.value as CityId })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Layers size={14} className="text-cyan-400" /> Nivel de Isla de Gremio
                </label>
                <select
                  value={config.islandLevel}
                  onChange={(e) => handleConfigChange({ islandLevel: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer font-mono"
                >
                  {islandLevels.map((lvl) => (
                    <option key={lvl.level} value={lvl.level}>
                      Nivel {lvl.level} - {lvl.buildingPlotsCount} solares estándar ({formatSilver(lvl.cumulativeCostSilver)} 🪙)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ficha técnica de la Isla seleccionada */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Solares Estándar</span>
                <span className="font-mono font-bold text-slate-200">{currentIslandLevelInfo.buildingPlotsCount} solares</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Parcela Guild Hall</span>
                <span className="font-mono font-bold text-purple-400">1 Parcela Masiva</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Inversión en Isla</span>
                <span className="font-mono font-bold text-amber-400">{formatSilver(currentIslandLevelInfo.cumulativeCostSilver)} 🪙</span>
              </div>
            </div>

            {/* Opciones de Propiedad de la Isla y Creación de Gremio */}
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.alreadyOwnsIsland || false}
                  onChange={(e) => handleConfigChange({ alreadyOwnsIsland: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span className="text-xs text-slate-200">
                  <strong>Ya poseo esta Isla de Gremio</strong> (Excluir coste de adquisición de la amortización)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.includeGuildCreationCost || false}
                  onChange={(e) => handleConfigChange({ includeGuildCreationCost: e.target.checked })}
                  disabled={config.alreadyOwnsIsland}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 disabled:opacity-40 cursor-pointer"
                />
                <span className={`text-xs ${config.alreadyOwnsIsland ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                  Incluir tarifa de fundación de nuevo gremio (+1.000.000 🪙 oficial)
                </span>
              </label>

              <div className="text-[11px] text-purple-300/80 pt-1.5 border-t border-purple-500/20 flex items-center justify-between">
                <span>Costes oficiales actualizados (Post-Wild Blood):</span>
                <span className="font-mono font-bold text-amber-300">
                  {config.alreadyOwnsIsland ? '0 🪙 (Ya amortizada)' : `${formatSilver(currentIslandLevelInfo.cumulativeCostSilver + (config.includeGuildCreationCost ? 1000000 : 0))} 🪙`}
                </span>
              </div>
            </div>

            {/* Alcance de la Simulación */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Alcance del Complejo de Trabajadores
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleConfigChange({ simulationScope: 'hall_only' })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    config.simulationScope === 'hall_only'
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <Castle size={14} className="text-purple-400" />
                    <span>Solo Casa Gremial</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Hasta 15 trabajadores en el salón principal.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConfigChange({ simulationScope: 'full_island' })}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    config.simulationScope === 'full_island'
                      ? 'bg-purple-950/40 border-purple-500 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                    <Home size={14} className="text-emerald-400" />
                    <span>Isla de Gremio Completa</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Guild Hall (15) + hasta {currentIslandLevelInfo.buildingPlotsCount} casas estándar (42 extra).
                  </span>
                </button>
              </div>

              {config.simulationScope === 'full_island' && currentIslandLevelInfo.buildingPlotsCount > 0 && (
                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">
                      Casas estándar adicionales construidas:
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {config.additionalHousesCount} / {currentIslandLevelInfo.buildingPlotsCount} casas
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={currentIslandLevelInfo.buildingPlotsCount}
                    value={config.additionalHousesCount}
                    onChange={(e) => handleConfigChange({ additionalHousesCount: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400">
                    Trabajadores adicionales: +{config.additionalHousesCount * 3} ({config.additionalHousesCount * 3 + config.activeLabourersCount} trabajadores en total).
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Casa Gremial (Tier y Trabajadores) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users size={18} className="text-emerald-400" />
              2. Casa Gremial & Trabajadores (Labourers)
            </h3>

            {/* Selector de Especialización del Trabajador */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Tipo de Trabajador en la Casa Gremial
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {labourersCatalog.map((l) => {
                  const isSelected = l.id === config.labourerType;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleConfigChange({ labourerType: l.id })}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-100 block">{l.nameEs}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                        {l.category === 'gathering' ? '⛏️ Recolección' : l.category === 'crafting' ? '🔨 Crafteo' : '⚔️ Combate'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tiers: Casa Gremial vs Trabajador vs Diario */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Castle size={14} className="text-purple-400" /> Tier Casa Gremial
                </label>
                <select
                  value={config.guildHallTier}
                  onChange={(e) => handleConfigChange({ guildHallTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer font-mono"
                >
                  {guildHallTiers.map((h) => (
                    <option key={h.tier} value={h.tier}>
                      T{h.tier} - Capacidad: {h.maxLabourers}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Requiere {currentGuildHallInfo.stoneBlocksNeeded.toLocaleString()} {currentGuildHallInfo.stoneTypeEs}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Users size={14} className="text-emerald-400" /> Tier Trabajador
                </label>
                <select
                  value={config.labourerTier}
                  onChange={(e) => handleConfigChange({ labourerTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer font-mono"
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
                  <Award size={14} className="text-cyan-400" /> Tier del Diario
                </label>
                <select
                  value={config.journalTier}
                  onChange={(e) => handleConfigChange({ journalTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer font-mono"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Diario Tier {t}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {config.labourerTier < config.journalTier
                    ? '⚠️ Trabajador inferior al diario (Incompatible)'
                    : config.guildHallTier > config.journalTier && config.labourerTier > config.journalTier
                    ? '🌟 +1 Tier: Retorno máximo (hasta 150%)'
                    : config.guildHallTier === config.journalTier
                    ? 'Mismo Tier: Retorno 100%-112%'
                    : '⚠️ Casa inferior al diario: Penalización'}
                </span>
              </div>
            </div>

            {/* Slider de Trabajadores en Guild Hall */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="font-semibold text-slate-300">
                  Trabajadores en la Casa Gremial:
                </span>
                <span className="font-mono font-bold text-purple-400">
                  {config.activeLabourersCount} / {currentGuildHallInfo.maxLabourers} permitidos en T{config.guildHallTier}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={currentGuildHallInfo.maxLabourers}
                value={config.activeLabourersCount}
                onChange={(e) => handleConfigChange({ activeLabourersCount: Number(e.target.value) })}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Mobiliario de la Casa Gremial & Trofeos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bed size={18} className="text-amber-400" />
              3. Mobiliario Gremial & Trofeos de Felicidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tier de Camas (1 por cada trabajador)
                </label>
                <select
                  value={config.bedTier}
                  onChange={(e) => handleConfigChange({ bedTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Cama Tier {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tier de Mesas Gremiales
                </label>
                <select
                  value={config.tableTier}
                  onChange={(e) => handleConfigChange({ tableTier: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Mesa Tier {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggles de Trofeos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hasGeneralistTrophies}
                  onChange={(e) => handleConfigChange({ hasGeneralistTrophies: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-300">
                  Trofeos Generales (Libros/Telescopios T2-T8)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-lg border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hasSpecialistTrophies}
                  onChange={(e) => handleConfigChange({ hasSpecialistTrophies: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-300">
                  Trofeos de Especialidad ({currentLabourerDef.specialistTrophyNameEs})
                </span>
              </label>
            </div>
          </div>

          {/* 4. Precios Manuales de Mercado de Diarios y Materiales */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign size={18} className="text-emerald-400" />
              4. Precios Manuales de Mercado (Diarios & Retornos)
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
                    onChange={(val) => handleConfigChange({ filledJournalPrice: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-purple-500 pr-8"
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
                    onChange={(val) => handleConfigChange({ emptyJournalResellPrice: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-purple-500 pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">🪙</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Valor de reventa del libro devuelto.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recursos Devueltos (Valor)
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={config.estimatedReturnSilverValue || 0}
                    onChange={(val) => handleConfigChange({ estimatedReturnSilverValue: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-purple-500 pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">🪙</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Valor base de mercado de los materiales.</span>
              </div>
            </div>

            {/* Precios de Materiales para Amortización */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Costes de Materiales de Construcción (Para Amortización):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bloque de Piedra T{config.guildHallTier}</label>
                  <NumericInput
                    min={0}
                    value={config.stoneBlockUnitPrice || 0}
                    onChange={(val) => handleConfigChange({ stoneBlockUnitPrice: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Cama Gremial T{config.bedTier}</label>
                  <NumericInput
                    min={0}
                    value={config.bedUnitPrice || 0}
                    onChange={(val) => handleConfigChange({ bedUnitPrice: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Mesa Gremial T{config.tableTier}</label>
                  <NumericInput
                    min={0}
                    value={config.tableUnitPrice || 0}
                    onChange={(val) => handleConfigChange({ tableUnitPrice: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Juego de Trofeos</label>
                  <NumericInput
                    min={0}
                    value={config.trophySetCost || 0}
                    onChange={(val) => handleConfigChange({ trophySetCost: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Control de Cálculo, Veredicto y Amortización (5 columnas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barra de Activación: Botón manual para Dar Resultado */}
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Calculator className="text-purple-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Control de Amortización Gremial
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Presiona para auditar la inversión de tu isla de gremio y retorno de tus {result.totalLabourersCount} trabajadores.
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
                id="btn-calculate-guild-island-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-2 ring-purple-400/40 shadow-purple-600/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700'
                }`}
              >
                <Calculator size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Calcular Amortización'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Calcular'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
                <Castle size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Esperando Activación Manual
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Configura el nivel de isla, tier de Casa Gremial y presiona{' '}
                <strong className="text-purple-300">"Dar Resultado / Calcular Amortización"</strong> para ver el flujo financiero y días exactos de recuperación de inversión.
              </p>
            </div>
          ) : (
            <>
              {/* Tarjeta de Veredicto Financiero Principal */}
              <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider block">
                      Balance Financiero Gremial (Ciclo 22h)
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono mt-1 text-emerald-400 tabular-nums">
                      {result.dailyNetProfitSilver >= 0 ? '+' : ''}
                      {formatSilver(result.dailyNetProfitSilver)} 🪙
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      +{formatSilver(result.monthlyNetProfitSilver)} 🪙 netos cada 30 días
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Retorno RRR</span>
                    <span className="font-mono text-base font-bold text-purple-400">
                      {result.returnYieldPercent}%
                    </span>
                  </div>
                </div>

                {/* Métricas Clave de Amortización */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tiempo de Amortización:</span>
                    <span className={`text-lg font-black font-mono block mt-0.5 ${
                      result.paybackDays <= 45 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {Number.isFinite(result.paybackDays) ? `${result.paybackDays} Días` : 'Inviable'}
                    </span>
                    <span className="text-[10px] text-slate-500">Recuperación de inversión</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ROI Anualizado:</span>
                    <span className="text-lg font-black font-mono text-cyan-400 block mt-0.5">
                      {result.annualRoiPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500">Rentabilidad sobre capital</span>
                  </div>
                </div>
              </div>

              {/* Desglose de Inversión Inicial Total */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Coins size={14} className="text-amber-400" />
                  Desglose de Inversión Inicial Requerida
                </h4>

                <div className="space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">
                      Isla de Gremio (Nivel {result.islandLevel}{config.alreadyOwnsIsland ? ' - Ya adquirida' : config.includeGuildCreationCost ? ' + Gremio' : ''}):
                    </span>
                    <span className="font-bold">
                      {result.islandUpgradeCostSilver === 0 ? (
                        <span className="text-emerald-400 font-normal">0 🪙 (Excluida)</span>
                      ) : (
                        `${formatSilver(result.islandUpgradeCostSilver)} 🪙`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Casa Gremial T{result.guildHallTier} ({currentGuildHallInfo.stoneBlocksNeeded} bloques):</span>
                    <span className="font-bold">{formatSilver(result.guildHallConstructionCostSilver)} 🪙</span>
                  </div>
                  {result.additionalHousesCostSilver > 0 && (
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 font-sans">Casas Estándar ({config.additionalHousesCount} solares):</span>
                      <span className="font-bold text-cyan-400">{formatSilver(result.additionalHousesCostSilver)} 🪙</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Mobiliario ({result.totalLabourersCount} camas + mesas + trofeos):</span>
                    <span className="font-bold">{formatSilver(result.furnitureTotalCostSilver)} 🪙</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Contratos de Trabajadores ({result.totalLabourersCount}x):</span>
                    <span className="font-bold">{formatSilver(result.contractsTotalCostSilver)} 🪙</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                    <span className="text-purple-300 font-sans">Inversión Total Requerida:</span>
                    <span className="text-amber-400">{formatSilver(result.totalInitialInvestmentSilver)} 🪙</span>
                  </div>
                </div>
              </div>

              {/* Desglose de Flujo de Operación Diario */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Clock size={14} className="text-cyan-400" />
                  Operación Diaria ({result.totalLabourersCount} Trabajadores / 22h)
                </h4>

                <div className="space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Ingreso Bruto de Recursos:</span>
                    <span className="text-emerald-400 font-bold">+{formatSilver(result.dailyGrossRevenueSilver)} 🪙</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Coste Neto de Diarios:</span>
                    <span className="text-rose-400 font-bold">-{formatSilver(result.dailyJournalsNetCostSilver)} 🪙</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Ganancia por Trabajador / Día:</span>
                    <span className="text-slate-200">~{formatSilver(result.profitPerLabourerDay)} 🪙/día</span>
                  </div>
                </div>
              </div>

              {/* Recomendaciones Tácticas */}
              <div className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed shadow-sm">
                    {rec}
                  </div>
                ))}
              </div>

              {/* Comparativa Estratégica: Guild Hall vs Casas Personales */}
              {result.comparisonVsHouses && (
                <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-5 shadow-lg space-y-3">
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <Castle size={14} className="text-purple-400" />
                    Comparativa: Guild Hall vs {result.comparisonVsHouses.equivalentHousesCount} Casas Personales T8
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">1 Casa Gremial (Guild Hall):</span>
                      <div className="text-slate-200 font-mono text-[11px]">
                        • 1 Parcela masiva usada<br />
                        • {result.comparisonVsHouses.guildHallStoneBlocksNeeded.toLocaleString()} bloques de piedra<br />
                        • {result.comparisonVsHouses.guildHallTablesNeeded} mesas gremiales<br />
                        • <strong className="text-purple-300">1 solo juego</strong> de trofeos
                      </div>
                      <div className="pt-1 text-[11px] font-bold font-mono text-purple-300">
                        {formatSilver(result.comparisonVsHouses.guildHallTotalInitialSilver)} 🪙
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">{result.comparisonVsHouses.equivalentHousesCount} Casas Personales:</span>
                      <div className="text-slate-200 font-mono text-[11px]">
                        • {result.comparisonVsHouses.housesPlotsUsed} parcelas estándar ocupadas<br />
                        • {result.comparisonVsHouses.housesStoneBlocksNeeded.toLocaleString()} bloques de piedra<br />
                        • {result.comparisonVsHouses.housesTablesNeeded} mesas individuales<br />
                        • <strong className="text-amber-400">{result.comparisonVsHouses.housesTrophySetsNeeded} juegos</strong> de trofeos
                      </div>
                      <div className="pt-1 text-[11px] font-bold font-mono text-amber-300">
                        {formatSilver(result.comparisonVsHouses.housesTotalInitialSilver)} 🪙
                      </div>
                    </div>
                  </div>

                  {/* Beneficios Clave del Guild Hall */}
                  <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-purple-200 font-semibold">
                      <Sparkles size={14} className="text-purple-400 shrink-0" />
                      <span>¡Ahorras {result.comparisonVsHouses.trophySetsSaved} juegos completos de trofeos!</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {result.comparisonVsHouses.recommendationVerdict}
                    </p>
                  </div>
                </div>
              )}

              {/* Barra de Acciones y Sincronizaciones */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Acciones Rápidas & Conexiones
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAddTodoRoutine}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Añade recordatorio de entrega de diarios a tu lista de tareas"
                  >
                    <ClipboardList size={14} />
                    <span>Añadir a Tareas de Hoy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Exporta el presupuesto completo a un archivo CSV para Excel"
                  >
                    <Download size={14} />
                    <span>Exportar Presupuesto (.csv)</span>
                  </button>
                </div>

                {/* Enlaces a otros módulos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                  {onNavigateToEquipmentCrafting && (
                    <button
                      type="button"
                      onClick={onNavigateToEquipmentCrafting}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded transition cursor-pointer"
                    >
                      <span>🔨 Forja de Equipo (Llenar Diarios)</span>
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {onNavigateToLabourers && (
                    <button
                      type="button"
                      onClick={onNavigateToLabourers}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-purple-300 hover:bg-slate-900 rounded transition cursor-pointer"
                    >
                      <span>🏠 Casas & Trabajadores Personales</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
