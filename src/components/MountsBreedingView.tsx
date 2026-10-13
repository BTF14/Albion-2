import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Compass,
  Package,
  Shield,
  Cat,
  Dog,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Clock,
  Wheat,
  Drumstick,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Coins,
  Scale,
  Flame,
  Zap,
  Calculator,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { MOUNTS_CATALOG, MountDefinition, MountCategory, calculateLeastCostFeed } from '../domain';
import { useMountEconomy } from '../hooks/useMountEconomy';
import { useDailyEvents } from '../hooks/useDailyEvents';
import { NumericInput } from './NumericInput';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';

interface MountsBreedingViewProps {
  dailyEventsHook: ReturnType<typeof useDailyEvents>;
}

export const MountsBreedingView: React.FC<MountsBreedingViewProps> = ({ dailyEventsHook }) => {
  const mountEconomy = useMountEconomy(dailyEventsHook);

  const {
    selectedMountId,
    setSelectedMountId,
    currentMount,
    mountCount,
    setMountCount,
    hasPremium,
    setHasPremium,
    useNurtureFocus,
    setUseNurtureFocus,
    useSaddlerFocus,
    setUseSaddlerFocus,
    isBabyRaisedOwn,
    setIsBabyRaisedOwn,
    fceNurture,
    setFceNurture,
    fceSaddler,
    setFceSaddler,
    activePrices,
    updatePrice,
    calculationResult,
    isCalculated,
    isStale,
    triggerCalculation,
    clearResult,
    dailyMountsBonusRRR,
  } = mountEconomy;

  const feedAdvice = useMemo(() => {
    return calculateLeastCostFeed(currentMount.diet);
  }, [currentMount.diet]);

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Manejador del botón manual de dar resultados
  const handleCalculateResult = () => {
    triggerCalculation();
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      const el = document.getElementById('mount-calculation-results');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  // Filtro de categoría
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'domestic' | 'wild_pasture' | 'kennel' | 'elite_faction' | 'armored'
  >('all');

  // Monturas filtradas
  const filteredMounts = useMemo(() => {
    return MOUNTS_CATALOG.filter((m) => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'domestic') return m.category === 'horse' || m.category === 'ox';
      if (categoryFilter === 'wild_pasture')
        return (
          m.category === 'stag' ||
          m.category === 'moose' ||
          m.category === 'wild_boar' ||
          m.category === 'mammoth'
        );
      if (categoryFilter === 'kennel')
        return (
          m.locationType === 'kennel' ||
          m.category === 'swiftclaw' ||
          m.category === 'direwolf' ||
          m.category === 'greywolf' ||
          m.category === 'direbear' ||
          m.category === 'salamander' ||
          m.category === 'swamp_dragon' ||
          m.category === 'ram' ||
          m.category === 'moabird' ||
          m.category === 'owl'
        );
      if (categoryFilter === 'elite_faction') return m.category === 'elite_faction';
      if (categoryFilter === 'armored') return m.category === 'armored_horse';
      return true;
    });
  }, [categoryFilter]);

  // Ícono según categoría
  const renderMountIcon = (cat: MountCategory, size = 18) => {
    switch (cat) {
      case 'horse':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🐴</span>;
      case 'ox':
        return <Package size={size} className="text-blue-400" />;
      case 'stag':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🦌</span>;
      case 'moose':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🫎</span>;
      case 'swiftclaw':
        return <Cat size={size} className="text-amber-400" />;
      case 'direwolf':
      case 'greywolf':
        return <Dog size={size} className="text-slate-300" />;
      case 'wild_boar':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🐗</span>;
      case 'direbear':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🐻</span>;
      case 'salamander':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🦎</span>;
      case 'swamp_dragon':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🐉</span>;
      case 'ram':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🐏</span>;
      case 'moabird':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🪶</span>;
      case 'owl':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🦉</span>;
      case 'mammoth':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🐘</span>;
      case 'fire_drake':
        return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>🔥🐲</span>;
      case 'elite_faction':
        return <Sparkles size={size} className="text-amber-300 animate-pulse" />;
      case 'armored_horse':
        return <Shield size={size} className="text-indigo-400" />;
      default:
        return <Compass size={size} className="text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                <span className="text-2xl leading-none">🐴</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  Crianza de Monturas & Pastizales
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    Pastizal / Criadero
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculadora integral de crianza, consumo de alimento (10/día), retorno de crías y ensillado en Guarnicionero.
                </p>
              </div>
            </div>
          </div>

          {/* Indicador de Bono Diario si está activo */}
          {dailyMountsBonusRRR > 0 ? (
            <div className="bg-amber-500/15 border border-amber-500/40 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-200 shadow-md animate-pulse">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Bono Diario Activo: +{dailyMountsBonusRRR}% RRR en Guarnicionero</span>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ciclo Premium: <strong>22h</strong> por día</span>
            </div>
          )}
        </div>
      </div>

      {/* Selector de Categorías y Monturas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        {/* Chips de Categorías */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Seleccionar Tipo de Montura:
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all' as const, label: 'Todas las Criaturas' },
              { id: 'domestic' as const, label: '🐴 Domésticos (Caballos/Bueyes)' },
              { id: 'wild_pasture' as const, label: '🦌 Salvajes Pastizal (Ciervo/Alce/Jabalí/Mamut)' },
              { id: 'kennel' as const, label: '🐾 Criadero / Kennel (Depredadores/Raras/T5)' },
              { id: 'elite_faction' as const, label: '✨ Élite de Facción (T8)' },
              { id: 'armored' as const, label: '🛡️ Caballos Blindados' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border ${
                  categoryFilter === cat.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuadrícula de Selección de Montura */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredMounts.map((m) => {
            const isSelected = selectedMountId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMountId(m.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-100 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <AlbionItemBadge tier={m.tier} size="xs" />
                  <span className="text-[10px] font-medium text-slate-400 font-mono tabular-nums">
                    {m.growthCycles}d ({m.growthCycles * 22}h)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {renderMountIcon(m.category, 16)}
                  <span className="text-xs font-bold truncate">{m.nameEs}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{m.locationType === 'pasture' ? '🌾 Pastizal' : '🥩 Criadero'}</span>
                  <span>{m.diet === 'herbivore' ? 'Grano' : 'Carne'}</span>
                </div>
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-black">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fila de Configuración & Precios Manuales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Parámetros y Opciones de Granja (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              Parámetros de Crianza
            </h3>

            {/* Cantidad de Monturas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-300 font-semibold">
                  Cantidad de Animales a Criar:
                </label>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {mountCount} {mountCount === 1 ? 'animal' : 'animales'} ({Math.ceil(mountCount / 9)} pastizal/es)
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 9, 18, 27, 45].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setMountCount(cnt)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      mountCount === cnt
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cnt === 9 ? '9 (1 Parcela)' : cnt === 45 ? '45 (Isla Nv6)' : cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Opciones y Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              {/* Premium */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-slate-200">Estado Premium Activo</div>
                    <div className="text-[10px] text-slate-400">Ciclo de 22h e impuesto de mercado reducido a 6.5%</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hasPremium}
                  onChange={(e) => setHasPremium(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Cría Propia vs Comprada */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-bold text-slate-200">Crías de Cosecha Propia</div>
                    <div className="text-[10px] text-slate-400">Sin desembolso inicial de compra de crías en mercado</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isBabyRaisedOwn}
                  onChange={(e) => setIsBabyRaisedOwn(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Nutrir con Foco */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-slate-200">Nutrir con Foco Diario</div>
                    <div className="text-[10px] text-slate-400">
                      Retorno de cría sube a {currentMount.offspringChanceWithFocus}% (vs {currentMount.offspringChanceWithoutFocus}%)
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useNurtureFocus}
                  onChange={(e) => setUseNurtureFocus(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Foco en Guarnicionero */}
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <div>
                    <div className="font-bold text-slate-200">Ensillar con Foco en Guarnicionero</div>
                    <div className="text-[10px] text-slate-400">RRR sube a 43.5% en materiales devueltos</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useSaddlerFocus}
                  onChange={(e) => setUseSaddlerFocus(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* FCE / Eficiencia de Foco del Jugador */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  FCE Crianza (Maestría):
                </label>
                <NumericInput
                  value={fceNurture}
                  onChange={(val) => setFceNurture(val)}
                  step={1000}
                  min={0}
                  max={30000}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  FCE Guarnicionero:
                </label>
                <NumericInput
                  value={fceSaddler}
                  onChange={(val) => setFceSaddler(val)}
                  step={1000}
                  min={0}
                  max={30000}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Precios Manuales del Mercado (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Tus Precios Manuales de Mercado ({currentMount.nameEs})
              </h3>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Guardado automático en caché
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* 1. Precio Cría */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold block mb-1">
                  1. Precio Cría ({currentMount.babyNameEs}):
                </label>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={activePrices.babyPrice}
                    onChange={(val) => updatePrice('babyPrice', val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">🪙</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Precio de compra en el mercado</div>
              </div>

              {/* 2. Precio Alimento */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1">
                  {currentMount.diet === 'herbivore' ? (
                    <Wheat className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Drumstick className="w-3.5 h-3.5 text-red-400" />
                  )}
                  2. Alimento ({currentMount.diet === 'herbivore' ? 'Grano' : 'Carne/Pescado'}):
                </label>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={activePrices.foodPrice}
                    onChange={(val) => updatePrice('foodPrice', val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">🪙</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Consume {currentMount.growthCycles * 10} u. en {currentMount.growthCycles} ciclos
                </div>

                {feedAdvice.cheapestOption && (
                  <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-emerald-300 font-bold truncate">
                        💡 Menor Coste Hoy: {feedAdvice.cheapestOption.nameEs}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {feedAdvice.cheapestOption.unitPrice} 🪙/u. {feedAdvice.maxSavingsPercent > 0 && `(ahorro hasta -${feedAdvice.maxSavingsPercent}%)`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePrice('foodPrice', feedAdvice.cheapestOption!.unitPrice)}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded text-[10px] transition-colors cursor-pointer shrink-0"
                      title="Aplicar precio del alimento más económico"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Precio Material de Ensillado */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold block mb-1">
                  3. Material Ensillado ({currentMount.saddlingMaterial.nameEs}):
                </label>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={activePrices.saddlingMaterialPrice}
                    onChange={(val) => updatePrice('saddlingMaterialPrice', val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">🪙</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Requiere {currentMount.saddlingMaterial.amount} unidades por montura
                </div>
              </div>

              {/* 4. Tasa Guarnicionero */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-slate-300 font-bold block mb-1">
                  4. Tasa Guarnicionero (por 100 nutrición):
                </label>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={activePrices.stationFee}
                    onChange={(val) => updatePrice('stationFee', val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">🪙</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Tasa que cobra el dueño del puesto en la ciudad
                </div>
              </div>

              {/* 5. Venta Animal Adulto */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-emerald-300 font-bold block mb-1">
                  5. Venta: Adulto Domado ({currentMount.adultNameEs}):
                </label>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={activePrices.adultPrice}
                    onChange={(val) => updatePrice('adultPrice', val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-200 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400 font-bold">🪙</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Venta sin ensillar en el mercado</div>
              </div>

              {/* 6. Venta Montura Ensillada */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <label className="text-amber-300 font-bold block mb-1">
                  6. Venta: Montura Ensillada ({currentMount.saddledNameEs}):
                </label>
                <div className="flex items-center gap-1.5">
                  <NumericInput
                    value={activePrices.saddledPrice}
                    onChange={(val) => updatePrice('saddledPrice', val)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-slate-400 font-bold">🪙</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Precio final en mercado tras ensillar</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Activación: Botón manual para Dar Resultado (Solo da el resultado al presionar el botón) */}
      <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="text-amber-400" size={20} />
            <span className="text-sm font-bold text-slate-100">
              Control de Cálculo Manual de Monturas
            </span>
            {isStale && calculationResult && (
              <span className="bg-amber-500/20 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                Parámetros modificados sin recalcular
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configura tus precios de mercado y presiona el botón para procesar la rentabilidad neta, ROI y ratios de Plata/Foco de {currentMount.nameEs}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {calculationResult && (
            <button
              type="button"
              onClick={clearResult}
              className="px-3 py-2.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Limpiar resultados de pantalla"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}

          <button
            type="button"
            id="btn-calculate-mount-result"
            onClick={handleCalculateResult}
            className={`flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-lg text-sm shadow-md transition-all duration-150 cursor-pointer ${
              !calculationResult
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-amber-500/20 transform hover:-translate-y-0.5'
                : isStale
                ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50'
            }`}
          >
            <Calculator size={18} />
            {!calculationResult
              ? 'Dar Resultado / Calcular Rentabilidad'
              : isStale
              ? 'Recalcular con Nuevos Precios'
              : 'Resultados al Día (Volver a Calcular)'}
          </button>
        </div>
      </div>

      {/* Resultados de Cálculo Condicionales: Solo se muestran al presionar el botón */}
      {!calculationResult ? (
        /* Estado Previo: Esperando que el usuario presione el botón */
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Calculator size={28} />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-slate-100">
              Crianza de {currentMount.nameEs} ({mountCount} u.) Lista para Calcular
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus precios de cría, alimento y ensillado están ingresados. Presiona el botón{' '}
              <strong className="text-amber-300">"Dar Resultado / Calcular Rentabilidad"</strong> para procesar la comparativa financiera entre vender adulto domado vs ensillar en guarnicionero.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCalculateResult}
            className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-1"
          >
            <Calculator size={18} />
            <span>Calcular Resultados Ahora</span>
          </button>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>Modo manual seguro: resultados generados estrictamente bajo demanda</span>
          </div>
        </div>
      ) : (
        /* Bloque Completo de Resultados Calculados */
        <div id="mount-calculation-results" className="space-y-6">
          {/* Alerta de datos obsoletos si modificó precios tras calcular */}
          {isStale && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-amber-400 shrink-0" />
                <span>
                  Modificaste precios o parámetros después del último cálculo. Haz clic en <strong className="text-amber-300">Recalcular</strong> para actualizar el diagnóstico.
                </span>
              </div>
              <button
                type="button"
                onClick={handleCalculateResult}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Calculator size={13} />
                <span>Recalcular</span>
              </button>
            </div>
          )}

          {/* Veredicto & Asesoría Estratégica Destacada */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 shadow-md ${
              calculationResult.strategySaddled.isProfitable || calculationResult.strategyAdult.isProfitable
                ? 'bg-slate-900 border-amber-500/40 text-slate-200'
                : 'bg-red-950/20 border-red-800 text-red-200'
            }`}
          >
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <span>Diagnóstico Financiero de Crianza ({mountCount} {currentMount.nameEs}):</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    calculationResult.bestStrategy === 'saddle_and_sell'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-blue-500 text-slate-950'
                  }`}
                >
                  {calculationResult.bestStrategy === 'saddle_and_sell'
                    ? 'Estrategia Recomendada: Ensillar'
                    : 'Estrategia Recomendada: Vender Adulto'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{calculationResult.verdict}</p>
              {!useNurtureFocus && currentMount.locationType === 'kennel' && (
                <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  <span>
                    <strong>Advertencia de Albion Online:</strong> Las criaturas salvajes (Garrapesta, Lobo Huargo, etc.) tienen estrictamente <strong>0% de retorno de crías sin foco</strong>. Toda la inversión en crías se consume por completo en este ciclo.
                  </span>
                </div>
              )}
            </div>
          </div>

      {/* Comparativa Lado a Lado: Adulto vs Ensillado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= TARJETA 1: VENDER ANIMAL ADULTO ================= */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 shadow-lg relative transition-all ${
            calculationResult.bestStrategy === 'sell_adult'
              ? 'border-blue-500 shadow-blue-500/10'
              : 'border-slate-800'
          }`}
        >
          {calculationResult.bestStrategy === 'sell_adult' && (
            <div className="absolute top-4 right-4 bg-blue-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
              ★ Mayor Ganancia Neta
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <span className="text-lg leading-none">🐴</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">
                Estrategia A: Vender Adulto Domado
              </h4>
              <p className="text-xs text-slate-400">Vender el {currentMount.adultNameEs} sin ensillar</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs pt-3 border-t border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Ingreso Bruto de Venta ({mountCount} u.):</span>
              <span className="font-mono tabular-nums text-slate-200">
                +{formatSilver(calculationResult.strategyAdult.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Impuesto de Mercado ({hasPremium ? '6.5%' : '10.5%'}):</span>
              <span className="font-mono tabular-nums text-red-400">
                -{formatSilver(Math.round(calculationResult.strategyAdult.marketTax))}
              </span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Ingreso Neto en Mano:</span>
              <span className="font-mono tabular-nums text-emerald-400">
                +{formatSilver(Math.round(calculationResult.strategyAdult.netRevenue))}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Coste de Crías iniciales:</span>
                <span className="font-mono tabular-nums">
                  {isBabyRaisedOwn ? '0 🪙 (Propia)' : formatSilver(calculationResult.babyTotalCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coste Total Alimento ({calculationResult.totalFoodUnits} u.):</span>
                <span className="font-mono tabular-nums">{formatSilver(calculationResult.foodTotalCost)}</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Retorno Esperado de Crías ({calculationResult.offspringExpectedCount.toFixed(1)} u.):</span>
                <span className="font-mono tabular-nums">
                  -{formatSilver(Math.round(calculationResult.offspringValueTotal))}
                </span>
              </div>
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Coste Neto de Crianza:</span>
                <span className="font-mono tabular-nums">
                  {formatSilver(Math.round(calculationResult.strategyAdult.totalCost))}
                </span>
              </div>
            </div>

            {/* Métrica Clave Adulto */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 p-3 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-400 block">Beneficio Neto Total:</span>
                <span
                  className={`text-lg font-black font-mono tabular-nums ${
                    calculationResult.strategyAdult.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {calculationResult.strategyAdult.netProfit >= 0 ? '+' : ''}
                  {formatSilver(Math.round(calculationResult.strategyAdult.netProfit))}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">ROI %:</span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums ${
                    calculationResult.strategyAdult.roiPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {calculationResult.strategyAdult.roiPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TARJETA 2: ENSILLAR EN GUARNICIONERO ================= */}
        <div
          className={`bg-slate-900 border rounded-2xl p-5 shadow-lg relative transition-all ${
            calculationResult.bestStrategy === 'saddle_and_sell'
              ? 'border-amber-500 shadow-amber-500/10'
              : 'border-slate-800'
          }`}
        >
          {calculationResult.bestStrategy === 'saddle_and_sell' && (
            <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow">
              ★ Mayor Ganancia Neta
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Package size={20} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-100">
                Estrategia B: Ensillar en Guarnicionero
              </h4>
              <p className="text-xs text-slate-400">
                Fabricar y vender la montura final {currentMount.saddledNameEs}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs pt-3 border-t border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Ingreso Bruto de Venta ({mountCount} monturas):</span>
              <span className="font-mono tabular-nums text-slate-200">
                +{formatSilver(calculationResult.strategySaddled.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Impuesto de Mercado ({hasPremium ? '6.5%' : '10.5%'}):</span>
              <span className="font-mono tabular-nums text-red-400">
                -{formatSilver(Math.round(calculationResult.strategySaddled.marketTax))}
              </span>
            </div>
            <div className="flex justify-between text-slate-300 font-semibold">
              <span>Ingreso Neto en Mano:</span>
              <span className="font-mono tabular-nums text-emerald-400">
                +{formatSilver(Math.round(calculationResult.strategySaddled.netRevenue))}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Coste Crianza del Animal:</span>
                <span className="font-mono tabular-nums">
                  {formatSilver(Math.round(calculationResult.netBreedingCost))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  Material ({currentMount.saddlingMaterial.amount * mountCount}x {currentMount.saddlingMaterial.nameEs}):
                </span>
                <span className="font-mono tabular-nums">
                  {formatSilver(calculationResult.saddlingMaterialCostGross)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>
                  Retorno RRR ({calculationResult.saddlingReturnRatePercent.toFixed(1)}% devuelto):
                </span>
                <span className="font-mono tabular-nums">
                  -{formatSilver(Math.round(calculationResult.saddlingReturnedMaterialValue))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tasa Estación Guarnicionero:</span>
                <span className="font-mono tabular-nums">
                  +{formatSilver(Math.round(calculationResult.saddlingStationFeeTotal))}
                </span>
              </div>
              <div className="flex justify-between text-slate-200 font-semibold">
                <span>Coste Total Montura Lista:</span>
                <span className="font-mono tabular-nums">
                  {formatSilver(Math.round(calculationResult.totalSaddledCost))}
                </span>
              </div>
            </div>

            {/* Métrica Clave Ensillado */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 p-3 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-400 block">Beneficio Neto Total:</span>
                <span
                  className={`text-lg font-black font-mono tabular-nums ${
                    calculationResult.strategySaddled.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {calculationResult.strategySaddled.netProfit >= 0 ? '+' : ''}
                  {formatSilver(Math.round(calculationResult.strategySaddled.netProfit))}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Diferencia vs Adulto:</span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums ${
                    calculationResult.profitDifferenceSaddledVsAdult >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {calculationResult.profitDifferenceSaddledVsAdult >= 0 ? '+' : ''}
                  {formatSilver(Math.round(calculationResult.profitDifferenceSaddledVsAdult))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análisis de Eficiencia de Puntos de Foco */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          Análisis de Puntos de Foco (Plata / Foco)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Foco Crianza */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Puntos Foco Crianza (Nutrir):</span>
            <div className="text-base font-bold font-mono tabular-nums text-amber-300">
              {calculationResult.focusNurtureTotalCost.toLocaleString()} pts
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Gasto en {currentMount.growthCycles} ciclos de 22h
            </div>
          </div>

          {/* Plata extra nutrición */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Plata Extra por Foco (Crías):</span>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-400">
              +{formatSilver(Math.round(calculationResult.extraSilverFromNurtureFocus))}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Valor de crías extra devueltas
            </div>
          </div>

          {/* Ratio Plata / Foco Crianza */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Ratio Nutrir Plata/Foco:</span>
            <div className="text-base font-black font-mono tabular-nums text-amber-400">
              {calculationResult.silverPerNurtureFocus.toFixed(2)} 🪙 / Foco
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {calculationResult.silverPerNurtureFocus >= 20 ? '🔥 Excelente gasto de foco' : 'Normal'}
            </div>
          </div>

          {/* Ratio Plata / Foco Guarnicionero */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1">Ratio Ensillar Plata/Foco:</span>
            <div className="text-base font-black font-mono tabular-nums text-blue-400">
              {calculationResult.silverPerSaddlerFocus.toFixed(2)} 🪙 / Foco
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Foco en Guarnicionero ({calculationResult.focusSaddlerTotalCost.toLocaleString()} pts)
            </div>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
