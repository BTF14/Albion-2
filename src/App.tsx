/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { DailyLogEntry, CityId, PriceMemory, DailyChecklistItem, AppTab } from './types';
import {
  loadLogs,
  saveLogs,
  addLogEntry,
  deleteLogEntry,
  loadPriceMemory,
  updatePriceMemory,
  loadRecipePrices,
  loadSettings,
  saveSettings,
  loadChecklist,
  saveChecklist,
  AppSettings,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { DailyLogger } from './components/DailyLogger';
import { DailyHistory } from './components/DailyHistory';
import { DailyTodoList } from './components/DailyTodoList';
import { QuickSimulator } from './components/QuickSimulator';
import { CityBonusesGuide } from './components/CityBonusesGuide';
import { HarvestCalendar } from './components/HarvestCalendar';
import { FocusMasteryCalculator } from './components/FocusMasteryCalculator';
import { FocusOptimizerDashboard } from './components/FocusOptimizerDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ValueAddedCalculator } from './components/ValueAddedCalculator';
import { FishChoppingSaucesView } from './components/FishChoppingSaucesView';
import { MountsBreedingView } from './components/MountsBreedingView';
import { ButcherCalculatorView } from './components/ButcherCalculatorView';
import { LabourersCalculatorView } from './components/LabourersCalculatorView';
import { GuildIslandLabourersView } from './components/GuildIslandLabourersView';
import { EquipmentCraftingView } from './components/EquipmentCraftingView';
import { RefiningCalculatorView } from './components/RefiningCalculatorView';
import { EnchantingCalculatorView } from './components/EnchantingCalculatorView';
import { TransmutationFoundryView } from './components/TransmutationFoundryView';
import { SilverLeakDetectorView } from './components/SilverLeakDetectorView';
import { FocusPortfolioView } from './components/FocusPortfolioView';
import { WarehouseLogisticsView } from './components/WarehouseLogisticsView';
import { RedZoneTransportView } from './components/RedZoneTransportView';
import { CraftingSalesLedgerView } from './components/CraftingSalesLedgerView';
import { BlackMarketSimulatorView } from './components/BlackMarketSimulatorView';
import { TransportCalculator } from './components/TransportCalculator';
import { DailyEventsBanner } from './components/DailyEventsBanner';
import { CharacterManagerModal } from './components/CharacterManagerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AlbionDataPriceModal } from './components/AlbionDataPriceModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { DailyRoadmapPrintModal } from './components/DailyRoadmapPrintModal';
import { useDailyEvents } from './hooks/useDailyEvents';
import { useCharacterProfiles } from './hooks/useCharacterProfiles';
import { CITIES } from './data/items';
import { getLocalDateString } from './utils/date';
import { LabourerType } from './domain';

export default function App() {
  const dailyEvents = useDailyEvents();
  const characterProfiles = useCharacterProfiles();
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState<boolean>(false);
  const [isAdpModalOpen, setIsAdpModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isDailyRoadmapOpen, setIsDailyRoadmapOpen] = useState<boolean>(false);
  const [adpModalItemId, setAdpModalItemId] = useState<string | undefined>(undefined);
  const [adpModalTargetType, setAdpModalTargetType] = useState<'product' | 'seed_or_baby'>('product');
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [selectedCityId, setSelectedCityId] = useState<CityId>(settings.defaultCityId || 'martlock');
  const [logs, setLogs] = useState<DailyLogEntry[]>(() => loadLogs());
  const [priceMemory, setPriceMemory] = useState<PriceMemory>(() => loadPriceMemory());
  const [checklist, setChecklist] = useState<DailyChecklistItem[]>(() => loadChecklist());
  const [activeTab, setActiveTab] = useState<AppTab>('logger');
  const [loggerPreset, setLoggerPreset] = useState<{
    cityId?: CityId;
    itemId?: string;
    plotsCount?: number;
    targetDate?: string;
  } | null>(null);

  const [targetCraftRecipeId, setTargetCraftRecipeId] = useState<string | undefined>(undefined);
  const [targetSimulatorItemId, setTargetSimulatorItemId] = useState<string | undefined>(undefined);
  const [targetEquipmentRecipeId, setTargetEquipmentRecipeId] = useState<string | null>(null);
  const [targetEquipmentTier, setTargetEquipmentTier] = useState<number | null>(null);
  const [targetLabourerType, setTargetLabourerType] = useState<LabourerType | null>(null);
  const [targetJournalTier, setTargetJournalTier] = useState<number | null>(null);
  const [targetJournalsCount, setTargetJournalsCount] = useState<number | null>(null);
  const [targetButcherAnimalId, setTargetButcherAnimalId] = useState<string | null>(null);
  const [targetButcherAnimalCount, setTargetButcherAnimalCount] = useState<number | null>(null);
  const [recipePrices, setRecipePrices] = useState<Record<string, number>>(() => loadRecipePrices());

  useEffect(() => {
    // Solo persistir si defaultCityId efectivamente cambió respecto a lo almacenado
    const currentStored = loadSettings();
    if (currentStored.defaultCityId !== selectedCityId) {
      saveSettings({ ...currentStored, defaultCityId: selectedCityId });
    }
  }, [selectedCityId]);

  // Sincronización automática de caché de precios y storage entre pestañas y eventos (TTL 6h)
  useEffect(() => {
    const handleSync = () => {
      setPriceMemory(loadPriceMemory());
      setRecipePrices(loadRecipePrices());
      setLogs(loadLogs());
      setChecklist(loadChecklist());
      const loadedSettings = loadSettings();
      setSettings(loadedSettings);
      if (loadedSettings.defaultCityId) {
        setSelectedCityId(loadedSettings.defaultCityId);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('albion_storage_sync', handleSync);

    // Verificación periódica cada 2 minutos para invalidar precios que hayan superado el TTL de 6 horas
    const intervalId = setInterval(() => {
      setPriceMemory(loadPriceMemory());
      setRecipePrices(loadRecipePrices());
    }, 2 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('albion_storage_sync', handleSync);
      clearInterval(intervalId);
    };
  }, []);

  // Atajo de teclado global Ctrl+K / Cmd+K para la Paleta de Comandos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tareas pendientes hoy para badge en Navbar
  const pendingTasksCount = useMemo(() => {
    return checklist.filter((item) => {
      if (item.isCustomTask) return !item.completed;
      return !(item.harvested && item.replanted);
    }).length;
  }, [checklist]);

  const handleNavigateToLoggerWithPreset = (preset: {
    cityId: CityId;
    itemId?: string;
    plotsCount?: number;
    targetDate?: string;
  }) => {
    if (preset.cityId) {
      setSelectedCityId(preset.cityId);
    }
    setLoggerPreset(preset);
    setActiveTab('logger');
  };

  const handleSaveEntry = (entry: DailyLogEntry) => {
    const updated = addLogEntry(entry);
    setLogs(updated);
  };

  const handleDeleteEntry = (id: string) => {
    const updated = deleteLogEntry(id);
    setLogs(updated);
  };

  const handleClearAllLogs = () => {
    saveLogs([]);
    setLogs([]);
  };

  const handleUpdatePrices = (
    itemId: string,
    prices: { lastSeedPrice?: number; lastProductPrice?: number; lastFoodPrice?: number }
  ) => {
    updatePriceMemory(itemId, prices);
    setPriceMemory(loadPriceMemory());
  };

  const handleOpenAdpModal = (itemId?: string, targetType: 'product' | 'seed_or_baby' = 'product') => {
    setAdpModalItemId(itemId);
    setAdpModalTargetType(targetType);
    setIsAdpModalOpen(true);
  };

  const handleApplyAdpPrice = (itemId: string, price: number, targetType: 'product' | 'seed_or_baby') => {
    if (targetType === 'seed_or_baby') {
      handleUpdatePrices(itemId, { lastSeedPrice: price });
    } else {
      handleUpdatePrices(itemId, { lastProductPrice: price });
    }
  };

  // Cargar datos de prueba de ejemplo
  const handleLoadSampleData = () => {
    const sampleLogs: DailyLogEntry[] = [
      {
        id: 'sample_1',
        timestamp: Date.now() - 86400000 * 2,
        dateStr: getLocalDateString(new Date(Date.now() - 86400000 * 2)),
        cityId: 'martlock',
        category: 'crop',
        itemId: 'crop_wheat',
        itemName: 'Trigo',
        tier: 4,
        plotsCount: 5,
        slotsCount: 45,
        returnedSeedsOrBabies: 39,
        reboughtSeedsOrBabies: 6,
        seedOrBabyUnitPrice: 2400,
        harvestedAmount: 440,
        productUnitPrice: 380,
        usedFocus: true,
        focusPointsSpent: 4500,
        marketTaxPercent: 8,
        seedsRebuyCost: 14400,
        foodCost: 0,
        totalCosts: 14400,
        grossRevenue: 167200,
        marketTaxAmount: 13376,
        netRevenue: 153824,
        netProfit: 139424,
        profitPerSlot: 3098,
        silverPerFocus: 31.0,
        notes: 'Cosecha con bono en Martlock (+10%). Buen retorno de semillas.',
      },
      {
        id: 'sample_2',
        timestamp: Date.now() - 86400000,
        dateStr: getLocalDateString(new Date(Date.now() - 86400000)),
        cityId: 'thetford',
        category: 'herb',
        itemId: 'herb_agaric',
        itemName: 'Agárico arcano',
        tier: 3,
        plotsCount: 5,
        slotsCount: 45,
        returnedSeedsOrBabies: 37,
        reboughtSeedsOrBabies: 8,
        seedOrBabyUnitPrice: 3200,
        harvestedAmount: 435,
        productUnitPrice: 490,
        usedFocus: true,
        focusPointsSpent: 4500,
        marketTaxPercent: 8,
        seedsRebuyCost: 25600,
        foodCost: 0,
        totalCosts: 25600,
        grossRevenue: 213150,
        marketTaxAmount: 17052,
        netRevenue: 196098,
        netProfit: 170498,
        profitPerSlot: 3789,
        silverPerFocus: 37.9,
        notes: 'Huerto de hierbas en Thetford con bono regional.',
      },
      {
        id: 'sample_3',
        timestamp: Date.now(),
        dateStr: getLocalDateString(new Date()),
        cityId: 'thetford',
        category: 'animal_meat',
        itemId: 'animal_meat_pig',
        itemName: 'Cerdo Crudo (Matanza)',
        tier: 5,
        plotsCount: 5,
        slotsCount: 45,
        returnedSeedsOrBabies: 0,
        reboughtSeedsOrBabies: 45,
        seedOrBabyUnitPrice: 6200,
        harvestedAmount: 890,
        productUnitPrice: 580,
        foodConsumedUnits: 450,
        foodUnitPrice: 0, // usando sus propios cultivos
        extraFees: 3000,
        usedFocus: false,
        marketTaxPercent: 8,
        seedsRebuyCost: 279000,
        foodCost: 0,
        totalCosts: 282000,
        grossRevenue: 516200,
        marketTaxAmount: 41296,
        netRevenue: 474904,
        netProfit: 192904,
        profitPerSlot: 4287,
        silverPerFocus: 0,
        notes: 'Cría de lechones T5 alimentados con zanahorias propias y sacrificio con bono de carnicería.',
      },
      {
        id: 'sample_4',
        timestamp: Date.now(),
        dateStr: getLocalDateString(new Date()),
        cityId: 'fort_sterling',
        category: 'animal_produce',
        itemId: 'animal_prod_chicken',
        itemName: 'Huevos de Gallina',
        tier: 3,
        plotsCount: 3,
        slotsCount: 27,
        returnedSeedsOrBabies: 27,
        reboughtSeedsOrBabies: 0,
        seedOrBabyUnitPrice: 0,
        harvestedAmount: 235,
        productUnitPrice: 290,
        foodConsumedUnits: 270,
        foodUnitPrice: 0,
        usedFocus: false,
        marketTaxPercent: 4,
        seedsRebuyCost: 0,
        foodCost: 0,
        totalCosts: 0,
        grossRevenue: 68150,
        marketTaxAmount: 2726,
        netRevenue: 65424,
        netProfit: 65424,
        profitPerSlot: 2423,
        silverPerFocus: 0,
        notes: 'Producción diaria continua de huevos sin recomprar animales.',
      },
    ];

    saveLogs(sampleLogs);
    setLogs(sampleLogs);
  };

  // Balance total acumulado
  const totalProfit = logs.reduce((sum, item) => sum + item.netProfit, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16">
      {/* Header & Nav */}
      <Navbar
        currentCityId={selectedCityId}
        onSelectCity={(city) => setSelectedCityId(city)}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        logsCount={logs.length}
        totalProfit={totalProfit}
        pendingTasksCount={pendingTasksCount}
        serverCountdown={dailyEvents.timeInfo.formattedCountdown}
        activeBonusesCount={dailyEvents.activeBonuses.length}
        onToggleEvents={dailyEvents.toggleBannerCollapse}
        activeCharacterName={characterProfiles.activeCharacter?.name}
        activeCharacterColor={characterProfiles.activeCharacter?.avatarColor}
        activeCharacterFocus={characterProfiles.activeFocusRegen.currentFocus}
        isFocusFull={characterProfiles.activeFocusRegen.isFull}
        onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenCloudSyncModal={() => setIsCloudSyncModalOpen(true)}
        onOpenAdpModal={() => handleOpenAdpModal()}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Monitor Oficial de Eventos Diarios & Bonos de Producción (Reinicio 10:00 UTC) */}
        <DailyEventsBanner
          dailyEventsHook={dailyEvents}
          onNavigateToSimulator={() => setActiveTab('value_added')}
          onNavigateToOptimizer={() => setActiveTab('focus_optimizer')}
        />

        {/* Pestaña: Registro Diario */}
        {activeTab === 'logger' && (
          <div className="space-y-6">
            <DailyLogger
              selectedCityId={selectedCityId}
              defaultPlots={settings.defaultPlotsCount}
              defaultTaxRate={settings.defaultTaxRate}
              priceMemory={priceMemory}
              onSaveEntry={handleSaveEntry}
              onUpdatePrices={handleUpdatePrices}
              presetData={loggerPreset}
              onClearPreset={() => setLoggerPreset(null)}
              onOpenAdpModal={handleOpenAdpModal}
              onNavigateToCooking={(recipeId) => {
                setTargetCraftRecipeId(recipeId);
                setActiveTab('value_added');
              }}
              onNavigateToButcher={(animalId, animalCount) => {
                setTargetButcherAnimalId(animalId);
                setTargetButcherAnimalCount(animalCount);
                setActiveTab('butcher');
              }}
            />

            {/* Vista previa de últimas cosechas registradas */}
            {logs.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-300">
                    Últimas cosechas registradas recientemente:
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Ver historial completo ({logs.length}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {logs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{log.itemName}</div>
                        <div className="text-[11px] text-slate-400">
                          {log.dateStr} • {log.plotsCount} parcelas
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold ${
                            log.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {log.netProfit >= 0 ? '+' : ''}
                          {log.netProfit.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {log.usedFocus ? `${log.silverPerFocus} Silv/Foc` : 'Sin Foco'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Historial */}
        {activeTab === 'history' && (
          <DailyHistory
            logs={logs}
            onDeleteEntry={handleDeleteEntry}
            onClearAll={handleClearAllLogs}
            onLoadSampleData={handleLoadSampleData}
            onImportLogs={(importedLogs) => {
              saveLogs(importedLogs);
              setLogs(importedLogs);
            }}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {/* Pestaña: Calendario de Cosechas & Alarmas de 22 Horas */}
        {activeTab === 'calendar' && (
          <HarvestCalendar
            logs={logs}
            currentCityId={selectedCityId}
            onNavigateToLoggerWithPreset={handleNavigateToLoggerWithPreset}
          />
        )}

        {/* Pestaña: Lista de Cosas por Hacer y Rutinas */}
        {activeTab === 'todo' && (
          <DailyTodoList
            checklist={checklist}
            onSaveChecklist={(updated) => {
              saveChecklist(updated);
              setChecklist(updated);
            }}
            currentCityId={selectedCityId}
            onNavigateToLoggerWithPreset={handleNavigateToLoggerWithPreset}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            activeCharacterName={characterProfiles.activeCharacter?.name}
            characterProfiles={characterProfiles.characters}
            onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
            onOpenDailyRoadmap={() => setIsDailyRoadmapOpen(true)}
          />
        )}

        {/* Pestaña: Calculadora de Maestría y Eficiencia de Foco */}
        {activeTab === 'mastery' && (
          <FocusMasteryCalculator
            currentCityId={selectedCityId}
            onNavigateToLoggerWithPreset={handleNavigateToLoggerWithPreset}
            onNavigateToCrafting={(recipeId) => {
              setTargetCraftRecipeId(recipeId);
              setActiveTab('value_added');
            }}
            activeCharacterFocus={characterProfiles.activeFocusRegen.currentFocus}
            activeCharacterName={characterProfiles.activeCharacter?.name}
            onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
          />
        )}

        {/* Pestaña: Optimizador de Foco Diario (Clean Architecture) */}
        {activeTab === 'focus_optimizer' && (
          <FocusOptimizerDashboard
            currentCityId={selectedCityId}
            priceMemory={priceMemory}
            recipePrices={recipePrices}
            dailyBonusCookingRRR={dailyEvents.cookingBonusPercent}
            dailyBonusAlchemyRRR={dailyEvents.alchemyBonusPercent}
            activeCharacterFocus={characterProfiles.activeFocusRegen.currentFocus}
            activeCharacterName={characterProfiles.activeCharacter?.name}
            onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
            onNavigateToLogger={(itemId) => {
              handleNavigateToLoggerWithPreset({ cityId: selectedCityId, itemId });
              setActiveTab('logger');
            }}
            onNavigateToValueAdded={(recipeId) => {
              setTargetCraftRecipeId(recipeId);
              setActiveTab('value_added');
            }}
            onNavigateToMastery={() => setActiveTab('mastery')}
            onSelectCity={(city) => setSelectedCityId(city)}
          />
        )}

        {/* Pestaña: Portafolio de Foco del Imperio (Multi-Alt) */}
        {activeTab === 'focus_portfolio' && (
          <FocusPortfolioView
            onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab as AppTab)}
          />
        )}

        {/* Pestaña: Crianza de Monturas & Pastizales Avanzados */}
        {activeTab === 'mounts' && (
          <MountsBreedingView dailyEventsHook={dailyEvents} />
        )}

        {/* Pestaña: Carnicería y Matadero de Animales (Rendimiento de Carne) */}
        {activeTab === 'butcher' && (
          <ButcherCalculatorView
            currentCityId={selectedCityId}
            onOpenAdpModal={(itemId, targetType) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType(targetType || 'product');
              setIsAdpModalOpen(true);
            }}
            onNavigateToTab={(tab) => setActiveTab(tab as AppTab)}
            targetAnimalId={targetButcherAnimalId}
            targetAnimalCount={targetButcherAnimalCount}
            onClearTarget={() => {
              setTargetButcherAnimalId(null);
              setTargetButcherAnimalCount(null);
            }}
          />
        )}

        {/* Pestaña: Casas y Trabajadores (Labourers) */}
        {activeTab === 'labourers' && (
          <LabourersCalculatorView
            onNavigateToEquipmentCrafting={() => setActiveTab('crafting_equipment')}
            onNavigateToTransport={() => setActiveTab('transport')}
            targetLabourerType={targetLabourerType}
            targetJournalTier={targetJournalTier}
            targetJournalsCount={targetJournalsCount}
            onClearTarget={() => {
              setTargetLabourerType(null);
              setTargetJournalTier(null);
              setTargetJournalsCount(null);
            }}
          />
        )}

        {/* Pestaña: Isla de Gremio & Casa Gremial (Guild Hall) */}
        {activeTab === 'guild_island' && (
          <GuildIslandLabourersView
            currentCityId={selectedCityId}
            onNavigateToEquipmentCrafting={() => setActiveTab('crafting_equipment')}
            onNavigateToLabourers={() => setActiveTab('labourers')}
          />
        )}

        {/* Pestaña: Crafteo de Equipo y Diarios de Trabajador */}
        {activeTab === 'crafting_equipment' && (
          <EquipmentCraftingView
            cityId={selectedCityId}
            dailyProductionBonusRRR={dailyEvents.equipmentCraftingBonusPercent}
            onOpenAdpModal={(itemId, targetType) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType(targetType || 'product');
              setIsAdpModalOpen(true);
            }}
            onNavigateToLabourers={(labourerType, journalTier, journalsCount) => {
              if (labourerType) setTargetLabourerType(labourerType);
              if (journalTier) setTargetJournalTier(journalTier);
              if (journalsCount) setTargetJournalsCount(journalsCount);
              setActiveTab('labourers');
            }}
            targetRecipeId={targetEquipmentRecipeId}
            targetTier={targetEquipmentTier}
            onClearTarget={() => {
              setTargetEquipmentRecipeId(null);
              setTargetEquipmentTier(null);
            }}
          />
        )}

        {/* Pestaña: Calculadora de Refinado de Recursos Brutos (RRR hasta 53.9%) */}
        {activeTab === 'refining' && (
          <RefiningCalculatorView
            cityId={selectedCityId}
            dailyProductionBonusRRR={dailyEvents.equipmentCraftingBonusPercent}
            onOpenAdpModal={(itemId, targetType) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType(targetType || 'product');
              setIsAdpModalOpen(true);
            }}
            onSelectCity={(city) => setSelectedCityId(city)}
            onNavigateToCrafting={(recipeId, tier) => {
              if (recipeId) setTargetEquipmentRecipeId(recipeId);
              if (tier) setTargetEquipmentTier(tier);
              setActiveTab('crafting_equipment');
            }}
          />
        )}

        {/* Pestaña: Taller de Transmutación y Arbitraje de Recursos Refinados y Brutos */}
        {activeTab === 'transmutation' && (
          <TransmutationFoundryView
            onOpenAdpModal={(itemId, targetType) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType(targetType || 'product');
              setIsAdpModalOpen(true);
            }}
          />
        )}

        {/* Pestaña: Taller de Encantamiento y Fusión (.0 a .1, .2, .3, .4) */}
        {activeTab === 'enchanting' && (
          <EnchantingCalculatorView
            onOpenAdpModal={(itemId, targetType) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType(targetType || 'product');
              setIsAdpModalOpen(true);
            }}
          />
        )}

        {/* Pestaña: Libro Mayor de Ventas & Mercado Negro (Caerleon) */}
        {activeTab === 'sales_ledger' && (
          <CraftingSalesLedgerView />
        )}

        {/* Pestaña: Auditor y Detector de Fugas Silenciosas de Plata */}
        {activeTab === 'silver_audit' && (
          <SilverLeakDetectorView
            currentCityId={selectedCityId}
            stationTax={settings.customNutritionTax || 450}
            hasPremium={settings.defaultTaxRate <= 4}
            onNavigateToTab={(tab) => setActiveTab(tab as AppTab)}
          />
        )}

        {/* Pestaña: Simulador de Pedidos del Mercado Negro de Caerleon */}
        {activeTab === 'black_market_simulator' && (
          <BlackMarketSimulatorView
            onOpenAdpModal={(itemId, targetType) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType(targetType || 'product');
              setIsAdpModalOpen(true);
            }}
          />
        )}

        {/* Pestaña: Calculadora de Rutas de Transporte, Capacidad de Carga y Arbitraje */}
        {activeTab === 'transport' && (
          <TransportCalculator
            currentCityId={selectedCityId}
            priceMemory={priceMemory}
            hasPremium={settings.defaultTaxRate <= 4}
            onAddTodoTask={(newTask) => {
              const updated = [...checklist, newTask];
              setChecklist(updated);
              saveChecklist(updated);
            }}
            onOpenAdpModal={(itemId) => {
              setAdpModalItemId(itemId);
              setAdpModalTargetType('product');
              setIsAdpModalOpen(true);
            }}
          />
        )}

        {/* Pestaña: Planificador de Logística de Almacén y Control de Carga */}
        {activeTab === 'warehouse_logistics' && (
          <WarehouseLogisticsView />
        )}

        {/* Pestaña: Planificador de Envíos Masivos por Zona Roja & Riesgo de Gankers a Caerleon */}
        {activeTab === 'red_zone_transport' && (
          <RedZoneTransportView
            currentCityId={selectedCityId}
            onNavigateToBlackMarket={() => setActiveTab('black_market_simulator')}
            onNavigateToWarehouse={() => setActiveTab('warehouse_logistics')}
          />
        )}

        {/* Pestaña: Dashboard de Métricas y Analíticas Gráficas */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            logs={logs}
            priceMemory={priceMemory}
            recipePrices={recipePrices}
            currentCityId={selectedCityId}
            onNavigateToLogger={() => setActiveTab('logger')}
            onNavigateToSimulator={(itemId) => {
              setTargetSimulatorItemId(itemId);
              handleNavigateToLoggerWithPreset({ cityId: selectedCityId, itemId });
              setActiveTab('simulator');
            }}
            onNavigateToCrafting={(recipeId) => {
              setTargetCraftRecipeId(recipeId);
              setActiveTab('value_added');
            }}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {/* Pestaña: Simulador */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <QuickSimulator
              selectedCityId={selectedCityId}
              onSelectCity={(city) => setSelectedCityId(city)}
              defaultPlots={settings.defaultPlotsCount}
              defaultTaxRate={settings.defaultTaxRate}
              priceMemory={priceMemory}
              initialItemId={targetSimulatorItemId}
              onUpdatePrices={handleUpdatePrices}
              onNavigateToLoggerWithPreset={handleNavigateToLoggerWithPreset}
            />
          </div>
        )}

        {/* Pestaña: Guía de Bonificaciones */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <CityBonusesGuide
              selectedCityId={selectedCityId}
              onSelectCity={(city) => setSelectedCityId(city)}
            />
          </div>
        )}

        {/* Pestaña: Calculadora de Valor Agregado (Cocina & Alquimia) */}
        {activeTab === 'value_added' && (
          <div className="space-y-6">
            <ValueAddedCalculator
              priceMemory={priceMemory}
              onUpdatePrices={handleUpdatePrices}
              initialRecipeId={targetCraftRecipeId}
              dailyBonusCookingRRR={dailyEvents.cookingBonusPercent}
              dailyBonusAlchemyRRR={dailyEvents.alchemyBonusPercent}
              onNavigateToTransport={() => setActiveTab('transport')}
            />
          </div>
        )}

        {/* Pestaña: Taller de Pesca, Fileteado y Salsas de Comida */}
        {activeTab === 'fishing_sauces' && (
          <FishChoppingSaucesView
            onNavigateToValueAdded={() => setActiveTab('value_added')}
            onNavigateToTransport={() => setActiveTab('transport')}
            onOpenAdpModal={handleOpenAdpModal}
          />
        )}
      </main>

      {/* Modal Gestor Multi-Personaje & Multi-Isla (Alts) */}
      <CharacterManagerModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onSelectCity={(cityId) => setSelectedCityId(cityId)}
      />

      {/* Modal Respaldo Completo de Datos (Exportar / Importar JSON) */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentCityId={selectedCityId}
        totalLogsCount={logs.length}
        totalPricesCount={Object.keys(priceMemory).length}
        totalCharactersCount={characterProfiles.characters.length}
      />

      {/* Modal de Sincronización en la Nube Multidispositivo & Vercel */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        onClose={() => setIsCloudSyncModalOpen(false)}
      />

      {/* Modal de Consulta Referencial de Precios (Albion Data Project) */}
      <AlbionDataPriceModal
        isOpen={isAdpModalOpen}
        onClose={() => setIsAdpModalOpen(false)}
        initialItemId={adpModalItemId}
        initialTargetType={adpModalTargetType}
        onApplyPriceToManual={handleApplyAdpPrice}
      />

      {/* Modal de Hoja de Ruta Diaria Imprimible / Exportable */}
      <DailyRoadmapPrintModal
        isOpen={isDailyRoadmapOpen}
        onClose={() => setIsDailyRoadmapOpen(false)}
        logs={logs}
        checklist={checklist}
        activeCharacterName={characterProfiles.activeCharacter?.name}
        activeCharacterFocus={characterProfiles.activeFocusRegen.currentFocus}
        currentCityName={CITIES.find((c) => c.id === selectedCityId)?.name}
      />

      {/* Modal de Paleta de Comandos Global (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}
