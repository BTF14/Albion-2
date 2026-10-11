import React, { useState, useRef, useEffect } from 'react';
import {
  Skull,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  Eye,
  Crosshair,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Download,
  ClipboardList,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  Scale,
  Footprints,
  Compass,
} from 'lucide-react';
import { useRedZoneTransport } from '../hooks/useRedZoneTransport';
import { RedZoneTransportInput } from '../domain';
import { NumericInput } from './NumericInput';
import { formatSilver } from '../utils/albionColors';
import { CityId, DailyChecklistItem } from '../types';
import { CITIES } from '../data/items';
import { loadChecklist, saveChecklist } from '../utils/storage';
import { sanitizeCsvCell } from '../domain/use-cases/exportHistoryToCsv';

interface Props {
  currentCityId?: CityId;
  onNavigateToBlackMarket?: () => void;
  onNavigateToWarehouse?: () => void;
}

export const RedZoneTransportView: React.FC<Props> = ({
  currentCityId,
  onNavigateToBlackMarket,
  onNavigateToWarehouse,
}) => {
  const {
    config,
    updateConfig,
    addCargoItem,
    updateCargoItem,
    removeCargoItem,
    loadPresetBatch,
    importFromWarehouse,
    resetToDefaults,
    result,
    currentRoute,
    currentMount,
    currentEscapeSet,
    routes,
    mounts,
    escapeSets,
  } = useRedZoneTransport(currentCityId);

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nuevo ítem en formulario manual
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemWeight, setNewItemWeight] = useState<number>(0.2);
  const [newItemQty, setNewItemQty] = useState<number>(50);
  const [newItemCost, setNewItemCost] = useState<number>(10000);
  const [newItemPrice, setNewItemPrice] = useState<number>(18000);
  const [newItemCategory, setNewItemCategory] = useState<'potion' | 'food' | 'equipment' | 'material'>('potion');

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

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      showToast('⚠️ Ingresa un nombre para el ítem de carga.');
      return;
    }
    addCargoItem({
      nameEs: newItemName.trim(),
      category: newItemCategory,
      unitWeightKg: Math.max(0.01, newItemWeight),
      quantity: Math.max(1, newItemQty),
      unitCostOriginSilver: Math.max(0, newItemCost),
      unitPriceCaerleonSilver: Math.max(0, newItemPrice),
    });
    setNewItemName('');
    showToast(`✅ "${newItemName.trim()}" añadido al manifiesto de carga.`);
    if (hasCalculated) setIsStale(true);
  };

  const handleAddTodoRoutine = () => {
    try {
      const currentList = loadChecklist();
      const newTask: DailyChecklistItem = {
        id: `red_zone_transport_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Transportar envío de ${result.totalWeightKg} kg a Caerleon (${currentRoute.nameEs})`,
        cityId: config.originCityId,
        plotsCount: config.cargoItems.length,
        harvested: false,
        replanted: false,
        usedFocus: false,
        category: 'island',
        isCustomTask: true,
        completed: false,
        notes: `Montura: ${currentMount.nameEs}. Margen neto: +${formatSilver(result.tripNetProfitSilver)} 🪙. Supervivencia: ${Math.round(result.estimatedSurvivalRate * 100)}%.`,
        priority: 'high',
        createdAt: Date.now(),
      };
      saveChecklist([newTask, ...currentList]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('albion_storage_sync'));
      }
      showToast('📋 Envío a Caerleon programado en tu Lista de Tareas de Hoy');
    } catch {
      showToast('❌ Error al guardar tarea');
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = ['Ítem de Carga', 'Categoría', 'Cantidad', 'Peso Unitario (kg)', 'Peso Total (kg)', 'Coste Origen (🪙)', 'Precio Caerleon (🪙)', 'Beneficio Neto (🪙)', 'Plata / kg'];
      const rows = result.sortedCargoBySilverPerKg.map((item) => [
        item.nameEs,
        item.category,
        String(item.quantity),
        String(item.totalWeightKg / (item.quantity || 1)),
        String(item.totalWeightKg),
        String(item.totalCostOriginSilver),
        String(item.totalRevenueCaerleonSilver),
        String(item.netProfitSilver),
        String(item.silverPerKg),
      ]);

      const summaryRows = [
        [],
        ['RESUMEN DE RIESGO DE ENVIO A CAERLEON'],
        ['Ruta', currentRoute.nameEs],
        ['Montura de Transporte', currentMount.nameEs],
        ['Set de Escape', currentEscapeSet.nameEs],
        ['Peso Total Transportado', `${result.totalWeightKg} kg`],
        ['Capacidad Efectiva de Montura', `${result.mountEffectiveCapacityKg} kg`],
        ['Ganancia Neta (Viaje Exitoso)', `${result.tripNetProfitSilver} Plata`],
        ['Pérdida en Caso de Emboscada (Gank)', `${result.totalSilverAtRiskSilver} Plata`],
        ['Tasa de Supervivencia Estimada', `${Math.round(result.estimatedSurvivalRate * 100)}%`],
        ['Umbral de Supervivencia Mínimo (Break-Even)', `${(result.breakEvenSurvivalRate * 100).toFixed(1)}%`],
        ['Valor Esperado Estadístico (EV)', `${result.expectedValueSilver} Plata / viaje`],
        ['Veredicto de Seguridad', result.verdictTitleEs],
      ];

      const csvContent = [
        headers.map(sanitizeCsvCell).join(','),
        ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
        ...summaryRows.map((row) => row.map(sanitizeCsvCell).join(',')),
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `envio_zona_roja_caerleon_${config.originCityId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('📊 Manifiesto de transporte descargado en CSV');
    } catch {
      showToast('❌ Error al exportar archivo');
    }
  };

  return (
    <div id="red-zone-transport-container" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-rose-950/90 border border-rose-500 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between text-xs font-semibold backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-rose-300 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-rose-400 hover:text-rose-200 ml-4 p-1 rounded hover:bg-rose-900/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="bg-slate-900 border border-rose-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none text-rose-500">
          <Skull size={220} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
              <Skull size={14} /> Logística de Alto Riesgo & Full Loot PvP
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <span>Envíos por Zona Roja a Caerleon & Riesgo de Gankers</span>
              <span className="text-xs bg-rose-950 text-rose-300 border border-rose-700 font-mono font-bold px-2 py-0.5 rounded-full">
                Plata / kg & EV
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Optimiza cargamentos masivos hacia el Mercado Negro y Caerleon. Clasifica tu inventario por rentabilidad
              de peso (<strong className="text-rose-300">Plata / kg</strong>), simula la probabilidad estadística de supervivencia
              ante emboscadas y verifica si tu montura te permite escapar a pie si eres desmontado.
            </p>
          </div>
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition self-start md:self-auto cursor-pointer"
            title="Restablecer valores por defecto"
          >
            <RotateCcw size={14} />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configuración de Ruta, Montura, Carga y Riesgo (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Ruta de Transporte y Ciudad de Origen */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Compass size={18} className="text-rose-400" />
              1. Ruta de Transporte hacia Caerleon
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ciudad de Origen
                </label>
                <select
                  value={config.originCityId}
                  onChange={(e) => handleConfigChange({ originCityId: e.target.value as CityId })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer font-medium"
                >
                  {CITIES.filter((c) => c.id !== 'caerleon' && c.id !== 'brecilien').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.biome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Destino y Tipo de Venta
                </label>
                <select
                  value={config.destinationSaleType}
                  onChange={(e) => handleConfigChange({ destinationSaleType: e.target.value as RedZoneTransportInput['destinationSaleType'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer font-medium"
                >
                  <option value="black_market_buy_order">Mercado Negro (0% Impuestos / Compra Directa)</option>
                  <option value="caerleon_market_sell_order">Subasta de Caerleon (Con Tasas e Impuestos)</option>
                </select>
              </div>
            </div>

            {/* Ficha de la Ruta Activa */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-200">{currentRoute.nameEs}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800">
                  {currentRoute.redZonesCount} Mapas de Zona Roja
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Puntos de Emboscada (Choke Points): <strong className="text-slate-300">{currentRoute.notableChokePointsEs}</strong>
              </p>
            </div>
          </div>

          {/* 2. Selección de Montura y Set de Escape */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield size={18} className="text-cyan-400" />
              2. Montura de Transporte & Set de Escape
            </h3>

            {/* Selector de Montura */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Montura de Transporte Seleccionada
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mounts.map((m) => {
                  const isSelected = m.id === config.mountId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleConfigChange({ mountId: m.id })}
                      className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-100">{m.nameEs}</span>
                        <span className="text-[10px] font-mono text-amber-400 font-semibold">{formatSilver(m.estimatedPriceSilver)} 🪙</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px]">
                        <span className="text-slate-400">Capacidad: <strong>{m.maxLoadKg} kg</strong></span>
                        <span className={`px-1.5 py-0.2 rounded font-semibold ${
                          m.isCourierMount ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {m.isCourierMount ? '✓ Courier (Pasivo)' : '⚠️ Solo Montado'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block truncate">
                        {m.specialAbilityEs}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Set de Escape */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Set de Huida & Habilidades (En caso de ser desmontado)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {escapeSets.map((s) => {
                  const isSelected = s.id === config.escapeSetId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleConfigChange({ escapeSetId: s.id })}
                      className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500 text-purple-200 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold text-xs text-slate-100 block truncate">{s.nameEs}</span>
                      <span className="text-[10px] text-amber-300 font-mono block mt-0.5">
                        Coste: {formatSilver(s.totalSetCostSilver)} 🪙
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Parámetros de Riesgo, Scout y Gestión de Banca */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Crosshair size={18} className="text-amber-400" />
              3. Parámetros de Riesgo, Hostiles & Banca
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hostiles Reportados en Zona (PKs)
                </label>
                <NumericInput
                  min={0}
                  max={40}
                  value={config.redPksReportedCount}
                  onChange={(val) => handleConfigChange({ redPksReportedCount: val })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-rose-400 focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Número de rojos visibles en el minimapa.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supervivencia Base Estimada
                </label>
                <div className="relative">
                  <NumericInput
                    min={10}
                    max={99}
                    value={config.estimatedSurvivalPercent}
                    onChange={(val) => handleConfigChange({ estimatedSurvivalPercent: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-rose-500 pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Tasa habitual de éxito en tus rutas.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reserva Total de Plata (Banca)
                </label>
                <div className="relative">
                  <NumericInput
                    min={0}
                    value={config.totalPlayerSilverReserve}
                    onChange={(val) => handleConfigChange({ totalPlayerSilverReserve: val })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-rose-500 pr-8"
                  />
                  <span className="absolute right-2.5 top-2 text-xs text-slate-500">🪙</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Para auditar % de capital en riesgo.</span>
              </div>
            </div>

            {/* Toggles de Bonos Tácticos */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.hasScoutAhead}
                    onChange={(e) => handleConfigChange({ hasScoutAhead: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200">
                    <strong>Cuento con un Scout / Explorador adelantado</strong> (Avisa de puertas y grupos)
                  </span>
                </label>
                <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  +12% Supervivencia
                </span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.hasEatenPorkPie ?? true}
                    onChange={(e) => handleConfigChange({ hasEatenPorkPie: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-200">
                    <strong>Pastel de Cerdo Consumido</strong> (Buff de comida oficial de Albion)
                  </span>
                </label>
                <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  +30% Carga Máxima
                </span>
              </div>
            </div>
          </div>

          {/* 4. Manifiesto de Carga & Botones de Lotes Predefinidos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Package size={18} className="text-emerald-400" />
                  4. Manifiesto de Carga ({config.cargoItems.length} ítems)
                </h3>
                <span className="text-xs text-slate-400">
                  Total Peso: <strong className="text-slate-200 font-mono">{result.totalWeightKg} kg</strong> / Capacidad:{' '}
                  <strong className="text-purple-300 font-mono">{result.mountEffectiveCapacityKg} kg</strong>
                </span>
              </div>

              {/* Botones de Lotes Rápidos */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => loadPresetBatch('potions')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 transition cursor-pointer"
                >
                  🧪 Pociones
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetBatch('food')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition cursor-pointer"
                >
                  🥧 Comida .2
                </button>
                <button
                  type="button"
                  onClick={() => loadPresetBatch('capes')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition cursor-pointer"
                >
                  🛡️ Capas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const count = importFromWarehouse();
                    if (count > 0) showToast(`📦 ${count} ítems importados desde tu Almacén.`);
                    else showToast('ℹ️ No hay ítems en tu Almacén para importar.');
                  }}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700/50 transition cursor-pointer"
                  title="Importa inventario de WarehouseLogistics"
                >
                  📦 Desde Almacén
                </button>
              </div>
            </div>

            {/* Formulario Rápido para Añadir Ítem */}
            <form onSubmit={handleAddItem} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Añadir Ítem Manual al Cargamento:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nombre del ítem (ej. Poción T8)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <NumericInput
                    placeholder="Cantidad"
                    min={1}
                    value={newItemQty}
                    onChange={(val) => setNewItemQty(val)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <NumericInput
                    placeholder="Peso kg"
                    min={0.01}
                    value={newItemWeight}
                    onChange={(val) => setNewItemWeight(val)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <NumericInput
                    placeholder="Coste Origen"
                    min={0}
                    value={newItemCost}
                    onChange={(val) => setNewItemCost(val)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <NumericInput
                    placeholder="Precio Caerleon"
                    min={0}
                    value={newItemPrice}
                    onChange={(val) => setNewItemPrice(val)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-emerald-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/40 text-rose-200 text-xs font-bold rounded transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                <span>Agregar Ítem al Manifiesto</span>
              </button>
            </form>

            {/* Tabla de Ítems en Carga */}
            <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Ítem</th>
                    <th className="py-2 px-2 text-right">Cant.</th>
                    <th className="py-2 px-2 text-right">Peso Total</th>
                    <th className="py-2 px-2 text-right">Coste Origen</th>
                    <th className="py-2 px-2 text-right">Venta Caerleon</th>
                    <th className="py-2 px-2 text-right">Plata / kg</th>
                    <th className="py-2 px-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                  {config.cargoItems.map((item) => {
                    const totalWeight = item.quantity * item.unitWeightKg;
                    const netMargin = (item.unitPriceCaerleonSilver - item.unitCostOriginSilver) * item.quantity;
                    const silverKg = totalWeight > 0 ? Math.round(netMargin / totalWeight) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-950/60">
                        <td className="py-2 px-3 font-sans font-medium text-slate-200 text-xs">
                          {item.nameEs}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-300">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {totalWeight.toFixed(1)} kg
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">
                          {formatSilver(item.unitCostOriginSilver * item.quantity)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-bold">
                          {formatSilver(item.unitPriceCaerleonSilver * item.quantity)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            silverKg >= 15000 ? 'bg-emerald-950 text-emerald-300' : silverKg >= 5000 ? 'bg-purple-950 text-purple-300' : 'bg-slate-800 text-slate-400'
                          }`}>
                            +{formatSilver(silverKg)}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeCargoItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                            title="Eliminar de la carga"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {config.cargoItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-sans text-xs">
                        No hay ítems en el manifiesto. Agrega ítems manuales o pulsa uno de los lotes rápidos arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Control de Cálculo, Veredicto y Valor Esperado (5 columnas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Barra de Activación */}
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Skull className="text-rose-400" size={20} />
                <span className="text-sm font-bold text-slate-100">
                  Auditoría de Riesgo de Zona Roja
                </span>
                {isStale && hasCalculated && (
                  <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                    Modificaciones sin recalcular
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calcula el Valor Esperado (EV), umbral de rentabilidad y pérdida máxima ante emboscadas.
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
                id="btn-calculate-red-zone-result"
                onClick={handleCalculate}
                className={`flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all duration-150 cursor-pointer ${
                  !hasCalculated
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white ring-2 ring-rose-400/40 shadow-rose-600/20 transform hover:-translate-y-0.5'
                    : isStale
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
                }`}
              >
                <Skull size={16} />
                {!hasCalculated
                  ? 'Dar Resultado / Evaluar Riesgo'
                  : isStale
                  ? 'Recalcular con Nuevos Datos'
                  : 'Volver a Evaluar'}
              </button>
            </div>
          </div>

          {!hasCalculated ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                <Skull size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-200">
                Esperando Evaluación de Riesgo
              </h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Revisa el peso de tu carga, selecciona tu montura y presiona{' '}
                <strong className="text-rose-300">"Dar Resultado / Evaluar Riesgo"</strong> para verificar el Valor Esperado (EV) y el porcentaje de capital en juego.
              </p>
            </div>
          ) : (
            <>
              {/* Veredicto de Seguridad Principal */}
              <div className={`p-5 rounded-xl border shadow-xl space-y-3 ${
                result.safetyVerdict === 'SEGURO'
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : result.safetyVerdict === 'PRECAUCION'
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : result.safetyVerdict === 'ALTO_RIESGO'
                  ? 'bg-orange-950/40 border-orange-500/50'
                  : 'bg-rose-950/40 border-rose-500/50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    result.safetyVerdict === 'SEGURO'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : result.safetyVerdict === 'PRECAUCION'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}>
                    {result.safetyVerdict.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    EV por Viaje:{' '}
                    <strong className={result.expectedValueSilver >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {result.expectedValueSilver >= 0 ? '+' : ''}{formatSilver(result.expectedValueSilver)} 🪙
                    </strong>
                  </span>
                </div>

                <h4 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  {result.verdictTitleEs}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.verdictDescriptionEs}
                </p>

                {/* Métricas Críticas de Carga y Capacidad */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Capacidad Usada:</span>
                    <span className={`text-base font-bold font-mono ${
                      result.isOverburdenedMounted ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {result.weightLoadPercent}% ({result.totalWeightKg} / {result.mountEffectiveCapacityKg} kg)
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Supervivencia al Desmontar:</span>
                    <span className={`text-xs font-bold block mt-0.5 ${
                      result.canEscapeOnDismount ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {result.canEscapeOnDismount ? '✓ Puede Huir a Pie' : '⛔ Inmóvil al Desmontar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balanza Financiera: Ganancia vs Pérdida Máxima */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Scale size={14} className="text-cyan-400" />
                  Balanza de Riesgo Financiero (Full Loot)
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Si llegas a salvo */}
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                      Si Llegas a Salvo:
                    </span>
                    <div className="text-xl font-black font-mono text-emerald-400 tabular-nums">
                      +{formatSilver(result.tripNetProfitSilver)} 🪙
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ROI: +{result.tripRoiPercent}% neto
                    </span>
                  </div>

                  {/* Si te emboscan y mueres */}
                  <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg space-y-1">
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">
                      Pérdida por Muerte (Gank):
                    </span>
                    <div className="text-xl font-black font-mono text-rose-400 tabular-nums">
                      -{formatSilver(result.totalSilverAtRiskSilver)} 🪙
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Carga + Set + Montura
                    </span>
                  </div>
                </div>

                {/* Métricas de Supervivencia y Gestión de Banca */}
                <div className="space-y-2 text-xs font-mono tabular-nums pt-1">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Supervivencia Estimada:</span>
                    <span className="font-bold text-emerald-400">{Math.round(result.estimatedSurvivalRate * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Umbral Mínimo Rentable (Break-Even):</span>
                    <span className="font-bold text-amber-300">{(result.breakEvenSurvivalRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">% de Patrimonio en Juego:</span>
                    <span className={`font-bold ${result.percentOfTotalSilverRisked > 25 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {result.percentOfTotalSilverRisked}% de tu banca total
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 font-sans">Plata Neta por Kilo (Plata/kg):</span>
                    <span className="font-bold text-purple-300">+{formatSilver(result.netSilverPerKg)} 🪙/kg</span>
                  </div>
                </div>
              </div>

              {/* Ranking de Ítems Más Rentables por Peso (Plata / kg) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <TrendingUp size={14} className="text-emerald-400" />
                  Prioridad de Carga por Ratio Plata / kg
                </h4>
                <div className="space-y-1.5 text-xs">
                  {result.sortedCargoBySilverPerKg.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between items-center text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] text-slate-300">
                          #{idx + 1}
                        </span>
                        <span className="font-medium text-slate-200 truncate max-w-[150px]">{item.nameEs}</span>
                      </div>
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-emerald-400 font-bold">+{formatSilver(item.silverPerKg)} 🪙/kg</span>
                        <span className="text-[10px] text-slate-500 block">({item.totalWeightKg} kg)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recomendaciones Tácticas */}
              <div className="space-y-2">
                {result.tacticalRecommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed shadow-sm">
                    {rec}
                  </div>
                ))}
              </div>

              {/* Barra de Acciones y Sincronizaciones */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Acciones Rápidas & Conexiones
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAddTodoRoutine}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Añade recordatorio de transporte a tu lista de tareas"
                  >
                    <ClipboardList size={14} />
                    <span>Añadir a Tareas de Hoy</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Exporta el manifiesto de transporte a un archivo CSV"
                  >
                    <Download size={14} />
                    <span>Exportar Manifiesto (.csv)</span>
                  </button>
                </div>

                {/* Enlaces cruzados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                  {onNavigateToBlackMarket && (
                    <button
                      type="button"
                      onClick={onNavigateToBlackMarket}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-900 rounded transition cursor-pointer"
                    >
                      <span>🏴 Mercado Negro de Caerleon</span>
                      <ArrowRight size={12} />
                    </button>
                  )}

                  {onNavigateToWarehouse && (
                    <button
                      type="button"
                      onClick={onNavigateToWarehouse}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded transition cursor-pointer"
                    >
                      <span>📦 Almacén & Logística</span>
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
