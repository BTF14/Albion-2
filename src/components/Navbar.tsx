import React, { useState, useEffect, useMemo } from 'react';
import { CityId, AppTab } from '../types';
import { CITIES } from '../data/items';
import {
  Wheat,
  MapPin,
  ShieldAlert,
  HelpCircle,
  Sliders,
  Sparkles,
  Users,
  Zap,
  Database,
  TrendingUp,
  Anvil,
  Flame,
  BookOpen,
  Skull,
  Layers,
  Castle,
  Cloud,
  Search,
} from 'lucide-react';

export type NavCategory = 'all' | 'farm' | 'focus' | 'crafting' | 'islands' | 'market';

export interface CategoryDef {
  id: NavCategory;
  name: string;
  icon: string;
  tabs: AppTab[];
  badgeColor: string;
}

export const NAV_CATEGORIES: CategoryDef[] = [
  {
    id: 'all',
    name: 'Todas',
    icon: '🌐',
    tabs: [
      'logger', 'history', 'calendar', 'todo', 'mastery', 'focus_optimizer', 'focus_portfolio',
      'mounts', 'butcher', 'labourers', 'guild_island', 'crafting_equipment', 'refining',
      'transmutation', 'enchanting', 'sales_ledger', 'black_market_simulator', 'transport',
      'warehouse_logistics', 'red_zone_transport', 'silver_audit', 'analytics', 'simulator', 'value_added', 'fishing_sauces', 'goals', 'regear', 'guide'
    ],
    badgeColor: 'border-slate-700 bg-slate-800 text-slate-200',
  },
  {
    id: 'farm',
    name: 'Granja & Ganadería',
    icon: '🌾',
    tabs: ['logger', 'history', 'calendar', 'todo', 'goals', 'mounts', 'butcher', 'simulator'],
    badgeColor: 'border-amber-500/50 bg-amber-500/20 text-amber-300',
  },
  {
    id: 'focus',
    name: 'Imperio de Foco',
    icon: '⚡',
    tabs: ['focus_optimizer', 'focus_portfolio', 'mastery', 'silver_audit', 'analytics'],
    badgeColor: 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300',
  },
  {
    id: 'crafting',
    name: 'Crafteo & Industria',
    icon: '🔨',
    tabs: ['crafting_equipment', 'refining', 'transmutation', 'enchanting', 'value_added', 'fishing_sauces'],
    badgeColor: 'border-orange-500/50 bg-orange-500/20 text-orange-300',
  },
  {
    id: 'islands',
    name: 'Islas & Trabajadores',
    icon: '🏰',
    tabs: ['labourers', 'guild_island'],
    badgeColor: 'border-purple-500/50 bg-purple-500/20 text-purple-300',
  },
  {
    id: 'market',
    name: 'Mercado & Transporte',
    icon: '⚖️',
    tabs: ['sales_ledger', 'black_market_simulator', 'transport', 'warehouse_logistics', 'red_zone_transport', 'guide'],
    badgeColor: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300',
  },
];

interface NavbarProps {
  currentCityId: CityId;
  onSelectCity: (id: CityId) => void;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  logsCount: number;
  totalProfit: number;
  pendingTasksCount?: number;
  serverCountdown?: string;
  activeBonusesCount?: number;
  onToggleEvents?: () => void;
  // Multi-personaje y Foco
  activeCharacterName?: string;
  activeCharacterColor?: string;
  activeCharacterFocus?: number;
  isFocusFull?: boolean;
  onOpenCharacterModal?: () => void;
  // Respaldo de Datos
  onOpenBackupModal?: () => void;
  // Sincronización en la Nube
  onOpenCloudSyncModal?: () => void;
  // Consulta Referencial de Precios (Albion Data Project)
  onOpenAdpModal?: () => void;
  // Paleta de Comandos Global (Búsqueda Rápida Ctrl+K)
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCityId,
  onSelectCity,
  activeTab,
  onSelectTab,
  logsCount,
  totalProfit,
  pendingTasksCount,
  serverCountdown,
  activeBonusesCount,
  onToggleEvents,
  activeCharacterName,
  activeCharacterColor = '#f59e0b',
  activeCharacterFocus,
  isFocusFull,
  onOpenCharacterModal,
  onOpenBackupModal,
  onOpenCloudSyncModal,
  onOpenAdpModal,
  onOpenCommandPalette,
}) => {
  const currentCity = CITIES.find((c) => c.id === currentCityId) || CITIES[0];

  const [selectedCategory, setSelectedCategory] = useState<NavCategory>(() => {
    try {
      const saved = localStorage.getItem('albion_nav_category_v1');
      if (saved && ['all', 'farm', 'focus', 'crafting', 'islands', 'market'].includes(saved)) {
        return saved as NavCategory;
      }
    } catch {}
    return 'all';
  });

  // Si la pestaña activa cambia externamente, auto-adaptar la categoría para que la pestaña no quede oculta
  useEffect(() => {
    if (selectedCategory === 'all') return;
    const currentCatDef = NAV_CATEGORIES.find((c) => c.id === selectedCategory);
    if (currentCatDef && !currentCatDef.tabs.includes(activeTab)) {
      const parentCat = NAV_CATEGORIES.find((c) => c.id !== 'all' && c.tabs.includes(activeTab));
      if (parentCat) {
        setSelectedCategory(parentCat.id);
        try {
          localStorage.setItem('albion_nav_category_v1', parentCat.id);
        } catch {}
      }
    }
  }, [activeTab]);

  const handleSelectCategory = (catId: NavCategory) => {
    setSelectedCategory(catId);
    try {
      localStorage.setItem('albion_nav_category_v1', catId);
    } catch {}
  };

  const activeTabsList = useMemo(() => {
    const cat = NAV_CATEGORIES.find((c) => c.id === selectedCategory) || NAV_CATEGORIES[0];
    return cat.tabs;
  }, [selectedCategory]);

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-900/30">
              <Wheat size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wide text-slate-100 uppercase">
                  Albion Farm & Livestock
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Precios Manuales
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calculadora & Registro de Cosechas, Hierbas y Ganadería (Huevos/Leche/Carne)
              </p>
            </div>
          </div>

          {/* Selector de Ciudad, Personaje y Estadísticas Rápidas */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Personaje Activo & Foco */}
            {onOpenCharacterModal && (
              <button
                type="button"
                onClick={onOpenCharacterModal}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-amber-500/40 text-xs transition-all cursor-pointer shadow-sm"
                title="Gestor Multi-Personaje & Multi-Isla (Alts)"
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-slate-950 shrink-0"
                  style={{ backgroundColor: activeCharacterColor }}
                >
                  {activeCharacterName?.charAt(0) || 'P'}
                </div>
                <span className="font-bold text-slate-200 truncate max-w-[110px]">
                  {activeCharacterName || 'Personaje'}
                </span>
                {typeof activeCharacterFocus === 'number' && (
                  <span
                    className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded ${
                      isFocusFull
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'text-amber-400'
                    }`}
                  >
                    ⚡ {activeCharacterFocus.toLocaleString()}
                  </span>
                )}
                <Users size={13} className="text-slate-400 ml-0.5" />
              </button>
            )}

            {/* Ciudad Activa */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <MapPin size={14} style={{ color: currentCity.color }} />
              <span className="text-slate-400 font-medium">Isla:</span>
              <select
                id="select-active-city"
                value={currentCityId}
                onChange={(e) => onSelectCity(e.target.value as CityId)}
                className="bg-transparent font-bold text-slate-100 cursor-pointer focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón de Paleta de Comandos Global (Ctrl+K) */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-amber-500/50 text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-amber-300 transition-all cursor-pointer shadow-sm"
                title="Búsqueda rápida de herramientas, calculadoras y módulos (Ctrl+K)"
              >
                <Search size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] bg-slate-950 border border-slate-700 rounded text-slate-400 font-mono">
                  Ctrl+K
                </kbd>
              </button>
            )}

            {/* Total Balance en Navbar */}
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 mr-1.5">Balance Total:</span>
              <span
                className={`font-black ${
                  totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalProfit >= 0 ? '+' : ''}
                {totalProfit.toLocaleString()} 🪙
              </span>
            </div>

            {/* Contador Oficial de Reinicio Diario de Albion 10:00 UTC */}
            {serverCountdown && (
              <button
                type="button"
                onClick={onToggleEvents}
                className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="Cuenta regresiva al reinicio diario de Albion Online (10:00 UTC)"
              >
                <span className="text-red-400 font-bold">⏳</span>
                <span className="text-amber-300 font-bold">{serverCountdown}</span>
                {activeBonusesCount !== undefined && activeBonusesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    {activeBonusesCount} bono(s)
                  </span>
                )}
              </button>
            )}

            {/* Botón de Respaldo Completo (Exportar / Importar JSON) */}
            {onOpenBackupModal && (
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500/50 text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer shadow-sm"
                title="Copia de Seguridad y Restauración de Datos (JSON)"
              >
                <Database size={13} className="text-emerald-400" />
                <span className="hidden sm:inline">Respaldo</span>
              </button>
            )}

            {/* Botón de Sincronización en la Nube & Vercel */}
            {onOpenCloudSyncModal && (
              <button
                type="button"
                onClick={onOpenCloudSyncModal}
                className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
                title="Sincronización en la Nube Multidispositivo & Vercel"
              >
                <Cloud size={13} className="text-cyan-400" />
                <span className="hidden sm:inline">Nube</span>
              </button>
            )}

            {/* Botón de Consulta Referencial de Precios (Albion Data Project) */}
            {onOpenAdpModal && (
              <button
                type="button"
                onClick={onOpenAdpModal}
                className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 text-xs font-semibold flex items-center gap-1.5 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer shadow-sm"
                title="Consulta referencial de mercado en vivo (Albion Data Project)"
              >
                <TrendingUp size={13} className="text-cyan-400" />
                <span className="hidden sm:inline">Mercado ADP</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtro de Sectores Económicos (Nav Hub) */}
        <div className="flex items-center gap-1.5 border-t border-slate-800/80 pt-2 pb-1.5 overflow-x-auto text-xs font-semibold no-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Sector:
          </span>
          {NAV_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`nav-sector-${cat.id}`}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? `${cat.badgeColor} ring-1 ring-white/30 shadow-md transform -translate-y-0.5`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-950/70 text-white' : 'bg-slate-800/80 text-slate-400'
                }`}>
                  {cat.id === 'all' ? 25 : cat.tabs.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barra de Navegación de Pestañas Filtradas */}
        <div className="flex items-center gap-1 pt-1.5 pb-2 overflow-x-auto text-xs sm:text-sm font-semibold">
          {activeTabsList.includes('logger') && (
            <button
              type="button"
              id="nav-tab-logger"
              onClick={() => onSelectTab('logger')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'logger'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📝 Registrar Cosecha de Hoy
            </button>
          )}

          {activeTabsList.includes('history') && (
            <button
              type="button"
              id="nav-tab-history"
              onClick={() => onSelectTab('history')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📜 Historial & Balance ({logsCount})
            </button>
          )}

          {activeTabsList.includes('calendar') && (
            <button
              type="button"
              id="nav-tab-calendar"
              onClick={() => onSelectTab('calendar')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📅 Calendario & Alarmas 22h
            </button>
          )}

          {activeTabsList.includes('todo') && (
            <button
              type="button"
              id="nav-tab-todo"
              onClick={() => onSelectTab('todo')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'todo'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📋 Cosas por Hacer
              {typeof pendingTasksCount === 'number' && pendingTasksCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                    activeTab === 'todo'
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {pendingTasksCount}
                </span>
              )}
            </button>
          )}

          {activeTabsList.includes('mastery') && (
            <button
              type="button"
              id="nav-tab-mastery"
              onClick={() => onSelectTab('mastery')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'mastery'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              ⚡ Maestría (Destino)
            </button>
          )}

          {activeTabsList.includes('focus_optimizer') && (
            <button
              type="button"
              id="nav-tab-focus-optimizer"
              onClick={() => onSelectTab('focus_optimizer')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'focus_optimizer'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              🎯 Optimizador de Foco
            </button>
          )}

          {activeTabsList.includes('focus_portfolio') && (
            <button
              type="button"
              id="nav-tab-focus-portfolio"
              onClick={() => onSelectTab('focus_portfolio')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'focus_portfolio'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-slate-900'
              }`}
            >
              👑 Portafolio Foco
            </button>
          )}

          {activeTabsList.includes('mounts') && (
            <button
              type="button"
              id="nav-tab-mounts"
              onClick={() => onSelectTab('mounts')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'mounts'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🐴 Monturas & Pastizales
            </button>
          )}

          {activeTabsList.includes('butcher') && (
            <button
              type="button"
              id="nav-tab-butcher"
              onClick={() => onSelectTab('butcher')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'butcher'
                  ? 'bg-rose-700 text-white font-bold shadow-md'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
            >
              🥩 Carnicería & Matadero
            </button>
          )}

          {activeTabsList.includes('labourers') && (
            <button
              type="button"
              id="nav-tab-labourers"
              onClick={() => onSelectTab('labourers')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'labourers'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              🏠 Casas & Trabajadores
            </button>
          )}

          {activeTabsList.includes('guild_island') && (
            <button
              type="button"
              id="nav-tab-guild-island"
              onClick={() => onSelectTab('guild_island')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'guild_island'
                  ? 'bg-purple-700 text-white font-bold shadow-md'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-slate-900'
              }`}
            >
              🏰 Isla de Gremio & Guild Hall
            </button>
          )}

          {activeTabsList.includes('crafting_equipment') && (
            <button
              type="button"
              id="nav-tab-crafting-equipment"
              onClick={() => onSelectTab('crafting_equipment')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'crafting_equipment'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <Anvil size={15} />
              🔨 Crafteo & Diarios
            </button>
          )}

          {activeTabsList.includes('refining') && (
            <button
              type="button"
              id="nav-tab-refining"
              onClick={() => onSelectTab('refining')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'refining'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-slate-900'
              }`}
            >
              <Flame size={15} />
              🔥 Refinado
            </button>
          )}

          {activeTabsList.includes('transmutation') && (
            <button
              type="button"
              id="nav-tab-transmutation"
              onClick={() => onSelectTab('transmutation')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'transmutation'
                  ? 'bg-purple-600 text-white font-bold shadow-md'
                  : 'text-purple-300 hover:text-purple-200 hover:bg-slate-900'
              }`}
            >
              🔮 Transmutación
            </button>
          )}

          {activeTabsList.includes('enchanting') && (
            <button
              type="button"
              id="nav-tab-enchanting"
              onClick={() => onSelectTab('enchanting')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'enchanting'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-900'
              }`}
            >
              <Sparkles size={15} />
              ✨ Encantar
            </button>
          )}

          {activeTabsList.includes('sales_ledger') && (
            <button
              type="button"
              id="nav-tab-sales-ledger"
              onClick={() => onSelectTab('sales_ledger')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'sales_ledger'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              <BookOpen size={15} />
              🏴 Libro Mayor
            </button>
          )}

          {activeTabsList.includes('black_market_simulator') && (
            <button
              type="button"
              id="nav-tab-black-market-simulator"
              onClick={() => onSelectTab('black_market_simulator')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'black_market_simulator'
                  ? 'bg-red-900 text-white font-bold shadow-md'
                  : 'text-red-400 hover:text-red-300 hover:bg-slate-900'
              }`}
            >
              <Skull size={15} />
              ☠️ Simulador M. Negro
            </button>
          )}

          {activeTabsList.includes('transport') && (
            <button
              type="button"
              id="nav-tab-transport"
              onClick={() => onSelectTab('transport')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'transport'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              🐂 Rutas & Carga
            </button>
          )}

          {activeTabsList.includes('warehouse_logistics') && (
            <button
              type="button"
              id="nav-tab-warehouse-logistics"
              onClick={() => onSelectTab('warehouse_logistics')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'warehouse_logistics'
                  ? 'bg-sky-600 text-white font-bold shadow-md'
                  : 'text-sky-400 hover:text-sky-300 hover:bg-slate-900'
              }`}
            >
              📦 Almacén & Logística
            </button>
          )}

          {activeTabsList.includes('red_zone_transport') && (
            <button
              type="button"
              id="nav-tab-red-zone-transport"
              onClick={() => onSelectTab('red_zone_transport')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'red_zone_transport'
                  ? 'bg-rose-700 text-white font-bold shadow-md'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
            >
              <Skull size={15} />
              💀 Zona Roja & Gankers
            </button>
          )}

          {activeTabsList.includes('silver_audit') && (
            <button
              type="button"
              id="nav-tab-silver-audit"
              onClick={() => onSelectTab('silver_audit')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'silver_audit'
                  ? 'bg-rose-700 text-white font-bold shadow-md'
                  : 'text-rose-400 hover:text-rose-300 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert size={15} />
              🛡️ Fugas de Plata
            </button>
          )}

          {activeTabsList.includes('analytics') && (
            <button
              type="button"
              id="nav-tab-analytics"
              onClick={() => onSelectTab('analytics')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              📊 Analytics & Oportunidades
            </button>
          )}

          {activeTabsList.includes('simulator') && (
            <button
              type="button"
              id="nav-tab-simulator"
              onClick={() => onSelectTab('simulator')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🧮 Simulador Preventivo
            </button>
          )}

          {activeTabsList.includes('value_added') && (
            <button
              type="button"
              id="nav-tab-value-added"
              onClick={() => onSelectTab('value_added')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'value_added'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🍲 Cocina & Alquimia
            </button>
          )}

          {activeTabsList.includes('fishing_sauces') && (
            <button
              type="button"
              id="nav-tab-fishing-sauces"
              onClick={() => onSelectTab('fishing_sauces')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'fishing_sauces'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🐟 Pesca & Salsas
            </button>
          )}

          {activeTabsList.includes('goals') && (
            <button
              type="button"
              id="nav-tab-goals"
              onClick={() => onSelectTab('goals')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'goals'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              🎯 Metas & Presupuesto
            </button>
          )}

          {activeTabsList.includes('regear') && (
            <button
              type="button"
              id="nav-tab-regear"
              onClick={() => onSelectTab('regear')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'regear'
                  ? 'bg-red-600 text-white font-bold shadow-md'
                  : 'text-red-400 hover:text-red-300 hover:bg-slate-900'
              }`}
            >
              🛡️ Sets & Re-Gear
            </button>
          )}

          {activeTabsList.includes('guide') && (
            <button
              type="button"
              id="nav-tab-guide"
              onClick={() => onSelectTab('guide')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              🗺️ Bonos de Ciudad (+10%)
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
