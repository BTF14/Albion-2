import React from 'react';
import { CITIES } from '../data/items';
import { CityId } from '../types';
import { Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedCityId: CityId;
  onSelectCity: (id: CityId) => void;
}

export const CityBonusesGuide: React.FC<Props> = ({ selectedCityId, onSelectCity }) => {
  return (
    <div id="city-bonuses-guide" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Sparkles size={20} className="text-amber-400" />
            Bonificaciones de Islas por Ciudad & Comidas Favoritas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada isla vinculada a una Ciudad Real otorga <strong className="text-emerald-400">+10% de rendimiento</strong> en sus especialidades, y <strong className="text-pink-400">Brecilien otorga +15%</strong> en todos los cultivos vegetales.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-5">
        {CITIES.map((city) => {
          const isSelected = city.id === selectedCityId;
          return (
            <button
              key={city.id}
              id={`city-card-${city.id}`}
              type="button"
              onClick={() => onSelectCity(city.id)}
              className={`text-left p-3.5 rounded-lg border transition-all duration-150 ${
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

      {/* Guía Rápida de Comidas Favoritas del Ganado (Mecánica Oficial Albion Online) */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between font-semibold text-amber-300 mb-2">
          <span>⭐ Comidas Favoritas de Animales (Ahorro del 50% en Alimento):</span>
          <span className="text-[11px] text-slate-400 font-normal">Intercambio comercial entre biomas</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-slate-300">
          <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
            <span className="font-bold text-slate-100 block">Gallina (T3)</span>
            <span className="text-amber-400 text-[11px]">➔ Trigo (T4)</span>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
            <span className="font-bold text-slate-100 block">Cabra (T4)</span>
            <span className="text-amber-400 text-[11px]">➔ Nabos (T5)</span>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
            <span className="font-bold text-slate-100 block">Ganso (T5)</span>
            <span className="text-amber-400 text-[11px]">➔ Coles (T6)</span>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
            <span className="font-bold text-slate-100 block">Oveja (T6)</span>
            <span className="text-amber-400 text-[11px]">➔ Patatas (T7)</span>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
            <span className="font-bold text-slate-100 block">Cerdo (T7)</span>
            <span className="text-amber-400 text-[11px]">➔ Maíz (T8)</span>
          </div>
          <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
            <span className="font-bold text-slate-100 block">Vaca (T8)</span>
            <span className="text-amber-400 text-[11px]">➔ Calabazas (T8)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
