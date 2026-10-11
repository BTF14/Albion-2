import React, { useState } from 'react';
import { useCharacterProfiles } from '../hooks/useCharacterProfiles';
import { PlayerIsland } from '../domain/models/character';
import { CityId } from '../types';
import { CITIES } from '../data/items';
import { NumericInput } from './NumericInput';
import {
  Users,
  User,
  Plus,
  Trash2,
  Edit2,
  Zap,
  Clock,
  MapPin,
  Check,
  X,
  Crown,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface CharacterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity?: (cityId: CityId) => void;
}

const AVATAR_COLORS = [
  '#f59e0b', // Amber (Martlock / General)
  '#10b981', // Emerald (Lymhurst)
  '#3b82f6', // Blue (Thetford)
  '#8b5cf6', // Purple (Brecilien)
  '#ef4444', // Red (Caerleon)
  '#e2e8f0', // White/Silver (Fort Sterling)
  '#f97316', // Orange (Bridgewatch)
];

export const CharacterManagerModal: React.FC<CharacterManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
}) => {
  const {
    characters,
    activeCharacter,
    activeId,
    allCharactersWithRegen,
    imperialFocusSummary,
    selectActiveCharacter,
    addCharacter,
    updateCharacter,
    setCharacterFocusValue,
    deleteCharacter,
    upsertIsland,
    deleteIsland,
  } = useCharacterProfiles();

  // Estados para creación de personaje
  const [isCreatingChar, setIsCreatingChar] = useState<boolean>(false);
  const [newCharName, setNewCharName] = useState<string>('');
  const [newCharRole, setNewCharRole] = useState<string>('');
  const [newCharColor, setNewCharColor] = useState<string>(AVATAR_COLORS[1]);
  const [newCharFocus, setNewCharFocus] = useState<number>(10000);
  const [newCharPremium, setNewCharPremium] = useState<boolean>(true);
  const [newCharIslandName, setNewCharIslandName] = useState<string>('');
  const [newCharIslandCity, setNewCharIslandCity] = useState<CityId>('caerleon');
  const [newCharIslandPlots, setNewCharIslandPlots] = useState<number>(5);

  // Estados para edición de personaje seleccionado
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editRole, setEditRole] = useState<string>('');
  const [editFocusInput, setEditFocusInput] = useState<number>(10000);
  const [pendingDeleteCharId, setPendingDeleteCharId] = useState<string | null>(null);

  // Estados para agregar isla al personaje activo
  const [isAddingIsland, setIsAddingIsland] = useState<boolean>(false);
  const [islandNameInput, setIslandNameInput] = useState<string>('Segunda Isla');
  const [islandCityInput, setIslandCityInput] = useState<CityId>('caerleon');
  const [islandPlotsInput, setIslandPlotsInput] = useState<number>(5);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreatingChar(true);
    setNewCharName('');
    setNewCharRole('');
    setNewCharIslandName('');
    setNewCharFocus(10000);
  };

  const handleConfirmCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    addCharacter({
      name: newCharName.trim(),
      avatarColor: newCharColor,
      hasPremium: newCharPremium,
      currentFocus: newCharFocus,
      roleNotes: newCharRole.trim() || undefined,
      initialIslandName: newCharIslandName.trim() || undefined,
      initialIslandCity: newCharIslandCity,
      initialIslandPlots: newCharIslandPlots,
    });

    setIsCreatingChar(false);
  };

  const handleSaveEdit = (charId: string) => {
    if (!editName.trim()) return;
    updateCharacter(charId, {
      name: editName.trim(),
      roleNotes: editRole.trim() || undefined,
    });
    setCharacterFocusValue(charId, editFocusInput);
    setEditingCharId(null);
  };

  const handleAddIslandToActive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCharacter || !islandNameInput.trim()) return;

    const newIsland: PlayerIsland = {
      id: `isl_${Date.now()}`,
      name: islandNameInput.trim(),
      cityId: islandCityInput,
      level: 6,
      plotsCount: islandPlotsInput,
      createdAt: Date.now(),
    };

    upsertIsland(activeCharacter.id, newIsland);
    setIsAddingIsland(false);
    setIslandNameInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Users size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Gestor Multi-Personaje & Multi-Isla (Alts)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {characters.length} {characters.length === 1 ? 'Personaje' : 'Personajes'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitorea el foco hasta 30.000 pts (recarga 10k/24h ~416/h con Premium) y organiza las islas independientes de tu imperio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumen Imperial de Foco Global */}
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">⚡ Foco Total Disponible:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {imperialFocusSummary.totalFocus.toLocaleString()} / {imperialFocusSummary.maxPossibleFocus.toLocaleString()} pts
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">👑 Alts a Máxima Capacidad:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {imperialFocusSummary.fullCharactersCount} de {imperialFocusSummary.totalCharacters} listos (10k)
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">🏝️ Total de Islas Registradas:</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {imperialFocusSummary.totalIslands} islas
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">🌾 Parcelas Agrícolas Totales:</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {imperialFocusSummary.totalPlots} parcelas ({imperialFocusSummary.totalPlots * 9} slots)
              </span>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Botón para crear nuevo personaje */}
          {!isCreatingChar && (
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selecciona o administra tus personajes
              </h3>
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Agregar Nuevo Personaje (Alt)</span>
              </button>
            </div>
          )}

          {/* Formulario de creación de personaje */}
          {isCreatingChar && (
            <form
              onSubmit={handleConfirmCreate}
              className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-4 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                  <User size={16} />
                  <span>Crear Nuevo Perfil de Personaje (Alt)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingChar(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre del Personaje *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. JuanCaerleon / AltPociones"
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rol / Especialización</label>
                  <input
                    type="text"
                    placeholder="ej. Criador de Caballos / Chef"
                    value={newCharRole}
                    onChange={(e) => setNewCharRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Color Distintivo</label>
                  <div className="flex items-center gap-2 pt-1">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCharColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          newCharColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Foco inicial y Premium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-400" />
                    <span>Foco Actual del Personaje (0 - 30.000 pts)</span>
                  </label>
                  <NumericInput
                    min={0}
                    max={30000}
                    step={500}
                    value={newCharFocus}
                    onChange={(val) => setNewCharFocus(val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    El sistema comenzará a regenerarlo automáticamente desde este punto (~416.6 pts/h).
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCharPremium}
                      onChange={(e) => setNewCharPremium(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-slate-200 font-semibold text-xs flex items-center gap-1">
                      <Crown size={14} className="text-amber-400" />
                      Tiene Estado Premium Activo
                    </span>
                  </label>
                </div>
              </div>

              {/* Isla inicial opcional */}
              <div className="border-t border-slate-800 pt-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase block mb-2">
                  Isla Inicial (Opcional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre de Isla (ej. Isla Caerleon)"
                      value={newCharIslandName}
                      onChange={(e) => setNewCharIslandName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newCharIslandCity}
                      onChange={(e) => setNewCharIslandCity(e.target.value as CityId)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <NumericInput
                      min={1}
                      max={16}
                      value={newCharIslandPlots}
                      onChange={(val) => setNewCharIslandPlots(Math.max(1, val))}
                      placeholder="Parcelas (ej. 5)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingChar(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check size={14} />
                  <span>Crear Personaje</span>
                </button>
              </div>
            </form>
          )}

          {/* Lista de Personajes con sus monitores de foco y reloj de regeneración */}
          <div className="grid grid-cols-1 gap-4">
            {allCharactersWithRegen.map(({ character: char, regen }) => {
              const isActive = char.id === activeId;
              const isEditing = editingCharId === char.id;

              return (
                <div
                  key={char.id}
                  className={`rounded-xl border transition-all p-4 ${
                    isActive
                      ? 'bg-slate-950 border-amber-500/50 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Info Personaje */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shadow-md shrink-0"
                        style={{ backgroundColor: char.avatarColor }}
                      >
                        {char.name.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm">{char.name}</span>
                          {char.isMain && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                              <Crown size={11} /> Principal
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              ACTIVO AHORA
                            </span>
                          )}
                          {char.hasPremium ? (
                            <span className="text-[10px] font-semibold text-amber-400">★ Premium</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Sin Premium</span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                          {char.roleNotes && <span>{char.roleNotes}</span>}
                          <span>•</span>
                          <span>{char.islands.length} {char.islands.length === 1 ? 'isla' : 'islas'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones de Selección y Edición */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => selectActiveCharacter(char.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Seleccionar</span>
                          <ChevronRight size={13} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingCharId(null);
                          } else {
                            setEditingCharId(char.id);
                            setEditName(char.name);
                            setEditRole(char.roleNotes || '');
                            setEditFocusInput(regen.currentFocus);
                          }
                        }}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer text-xs"
                        title="Editar personaje o ajustar foco"
                      >
                        <Edit2 size={14} />
                      </button>

                      {characters.length > 1 && (
                        pendingDeleteCharId === char.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/50 p-1 rounded-lg text-xs">
                            <span className="text-[10px] text-rose-200 font-semibold pl-1">¿Eliminar?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteCharacter(char.id);
                                setPendingDeleteCharId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteCharId(null)}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteCharId(char.id)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer text-xs"
                            title="Eliminar personaje"
                          >
                            <Trash2 size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Barra y Reloj de Regeneración de Foco en Tiempo Real */}
                  <div className="mt-3 bg-slate-900/80 rounded-xl p-3 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} className={regen.isFull ? 'text-amber-400 animate-pulse' : 'text-amber-400'} />
                        <span className="font-bold text-slate-200">
                          {regen.currentFocus.toLocaleString()} / 30.000 ⚡
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({regen.percentage}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock size={12} className="text-slate-400" />
                        <span className={regen.isFull ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                          {regen.isFull ? '¡Tope alcanzado (30k)!' : `Tope en: ${regen.formattedTimeUntilFull}`}
                        </span>
                        {char.hasPremium && (
                          <span className="text-slate-500 text-[10px] hidden sm:inline">
                            (+416.6/h)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          regen.isFull
                            ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                            : 'bg-gradient-to-r from-amber-600 to-amber-400'
                        }`}
                        style={{ width: `${regen.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Formulario rápido de edición inline */}
                  {isEditing && (
                    <div className="mt-3 p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-0.5">Nombre</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-0.5">Rol / Notas</label>
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-0.5">Ajustar Foco Actual (0 - 30k)</label>
                          <NumericInput
                            min={0}
                            max={30000}
                            step={250}
                            value={editFocusInput}
                            onChange={(val) => setEditFocusInput(val)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-amber-300 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCharId(null)}
                          className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(char.id)}
                          className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Islas del Personaje */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={12} className="text-amber-400" />
                        Islas de {char.name} ({char.islands.length})
                      </span>

                      {isActive && !isAddingIsland && (
                        <button
                          type="button"
                          onClick={() => setIsAddingIsland(true)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Agregar Isla</span>
                        </button>
                      )}
                    </div>

                    {/* Lista de Islas */}
                    {char.islands.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-1">
                        Sin islas registradas aún para este personaje.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {char.islands.map((isl) => {
                          const city = CITIES.find((c) => c.id === isl.cityId) || CITIES[0];
                          return (
                            <div
                              key={isl.id}
                              className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: city.color }}
                                  title={`Ciudad: ${city.name}`}
                                />
                                <div>
                                  <span className="font-bold text-slate-200 block">{isl.name}</span>
                                  <span className="text-[11px] text-slate-400">
                                    {city.name} • {isl.plotsCount} parcelas ({isl.plotsCount * 9} slots)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {onSelectCity && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onSelectCity(isl.cityId);
                                      onClose();
                                    }}
                                    className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                                    title="Viajar / Filtrar por esta ciudad"
                                  >
                                    Ir
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => deleteIsland(char.id, isl.id)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Eliminar isla"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Formulario para agregar isla al personaje activo */}
                    {isActive && isAddingIsland && (
                      <form
                        onSubmit={handleAddIslandToActive}
                        className="mt-2.5 p-3 bg-slate-900 border border-amber-500/30 rounded-xl space-y-2 text-xs"
                      >
                        <div className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                          <Plus size={12} /> Nueva Isla para {char.name}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nombre de Isla (ej. Isla Hierbas)"
                            value={islandNameInput}
                            onChange={(e) => setIslandNameInput(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
                          />
                          <select
                            value={islandCityInput}
                            onChange={(e) => setIslandCityInput(e.target.value as CityId)}
                            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
                          >
                            {CITIES.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <NumericInput
                            min={1}
                            max={16}
                            value={islandPlotsInput}
                            onChange={(val) => setIslandPlotsInput(Math.max(1, val))}
                            placeholder="Parcelas (1-16)"
                            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingIsland(false)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[11px]"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                          >
                            Guardar Isla
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Los alts y sus relojes de foco se sincronizan localmente en tu navegador sin requerir APIs externas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
