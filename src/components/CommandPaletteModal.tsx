import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Sparkles,
  Command,
  X,
  Compass,
  Fish,
  Flame,
  Wheat,
  Shield,
  Coins,
  Warehouse,
  History,
  Calendar,
  CheckSquare,
  Zap,
} from 'lucide-react';
import { AppTab, CityId } from '../types';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tab: AppTab;
  keywords: string[];
  icon: string;
}

const SEARCH_CATALOG: SearchItem[] = [
  { id: 'tab_logger', title: 'Registrar Cosecha de Hoy', subtitle: 'Registrar zanahorias, trigo, carne o huevos', category: 'Navegación', tab: 'logger', keywords: ['cosecha', 'semillas', 'diario', 'cultivo'], icon: '🌾' },
  { id: 'tab_history', title: 'Historial & Balance', subtitle: 'Auditoría de plata histórica y exportación CSV', category: 'Navegación', tab: 'history', keywords: ['historial', 'balance', 'plata', 'csv'], icon: '📜' },
  { id: 'tab_calendar', title: 'Calendario & Alarmas 22h', subtitle: 'Temporizador oficial de maduración de cultivos', category: 'Navegación', tab: 'calendar', keywords: ['calendario', 'alarma', '22h', 'tiempo'], icon: '⏰' },
  { id: 'tab_todo', title: 'Lista de Cosas por Hacer', subtitle: 'Rutinas diarias automáticas sincronizadas con islas', category: 'Navegación', tab: 'todo', keywords: ['todo', 'tareas', 'rutina', 'checklist'], icon: '✅' },
  { id: 'tab_focus_optimizer', title: 'Optimizador de Foco Diario', subtitle: 'Ranking Plata / Foco de tus actividades', category: 'Foco', tab: 'focus_optimizer', keywords: ['foco', 'ranking', 'optimizar', 'plata foco'], icon: '⚡' },
  { id: 'tab_focus_portfolio', title: 'Portafolio de Foco (Imperio)', subtitle: 'Consolidación multi-alt de regeneración', category: 'Foco', tab: 'focus_portfolio', keywords: ['imperio', 'alts', 'personajes', 'portfolio'], icon: '👑' },
  { id: 'tab_mounts', title: 'Crianza de Monturas & Pastizales', subtitle: 'Caballos, bueyes, garrasprestas y ensillado', category: 'Animales', tab: 'mounts', keywords: ['caballos', 'bueyes', 'monturas', 'garrasprestas', 'ensillado'], icon: '🐴' },
  { id: 'tab_butcher', title: 'Carnicería & Rendimiento de Carne', subtitle: 'Sacrificio T3-T8 (20 base + RRR de ciudad)', category: 'Animales', tab: 'butcher', keywords: ['carnicería', 'carne', 'pollo', 'cerdo', 'vaca'], icon: '🥩' },
  { id: 'tab_labourers', title: 'Casas & Trabajadores (Labourers)', subtitle: 'Felicidad, camas, mesas, trofeos y diarios', category: 'Islas', tab: 'labourers', keywords: ['trabajadores', 'labourers', 'casa', 'felicidad', 'diarios'], icon: '🏠' },
  { id: 'tab_guild_island', title: 'Isla de Gremio & Guild Hall', subtitle: '15 trabajadores bajo un mismo techo y amortización', category: 'Islas', tab: 'guild_island', keywords: ['gremio', 'guild hall', 'isla gremial', '15 trabajadores'], icon: '🏰' },
  { id: 'tab_crafting_equipment', title: 'Crafteo de Equipo & Diarios', subtitle: 'Forja de armas, armaduras, bonos de ciudad', category: 'Industria', tab: 'crafting_equipment', keywords: ['crafteo', 'armas', 'armaduras', 'forja', 'diarios'], icon: '⚔️' },
  { id: 'tab_refining', title: 'Refinado de Recursos Brutos', subtitle: 'Mineral, madera, piel, fibra, piedra (hasta 53.9% RRR)', category: 'Industria', tab: 'refining', keywords: ['refinado', 'lingotes', 'cuero', 'tela', 'tablas', 'bloques'], icon: '🔨' },
  { id: 'tab_transmutation', title: 'Taller de Transmutación & Arbitraje', subtitle: 'Subida de tier y encantamiento con costes oficiales', category: 'Industria', tab: 'transmutation', keywords: ['transmutacion', 'arbitraje', 'tier', 'esquirlas'], icon: '🔮' },
  { id: 'tab_enchanting', title: 'Taller de Encantamiento (.0 a .4)', subtitle: 'Fusión de runas, almas, reliquias y fragmentos', category: 'Industria', tab: 'enchanting', keywords: ['encantar', 'runas', 'almas', 'reliquias', 'avaloniano'], icon: '✨' },
  { id: 'tab_sales_ledger', title: 'Libro Mayor de Ventas & Mercado Negro', subtitle: 'Registro auditable de lotes vendidos en Caerleon', category: 'Mercado', tab: 'sales_ledger', keywords: ['libro mayor', 'ledger', 'mercado negro', 'ventas'], icon: '📊' },
  { id: 'tab_black_market', title: 'Simulador Mercado Negro de Caerleon', subtitle: 'Precio umbral de equilibrio (Break-Even) y ROI', category: 'Mercado', tab: 'black_market_simulator', keywords: ['mercado negro', 'black market', 'caerleon', 'break even'], icon: '💀' },
  { id: 'tab_transport', title: 'Rutas de Transporte & Capacidad de Carga', subtitle: 'Arbitraje inter-ciudades y Plata / kg', category: 'Mercado', tab: 'transport', keywords: ['transporte', 'rutas', 'capacidad', 'peso', 'plata kg'], icon: '🚚' },
  { id: 'tab_warehouse', title: 'Almacén & Cubicaje de Inventario', subtitle: 'Control de viajes y monturas de transporte', category: 'Mercado', tab: 'warehouse_logistics', keywords: ['almacén', 'peso', 'inventario', 'buey', 'mamut'], icon: '📦' },
  { id: 'tab_red_zone', title: 'Planificador de Envíos Masivos por Zona Roja', subtitle: 'Analizador de riesgo de gankers y valor esperado', category: 'Mercado', tab: 'red_zone_transport', keywords: ['zona roja', 'gankers', 'caerleon', 'escape', 'courier'], icon: '🛑' },
  { id: 'tab_fishing_sauces', title: 'Taller de Pesca, Fileteado y Salsas', subtitle: 'Filetear pescado picado y craftear salsas .1, .2, .3', category: 'Pesca & Cocina', tab: 'fishing_sauces', keywords: ['pesca', 'pescado', 'fileteado', 'salsas', 'algas'], icon: '🐟' },
  { id: 'tab_goals', title: 'Metas Financieras & Presupuesto de Siembra', subtitle: 'Progreso hacia Premium, Mamut y capital de trabajo masivo', category: 'Finanzas', tab: 'goals', keywords: ['metas', 'presupuesto', 'premium', 'mamut', 'siembra', 'capital'], icon: '🎯' },
  { id: 'tab_regear', title: 'Calculadora de Sets & Re-Gear', subtitle: 'Coste por muerte y presupuesto para 3x, 5x, 10x bajas', category: 'Militar & PvP', tab: 'regear', keywords: ['regear', 'sets', 'pvp', 'zvz', 'muerte', 'bajas', 'loadout'], icon: '🛡️' },
  { id: 'tab_value_added', title: 'Calculadora de Valor Agregado', subtitle: 'Cocina y alquimia con salsas y bonos de RRR', category: 'Cocina & Alquimia', tab: 'value_added', keywords: ['cocina', 'alquimia', 'comida', 'pociones', 'salsas'], icon: '🍲' },
  { id: 'tab_silver_audit', title: 'Auditor de Fugas de Plata', subtitle: 'Detección de tasas abusivas y resiembras en pérdida', category: 'Auditoría', tab: 'silver_audit', keywords: ['fugas', 'auditor', 'tasas abusivas', 'perdidas'], icon: '🔍' },
  { id: 'tab_mastery', title: 'Calculadora de Maestría & FCE', subtitle: 'Eficiencia de puntos de foco y especialización del destino', category: 'Foco', tab: 'mastery', keywords: ['maestría', 'fce', 'tabla del destino', 'eficiencia', 'foco'], icon: '⭐' },
  { id: 'tab_analytics', title: 'Analítica Visual & Gráficos', subtitle: 'Evolución histórica de plata, ingresos y costes', category: 'Auditoría', tab: 'analytics', keywords: ['analítica', 'gráficos', 'métricas', 'roi', 'evolución'], icon: '📈' },
  { id: 'tab_simulator', title: 'Simulador Rápido de Rendimiento', subtitle: 'Proyección express de ganancias por casilla y tipo de cultivo', category: 'Granja & Ganadería', tab: 'simulator', keywords: ['simulador', 'proyección', 'express', 'casillas'], icon: '🧮' },
  { id: 'tab_guide', title: 'Guía de Bonos de Ciudades Reales', subtitle: 'Especializaciones de bioma y retorno de recursos por ciudad', category: 'Referencia', tab: 'guide', keywords: ['guía', 'ciudades', 'bonos', 'biomas', 'rrr'], icon: '🗺️' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AppTab) => void;
}

export const CommandPaletteModal: React.FC<Props> = ({ isOpen, onClose, onSelectTab }) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_CATALOG;
    return SEARCH_CATALOG.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        onSelectTab(selected.tab);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Input de Búsqueda */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search size={18} className="text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Buscar módulo, cultivo, montura, receta o herramienta"
            placeholder="Buscar módulo, cultivo, montura, receta o herramienta... (o usa flechas)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar búsqueda"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No se encontraron coincidencias para "{query}". Prueba buscando "foco", "pesca", "buey" o "caerleon".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.tab);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className={`shrink-0 ml-2 transition ${
                      isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Pie de Ayuda */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navegar</span>
            <span>↵ Abrir</span>
            <span>ESC Cerrar</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400">Ctrl + K / Cmd + K</span>
        </div>
      </div>
    </div>
  );
};
