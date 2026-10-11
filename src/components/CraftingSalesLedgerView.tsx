import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  TrendingUp,
  MapPin,
  Coins,
  ArrowUpRight,
  Shield,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useCraftingSalesLedger } from '../hooks/useCraftingSalesLedger';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import { sanitizeCsvCell, exportSalesLedgerToCsv } from '../domain/use-cases/exportHistoryToCsv';

const ROYAL_CITIES = [
  'Martlock',
  'Fort Sterling',
  'Lymhurst',
  'Bridgewatch',
  'Thetford',
  'Caerleon (Mercado Real)',
  'Brecilien',
] as const;

const QUALITY_LABELS: Record<string, { label: string; color: string }> = {
  normal: { label: 'Normal', color: 'bg-slate-800/80 text-slate-300 border-slate-700' },
  good: { label: 'Buena', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50' },
  outstanding: { label: 'Notable', color: 'bg-sky-950/60 text-sky-300 border-sky-700/50' },
  excellent: { label: 'Sobresaliente', color: 'bg-purple-950/60 text-purple-300 border-purple-700/50' },
  masterpiece: { label: 'Obra Maestra', color: 'bg-amber-950/70 text-amber-300 border-amber-500/60 shadow-sm' },
};

export const CraftingSalesLedgerView: React.FC = () => {
  const {
    records,
    addRecord,
    deleteRecord,
    clearAllRecords,
    totalSalesSilver,
    totalNetProfitSilver,
    totalProductionCostSilver,
    blackMarketSalesCount,
    royalCitySalesCount,
  } = useCraftingSalesLedger();

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [filterDestination, setFilterDestination] = useState<'all' | 'black_market' | 'royal_city'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'profit' | 'roi'>('newest');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Form State
  const [itemName, setItemName] = useState<string>('Espada Ancha');
  const [tier, setTier] = useState<number>(5);
  const [enchantment, setEnchantment] = useState<number>(0);
  const [quality, setQuality] = useState<'normal' | 'good' | 'outstanding' | 'excellent' | 'masterpiece'>('good');
  const [batchCount, setBatchCount] = useState<number>(10);
  const [unitProductionCost, setUnitProductionCost] = useState<number>(18500);
  const [destination, setDestination] = useState<'black_market' | 'royal_city'>('black_market');
  const [destinationCityName, setDestinationCityName] = useState<string>('Caerleon (Mercado Negro)');
  const [orderType, setOrderType] = useState<'instant_buy_order' | 'sell_order'>('instant_buy_order');
  const [hasPremium, setHasPremium] = useState<boolean>(true);
  const [unitSalePrice, setUnitSalePrice] = useState<number>(32000);
  const [notes, setNotes] = useState<string>('');

  // Cálculo en tiempo real de impuestos y tasas para el formulario según mecánicas oficiales de Albion
  const formCalculations = useMemo(() => {
    const isDirect = orderType === 'instant_buy_order';
    let marketTaxPercent = 0;
    let setupFeePercent = 0;

    if (destination === 'black_market') {
      if (isDirect) {
        marketTaxPercent = 0;
        setupFeePercent = 0;
      } else {
        marketTaxPercent = hasPremium ? 4 : 8;
        setupFeePercent = 2.5;
      }
    } else {
      // Ciudad Real
      marketTaxPercent = hasPremium ? 4 : 8;
      setupFeePercent = isDirect ? 0 : 2.5;
    }

    const safeBatch = Math.max(1, batchCount);
    const safeProdCost = Math.max(0, unitProductionCost);
    const safeSalePrice = Math.max(0, unitSalePrice);

    const productionCostTotal = safeProdCost * safeBatch;
    const grossRevenue = safeSalePrice * safeBatch;
    const totalFeesRate = (marketTaxPercent + setupFeePercent) / 100;
    const totalMarketFees = Math.round(grossRevenue * totalFeesRate);
    const netRevenue = grossRevenue - totalMarketFees;
    const netProfit = netRevenue - productionCostTotal;
    const profitPerUnit = safeBatch > 0 ? Math.round(netProfit / safeBatch) : 0;
    const roiPercent = productionCostTotal > 0 ? Number(((netProfit / productionCostTotal) * 100).toFixed(1)) : 0;

    return {
      safeBatch,
      productionCostTotal,
      grossRevenue,
      marketTaxPercent,
      setupFeePercent,
      totalMarketFees,
      netRevenue,
      netProfit,
      profitPerUnit,
      roiPercent,
    };
  }, [destination, orderType, hasPremium, batchCount, unitProductionCost, unitSalePrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const {
      safeBatch,
      productionCostTotal,
      grossRevenue,
      marketTaxPercent,
      setupFeePercent,
      totalMarketFees,
      netRevenue,
      netProfit,
      profitPerUnit,
      roiPercent,
    } = formCalculations;

    addRecord({
      itemId: `item_${Date.now()}`,
      itemName: itemName.trim() || 'Equipo Artesanal',
      tier,
      enchantment,
      quality,
      batchCount: safeBatch,
      productionCostTotal,
      unitProductionCost: Math.max(0, unitProductionCost),
      destination,
      destinationCityName: destination === 'black_market' ? 'Caerleon (Mercado Negro)' : destinationCityName,
      unitSalePrice: Math.max(0, unitSalePrice),
      grossRevenue,
      marketTaxPercent,
      setupFeePercent,
      totalMarketFees,
      netRevenue,
      netProfit,
      profitPerUnit,
      roiPercent,
      notes: notes.trim() || undefined,
    });

    setIsFormOpen(false);
    setNotes('');
  };

  // Filtrado y Ordenación de Registros
  const filteredRecords = useMemo(() => {
    const list = records.filter((r) => {
      const matchDest = filterDestination === 'all' || r.destination === filterDestination;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        r.itemName.toLowerCase().includes(q) ||
        r.destinationCityName.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q));
      return matchDest && matchSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === 'profit') return b.netProfit - a.netProfit;
      if (sortBy === 'roi') return b.roiPercent - a.roiPercent;
      return b.timestamp - a.timestamp;
    });
  }, [records, filterDestination, searchTerm, sortBy]);

  // Exportar a CSV de manera segura contra Inyecciones de Fórmulas y compatible con Excel/Google Sheets
  const handleExportCsv = () => {
    if (records.length === 0) return;

    const result = exportSalesLedgerToCsv(records, {
      delimiter: ';',
      includeSummary: true,
    });

    const blob = new Blob([result.csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const globalRoi =
    totalProductionCostSilver > 0
      ? Number(((totalNetProfitSilver / totalProductionCostSilver) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2 flex-wrap">
                <span>Libro Mayor de Ventas & Mercado Negro</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Caerleon vs Ciudades Reales
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Historial contable auditable de lotes crafteados y entregados al Mercado Negro de Caerleon o subastas reales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {records.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                title="Exportar registros a archivo CSV compatible con Excel y Sheets"
              >
                <Download size={14} className="text-amber-400" />
                <span>Exportar CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus size={15} />
              {isFormOpen ? 'Cerrar Formulario' : 'Registrar Venta / Entrega'}
            </button>
          </div>
        </div>

        {/* Métricas Globales del Libro Mayor */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Volumen Total Vendido:</span>
            <span className="text-base font-mono tabular-nums font-bold text-slate-200">
              {formatSilver(totalSalesSilver)} 🪙
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Inversión Fabricada:</span>
            <span className="text-base font-mono tabular-nums font-bold text-rose-300">
              {formatSilver(totalProductionCostSilver)} 🪙
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Ganancia Neta Limpia:</span>
            <span
              className={`text-base font-mono tabular-nums font-bold ${
                totalNetProfitSilver >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalNetProfitSilver >= 0 ? '+' : ''}
              {formatSilver(totalNetProfitSilver)} 🪙
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">ROI Promedio Global:</span>
            <span
              className={`text-base font-mono tabular-nums font-bold ${
                globalRoi >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {globalRoi >= 0 ? '+' : ''}
              {globalRoi}%
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block font-medium">Distribución Destinos:</span>
            <div className="text-xs font-mono tabular-nums font-semibold flex items-center justify-between mt-1">
              <span className="text-amber-400">🏴 {blackMarketSalesCount} BM</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300">🏛️ {royalCitySalesCount} Reales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario Desplegable de Nuevo Registro */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-2xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Plus size={16} className="text-amber-400" />
              <span>Registrar Nueva Entrega o Lote Vendido</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Fila 1: Ítem, Tier, Encanto y Calidad */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1 font-semibold">Nombre del Ítem / Equipo:</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej. Espada Ancha, Hacha de Batalla..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Tier & Encantamiento:</label>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={tier}
                  onChange={(e) => setTier(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {[4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      T{t}
                    </option>
                  ))}
                </select>
                <select
                  value={enchantment}
                  onChange={(e) => setEnchantment(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>.0</option>
                  <option value={1}>.1</option>
                  <option value={2}>.2</option>
                  <option value={3}>.3</option>
                  <option value={4}>.4</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Calidad del Lote:</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as 'normal' | 'good' | 'outstanding' | 'excellent' | 'masterpiece')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="normal">Normal</option>
                <option value="good">Buena</option>
                <option value="outstanding">Notable</option>
                <option value="excellent">Sobresaliente</option>
                <option value="masterpiece">Obra Maestra</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Cantidad, Destino, Ciudad y Tipo de Orden */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Cantidad (Piezas):</label>
              <NumericInput
                min={1}
                value={batchCount}
                onChange={(val) => setBatchCount(Math.max(1, val))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono font-bold text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Destino de Venta:</label>
              <select
                value={destination}
                onChange={(e) => {
                  const val = e.target.value as 'black_market' | 'royal_city';
                  setDestination(val);
                  setDestinationCityName(val === 'black_market' ? 'Caerleon (Mercado Negro)' : 'Martlock');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="black_market">🏴 Mercado Negro (Caerleon)</option>
                <option value="royal_city">🏛️ Ciudad Real (Subasta)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Ciudad Específica:</label>
              {destination === 'black_market' ? (
                <input
                  type="text"
                  disabled
                  value="Caerleon (Mercado Negro)"
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-2 font-bold text-slate-400 cursor-not-allowed"
                />
              ) : (
                <select
                  value={destinationCityName}
                  onChange={(e) => setDestinationCityName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {ROYAL_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Modalidad de Venta:</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'instant_buy_order' | 'sell_order')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 font-bold text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="instant_buy_order">
                  {destination === 'black_market'
                    ? 'Orden Directa BM (0% Tasas)'
                    : 'Orden de Compra (0% Publicación)'}
                </option>
                <option value="sell_order">Orden de Venta (2.5% Tarifa + Tasa)</option>
              </select>
            </div>
          </div>

          {/* Fila 3: Coste Unitario, Precio Venta y Estado Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Coste Unitario de Fabricación (🪙):</label>
              <NumericInput
                min={0}
                value={unitProductionCost}
                onChange={(val) => setUnitProductionCost(val)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono font-bold text-rose-300"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Precio Unitario de Venta (🪙):</label>
              <NumericInput
                min={0}
                value={unitSalePrice}
                onChange={(val) => setUnitSalePrice(val)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono font-bold text-emerald-400"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  checked={hasPremium}
                  onChange={(e) => setHasPremium(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-slate-300 font-bold text-xs">
                  Estado Premium Activo <span className="text-amber-400 font-normal">(4% tasa en vez de 8%)</span>
                </span>
              </label>
            </div>
          </div>

          {/* Fila 4: Notas / Estrategia */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">
              Notas u Observaciones del Lote (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Fabricado con foco en Martlock (+24.8% RRR), transportado en buey por zona roja..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Tarjeta de Previsualización Financiera en Tiempo Real */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Inversión Lote:</span>
              <span className="font-mono tabular-nums font-bold text-slate-300">
                {formatSilver(formCalculations.productionCostTotal)} 🪙
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Ingreso Bruto:</span>
              <span className="font-mono tabular-nums font-bold text-slate-200">
                {formatSilver(formCalculations.grossRevenue)} 🪙
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">
                Tasas ({formCalculations.marketTaxPercent + formCalculations.setupFeePercent}%):
              </span>
              <span className="font-mono tabular-nums font-bold text-rose-300">
                -{formatSilver(formCalculations.totalMarketFees)} 🪙
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Beneficio Neto:</span>
              <span
                className={`font-mono tabular-nums font-bold ${
                  formCalculations.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formCalculations.netProfit >= 0 ? '+' : ''}
                {formatSilver(formCalculations.netProfit)} 🪙
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 block">ROI Estimado:</span>
              <span
                className={`font-mono tabular-nums font-bold ${
                  formCalculations.roiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formCalculations.roiPercent >= 0 ? '+' : ''}
                {formCalculations.roiPercent}%
              </span>
            </div>
          </div>

          {/* Botones de Envío */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Guardar en el Libro Mayor</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Registros Auditables */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Buscador */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por ítem, ciudad o notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full sm:w-64"
            />
          </div>

          {/* Filtros de Destino y Ordenación */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterDestination('all')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  filterDestination === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDestination('black_market')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  filterDestination === 'black_market'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mercado Negro ({blackMarketSalesCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterDestination('royal_city')}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  filterDestination === 'royal_city'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ciudades Reales ({royalCitySalesCount})
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'profit' | 'roi')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-bold focus:outline-none"
            >
              <option value="newest">Más reciente primero</option>
              <option value="profit">Mayor Ganancia</option>
              <option value="roi">Mayor ROI %</option>
            </select>

            {records.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-950 rounded-lg border border-transparent hover:border-rose-900/40 transition-colors"
                title="Vaciar todos los registros del libro mayor"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Modal / Diálogo de Confirmación para Vaciar Todo */}
        {showClearConfirm && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5 text-rose-200">
              <AlertCircle size={20} className="text-rose-400 shrink-0" />
              <span>
                ¿Estás seguro de que deseas vaciar todos los registros del Libro Mayor? Esta acción eliminará el
                historial contable acumulado.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllRecords();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-colors"
              >
                Sí, Vaciar Todo
              </button>
            </div>
          </div>
        )}

        {/* Listado de Entregas */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs space-y-2">
            <BookOpen size={28} className="mx-auto text-slate-600 mb-1" />
            <p className="font-semibold text-slate-400">No hay registros que coincidan con la búsqueda o filtro.</p>
            <p className="text-[11px]">
              Haz clic en <span className="text-amber-400 font-bold">"Registrar Venta / Entrega"</span> o envía órdenes
              desde el <span className="text-slate-300 font-semibold">Simulador de Mercado Negro</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => {
              const qBadge = QUALITY_LABELS[record.quality] || QUALITY_LABELS.normal;
              const totalFees = record.marketTaxPercent + record.setupFeePercent;

              return (
                <div
                  key={record.id}
                  className="bg-slate-950 border border-slate-800/90 hover:border-slate-700/80 p-4 rounded-xl flex flex-col gap-3 text-xs transition-all shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-100 text-sm">{record.itemName}</span>
                      <AlbionItemBadge tier={record.tier} enchantment={record.enchantment} />
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${qBadge.color}`}
                        title="Calidad del ítem"
                      >
                        {qBadge.label}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          record.destination === 'black_market'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                        }`}
                      >
                        {record.destinationCityName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                        {record.setupFeePercent === 0 ? 'Venta Directa (0% Pub.)' : 'Subasta (2.5% Pub.)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">{record.dateStr}</span>
                      <button
                        type="button"
                        onClick={() => deleteRecord(record.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors rounded hover:bg-slate-900"
                        title="Eliminar este registro"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo de Estadísticas Financieras */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-0.5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Volumen Fabricado:</span>
                      <span className="font-mono font-bold text-slate-300 tabular-nums">
                        {record.batchCount} piezas
                      </span>
                      <span className="text-[10px] text-slate-500 block tabular-nums">
                        a {formatSilver(record.unitProductionCost)} 🪙/ud
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">Precio de Venta:</span>
                      <span className="font-mono font-bold text-slate-200 tabular-nums">
                        {formatSilver(record.unitSalePrice)} 🪙/ud
                      </span>
                      <span className="text-[10px] text-slate-500 block tabular-nums">
                        Bruto: {formatSilver(record.grossRevenue)} 🪙
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        Tasas de Mercado ({totalFees}%):
                      </span>
                      <span className="font-mono font-bold text-rose-300 tabular-nums">
                        -{formatSilver(record.totalMarketFees)} 🪙
                      </span>
                      <span className="text-[10px] text-slate-500 block tabular-nums">
                        Neto: {formatSilver(record.netRevenue)} 🪙
                      </span>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-slate-500 block text-[10px]">Beneficio Neto Final:</span>
                      <div
                        className={`font-mono font-black text-sm tabular-nums ${
                          record.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {record.netProfit >= 0 ? '+' : ''}
                        {formatSilver(record.netProfit)} 🪙
                      </div>
                      <div className="text-[10px] font-mono tabular-nums text-slate-400">
                        ROI: <span className={record.roiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{record.roiPercent}%</span>
                        {' '}({formatSilver(record.profitPerUnit)} 🪙/ud)
                      </div>
                    </div>
                  </div>

                  {/* Notas si existen */}
                  {record.notes && (
                    <div className="mt-1 p-2 bg-slate-900/80 border border-slate-800/80 rounded-lg text-[11px] text-slate-300 italic flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold not-italic">Nota:</span>
                      <span>{record.notes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
