import React, { useState } from 'react';
import {
  Package,
  Truck,
  Weight,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  DollarSign,
  Building2,
} from 'lucide-react';
import { useWarehouseLogistics } from '../hooks/useWarehouseLogistics';
import { NumericInput } from './NumericInput';
import { formatSilver } from '../utils/albionColors';
import { WarehouseStoredItem } from '../domain/models/warehouseLogistics';

export const WarehouseLogisticsView: React.FC = () => {
  const {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    availableMounts,
    selectedMount,
    setMount,
    bagBonusKg,
    setBagBonusKg,
    usePorkPie,
    setUsePorkPie,
    logisticsReport,
  } = useWarehouseLogistics();

  // Ciclo de cálculo oficial con botón "Dar Resultado"
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  const handleMountChange = (mountId: string) => {
    setMount(mountId);
    if (hasCalculated) setIsStale(true);
  };

  const handleBagChange = (val: number) => {
    setBagBonusKg(val);
    if (hasCalculated) setIsStale(true);
  };

  const handlePorkPieToggle = () => {
    setUsePorkPie(!usePorkPie);
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

  // Formulario rápido para nuevo ítem
  const [newItemName, setNewItemName] = useState<string>('Trigo T4');
  const [newItemQty, setNewItemQty] = useState<number>(900);
  const [newItemWeight, setNewItemWeight] = useState<number>(0.1);
  const [newItemPrice, setNewItemPrice] = useState<number>(380);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: WarehouseStoredItem = {
      id: `wh_item_${Date.now()}`,
      nameEs: newItemName.trim(),
      category: 'crop',
      quantity: Math.max(1, newItemQty),
      weightKgPerUnit: Math.max(0.01, newItemWeight),
      estimatedUnitPrice: Math.max(0, newItemPrice),
    };

    addItem(newItem);
    setNewItemName('');
    setShowAddForm(false);
  };

  return (
    <div id="warehouse-logistics-container" className="space-y-6">
      {/* Header Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-950 flex items-center justify-center text-white shadow-md border border-blue-500/30">
              <Package size={26} className="text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>Logística de Almacén & Capacidad de Cofres</span>
                <span className="text-xs bg-blue-900/80 text-blue-200 border border-blue-700/60 font-semibold px-2 py-0.5 rounded-full">
                  Islas & Transporte
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cubicaje de peso en kg, viajes requeridos según montura de carga y planificación de cofres para cosechas acumuladas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md self-start md:self-auto"
          >
            <Plus size={14} />
            <span>Agregar Mercancía al Almacén</span>
          </button>
        </div>
      </div>

      {/* Barra de Control de Cálculo Oficial "Dar Resultado" */}
      <div className="bg-slate-900 border border-blue-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center">
            <Truck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {hasCalculated ? (isStale ? 'Parámetros Modificados' : 'Cubicaje y Logística Calculados') : 'Listo para Calcular'}
            </div>
            <div className="text-[11px] text-slate-400">
              {hasCalculated
                ? isStale
                  ? 'Cambiaste montura, carga o inventario. Presiona el botón para recalcular los viajes.'
                  : 'Cálculo de viajes y cubicaje óptimo según tu montura de carga.'
                : 'Presiona "Dar Resultado" para calcular viajes necesarios y sobrecarga.'}
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
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-950/50'
                : isStale
                ? 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>
              {!hasCalculated
                ? 'Dar Resultado / Calcular Logística'
                : isStale
                ? 'Recalcular con Nuevos Parámetros'
                : 'Resultado Actualizado ✓'}
            </span>
          </button>
        </div>
      </div>

      {!hasCalculated ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
            <Truck size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-200">Listo para Calcular la Capacidad de Carga y Viajes</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configura tus monturas y mercancías almacenadas, luego presiona{' '}
              <strong className="text-blue-400">"Dar Resultado / Calcular Logística"</strong> para calcular el peso total en stock, los viajes necesarios y el margen de sobrecarga.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCalculate}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-950/40 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={16} />
            <span>Calcular Capacidad y Viajes Ahora</span>
          </button>
        </div>
      ) : (
        <>
      {/* Resumen Logístico de Viajes y Peso */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Peso Total en Stock:</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block tabular-nums">
            {logisticsReport.totalWeightKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{logisticsReport.totalVolumeSlots} slots ocupados</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Capacidad de tu Montura:</span>
          <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block tabular-nums">
            {logisticsReport.effectiveMountCapacityKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{selectedMount.name}</span>
        </div>

        <div className={`p-4 rounded-xl shadow-md border ${
          logisticsReport.canCarryInOneTrip
            ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
            : 'bg-amber-950/60 border-amber-500/80 text-amber-200'
        }`}>
          <span className="text-xs font-semibold text-slate-400 block">Viajes Necesarios:</span>
          <span className={`text-2xl font-black font-mono mt-1 block ${
            logisticsReport.canCarryInOneTrip ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {logisticsReport.tripsRequired} {logisticsReport.tripsRequired === 1 ? 'Viaje' : 'Viajes'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {logisticsReport.canCarryInOneTrip ? '¡Cabe todo en un solo viaje!' : 'Sobrecarga para 1 viaje'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Valor Estimado en Plata:</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block tabular-nums">
            {formatSilver(logisticsReport.totalEstimatedSilverValue)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Valor de mercado total</span>
        </div>
      </div>

      {/* Dictamen Logístico */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <Truck size={20} className="text-blue-400 shrink-0" />
        <p className="text-xs text-slate-300">
          <strong>Dictamen de Transporte:</strong> {logisticsReport.logisticsAdvice}
        </p>
      </div>

      {/* Configuración de Montura de Transporte */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
          <span>Configuración del Equipo de Transporte</span>
          <span className="text-xs text-slate-400">Pastel de cerdo (+30% carga) & Bolsas</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Montura de Transporte:</label>
            <select
              value={selectedMount.id}
              onChange={(e) => handleMountChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
            >
              {availableMounts.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.baseCapacityKg} kg base)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Bolsa del Jugador (+kg extra):</label>
            <NumericInput
              value={bagBonusKg}
              onChange={(val) => handleBagChange(val)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
              placeholder="150"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Comida Bufada (Pastel de Cerdo):</label>
            <button
              type="button"
              onClick={handlePorkPieToggle}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                usePorkPie
                  ? 'bg-blue-950 text-blue-300 border-blue-500/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {usePorkPie ? '🐷 Con Pastel de Cerdo (+30% Carga)' : 'Sin Pastel de Cerdo'}
            </button>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Formulario Agregar Ítem */}
      {showAddForm && (
        <form onSubmit={handleAddNewItem} className="bg-slate-950 border border-blue-500/40 p-4 rounded-xl shadow-lg space-y-3">
          <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            Agregar Mercancía al Almacén
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre del Ítem:</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="ej. Zanahorias T3"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cantidad de Unidades:</label>
              <NumericInput
                value={newItemQty}
                onChange={(val) => setNewItemQty(val)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Peso por Unidad (kg):</label>
              <NumericInput
                allowDecimals={true}
                step={0.05}
                min={0.01}
                value={newItemWeight}
                onChange={(val) => setNewItemWeight(val)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Precio Unitario Estimado (🪙):</label>
              <NumericInput
                value={newItemPrice}
                onChange={(val) => setNewItemPrice(val)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer shadow"
            >
              Guardar en Inventario
            </button>
          </div>
        </form>
      )}

      {/* Lista de Ítems en el Almacén */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Inventario Acumulado en la Isla</span>
          <span className="text-xs text-slate-500 font-normal">
            Recomendación: {logisticsReport.recommendedChestCount}x {logisticsReport.recommendedChestType.nameEs}
          </span>
        </h3>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                  <Package size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.nameEs}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.weightKgPerUnit} kg/u. • {formatSilver(item.estimatedUnitPrice)}/u.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="w-28">
                  <NumericInput
                    value={item.quantity}
                    onChange={(val) => updateItemQuantity(item.id, val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-slate-200 font-mono"
                  />
                </div>

                <div className="text-right w-24">
                  <span className="text-xs font-bold text-white font-mono block tabular-nums">
                    {(item.quantity * item.weightKgPerUnit).toFixed(1)} kg
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {formatSilver(item.quantity * item.estimatedUnitPrice)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                  title="Eliminar ítem"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
