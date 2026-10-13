import React, { useState } from 'react';
import { DailyLogEntry, CityId } from '../types';
import { useFinancialGoals } from '../hooks/useFinancialGoals';
import { ALBION_ITEMS } from '../data/items';
import { ItemIcon } from './ItemIcon';
import { AlbionItemBadge } from './AlbionItemBadge';
import { formatSilver } from '../utils/albionColors';
import {
  Target,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Wheat,
  Coins,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface Props {
  logs: DailyLogEntry[];
  hasPremium: boolean;
  onNavigateToLogger?: () => void;
}

export const FinancialGoalsView: React.FC<Props> = ({
  logs,
  hasPremium,
  onNavigateToLogger,
}) => {
  const {
    goals,
    manualSavedSilver,
    setManualSavedSilver,
    goalsAnalysis,
    addCustomGoal,
    deleteGoal,
    resetToCanonicalGoals,
    seedBudgetInput,
    updateSeedBudgetInput,
    seedBudgetResult,
  } = useFinancialGoals(logs, hasPremium);

  // Ciclo oficial de cálculo
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Modal para agregar meta personalizada
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTarget, setNewTarget] = useState<string>('5000000');
  const [newNotes, setNewNotes] = useState<string>('');

  const handleCalculate = () => {
    setHasCalculated(true);
    setIsStale(false);
  };

  const handleClear = () => {
    setHasCalculated(false);
    setIsStale(false);
  };

  const handleParamChange = () => {
    if (hasCalculated) {
      setIsStale(true);
    }
  };

  const handleCreateCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(newTarget);
    if (newTitle.trim() && num > 0) {
      addCustomGoal(newTitle, num, newNotes);
      setNewTitle('');
      setNewTarget('5000000');
      setNewNotes('');
      setShowAddModal(false);
      handleParamChange();
    }
  };

  // Filtrar solo cultivos/hierbas para el presupuesto de siembra
  const farmingItems = ALBION_ITEMS.filter(
    (i) => i.category === 'crop' || i.category === 'herb'
  );

  const selectedItem = farmingItems.find((i) => i.id === seedBudgetInput.itemId) || farmingItems[0];

  // Métricas acumuladas globales
  const totalCompleted = goalsAnalysis.filter((g) => g.isCompleted).length;
  const currentSaved = manualSavedSilver > 0
    ? manualSavedSilver
    : logs.reduce((acc, l) => acc + (l.netProfit || 0), 0);

  const avgVelocity = goalsAnalysis[0]?.dailySilverVelocity || 0;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Planificación Financiera de Albion
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs">Metas & Capital de Trabajo</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <Target className="text-amber-400" size={26} />
              <span>Metas Financieras & Presupuesto de Siembra</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Monitorea el progreso hacia tu suscripción Premium, Mamut de transporte e islas de gremio,
              y calcula el desembolso líquido exacto antes de acudir al mercado de semillas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Nueva Meta</span>
            </button>
            <button
              type="button"
              onClick={resetToCanonicalGoals}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Restaurar metas canónicas oficiales de Albion"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Restablecer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Control de Cálculo Oficial "Dar Resultado" */}
      <div className="bg-slate-900 border border-amber-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              {hasCalculated
                ? isStale
                  ? 'Parámetros Modificados'
                  : 'Metas y Presupuesto Evaluados'
                : 'Listo para Evaluar'}
            </div>
            <div className="text-[11px] text-slate-400">
              {hasCalculated
                ? isStale
                  ? 'Cambiaste valores. Presiona el botón para recalcular los días de llegada y presupuesto.'
                  : 'Progreso de metas sincronizado con tus cosechas e inventario de semillas.'
                : 'Presiona "Dar Resultado" para proyectar el cumplimiento de tus metas y presupuesto de siembra.'}
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
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/50'
                : isStale
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            <Sparkles size={16} />
            <span>
              {!hasCalculated
                ? 'Dar Resultado / Evaluar Metas'
                : isStale
                ? 'Recalcular Metas y Presupuesto'
                : 'Metas Calculadas (Listo)'}
            </span>
          </button>
        </div>
      </div>

      {/* Resumen Superior de Plata & Banco */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Plata Analizada en el Sistema</span>
            <Coins size={14} className="text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 mt-1 tabular-nums">
            {formatSilver(currentSaved)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-[11px] text-slate-500 whitespace-nowrap">Ajuste manual:</label>
            <input
              type="number"
              value={manualSavedSilver || ''}
              placeholder="0 (automático)"
              onChange={(e) => {
                setManualSavedSilver(Math.max(0, Number(e.target.value) || 0));
                handleParamChange();
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 tabular-nums focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Velocidad Diaria Promedio</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="text-lg font-black text-emerald-400 mt-1 tabular-nums">
            +{formatSilver(avgVelocity)} / día
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Calculado a partir de los registros de cosechas en el historial.
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Hitos Alcanzados</span>
            <CheckCircle2 size={14} className="text-cyan-400" />
          </div>
          <div className="text-lg font-black text-cyan-300 mt-1 tabular-nums">
            {totalCompleted} de {goals.length} cumplidos
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {totalCompleted > 0
              ? '¡Excelente progreso en tu imperio!'
              : 'Continúa reinvirtiendo para alcanzar tus metas.'}
          </div>
        </div>
      </div>

      {/* ESTADO DE ESPERA: Muestra tarjeta hasta presionar "Dar Resultado" */}
      {!hasCalculated ? (
        <div className="bg-slate-900/60 border border-dashed border-amber-900/40 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Target size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-200">
              Listo para Proyectar tus Metas Financieras
            </h3>
            <p className="text-xs text-slate-400">
              Presiona el botón oficial para calcular el tiempo estimado de llegada a tu Premium,
              Mamut de Transporte, y dimensionar el presupuesto de tu próxima siembra.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCalculate}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 inline-flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles size={16} />
            <span>Calcular Progreso y Presupuesto Ahora</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECCIÓN 1: METAS FINANCIERAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Target size={18} className="text-amber-400" />
                <span>Progreso de Metas & Hitos</span>
              </h2>
              <span className="text-xs text-slate-400">
                {goalsAnalysis.length} meta(s) activas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goalsAnalysis.map((item) => (
                <div
                  key={item.goalId}
                  className={`border rounded-xl p-4 transition-all relative overflow-hidden ${
                    item.isCompleted
                      ? 'bg-emerald-950/20 border-emerald-800/50 shadow-emerald-950/20 shadow-md'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          item.isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-800 text-amber-400 border-slate-700'
                        }`}
                      >
                        {item.isCompleted ? <CheckCircle2 size={20} /> : <Target size={20} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950">
                              CUMPLIDO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                          Meta: {formatSilver(item.targetSilver)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteGoal(item.goalId)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Eliminar meta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Barra de Progreso */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="text-slate-400">
                        {formatSilver(item.currentProgressSilver)} acumulados
                      </span>
                      <span
                        className={`font-black ${
                          item.isCompleted ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          item.isCompleted
                            ? 'bg-emerald-500'
                            : item.percentage > 60
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                            : 'bg-gradient-to-r from-amber-600 to-amber-400'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Estado y Tiempo Estimado */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={13} className="text-slate-500" />
                      <span>{item.statusMessage}</span>
                    </div>

                    {!item.isCompleted && item.remainingSilver > 0 && (
                      <div className="text-right tabular-nums text-slate-400 text-[11px]">
                        Falta: <span className="text-slate-200 font-semibold">{formatSilver(item.remainingSilver)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECCIÓN 2: CALCULADORA DE PRESUPUESTO DE SIEMBRA MASIVA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Wheat size={20} className="text-amber-400" />
                  <span>Presupuesto de Siembra Masiva & Capital de Trabajo</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calcula cuánta plata líquida necesitas retirar del banco antes de ir al mercado a comprar semillas.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Cultivo:</span>
                <span className="font-bold text-amber-300">{selectedItem.nameEs}</span>
                <AlbionItemBadge tier={selectedItem.tier} />
              </div>
            </div>

            {/* Parámetros de Entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Cultivo a Sembrar
                </label>
                <select
                  value={seedBudgetInput.itemId}
                  onChange={(e) => {
                    const found = farmingItems.find((i) => i.id === e.target.value);
                    if (found) {
                      updateSeedBudgetInput({
                        itemId: found.id,
                        tier: found.tier,
                      });
                      handleParamChange();
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  {farmingItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      T{item.tier} {item.nameEs}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Número de Parcelas
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={seedBudgetInput.plotsCount}
                  onChange={(e) => {
                    updateSeedBudgetInput({ plotsCount: Math.max(1, Number(e.target.value) || 1) });
                    handleParamChange();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 tabular-nums focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block tabular-nums">
                  {seedBudgetInput.plotsCount * 9} casillas totales (a 9 por parcela)
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Semillas en Cofre / Inventario
                </label>
                <input
                  type="number"
                  min="0"
                  value={seedBudgetInput.currentSeedsInStock}
                  onChange={(e) => {
                    updateSeedBudgetInput({ currentSeedsInStock: Math.max(0, Number(e.target.value) || 0) });
                    handleParamChange();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 tabular-nums focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Se descuentan de la compra obligatoria
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Precio Semilla en Mercado (🪙)
                </label>
                <input
                  type="number"
                  min="0"
                  value={seedBudgetInput.seedUnitPriceManual}
                  onChange={(e) => {
                    updateSeedBudgetInput({ seedUnitPriceManual: Math.max(0, Number(e.target.value) || 0) });
                    handleParamChange();
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 tabular-nums focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Resultados del Presupuesto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
                <div className="text-xs font-bold text-amber-300">
                  Desembolso Líquido Necesario
                </div>
                <div className="text-xl font-black text-amber-400 mt-1 tabular-nums">
                  {formatSilver(seedBudgetResult.totalSeedCost)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                  Debes comprar: <strong className="text-slate-200">{seedBudgetResult.seedsToBuy} semillas</strong>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">
                  Cosecha Estimada (22h)
                </div>
                <div className="text-xl font-black text-slate-100 mt-1 tabular-nums">
                  ~{seedBudgetResult.estimatedHarvestUnits.toLocaleString()} u.
                </div>
                <div className="text-[11px] text-slate-500 mt-1 tabular-nums">
                  {seedBudgetResult.totalSlots} casillas sembradas
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">
                  Ingreso Neto Proyectado
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1 tabular-nums">
                  +{formatSilver(seedBudgetResult.estimatedNetRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Tras impuesto de venta de mercado
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-400">
                  Ganancia Neta / ROI Ronda
                </div>
                <div
                  className={`text-xl font-black mt-1 tabular-nums ${
                    seedBudgetResult.estimatedNetProfit >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {formatSilver(seedBudgetResult.estimatedNetProfit)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                  ROI: <strong className="text-amber-400">{seedBudgetResult.roiPercent}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agregar Meta Personalizada */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-slate-100 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-amber-400" />
              <span>Crear Meta Personalizada</span>
            </h3>

            <form onSubmit={handleCreateCustomGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Título de la Meta
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Set de Transporte T8 / Isla Secundaria"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Plata Objetivo (🪙)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 tabular-nums focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Notas / Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la compra o equipamiento..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
