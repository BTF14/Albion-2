import React, { useState, useMemo } from 'react';
import {
  Clock,
  Flame,
  CheckCircle2,
  Settings2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Layers,
  Utensils,
  FlaskConical,
  Sword,
  Shield,
  Globe2,
  Search,
  X,
  Filter,
  Tag,
  TreePine,
  Pickaxe,
} from 'lucide-react';
import { useDailyEvents } from '../hooks/useDailyEvents';
import { ALBION_SERVERS, AlbionServerRegion, EventCategory, ProductionBonusCategory } from '../domain/models/dailyEvents';

interface DailyEventsBannerProps {
  dailyEventsHook: ReturnType<typeof useDailyEvents>;
  onNavigateToSimulator?: () => void;
  onNavigateToOptimizer?: () => void;
}

export const DailyEventsBanner: React.FC<DailyEventsBannerProps> = ({
  dailyEventsHook,
  onNavigateToSimulator,
  onNavigateToOptimizer,
}) => {
  const {
    timeInfo,
    currentEvent,
    activeBonuses,
    availableEvents,
    availableBonuses,
    isBannerCollapsed,
    cookingBonusPercent,
    alchemyBonusPercent,
    serverRegion,
    setServerRegion,
    toggleBonus,
    selectEvent,
    setCustomBonus,
    toggleBannerCollapse,
  } = dailyEventsHook;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'bonuses' | 'events' | 'custom'>('bonuses');
  
  // Filtros de búsqueda para Eventos/Actividades
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<'all' | EventCategory>('all');

  // Filtros de búsqueda para Bonos de Producción
  const [bonusSearch, setBonusSearch] = useState('');
  const [bonusCategoryFilter, setBonusCategoryFilter] = useState<'all' | ProductionBonusCategory>('all');

  const [customInputName, setCustomInputName] = useState('');
  const [customInputPercent, setCustomInputPercent] = useState<number>(10);

  const currentServerConfig = ALBION_SERVERS[serverRegion] || ALBION_SERVERS.americas;
  const hasAnyBonusActive = activeBonuses.length > 0;

  // Filtrado reactivo de actividades
  const filteredEvents = useMemo(() => {
    return availableEvents.filter((ev) => {
      const matchesSearch =
        ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.description.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.badgeLabel.toLowerCase().includes(eventSearch.toLowerCase());

      const matchesCat =
        eventCategoryFilter === 'all' || ev.category === eventCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [availableEvents, eventSearch, eventCategoryFilter]);

  // Filtrado reactivo de bonos de producción
  const filteredBonuses = useMemo(() => {
    return availableBonuses.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(bonusSearch.toLowerCase()) ||
        b.affectedSkill.toLowerCase().includes(bonusSearch.toLowerCase()) ||
        b.description.toLowerCase().includes(bonusSearch.toLowerCase()) ||
        (b.itemLines && b.itemLines.some((line) => line.toLowerCase().includes(bonusSearch.toLowerCase())));

      const matchesCat =
        bonusCategoryFilter === 'all' || b.category === bonusCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [availableBonuses, bonusSearch, bonusCategoryFilter]);

  return (
    <div className="mb-6">
      {/* Contenedor Principal del Banner Estilo Oficial Albion */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Decoración de resplandor de fondo */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado Superior: Título de Actividades + Reloj UTC Oficial + Selector Servidor + Botón Colapsar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            {/* Ícono de Escudo de Actividades de Albion */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 border border-amber-300/40">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-amber-100 uppercase">
                  Eventos Diarios & Mantenimiento
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Albion Online
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Servidor <strong className="text-amber-300">{currentServerConfig.name}</strong> • Mantenimiento a las{' '}
                <span className="text-amber-400 font-semibold">{currentServerConfig.maintenanceHourUtc}:00 UTC</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Selector de Servidor (América, Europa, Asia) */}
            <div className="flex items-center bg-slate-950/80 border border-amber-500/30 rounded-xl px-2 py-1 shadow-inner">
              <Globe2 className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              <select
                value={serverRegion}
                onChange={(e) => setServerRegion(e.target.value as AlbionServerRegion)}
                className="bg-transparent text-amber-200 text-xs font-bold focus:outline-none cursor-pointer pr-1"
                title="Seleccionar servidor de Albion Online"
              >
                <option value="americas" className="bg-slate-900 text-slate-100">
                  🌎 Albion América (10:00 UTC)
                </option>
                <option value="europe" className="bg-slate-900 text-slate-100">
                  🌍 Albion Europa (10:00 UTC)
                </option>
                <option value="asia" className="bg-slate-900 text-slate-100">
                  🌏 Albion Asia (23:00 UTC)
                </option>
              </select>
            </div>

            {/* Reloj Oficial UTC en Vivo */}
            <div className="bg-slate-950/80 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="text-right">
                <div className="text-[10px] text-slate-400 leading-tight">Hora Servidor</div>
                <div className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                  {timeInfo.currentUtcString}
                </div>
              </div>
            </div>

            {/* Botón para Configurar Eventos / Bonos */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-500/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Ajustar eventos y bonos del día"
            >
              <Settings2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Personalizar</span>
            </button>

            {/* Botón Minimizar / Desplegar */}
            <button
              type="button"
              onClick={toggleBannerCollapse}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title={isBannerCollapsed ? 'Expandir panel' : 'Minimizar panel'}
            >
              {isBannerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL BANNER (Visible salvo si el usuario lo minimiza explícitamente) */}
        {!isBannerCollapsed ? (
          <div className="pt-4 space-y-4">
            {/* Cuadrícula de 2 Tarjetas (Inspirada en la pantalla oficial de Albion) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Tarjeta Izquierda: Evento Diario Rotativo */}
              <div className="lg:col-span-7 bg-slate-950/70 border border-amber-500/20 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span>{currentEvent.badgeLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-[11px] text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Cambiar evento ▾
                    </button>
                  </div>

                  <h3 className="text-lg font-black text-amber-100 tracking-tight mb-1">
                    {currentEvent.title}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {currentEvent.description}
                  </p>
                </div>

                {/* Ribbon rojo/dorado oficial con cuenta regresiva al reinicio 10:00 UTC */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-950/90 via-red-900/80 to-amber-950/80 border border-red-500/50 px-3 py-1.5 rounded-lg shadow-md">
                    <span className="text-red-400 font-bold animate-pulse text-sm">⏳</span>
                    <span className="text-xs font-mono font-black text-amber-100 tracking-wide">
                      {timeInfo.formattedCountdown} restantes
                    </span>
                    <span className="text-[10px] text-red-200/70 border-l border-red-500/30 pl-2">
                      Reinicio 10:00 UTC
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Ciclo del día:{' '}
                    <span className="font-mono text-slate-300">{timeInfo.currentCycleDateUtc}</span>
                  </span>
                </div>
              </div>

              {/* Tarjeta Derecha: Bonos Diarios de Producción Activos */}
              <div className="lg:col-span-5 bg-slate-950/70 border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Bonos Diarios de Producción
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {activeBonuses.length} activo(s)
                    </span>
                  </div>

                  {/* Chips interactivos rápidos de bonos más comunes de Albion */}
                  <div className="flex flex-wrap gap-1.5 my-2">
                    {/* Cocina +10% */}
                    <button
                      type="button"
                      onClick={() => toggleBonus('bonus_cooking')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeBonuses.some((b) => b.id === 'bonus_cooking')
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <Utensils className="w-3 h-3" />
                      +10% Cocina
                    </button>

                    {/* Alquimia +10% */}
                    <button
                      type="button"
                      onClick={() => toggleBonus('bonus_alchemy')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeBonuses.some((b) => b.id === 'bonus_alchemy')
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <FlaskConical className="w-3 h-3" />
                      +10% Alquimia
                    </button>

                    {/* Mazas y Espadas +10% */}
                    <button
                      type="button"
                      onClick={() => toggleBonus('bonus_weapons_mace_sword')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeBonuses.some((b) => b.id === 'bonus_weapons_mace_sword')
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <Sword className="w-3 h-3" />
                      +10% Maza/Espada
                    </button>

                    {/* Cuero +10% */}
                    <button
                      type="button"
                      onClick={() => toggleBonus('bonus_refining_leather')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeBonuses.some((b) => b.id === 'bonus_refining_leather')
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      +10% Cuero
                    </button>

                    {/* Madera +10% */}
                    <button
                      type="button"
                      onClick={() => toggleBonus('bonus_refining_wood')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeBonuses.some((b) => b.id === 'bonus_refining_wood')
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <TreePine className="w-3 h-3" />
                      +10% Madera
                    </button>

                    {/* Mineral +10% */}
                    <button
                      type="button"
                      onClick={() => toggleBonus('bonus_refining_ore')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        activeBonuses.some((b) => b.id === 'bonus_refining_ore')
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <Pickaxe className="w-3 h-3" />
                      +10% Mineral
                    </button>

                    {/* Botón para abrir catálogo completo */}
                    <button
                      type="button"
                      onClick={() => {
                        setModalTab('bonuses');
                        setIsModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30"
                    >
                      <span>+ Catálogo ({availableBonuses.length})</span>
                    </button>
                  </div>
                </div>

                {/* Estado de impacto directo en la economía */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                  {hasAnyBonusActive ? (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {cookingBonusPercent > 0 && `+${cookingBonusPercent}% RRR Cocina`}
                          {cookingBonusPercent > 0 && alchemyBonusPercent > 0 && ' • '}
                          {alchemyBonusPercent > 0 && `+${alchemyBonusPercent}% RRR Alquimia`}
                          {cookingBonusPercent === 0 &&
                            alchemyBonusPercent === 0 &&
                            activeBonuses.map((b) => b.name).join(', ')}
                        </span>
                      </div>
                      {onNavigateToSimulator && (
                        <button
                          type="button"
                          onClick={onNavigateToSimulator}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                        >
                          Simular con bono →
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sin bonos de producción activos hoy. Haz clic arriba para activar.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso Dinámico de Integración Económica */}
            {(cookingBonusPercent > 0 || alchemyBonusPercent > 0) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-200">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                  <span>
                    <strong>¡Bono de producción activo!</strong> El motor económico está aplicando{' '}
                    {cookingBonusPercent > 0 && (
                      <span className="font-bold text-amber-300">+{cookingBonusPercent}% de Retorno en Cocina</span>
                    )}
                    {cookingBonusPercent > 0 && alchemyBonusPercent > 0 && ' y '}
                    {alchemyBonusPercent > 0 && (
                      <span className="font-bold text-amber-300">+{alchemyBonusPercent}% en Alquimia</span>
                    )}
                    . Tus ganancias y Plata/Foco están recalculados automáticamente.
                  </span>
                </div>
                {onNavigateToOptimizer && (
                  <button
                    type="button"
                    onClick={onNavigateToOptimizer}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Ver Ranking de Foco Actualizado
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Vista Compacta (cuando el usuario minimiza) */
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold">
                <span className="text-red-400">⏳</span> {timeInfo.formattedCountdown} restantes para 10:00 UTC
              </span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-slate-300 font-medium hidden sm:inline">
                Evento: <strong className="text-amber-200">{currentEvent.title}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">
                Bonos activos:{' '}
                <strong className="text-amber-300">
                  {hasAnyBonusActive ? activeBonuses.map((b) => b.name).join(', ') : 'Ninguno'}
                </strong>
              </span>
              <button
                type="button"
                onClick={toggleBannerCollapse}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
              >
                Expandir detalles ▾
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE PERSONALIZACIÓN DE EVENTOS Y BONOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-100">
                  Ajustar Eventos Diarios & Bonos Activos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Barra de Pestañas del Modal */}
            <div className="flex border-b border-slate-800 mt-3 -mx-6 px-6 gap-2">
              <button
                type="button"
                onClick={() => setModalTab('bonuses')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'bonuses'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Bonos de Producción</span>
                {activeBonuses.length > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 text-[10px] font-black rounded-full">
                    {activeBonuses.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalTab('events')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'events'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Actividades Diarias ({availableEvents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('custom')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'custom'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Servidor & Personalizado</span>
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* ================= PESTAÑA 1: BONOS DE PRODUCCIÓN ================= */}
              {modalTab === 'bonuses' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-300">
                      Selecciona los bonos que correspondan a tu servidor hoy para calcular el <strong>RRR exacto</strong>:
                    </p>
                    {activeBonuses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          activeBonuses.forEach((b) => toggleBonus(b.id));
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
                      >
                        Limpiar Selección ({activeBonuses.length})
                      </button>
                    )}
                  </div>

                  {/* Barra de Búsqueda de Bonos */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={bonusSearch}
                      onChange={(e) => setBonusSearch(e.target.value)}
                      placeholder="Buscar por arma, armadura, comida, mineral, etc..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    {bonusSearch && (
                      <button
                        type="button"
                        onClick={() => setBonusSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Chips de Categoría de Bonos */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      { id: 'all' as const, label: 'Todos' },
                      { id: 'refining' as const, label: '🌲 Refinado (5)' },
                      { id: 'cooking' as const, label: '🍲 Cocina' },
                      { id: 'alchemy' as const, label: '🧪 Alquimia' },
                      { id: 'weapons' as const, label: '⚔️ Armas' },
                      { id: 'armor' as const, label: '🛡️ Armaduras' },
                      { id: 'accessories' as const, label: '🎒 Accesorios' },
                      { id: 'mounts' as const, label: '🐴 Monturas' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBonusCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                          bonusCategoryFilter === cat.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Cuadrícula de Bonos Disponibles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredBonuses.map((bonus) => {
                      const isSelected = activeBonuses.some((b) => b.id === bonus.id);
                      return (
                        <button
                          key={bonus.id}
                          type="button"
                          onClick={() => toggleBonus(bonus.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-200 font-bold shadow-md'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="pr-2">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span>{bonus.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{bonus.affectedSkill}</div>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">
                              +{bonus.bonusPercent}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {filteredBonuses.length === 0 && (
                      <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                        No se encontraron bonos con el término "{bonusSearch}".
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= PESTAÑA 2: ACTIVIDADES Y EVENTOS ================= */}
              {modalTab === 'events' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300">
                    Selecciona el evento oficial activo hoy en tu servidor (cambia a las {currentServerConfig.maintenanceHourUtc}:00 UTC):
                  </p>

                  {/* Barra de Búsqueda de Eventos */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Buscar actividad (nieblas, mazmorras, pesca, facciones...)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    {eventSearch && (
                      <button
                        type="button"
                        onClick={() => setEventSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Chips de Categoría de Actividades */}
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      { id: 'all' as const, label: 'Todas' },
                      { id: 'mists' as const, label: '🌫️ Nieblas & Brecilien' },
                      { id: 'roads' as const, label: '🌀 Caminos' },
                      { id: 'dungeons' as const, label: '🏰 Mazmorras' },
                      { id: 'hellgates' as const, label: '🔥 Hellgates' },
                      { id: 'faction' as const, label: '🛡️ Facciones' },
                      { id: 'gathering' as const, label: '⛏️ Recolección' },
                      { id: 'farming' as const, label: '🌾 Granja & Economía' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEventCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer border ${
                          eventCategoryFilter === cat.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Lista de Actividades Disponibles */}
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => selectEvent(ev.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          currentEvent.id === ev.id
                            ? 'bg-amber-500/15 border-amber-500 text-amber-100 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            <span>{ev.badgeLabel}</span>
                            <span>{ev.title}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{ev.description}</div>
                          <div className="text-[11px] text-amber-300 font-semibold mt-1">
                            Bono: {ev.bonusText}
                          </div>
                        </div>
                        {currentEvent.id === ev.id && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                      </button>
                    ))}
                    {filteredEvents.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No se encontraron actividades con el término "{eventSearch}".
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= PESTAÑA 3: SERVIDOR Y PERSONALIZADO ================= */}
              {modalTab === 'custom' && (
                <div className="space-y-4">
                  {/* Selector de Servidor */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe2 className="w-4 h-4 text-amber-400" />
                        Servidor Oficial de Albion
                      </label>
                      <span className="text-[11px] text-amber-300 font-mono font-bold">
                        Mantenimiento: {currentServerConfig.maintenanceHourUtc}:00 UTC
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(ALBION_SERVERS) as AlbionServerRegion[]).map((regionKey) => {
                        const cfg = ALBION_SERVERS[regionKey];
                        const isSelected = serverRegion === regionKey;
                        return (
                          <button
                            key={regionKey}
                            type="button"
                            onClick={() => setServerRegion(regionKey)}
                            className={`p-2 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            <div>{cfg.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">{cfg.location}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Albion Online:</strong> Sandbox Interactive rota sus eventos diarios en cada mantenimiento del servidor. Las cuentas regresivas y rotaciones se ajustan automáticamente al horario de tu servidor seleccionado.
                      </span>
                    </div>
                  </div>

                  {/* Bono Personalizado */}
                  <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      ¿Tienes algún otro bono activo o parche especial hoy?
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Si Albion lanza un evento de gremio o bono extraordinario, agrégalo aquí:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customInputName}
                        onChange={(e) => setCustomInputName(e.target.value)}
                        placeholder="Ej. Crafteo de Ballestas o Escudos"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <select
                        value={customInputPercent}
                        onChange={(e) => setCustomInputPercent(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value={10}>+10% RRR</option>
                        <option value={20}>+20% RRR</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (customInputName.trim()) {
                            setCustomBonus(customInputName.trim(), customInputPercent);
                            setCustomInputName('');
                          }
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
