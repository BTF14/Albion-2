import React, { useState } from 'react';
import { useLoadoutManager } from '../hooks/useLoadoutManager';
import { LoadoutSlot, LoadoutCategory } from '../domain/models/loadouts';
import { formatSilver } from '../utils/albionColors';
import { AlbionItemBadge } from './AlbionItemBadge';
import {
  Shield,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Skull,
  Coins,
  Swords,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';

const SLOT_CONFIG: Record<
  LoadoutSlot,
  { label: string; icon: string; defaultName: string; defaultTier: number }
> = {
  main_hand: { label: 'Arma Principal', icon: '⚔️', defaultName: 'Espada / Bastón / Arco', defaultTier: 6 },
  off_hand: { label: 'Mano Secundaria', icon: '🛡️', defaultName: 'Escudo / Libro / Antorcha', defaultTier: 6 },
  head: { label: 'Cabeza (Casco/Caperuza)', icon: '🪖', defaultName: 'Casco de Placas / Caperuza', defaultTier: 6 },
  chest: { label: 'Pecho (Armadura/Túnica)', icon: '🥋', defaultName: 'Chaqueta / Túnica', defaultTier: 6 },
  shoes: { label: 'Zapatos (Botas/Sandalias)', icon: '👢', defaultName: 'Botas / Sandalias', defaultTier: 6 },
  cape: { label: 'Capa Faccionaria', icon: '🧣', defaultName: 'Capa de Ciudad', defaultTier: 6 },
  mount: { label: 'Montura', icon: '🐎', defaultName: 'Caballo / Buey / Garrapresta', defaultTier: 5 },
  food: { label: 'Comida', icon: '🍲', defaultName: 'Tortilla / Guiso / Pastel', defaultTier: 7 },
  potion: { label: 'Poción', icon: '🧪', defaultName: 'Poción de Resistencia / Veneno', defaultTier: 7 },
};

const CATEGORY_LABELS: Record<LoadoutCategory, { label: string; color: string }> = {
  pvp_zvz: { label: 'PvP ZvZ / Guerra de Gremios', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  pvp_smallscale: { label: 'PvP Small Scale / Roaming', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  transport: { label: 'Transporte a Caerleon', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  pve_fame: { label: 'PvE / Fama de Caminos', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  custom: { label: 'Set Personalizado', color: 'bg-slate-700 text-slate-300 border-slate-600' },
};

export const LoadoutsRegearView: React.FC = () => {
  const {
    loadouts,
    activeLoadout,
    setActiveLoadoutId,
    analysis,
    updateItemInActiveLoadout,
    createLoadout,
    deleteLoadout,
  } = useLoadoutManager();

  // Ciclo oficial de cálculo "Dar Resultado"
  const [hasCalculated, setHasCalculated] = useState<boolean>(true);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Modal crear set
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newSetName, setNewSetName] = useState<string>('');
  const [newSetCategory, setNewSetCategory] = useState<LoadoutCategory>('pvp_zvz');
  const [newSetNotes, setNewSetNotes] = useState<string>('');

  const handleCalculate = () => {
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  const markStale = () => {
    if (hasCalculated) setIsStale(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSetName.trim()) {
      createLoadout(newSetName, newSetCategory, newSetNotes);
      setNewSetName('');
      setNewSetNotes('');
      setShowCreateModal(false);
      setHasCalculated(true);
      setIsStale(false);
    }
  };

  const slots = Object.keys(SLOT_CONFIG) as LoadoutSlot[];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                Logística Militar & Presupuesto de Bajas
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs">Full Loot & Re-Gear</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <Shield className="text-red-400" size={26} />
              <span>Calculadora de Sets, Re-Gear & Presupuesto de Bajas</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Configura tus sets de batalla o transporte, calcula el coste exacto de reposición por muerte
              y asegura el fondo de reserva de plata para soportar múltiples bajas sin quebrar tu economía.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Nuevo Set</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Set Activo */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {loadouts.map((loadout) => {
          const isActive = loadout.id === activeLoadout.id;
          return (
            <button
              key={loadout.id}
              type="button"
              onClick={() => {
                setActiveLoadoutId(loadout.id);
                setIsStale(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-red-950/60 border-red-500/80 text-red-200 shadow-md shadow-red-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <span>⚔️ {loadout.name}</span>
              <span className="text-[10px] text-amber-400 font-mono tabular-nums">
                ({formatSilver(loadout.totalCost)})
              </span>
            </button>
          );
        })}
      </div>

      {/* Barra de Control de Cálculo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
            <Skull size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {hasCalculated
                ? isStale
                  ? 'Parámetros del Set Modificados'
                  : 'Presupuesto de Bajas Calculado'
                : 'Listo para Calcular'}
            </div>
            <div className="text-[11px] text-slate-400">
              {hasCalculated
                ? isStale
                  ? 'Modificaste piezas del set. Presiona para actualizar el fondo de reserva.'
                  : `Set "${activeLoadout.name}" evaluado con precios manuales de mercado.`
                : 'Presiona el botón para proyectar tu presupuesto de 1x, 3x, 5x y 10x bajas.'}
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
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-950/50'
                : isStale
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>
              {!hasCalculated
                ? 'Dar Resultado / Calcular Presupuesto'
                : isStale
                ? 'Recalcular Presupuesto'
                : 'Presupuesto Listo (Válido)'}
            </span>
          </button>
        </div>
      </div>

      {/* Resultados de Presupuesto de Bajas */}
      {hasCalculated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-4">
            <div className="text-xs text-red-300 font-bold flex items-center justify-between">
              <span>Coste por Muerte (1x Re-Gear)</span>
              <Skull size={16} className="text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-400 mt-1 tabular-nums font-mono">
              {formatSilver(analysis.costPerDeath)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {analysis.itemsCount} piezas equipadas en el set
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Reserva para 3 Bajas</span>
              <Swords size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1 tabular-nums font-mono">
              {formatSilver(analysis.budget3Deaths)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Fondo recomendado para Roaming / Ganking
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Reserva para 5 Bajas</span>
              <Shield size={16} className="text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-300 mt-1 tabular-nums font-mono">
              {formatSilver(analysis.budget5Deaths)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Fondo estándar para CTA / Castillos de Gremio
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Reserva para 10 Bajas (Inquebrantable)</span>
              <Coins size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums font-mono">
              {formatSilver(analysis.budget10Deaths)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Seguridad financiera total para temporadas ZvZ
            </div>
          </div>
        </div>
      )}

      {/* Grid de Ranuras del Set */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Configuración de Piezas: {activeLoadout.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${CATEGORY_LABELS[activeLoadout.category]?.color}`}>
                {CATEGORY_LABELS[activeLoadout.category]?.label}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edita el nombre, tier, encantamiento y coste manual de cada elemento.
            </p>
          </div>

          {loadouts.length > 1 && (
            <button
              type="button"
              onClick={() => deleteLoadout(activeLoadout.id)}
              className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors self-end sm:self-auto"
            >
              <Trash2 size={14} />
              <span>Eliminar este set</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {slots.map((slot) => {
            const config = SLOT_CONFIG[slot];
            const currentItem = activeLoadout.items[slot];
            const isEquipped = currentItem !== null;

            return (
              <div
                key={slot}
                className={`p-3.5 rounded-xl border transition-all ${
                  isEquipped
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-dashed border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{config.icon}</span>
                    <span className="text-xs font-bold text-slate-200">{config.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isEquipped) {
                        updateItemInActiveLoadout(slot, null);
                      } else {
                        updateItemInActiveLoadout(slot, {
                          slot,
                          name: config.defaultName,
                          tier: config.defaultTier,
                          enchantment: 0,
                          unitPrice: 50000,
                          quantity: 1,
                        });
                      }
                      markStale();
                    }}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      isEquipped
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/30'
                        : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                    }`}
                  >
                    {isEquipped ? 'Vaciar' : '+ Equipar'}
                  </button>
                </div>

                {isEquipped ? (
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      value={currentItem.name}
                      onChange={(e) => {
                        updateItemInActiveLoadout(slot, { ...currentItem, name: e.target.value });
                        markStale();
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-red-500"
                      placeholder="Nombre del ítem"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Tier & Encantamiento</label>
                        <div className="flex items-center gap-1 mt-0.5">
                          <select
                            value={currentItem.tier}
                            onChange={(e) => {
                              updateItemInActiveLoadout(slot, { ...currentItem, tier: Number(e.target.value) });
                              markStale();
                            }}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none"
                          >
                            {[3, 4, 5, 6, 7, 8].map((t) => (
                              <option key={t} value={t}>
                                T{t}
                              </option>
                            ))}
                          </select>
                          <select
                            value={currentItem.enchantment}
                            onChange={(e) => {
                              updateItemInActiveLoadout(slot, { ...currentItem, enchantment: Number(e.target.value) });
                              markStale();
                            }}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none"
                          >
                            {[0, 1, 2, 3, 4].map((e) => (
                              <option key={e} value={e}>
                                .{e}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block">Precio Unitario (🪙)</label>
                        <input
                          type="number"
                          min="0"
                          value={currentItem.unitPrice}
                          onChange={(e) => {
                            updateItemInActiveLoadout(slot, {
                              ...currentItem,
                              unitPrice: Math.max(0, Number(e.target.value) || 0),
                            });
                            markStale();
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-100 font-mono tabular-nums focus:outline-none focus:border-red-500 mt-0.5"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-900 font-mono tabular-nums">
                      <span className="text-slate-500">Subtotal ranura:</span>
                      <span className="text-amber-300 font-bold">
                        {formatSilver(currentItem.unitPrice * currentItem.quantity)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-[11px] text-slate-600 italic">
                    Ranura vacía
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Crear Set */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-slate-100 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-red-400" />
              <span>Crear Nuevo Set de Re-Gear</span>
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre del Set
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Set Curandero Sagrado ZvZ / Oso Transporte"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Categoría de Actividad
                </label>
                <select
                  value={newSetCategory}
                  onChange={(e) => setNewSetCategory(e.target.value as LoadoutCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none cursor-pointer"
                >
                  <option value="pvp_zvz">PvP ZvZ / Guerra de Gremios</option>
                  <option value="pvp_smallscale">PvP Small Scale / Roaming</option>
                  <option value="transport">Transporte a Caerleon</option>
                  <option value="pve_fame">PvE / Fama de Caminos de Avalon</option>
                  <option value="custom">Set Personalizado</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Instrucciones del gremio o build..."
                  value={newSetNotes}
                  onChange={(e) => setNewSetNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Crear Set
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
