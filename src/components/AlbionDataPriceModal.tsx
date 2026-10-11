import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  TrendingUp,
  TrendingDown,
  Clock,
  Check,
  AlertTriangle,
  Copy,
  Building2,
  Wheat,
  Sprout,
  Egg,
  Beef,
  Shield,
  Flame,
} from 'lucide-react';
import {
  AlbionDataServerRegion,
  ALBION_DATA_SERVERS,
  ALBION_LOOKUP_CATALOGUE,
  AlbionLookupItem,
  NormalizedCityPriceRecord,
} from '../domain/models/albionDataProject';
import { useAlbionDataProject } from '../hooks/useAlbionDataProject';
import { ItemIcon } from './ItemIcon';

interface AlbionDataPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItemId?: string;
  initialTargetType?: 'product' | 'seed_or_baby';
  onApplyPriceToManual?: (appItemId: string, price: number, targetType: 'product' | 'seed_or_baby') => void;
}

const CITY_COLORS: Record<string, string> = {
  Martlock: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
  Lymhurst: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
  Bridgewatch: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
  'Fort Sterling': 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60',
  Thetford: 'text-purple-400 bg-purple-950/40 border-purple-800/60',
  Caerleon: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
  Brecilien: 'text-teal-400 bg-teal-950/40 border-teal-800/60',
};

export const AlbionDataPriceModal: React.FC<AlbionDataPriceModalProps> = ({
  isOpen,
  onClose,
  initialItemId,
  initialTargetType = 'product',
  onApplyPriceToManual,
}) => {
  const effectiveTargetType: 'product' | 'seed_or_baby' = initialTargetType === 'seed_or_baby' ? 'seed_or_baby' : 'product';
  const {
    server,
    setServer,
    selectedItem,
    setSelectedItem,
    targetType,
    setTargetType,
    isLoading,
    error,
    isThrottled,
    quote,
    catalogue,
    refreshQuote,
    copyPriceToClipboard,
    lastCopiedNotice,
  } = useAlbionDataProject(initialItemId, effectiveTargetType);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const appliedNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (appliedNoticeTimeoutRef.current) {
        clearTimeout(appliedNoticeTimeoutRef.current);
      }
    };
  }, []);

  // Asegurar que si se abre con un ítem inicial, la categoría no oculte dicho ítem
  useEffect(() => {
    if (isOpen && initialItemId) {
      const found = catalogue.find((i) => i.appItemId === initialItemId);
      if (found) {
        setSelectedCategory('all');
      }
    }
  }, [isOpen, initialItemId, catalogue]);

  if (!isOpen) return null;

  // Filtrado reactivo del catálogo
  const filteredCatalogue = catalogue.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.nameEs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleApplyPrice = (price: number) => {
    if (!selectedItem || !onApplyPriceToManual || price <= 0) return;
    onApplyPriceToManual(selectedItem.appItemId, price, targetType);
    setAppliedNotice(
      `¡Precio de ${price.toLocaleString()} 🪙 guardado como cotización manual para ${
        targetType === 'seed_or_baby' ? selectedItem.seedOrBabyNameEs || selectedItem.nameEs : selectedItem.nameEs
      }!`
    );
    if (appliedNoticeTimeoutRef.current) {
      clearTimeout(appliedNoticeTimeoutRef.current);
    }
    appliedNoticeTimeoutRef.current = setTimeout(() => setAppliedNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Consulta Referencial de Precios
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-cyan-500/40">
                  Albion Data Project
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Información pública comunitaria para consultar cotizaciones en tiempo real sin alterar tus precios manuales.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notificación de retroalimentación de copia o aplicación */}
        {(lastCopiedNotice || appliedNotice) && (
          <div className="bg-emerald-950 border-b border-emerald-700/80 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 font-semibold animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-emerald-400" />
              <span>{appliedNotice || lastCopiedNotice}</span>
            </div>
          </div>
        )}

        {/* Cuerpo principal desplazable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Fila 1: Selector de Servidores */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Servidor de Albion Online:
              </span>
              <p className="text-[11px] text-slate-400">
                Selecciona la región donde juega tu personaje para consultar los mercados correctos.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
              {(Object.keys(ALBION_DATA_SERVERS) as AlbionDataServerRegion[]).map((regKey) => {
                const srv = ALBION_DATA_SERVERS[regKey];
                const isActive = server === regKey;
                return (
                  <button
                    key={regKey}
                    type="button"
                    onClick={() => setServer(regKey)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-cyan-600 text-white shadow-sm border border-cyan-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{srv.flag}</span>
                    <span>{srv.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 2: Filtro y Búsqueda de Ítems */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar cultivo, hierba, animal, carne o montura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Categorías */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'crop', label: 'Cultivos' },
                  { id: 'herb', label: 'Hierbas' },
                  { id: 'animal_produce', label: 'Granja' },
                  { id: 'animal_meat', label: 'Carnicería' },
                  { id: 'mount', label: 'Monturas' },
                  { id: 'sauce', label: 'Salsas' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                      selectedCategory === cat.id
                        ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Carrusel / rejilla compacta de selección de ítems */}
            <div className="flex gap-2 overflow-x-auto p-1 max-h-24 pb-2 scrollbar-thin">
              {filteredCatalogue.map((item) => {
                const isSelected = selectedItem?.appItemId === item.appItemId;
                return (
                  <button
                    key={item.appItemId}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0 transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <ItemIcon name={item.iconName} size={18} />
                    <div>
                      <span className="text-xs font-bold block leading-tight truncate max-w-[130px]">
                        {item.nameEs}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">T{item.tier}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 3: Detalle del Ítem Seleccionado y Tipo de Cotización */}
          {selectedItem && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 shrink-0">
                    <ItemIcon name={selectedItem.iconName} size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {targetType === 'seed_or_baby'
                          ? selectedItem.seedOrBabyNameEs || `Semilla / Cría de ${selectedItem.nameEs}`
                          : selectedItem.nameEs}
                      </h3>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-400 rounded">
                        Tier {selectedItem.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Game ID:{' '}
                      <span className="text-slate-300">
                        {targetType === 'seed_or_baby' && selectedItem.seedOrBabyGameId
                          ? selectedItem.seedOrBabyGameId
                          : selectedItem.productGameId}
                      </span>{' '}
                      • Servidor:{' '}
                      <span className="text-cyan-300 font-semibold">{ALBION_DATA_SERVERS[server].name}</span>
                    </p>
                  </div>
                </div>

                {/* Alternador entre Producto Cosechado vs Semilla/Cría */}
                {selectedItem.seedOrBabyGameId && (
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setTargetType('product')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        targetType === 'product'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {selectedItem.category === 'mount' ? 'Montura Criada' : 'Cosecha / Producción'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('seed_or_baby')}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                        targetType === 'seed_or_baby'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {selectedItem.category === 'mount' || selectedItem.category.includes('animal')
                        ? 'Cría de Animal'
                        : 'Semilla'}
                    </button>
                  </div>
                )}
              </div>

              {/* Botón de Refrescar y Resumen de Estado */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span>
                    {isLoading
                      ? 'Consultando API pública...'
                      : quote?.fetchedAt
                      ? `Actualizado a las ${new Date(quote.fetchedAt).toLocaleTimeString()}`
                      : 'Listo para consultar'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={refreshQuote}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin text-cyan-400' : ''} />
                  Actualizar Ahora
                </button>
              </div>

              {/* Mensajes de error o límite de tasa */}
              {isThrottled && (
                <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Servidor Público Ocupado (Throttled)</strong>
                    <p className="text-[11px] text-amber-300/90 mt-0.5">
                      Albion Data Project recibe millones de peticiones diarias y pide espaciar las consultas. Tus precios
                      manuales en la app continúan funcionando con total normalidad.
                    </p>
                  </div>
                </div>
              )}

              {error && !isThrottled && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Aviso de Conexión Externa</strong>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Tarjetas de Resumen Rápido (Mejor Venta vs Mayor Compra) */}
              {quote && quote.records.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Mejor Venta Mínima */}
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                        Venta Directa Más Barata
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold text-white font-mono">
                          {quote.cheapestSellPrice ? quote.cheapestSellPrice.toLocaleString() : 'N/D'}
                        </span>
                        <span className="text-xs text-amber-400">🪙</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ciudad:{' '}
                        <strong className="text-slate-200 font-semibold">
                          {quote.cheapestSellCity || 'Sin datos'}
                        </strong>
                      </p>
                    </div>
                    {quote.cheapestSellPrice && (
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            copyPriceToClipboard(
                              quote.cheapestSellPrice!,
                              `Mejor Venta en ${quote.cheapestSellCity}`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                          title="Copiar precio al portapapeles"
                        >
                          <Copy size={11} /> Copiar
                        </button>
                        {onApplyPriceToManual && (
                          <button
                            type="button"
                            onClick={() => handleApplyPrice(quote.cheapestSellPrice!)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white shadow-sm flex items-center gap-1 cursor-pointer"
                            title="Establecer como cotización manual para tus cálculos"
                          >
                            <Check size={11} /> Usar Manual
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mayor Orden de Compra */}
                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider block">
                        Mayor Orden de Compra (Buy Order)
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold text-white font-mono">
                          {quote.highestBuyPrice ? quote.highestBuyPrice.toLocaleString() : 'N/D'}
                        </span>
                        <span className="text-xs text-amber-400">🪙</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ciudad:{' '}
                        <strong className="text-slate-200 font-semibold">
                          {quote.highestBuyCity || 'Sin datos'}
                        </strong>
                      </p>
                    </div>
                    {quote.highestBuyPrice && (
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            copyPriceToClipboard(
                              quote.highestBuyPrice!,
                              `Orden de Compra en ${quote.highestBuyCity}`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                          title="Copiar precio al portapapeles"
                        >
                          <Copy size={11} /> Copiar
                        </button>
                        {onApplyPriceToManual && (
                          <button
                            type="button"
                            onClick={() => handleApplyPrice(quote.highestBuyPrice!)}
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold text-white shadow-sm flex items-center gap-1 cursor-pointer"
                            title="Establecer como cotización manual para tus cálculos"
                          >
                            <Check size={11} /> Usar Manual
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tabla Detallada por Ciudad */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="py-2 px-3">Ciudad Real</th>
                      <th className="py-2 px-3">Venta Mínima (Sell Order)</th>
                      <th className="py-2 px-3">Compra Máxima (Buy Order)</th>
                      <th className="py-2 px-3">Antigüedad Reporte</th>
                      <th className="py-2 px-3 text-right">Acción Opcional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {quote && quote.records.length > 0 ? (
                      quote.records.map((rec) => {
                        const cityBadgeColor =
                          CITY_COLORS[rec.city] || 'text-slate-300 bg-slate-900 border-slate-700';
                        const effectivePrice = rec.sellPriceMin > 0 ? rec.sellPriceMin : rec.buyPriceMax;

                        return (
                          <tr key={rec.city} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-sans">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${cityBadgeColor}`}
                              >
                                {rec.city}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {rec.sellPriceMin > 0 ? (
                                <span className="text-emerald-400 font-bold">
                                  {rec.sellPriceMin.toLocaleString()} 🪙
                                </span>
                              ) : (
                                <span className="text-slate-500">Sin datos</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {rec.buyPriceMax > 0 ? (
                                <span className="text-blue-400 font-bold">
                                  {rec.buyPriceMax.toLocaleString()} 🪙
                                </span>
                              ) : (
                                <span className="text-slate-500">Sin datos</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-[11px]">
                              <span
                                className={`flex items-center gap-1 ${
                                  rec.isSellPriceStale ? 'text-amber-400' : 'text-slate-300'
                                }`}
                              >
                                {rec.isSellPriceStale && <AlertTriangle size={11} />}
                                {rec.sellPriceAgeFormatted}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans">
                              {effectivePrice > 0 ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyPriceToClipboard(effectivePrice, `${rec.city}`)
                                    }
                                    className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
                                    title="Copiar número al portapapeles"
                                  >
                                    <Copy size={13} />
                                  </button>
                                  {onApplyPriceToManual && (
                                    <button
                                      type="button"
                                      onClick={() => handleApplyPrice(effectivePrice)}
                                      className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white text-[11px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                                      title="Copiar a precio manual en la app"
                                    >
                                      Aplicar a Manual
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[11px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-sans">
                          {isLoading
                            ? 'Consultando cotizaciones de mercado en los servidores de Albion Data Project...'
                            : 'No se encontraron cotizaciones para este ítem en el servidor seleccionado.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Banner de Aviso y Explicación Inviolable */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-300">
                Regla Inviolable de Precios Manuales de Albion Farm Tracker:
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Esta consulta se conecta a la red abierta de Albion Data Project creada por la comunidad. Los datos
                pueden tener minutos u horas de antigüedad dependiendo de cuándo pasó un jugador con el cliente abierto.
                <strong> Tus cálculos y balance siempre respetan al 100% los precios que tú ingresas</strong>; estos
                datos solo sirven como guía de referencia rápida para ahorrarte tiempo si decides copiarlos voluntariamente.
              </p>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>Powered by</span>
            <a
              href="https://www.albion-online-data.com/"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              The Albion Online Data Project <ExternalLink size={11} />
            </a>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
