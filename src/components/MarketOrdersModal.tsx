import React, { useState } from 'react';
import { useMarketOrders } from '../hooks/useMarketOrders';
import { CityId } from '../types';
import { CITIES } from '../data/items';
import { formatSilver } from '../utils/albionColors';
import { AlbionItemBadge } from './AlbionItemBadge';
import {
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Coins,
  CheckCircle2,
  X,
  MapPin,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTransferToLedger?: (order: {
    itemName: string;
    tier: number;
    unitPrice: number;
    quantity: number;
    cityId: CityId;
  }) => void;
}

export const MarketOrdersModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTransferToLedger,
}) => {
  const {
    analyzedOrders,
    urgentOrdersCount,
    totalLockedSilver,
    addOrder,
    deleteOrder,
  } = useMarketOrders();

  const [isAddFormOpen, setIsAddFormOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newTier, setNewTier] = useState<number>(4);
  const [newCityId, setNewCityId] = useState<CityId>('fort_sterling');
  const [newOrderType, setNewOrderType] = useState<'sell' | 'buy'>('sell');
  const [newUnitPrice, setNewUnitPrice] = useState<string>('5000');
  const [newQuantity, setNewQuantity] = useState<string>('10');
  const [newNotes, setNewNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newUnitPrice);
    const qty = Number(newQuantity);

    if (newItemName.trim() && price > 0 && qty > 0) {
      addOrder({
        itemId: `custom_${Date.now()}`,
        itemName: newItemName.trim(),
        tier: newTier,
        cityId: newCityId,
        orderType: newOrderType,
        unitPrice: price,
        quantity: qty,
        notes: newNotes.trim() || undefined,
      });

      setNewItemName('');
      setNewUnitPrice('5000');
      setNewQuantity('10');
      setNewNotes('');
      setIsAddFormOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                <span>Monitor de Caducidad de Órdenes de Mercado (30 Días)</span>
                {urgentOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {urgentOrdersCount} por vencer
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Evita perder la tasa de mercado: recibe avisos antes de que tus órdenes alcancen los 30 días.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>{isAddFormOpen ? 'Cerrar Formulario' : 'Nueva Orden'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Resumen Superior */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Plata en Órdenes Activas:</div>
            <div className="text-base font-black text-amber-300 mt-0.5 tabular-nums">
              {formatSilver(totalLockedSilver)}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Órdenes Totales Monitoreadas:</div>
            <div className="text-base font-black text-slate-100 mt-0.5 tabular-nums">
              {analyzedOrders.length} orden(es)
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Estado de Urgencia:</div>
            <div
              className={`text-base font-black mt-0.5 tabular-nums ${
                urgentOrdersCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {urgentOrdersCount > 0 ? `${urgentOrdersCount} requieren atención` : 'Todas vigentes'}
            </div>
          </div>
        </div>

        {/* Formulario Agregar Orden */}
        {isAddFormOpen && (
          <form
            onSubmit={handleCreateOrder}
            className="mb-4 bg-slate-950/80 border border-amber-900/40 rounded-xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nombre del Ítem
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Espada Ancha T4.1 / Pastel T7"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Ciudad de la Subasta
                </label>
                <select
                  value={newCityId}
                  onChange={(e) => setNewCityId(e.target.value as CityId)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tipo de Orden
                </label>
                <select
                  value={newOrderType}
                  onChange={(e) => setNewOrderType(e.target.value as 'sell' | 'buy')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="sell">Orden de Venta (Sell)</option>
                  <option value="buy">Orden de Compra (Buy)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tier
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {[3, 4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      Tier {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Precio Unitario (🪙)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newUnitPrice}
                  onChange={(e) => setNewUnitPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Cantidad (u.)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 tabular-nums focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Notas (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Margen +15%, esperando subida..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
              >
                Guardar Orden
              </button>
            </div>
          </form>
        )}

        {/* Lista de Órdenes */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {analyzedOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No tienes órdenes activas registradas. Añade una para comenzar el monitoreo de 30 días.
            </div>
          ) : (
            analyzedOrders.map(({ order, daysRemaining, hoursRemaining, isExpired, isUrgent, urgencyLabel }) => (
              <div
                key={order.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isExpired
                    ? 'bg-rose-950/20 border-rose-900/50'
                    : isUrgent
                    ? 'bg-amber-950/20 border-amber-600/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      order.orderType === 'sell'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}
                  >
                    {order.orderType === 'sell' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-xs">{order.itemName}</span>
                      <AlbionItemBadge tier={order.tier} />
                      <span className="text-[10px] text-slate-400 uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800">
                        {order.orderType === 'sell' ? 'Venta' : 'Compra'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1 tabular-nums">
                      <span>{order.quantity} u. × {formatSilver(order.unitPrice)}</span>
                      <span>=</span>
                      <span className="font-bold text-amber-300">{formatSilver(order.totalValue)}</span>
                      <span>•</span>
                      <span className="capitalize">{order.cityId.replace('_', ' ')}</span>
                      {order.notes && <span className="text-slate-500 italic">({order.notes})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div
                      className={`text-xs font-black flex items-center gap-1 ${
                        isExpired
                          ? 'text-rose-400'
                          : isUrgent
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      <Clock size={12} />
                      <span>{urgencyLabel}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Límite oficial de 30 días
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {onTransferToLedger && order.orderType === 'sell' && (
                      <button
                        type="button"
                        onClick={() => {
                          onTransferToLedger({
                            itemName: order.itemName,
                            tier: order.tier,
                            unitPrice: order.unitPrice,
                            quantity: order.quantity,
                            cityId: order.cityId,
                          });
                          deleteOrder(order.id);
                        }}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="Marcar como vendida y registrar en Libro Mayor"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Eliminar orden"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
