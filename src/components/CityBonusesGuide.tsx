import React, { useState } from 'react';
import { CITIES } from '../data/items';
import { CityId } from '../types';
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  BookOpen,
  Hammer,
  Truck,
  Home,
  Scale,
  Percent,
} from 'lucide-react';

interface Props {
  selectedCityId: CityId;
  onSelectCity: (id: CityId) => void;
}

type GuideSubTab = 'islands' | 'rrr' | 'mounts' | 'labourers' | 'taxes';

export const CityBonusesGuide: React.FC<Props> = ({ selectedCityId, onSelectCity }) => {
  const [activeSubTab, setActiveSubTab] = useState<GuideSubTab>('islands');

  return (
    <div id="city-bonuses-guide" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Guía Maestra Oficial
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs">Mecánicas de Albion Online</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <BookOpen size={22} className="text-amber-400" />
            <span>Biblia Económica & Bonificaciones de Ciudad</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Consulta las tablas oficiales de biomas, retorno de recursos (RRR), transporte y trabajadores sin salir de la app.
          </p>
        </div>

        {/* Sub-tabs de la guía */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveSubTab('islands')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'islands'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles size={14} />
            <span>Islas & Biomas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rrr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'rrr'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Percent size={14} />
            <span>RRR & Crafteo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mounts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'mounts'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Truck size={14} />
            <span>Monturas & Carga</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('labourers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'labourers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home size={14} />
            <span>Trabajadores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('taxes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'taxes'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Scale size={14} />
            <span>Impuestos</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ISLAS & BIOMAS */}
      {activeSubTab === 'islands' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
            Cada isla vinculada a una Ciudad Real otorga <strong className="text-emerald-400">+10% de rendimiento</strong> en sus especialidades, y <strong className="text-pink-400">Brecilien otorga +15%</strong> en todos los cultivos vegetales.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {CITIES.map((city) => {
              const isSelected = city.id === selectedCityId;
              return (
                <button
                  key={city.id}
                  id={`city-card-${city.id}`}
                  type="button"
                  onClick={() => onSelectCity(city.id)}
                  className={`text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} style={{ color: city.color }} />
                      <span className="font-bold text-sm text-slate-100">{city.name}</span>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                        <CheckCircle2 size={12} /> Seleccionada
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mb-2 font-mono">
                    Bioma: <span className="text-slate-300">{city.biome}</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {city.cropBonusNames.length > 0 && (
                      <div>
                        <span className="text-emerald-400 font-semibold">🌾 Cultivo:</span>{' '}
                        <span className="text-slate-300">{city.cropBonusNames.join(', ')}</span>
                      </div>
                    )}
                    {city.herbBonusNames.length > 0 && (
                      <div>
                        <span className="text-purple-400 font-semibold">🌿 Hierbas:</span>{' '}
                        <span className="text-slate-300">{city.herbBonusNames.join(', ')}</span>
                      </div>
                    )}
                    {city.animalBonusNames.length > 0 && (
                      <div>
                        <span className="text-amber-400 font-semibold">🥩 Ganado:</span>{' '}
                        <span className="text-slate-300">{city.animalBonusNames.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Guía Rápida de Comidas Favoritas del Ganado */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs">
            <div className="flex items-center justify-between font-semibold text-amber-300 mb-3">
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-400" />
                <span>⭐ Comidas Favoritas de Animales (Crecimiento al Doble de Velocidad):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Actualización Wild Blood</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-slate-300">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="font-bold text-slate-100 block">Gallina (T3)</span>
                <span className="text-amber-400 text-[11px] block mt-0.5">➔ Trigo (T3)</span>
                <span className="text-[10px] text-slate-500">Cultivo: Martlock</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="font-bold text-slate-100 block">Cabra (T4)</span>
                <span className="text-amber-400 text-[11px] block mt-0.5">➔ Nabos (T4)</span>
                <span className="text-[10px] text-slate-500">Cultivo: Fort Sterling</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="font-bold text-slate-100 block">Ganso (T5)</span>
                <span className="text-amber-400 text-[11px] block mt-0.5">➔ Coles (T5)</span>
                <span className="text-[10px] text-slate-500">Cultivo: Thetford</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="font-bold text-slate-100 block">Oveja (T6)</span>
                <span className="text-amber-400 text-[11px] block mt-0.5">➔ Patatas (T6)</span>
                <span className="text-[10px] text-slate-500">Cultivo: Martlock</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="font-bold text-slate-100 block">Cerdo (T7)</span>
                <span className="text-amber-400 text-[11px] block mt-0.5">➔ Maíz (T7)</span>
                <span className="text-[10px] text-slate-500">Cultivo: Bridgewatch</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                <span className="font-bold text-slate-100 block">Vaca (T8)</span>
                <span className="text-amber-400 text-[11px] block mt-0.5">➔ Calabazas (T8)</span>
                <span className="text-[10px] text-slate-500">Cultivo: Lymhurst</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RRR & CRAFTEO */}
      {activeSubTab === 'rrr' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-amber-400 mb-1">Ciudad con Bono Local</div>
              <div className="text-2xl font-black text-slate-100 tabular-nums">24.8% <span className="text-xs text-slate-400 font-normal">base</span></div>
              <div className="text-sm font-bold text-emerald-400 mt-1 tabular-nums">47.9% con Foco</div>
              <div className="text-[11px] text-slate-400 mt-2">Aplica en forjas o talleres con la especialidad oficial de la ciudad.</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-slate-400 mb-1">Ciudad sin Bono Local</div>
              <div className="text-2xl font-black text-slate-300 tabular-nums">15.2% <span className="text-xs text-slate-500 font-normal">base</span></div>
              <div className="text-sm font-bold text-emerald-400/80 mt-1 tabular-nums">43.5% con Foco</div>
              <div className="text-[11px] text-slate-400 mt-2">Crafteo estándar sin bonificación de bioma.</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-bold text-pink-400 mb-1">Caerleon & Brecilien</div>
              <div className="text-2xl font-black text-pink-300 tabular-nums">+15% RRR</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">Cocina / Pociones</div>
              <div className="text-[11px] text-slate-400 mt-2">Caerleon bonifica Cocina (+15%) y Brecilien bonifica Pociones (+15%).</div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Hammer size={16} />
              <span>Especializaciones Oficiales de Crafteo y Refinado por Ciudad</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-slate-300">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-amber-400 block mb-1">Fort Sterling</span>
                <span className="text-slate-400 text-[11px] block font-semibold">🌲 Madera (Tablas)</span>
                <span className="text-[11px] text-slate-300 mt-1 block">Martillos, Armaduras de Cuero, Cascos de Placas, Bastones de Fuego, Guanteletes.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-emerald-400 block mb-1">Lymhurst</span>
                <span className="text-slate-400 text-[11px] block font-semibold">🌿 Fibra (Tela)</span>
                <span className="text-[11px] text-slate-300 mt-1 block">Arcos, Cascos de Cuero, Dagas, Varas de Combate, Espadas.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-amber-500 block mb-1">Bridgewatch</span>
                <span className="text-slate-400 text-[11px] block font-semibold">🏜️ Piedra (Bloques)</span>
                <span className="text-[11px] text-slate-300 mt-1 block">Ballestas, Armaduras de Placas, Bastones Malditos, Varas Sagradas, Capas.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-blue-400 block mb-1">Martlock</span>
                <span className="text-slate-400 text-[11px] block font-semibold">🏔️ Piel (Cuero)</span>
                <span className="text-[11px] text-slate-300 mt-1 block">Hachas, Zapatos de Placas, Mazas, Bastones de Naturaleza, Capas.</span>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="font-bold text-purple-400 block mb-1">Thetford</span>
                <span className="text-slate-400 text-[11px] block font-semibold"> болот Mineral (Lingotes)</span>
                <span className="text-[11px] text-slate-300 mt-1 block">Lanzas, Zapatos de Cuero, Bastones Arcanos, Bastones de Hielo, Yelmos de Tela.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MONTURAS & CARGA */}
      {activeSubTab === 'mounts' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
            <span>El <strong className="text-amber-400">Pastel de Cerdo (T7)</strong> incrementa la capacidad máxima de carga en un <strong className="text-emerald-400">+30%</strong> durante 30 minutos.</span>
            <span className="text-red-400 font-bold">Sobrecarga &gt;= 200%: Inmovilidad (0 km/h)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-mono">
                  <th className="p-2.5">Montura de Transporte</th>
                  <th className="p-2.5">Tier</th>
                  <th className="p-2.5 text-right">Capacidad Base (kg)</th>
                  <th className="p-2.5 text-right text-emerald-400">Con Pastel (+30%)</th>
                  <th className="p-2.5">Velocidad Base</th>
                  <th className="p-2.5">Rol Recomendado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="p-2.5 font-bold text-slate-100">Buey de Transporte T3</td>
                  <td className="p-2.5 font-mono text-amber-500">T3</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">487 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">633 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">40% / 65%</td>
                  <td className="p-2.5 text-slate-400">Agricultura inicial en isla</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-100">Buey de Transporte T4</td>
                  <td className="p-2.5 font-mono text-blue-400">T4</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">794 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">1,032 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">40% / 65%</td>
                  <td className="p-2.5 text-slate-400">Rutas seguras de 1-2 islas</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-100">Buey de Transporte T5</td>
                  <td className="p-2.5 font-mono text-red-400">T5</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">1,291 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">1,678 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">40% / 65%</td>
                  <td className="p-2.5 text-slate-400">Comercio interurbano medio</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-100">Buey de Transporte T6</td>
                  <td className="p-2.5 font-mono text-amber-400">T6</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">2,096 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">2,725 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">40% / 65%</td>
                  <td className="p-2.5 text-slate-400">Transporte masivo de grano</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-100">Buey de Transporte T7</td>
                  <td className="p-2.5 font-mono text-yellow-400">T7</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">3,397 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">4,416 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">40% / 65%</td>
                  <td className="p-2.5 text-slate-400">Cosecha de 5 islas completas</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-100">Buey de Transporte T8</td>
                  <td className="p-2.5 font-mono text-slate-100">T8</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">5,502 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">7,152 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">40% / 65%</td>
                  <td className="p-2.5 text-slate-400">Carga pesada interurbana</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-cyan-300">Oso Polar de Caerleon</td>
                  <td className="p-2.5 font-mono text-yellow-400">T7</td>
                  <td className="p-2.5 text-right font-mono tabular-nums">4,200 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums text-emerald-400 font-bold">5,460 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">55% / 75%</td>
                  <td className="p-2.5 text-cyan-400">Transporte blindado por Zona Roja</td>
                </tr>
                <tr className="bg-amber-950/20 border-t border-amber-500/30">
                  <td className="p-2.5 font-black text-amber-300">Mamut de Transporte</td>
                  <td className="p-2.5 font-mono text-slate-100">T8</td>
                  <td className="p-2.5 text-right font-mono tabular-nums font-black text-amber-400">2,000,000 kg</td>
                  <td className="p-2.5 text-right font-mono tabular-nums font-black text-emerald-400">2,600,000 kg</td>
                  <td className="p-2.5 font-mono text-slate-400">35% / 50%</td>
                  <td className="p-2.5 text-amber-400 font-bold">Imperio Comercial Máximo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TRABAJADORES */}
      {activeSubTab === 'labourers' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-amber-400 block text-sm">Oficios de Trabajadores Oficiales</span>
              <p className="text-slate-400">
                En Albion Online <strong className="text-red-400">NO existen diarios para granja, animales ni cocina</strong>. Solo existen:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong>Recolectores</strong>: Leñador, Cantero, Prospector, Cosechador, Desollador, Pescador.</li>
                <li><strong>Artesanos</strong>: Herrero, Flechero, Mago, Hojalatero.</li>
                <li><strong>Combate</strong>: Mercenario (llena con plata y fama de mobs).</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-emerald-400 block text-sm">Rendimiento Máximo y Felicidad</span>
              <p className="text-slate-400">
                La felicidad depende de tener la casa, camas, mesas y trofeos en el nivel correspondiente:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li><strong>Recolectores</strong>: Hasta un <strong className="text-emerald-400">150% de retorno</strong> (cuando la casa supera en 1 tier al diario).</li>
                <li><strong>Artesanos</strong>: Hasta un <strong className="text-emerald-400">125% de retorno</strong>.</li>
                <li><strong>Mobiliario</strong>: 1 cama por trabajador, 1 mesa por cada 4 trabajadores y trofeos del tier correspondiente.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: IMPUESTOS */}
      {activeSubTab === 'taxes' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2">
              <span className="font-bold text-emerald-400 block text-sm">Con Suscripción Premium Activa</span>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Tasa de Venta de Mercado (Tax):</span>
                  <span className="font-mono font-bold text-emerald-400">4.0%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Tasa de Publicación de Orden (Setup Fee):</span>
                  <span className="font-mono font-bold text-slate-300">2.5%</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span>Coste Total Orden de Venta:</span>
                  <span className="font-mono text-amber-400">6.5%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-red-500/30 rounded-xl space-y-2">
              <span className="font-bold text-red-400 block text-sm">Sin Suscripción Premium</span>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Tasa de Venta de Mercado (Tax):</span>
                  <span className="font-mono font-bold text-red-400">8.0%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Tasa de Publicación de Orden (Setup Fee):</span>
                  <span className="font-mono font-bold text-slate-300">2.5%</span>
                </div>
                <div className="flex justify-between py-1 font-bold">
                  <span>Coste Total Orden de Venta:</span>
                  <span className="font-mono text-red-400">10.5%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-slate-300">
            <div>
              <strong className="text-amber-400 block">Mercado Negro de Caerleon:</strong>
              <span className="text-[11px] text-slate-400">Al vender directamente contra una Orden de Compra generada por el sistema de Albion:</span>
            </div>
            <span className="text-base font-black text-emerald-400 font-mono">0.0% Impuestos</span>
          </div>
        </div>
      )}
    </div>
  );
};

