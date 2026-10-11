# Manual Maestro de Arquitectura, Dominio y Protocolo de Auditoría
## Albion Farm & Economy Tracker (Albion Online)

> **AVISO CRÍTICO Y OBLIGATORIO PARA CUALQUIER AGENTE DE IA O DESARROLLADOR:**  
> Antes de realizar cualquier cambio, refactorización, creación de archivos o diagnóstico en este repositorio, **DEBES LEER ESTE DOCUMENTO EN SU TOTALIDAD JUNTO CON `/ALBION_KNOWLEDGE.md` Y `/AGENTS.md`**.  
> El incumplimiento de los principios arquitectónicos (Clean Architecture), la violación de las mecánicas oficiales de Albion Online, o la omisión del blindaje contra vulnerabilidades (Cloudflare Security Audit) resultará en código defectuoso, alucinaciones o degradación del sistema.

---

## 1. Filosofía Central y Reglas Inviolables del Sistema

1. **Precios Manuales como Núcleo Soberano**:  
   El motor económico funciona **100% sobre los precios introducidos manualmente por el jugador**. No depende de APIs externas. La integración con Albion Data Project (ADP) es exclusivamente una herramienta de consulta referencial opcional y secundaria; jamás sobreescribe ni altera los precios locales sin una confirmación explícita del usuario (`Usar en Manual`).
2. **Soberanía Local-First y Operatividad Offline**:  
   Toda la experiencia de usuario (cálculos, balance, inventario de islas, registro de precios, alts y tareas) opera de manera autónoma en el navegador mediante `localStorage` sin requerir conexión a internet ni backend.
3. **Fidelidad Estricta a las Mecánicas de Albion Online**:  
   Queda terminantemente prohibido inventar mecánicas. (Ejemplo: En Albion Online los trabajadores de casas NO tienen diarios para agricultura, herboristería, animales ni cocina; solo existen para recolección de mundo abierto y forja de equipo). Consultar obligatoriamente `/ALBION_KNOWLEDGE.md`.
4. **Clean Architecture / Estándar Gentleman Programming (Alan Buscaglia)**:  
   - **Regla del Ámbito (Scope Rule)**: Los componentes React (`/src/components/`) nunca contienen fórmulas matemáticas ni lógica de negocio acoplada al renderizado.
   - **Capa de Dominio Puro (`/src/domain/`)**: Toda la lógica matemática, modelos y casos de uso financieros viven en `/src/domain/models/` y `/src/domain/use-cases/`. Son funciones y entidades 100% puras, testeables y agnósticas de React, JSX y del DOM.
   - **Patrón Hook / Contenedor (`/src/hooks/`)**: El estado, reactividad y sincronización entre pestañas (`storage`) se encapsulan en Custom Hooks.
5. **Tipado Fuerte y Código Defensivo**:  
   Prohibido usar `any`. Todas las entradas numéricas deben sanitizarse con validaciones estrictas (`Number.isFinite`, `Math.max`, `Math.min`). Cero directivas `@ts-ignore` o `@ts-nocheck` en producción.
6. **Estándar de Seguridad Cloudflare Security Audit (`skills/security-audit/`)**:  
   Todo dato entrante debe sanitizarse contra *Prototype Pollution* (`__proto__`, `constructor`, `prototype`), inyecciones de fórmulas CSV y fugas de memoria en temporizadores (`useRef` + `useEffect` cleanup).
7. **Estándar Metodológico MoureDev: "El Nuevo Programador" & Spec-Driven Development (SDD)**:  
   - **Criterio de Ingeniería en 6 Capas**: El agente opera bajo la disciplina de MoureDev: 00 Fundamentos de Programación (Clean Architecture de Alan Buscaglia), 01 Fundamentos de IA (Prompting estructurado y contexto limpio), 02 Harness Engineering (Guardarraíles duros, Regla 0 de lectura de docs), 03 Harness Avanzado (Skills modulares y scripts CLI), 04 Spec-Driven Development (Especificaciones en `/specs/` con sintaxis EARS `RF-x`, casos borde y criterios de aceptación binarios `CA-x`), 05 Multiagente/Subagentes (Roles especializados de arquitectura, implementación y auditoría adversarial).
   - **Cero "Vibe Coding"**: Prohibido programar por ocurrencias; toda funcionalidad o cambio se desarrolla anclado a especificaciones técnicas y criterios de aceptación claros.

---

## 2. Pila Tecnológica y Entorno de Ejecución

- **Framework**: React 19 + TypeScript 5.8 (Strict Mode).
- **Herramienta de Compilación**: Vite 6 con partición de paquetes (`manualChunks`: `vendor-react`, `vendor-icons`, `vendor-charts`).
- **Estilos**: Tailwind CSS 4.0 (`@import "tailwindcss";` en `index.css`). Tipografía tabular en números (`tabular-nums`).
- **Iconografía**: `lucide-react`.
- **Suite de Pruebas y Auditoría**: Node.js Test Runner nativo (`node --test`), ejecutable con `npm run audit:test`.
- **Scripts del Proyecto**:
  - `npm run dev`: Inicia el servidor de desarrollo en puerto 3000.
  - `npm run build`: Compila la aplicación a producción (`tsc -b && vite build`).
  - `npm run lint`: Valida tipos y sintaxis.
  - `npm run audit:test`: Ejecuta los validadores de seguridad de Cloudflare.

---

## 3. Mapeo Granular de los 25 Módulos Canónicos del Sistema

| # | Módulo / Pestaña | ID Tab | Capa Dominio (Model / Use Case) | Hook | Componente UI | Propósito Central |
|---|---|---|---|---|---|---|
| **1** | Registrar Cosecha de Hoy | `logger` | `economy.ts`, `calculateHarvestEconomy.ts` | `usePriceMemory.ts` | `DailyLogger.tsx` | Registro manual de cosechas diarias, semillas perdidas, carne faenada y balance neto. |
| **2** | Historial & Balance | `history` | `economy.ts`, `calculateHistoryAnalytics.ts` | `usePriceMemory.ts` | `DailyHistory.tsx` | Historial auditable de jornadas pasadas con filtros, edición y métricas de plata acumulada. |
| **3** | Calendario & Alarmas 22h | `calendar` | `dailyEvents.ts` | Interno con notificaciones | `HarvestCalendar.tsx` | Temporizador del ciclo oficial de 22 horas con cálculo de maduración y alertas de navegador. |
| **4** | Cosas por Hacer | `todo` | `generateDailyTodoRoutine.ts` | `useDailyEvents.ts` | `DailyTodoList.tsx` | Lista de tareas diarias con sincronización de islas, alts y plantillas rápidas de Albion. |
| **5** | Maestría (Destino) | `mastery` | `destiny.ts`, `calculateDestinyEfficiency.ts` | `useDestinyMastery.ts` | `FocusMasteryCalculator.tsx` | FCE (Eficiencia de Coste de Foco) por nivel de rama (0-100) y reducción exponencial del gasto. |
| **6** | Optimizador de Foco | `focus_optimizer` | `focus.ts`, `calculateFocusRanking.ts` | `useFocusOptimizer.ts` | `FocusOptimizerDashboard.tsx` | Ranking de rentabilidad neta por punto de foco (`Plata / Foco`) según precios manuales guardados. |
| **7** | Portafolio Foco (Imperio) | `focus_portfolio` | `focusPortfolio.ts`, `calculateFocusPortfolio.ts` | `useFocusPortfolio.ts` | `FocusPortfolioView.tsx` | Consolidación multi-alt de regeneración (10k/día), prevención del tope de 30k y roles óptimos. |
| **8** | Monturas & Pastizales | `mounts` | `mounts.ts`, `calculateMountEconomy.ts` | `useMountEconomy.ts` | `MountsBreedingView.tsx` | Crianza de caballos, bueyes y garrasprestas, cálculo de alimento (10 u/día) y ensillado. |
| **9** | Casas & Trabajadores | `labourers` | `labourers.ts`, `calculateLabourerEconomy.ts` | `useLabourersEconomy.ts` | `LabourersCalculatorView.tsx` | Felicidad, camas, mesas, trofeos y retorno del 100% al 150% en diarios de recolección y crafteo. |
| **10** | Crafteo & Diarios | `crafting_equipment` | `equipmentCrafting.ts`, `calculateEquipmentCraftingEconomy.ts` | `useEquipmentCrafting.ts` | `EquipmentCraftingView.tsx` | Forja de armas, armaduras, herramientas, bonos de ciudad (15.2% a 47.9% RRR) y llenado de libros. |
| **11** | Refinado de Recursos | `refining` | `refining.ts`, `calculateRefiningEconomy.ts` | `useRefiningCalculator.ts` | `RefiningCalculatorView.tsx` | Refinado de T2 a T8 (.0 a .4) para los 5 recursos con bonos de Ciudad Real y RRR hasta 53.9%. |
| **12** | Taller de Transmutación | `transmutation` | `transmutation.ts`, `calculateResourceTransmutation.ts` | `useTransmutationCalculator.ts` | `TransmutationFoundryView.tsx` | Arbitraje de subida de tier, encantamiento y esquirlas (5:1) con costes oficiales de plata del juego. |
| **13** | Encantamiento de Equipo | `enchanting` | `enchanting.ts`, `calculateEnchantingEconomy.ts` | `useEnchantingCalculator.ts` | `EnchantingCalculatorView.tsx` | Fusión de runas, almas, reliquias y fragmentos avalonianos vs compra directa en subasta. |
| **14** | Libro Mayor de Ventas | `sales_ledger` | `craftingSalesLedger.ts` | `useCraftingSalesLedger.ts` | `CraftingSalesLedgerView.tsx` | Registro contable de lotes entregados en Ciudades Reales y en el Mercado Negro de Caerleon. |
| **15** | Fugas de Plata (Auditor) | `silver_audit` | `silverAudit.ts`, `runSilverAudit.ts` | `useSilverAudit.ts` | `SilverLeakDetectorView.tsx` | Puntuación de salud financiera (0-100), detección de tasas abusivas y resiembras en pérdida. |
| **16** | Simulador M. Negro | `black_market_simulator` | `blackMarket.ts`, `calculateBlackMarketThreshold.ts` | `useBlackMarketSimulator.ts` | `BlackMarketSimulatorView.tsx` | Umbral de equilibrio (*Break-Even*), órdenes de compra directa (0% setup) vs venta con ROI objetivo. |
| **17** | Rutas & Carga | `transport` | `transport.ts`, `calculateTransportArbitrage.ts` | Interno en vista | `TransportCalculator.tsx` | Arbitraje interurbano y hacia Caerleon por zona roja, pesos unitarios en kg y `Plata / kg`. |
| **18** | Almacén & Logística | `warehouse_logistics` | `warehouseLogistics.ts`, `calculateWarehouseLogistics.ts` | `useWarehouseLogistics.ts` | `WarehouseLogisticsView.tsx` | Cubicaje de peso de inventario, viajes requeridos según montura + Pastel de Cerdo (+30%) y cofres. |
| **19** | Analytics & Oportunidades | `analytics` | `calculateHistoryAnalytics.ts` | `usePriceMemory.ts` | `AnalyticsDashboard.tsx` | Gráficos históricos de plata, desglose por categoría, ROI acumulado y detección de líderes. |
| **20** | Simulador Preventivo | `simulator` | `economy.ts`, `calculateHarvestEconomy.ts` | `usePriceMemory.ts` | `QuickSimulator.tsx` | Simulación hipotética rápida de parcelas y costes antes de gastar plata en semillas. |
| **21** | Cocina & Alquimia | `value_added` | `crafting.ts`, `calculateCraftingEconomy.ts` | `usePriceMemory.ts` | `ValueAddedCalculator.tsx` | Elaboración de comidas y pociones con bonos de Caerleon/Brecilien (+15% RRR), salsas de pescado y destilados de cultivos (aguardiente de patata, maíz y calabaza). |
| **22** | Carnicería & Matadero | `butcher` | `butcher.ts`, `calculateButcherEconomy.ts` | `useButcherEconomy.ts` | `ButcherCalculatorView.tsx` | Sacrificio de animales adultos T3-T8 en carnicería (20 u. base + RRR) vs venta vivo o leche/huevos. |
| **23** | Isla de Gremio & Guild Hall | `guild_island` | `guildIsland.ts`, `calculateGuildIslandEconomy.ts` | `useGuildIslandEconomy.ts` | `GuildIslandLabourersView.tsx` | Expansión de Isla de Gremio N1-N6 (hasta 31.75M 🪙 post-Wild Blood + 1M gremio), Casa Gremial T2-T8 (15 trabajadores), mobiliario y cálculo de amortización. |
| **24** | Transporte a Caerleon & Riesgo de Gankers | `red_zone_transport` | `redZoneTransport.ts`, `calculateRedZoneTransport.ts` | `useRedZoneTransport.ts` | `RedZoneTransportView.tsx` | Planificador de envíos masivos por Zona Roja a Caerleon y Mercado Negro, ratio Valor/Peso (Plata/kg), probabilidad estadística de gank, monturas de escape y coste de set con fuga. |
| **25** | Taller de Pesca, Fileteado & Salsas | `fishing_sauces` | `fishingSauces.ts`, `calculateFishingSaucesEconomy.ts` | `useFishingSaucesEconomy.ts` | `FishChoppingSaucesView.tsx` | Arbitraje de pesca cruda vs picado vs salsas (.1, .2, .3), aprovechamiento de remanentes, umbral de algas y botón oficial de dar resultado. |
| **26** | Sincronización Nube & Vercel | `cloud_sync` | `cloudSync.ts`, `cloudSyncEngine.ts` | `useCloudSync.ts` | `CloudSyncModal.tsx` | Sincronización asíncrona multidispositivo (PC/móvil) con resolución de conflictos, tolerancia offline y hosting Vercel. |
| **27** | Bonos de Ciudad & Biomas (+10%) | `guide` | `items.ts`, `ALBION_KNOWLEDGE.md` | `usePriceMemory.ts` | `CityBonusesGuide.tsx` | Guía de biomas oficiales, bonos de cosecha (+10%), alimentos favoritos y especializaciones de refinado/crafteo de las 7 Ciudades Reales. |

---

## 4. Directorio de Claves de Almacenamiento Local (`localStorage`)

Toda interacción con `localStorage` debe incorporar validadores defensivos (ignorar claves `__proto__`, `constructor`, `prototype`, y validar tipos antes de mutar el estado):

| Clave | Descripción | Estructura / Sanitizador |
|---|---|---|
| `albion_farm_logs` | Historial completo de cosechas | Array de `DailyLogEntry` (`loadLogs()`, `saveLogs()`) |
| `albion_farm_price_memory` | Memoria de precios manuales por ítem | Objeto `PriceMemory` con TTL de 6 horas |
| `albion_character_profiles_v1` | Perfiles de personajes y alts | Array de `CharacterProfile` (`loadCharacters()`) |
| `albion_destiny_profile` | Niveles de maestría del árbol del destino | Objeto `DestinyMasteryProfile` |
| `albion_daily_checklist` | Lista de tareas diarias activas | Array de `DailyChecklistItem` |
| `albion_farm_settings` | Ajustes globales (ciudad defecto, tasa mercado) | Objeto `AppSettings` |
| `albion_recipe_prices` | Precios de platos de cocina y pociones | Record `<string, number>` |
| `albion_crafting_sales_ledger_v1`| Registro de operaciones de crafteo y venta | Array de `CraftingSaleRecord` |
| `albion_transmutation_config_v1` | Configuración activa del taller de transmutación | Objeto `StoredTransmutationConfig` |
| `albion_transmutation_prices_v1` | Precios manuales de materiales a transmutar | Record `<string, number>` |
| `albion_warehouse_stored_items_v1`| Ítems almacenados en el cubicaje de almacén | Array de `WarehouseStoredItem` |
| `albion_warehouse_mount_id_v1` | ID de la montura de carga seleccionada | String validado contra `TRANSPORT_MOUNTS` |
| `albion_black_market_simulator_config_v1` | Configuración del simulador de Mercado Negro | Objeto `SavedBlackMarketConfig` |
| `albion_butcher_config_v1` | Configuración activa de la carnicería/matadero | Objeto `StoredButcherConfig` |
| `albion_butcher_prices_v1` | Precios manuales de animales vivos y carne | Record `<string, number>` |
| `albion_guild_island_config_v1` | Configuración activa de la isla de gremio y Guild Hall | Objeto `StoredGuildIslandConfig` |
| `albion_red_zone_transport_config_v1` | Configuración activa del planificador de envíos a Caerleon | Objeto `RedZoneTransportInput` |
| `albion_fishing_sauces_config_v1` | Configuración activa del taller de salsas y fileteado | Objeto `FishingSaucesInput` |
| `albion_cloud_sync_config_v1` | Configuración activa de sincronización en la nube | Objeto `CloudSyncConfig` |
| `albion_cloud_sync_state_v1` | Estado de sincronización en la nube (último sync, hash) | Objeto `CloudSyncState` |

---

## 5. Directivas de Seguridad y Blindaje Cloudflare (`skills/security-audit/`)

1. **Aislamiento de Prototipos (*Prototype Pollution*)**:  
   Al procesar entradas JSON provenientes de `localStorage`, archivos de respaldo `.json` o respuestas de red, se debe iterar exclusivamente sobre propiedades propias (`Object.entries`) descartando cualquier clave que contenga `__proto__`, `constructor` o `prototype`.
2. **Mitigación de Inyección de Fórmulas CSV (*CSV Injection*)**:  
   En `exportHistoryToCsv.ts`, cualquier celda que comience con los caracteres `=`, `+`, `-`, `@`, `\t` o `\r` debe ser precedida por una comilla simple (`'`) antes de ser entrecomillada.
3. **Prevención de Fugas de Memoria en Temporizadores React**:  
   Cualquier llamada a `setTimeout` o `setInterval` en componentes React debe almacenar su identificador en un `useRef` y cancelarlo en el callback de limpieza de `useEffect` al desmontar el componente.
4. **Validación Numérica Defensiva**:  
   Prohibido permitir `NaN`, `Infinity` o valores negativos no intencionados. Emplear `Number.isFinite(val) ? Math.max(0, val) : fallback`.
5. **Verificación Automatizada**:  
   Antes de dar por concluida cualquier modificación, se debe ejecutar:
   ```bash
   npm run audit:test
   ```
   Todas las pruebas unitarias y de esquema deben concluir con estado `ok` (100% aprobado).

---

## 6. Procedimiento para Futuras Modificaciones (Handover Protocol)

Cualquier agente de IA o ingeniero que continúe el desarrollo debe seguir esta secuencia estricta:
1. **Paso 1**: Leer `/PROJECT_DOCUMENTATION.md` y `/ALBION_KNOWLEDGE.md`.
2. **Paso 2**: Diseñar los modelos de datos en `/src/domain/models/` antes de escribir componentes UI.
3. **Paso 3**: Implementar la lógica matemática en funciones puras dentro de `/src/domain/use-cases/`.
4. **Paso 4**: Desacoplar el estado y persistencia mediante Custom Hooks en `/src/hooks/`.
5. **Paso 5**: Conectar la interfaz de usuario en `/src/components/` respetando los estilos de Albion (paleta oscura, badges oficiales de tier y números tabulares `tabular-nums`).
6. **Paso 6**: Ejecutar `compile_applet` y `npm run audit:test` para garantizar 0 errores de compilación y 0 fallos de seguridad.
