# Plan Maestro de Desarrollo & Arquitectura del Sistema
## Albion Farm & Economy Tracker (Albion Online)

---

## 1. Visión y Objetivos del Sistema
Construir y perfeccionar la suite integral de inteligencia económica más avanzada, fiable y rápida para **Albion Online**, operando bajo el paradigma **Local-First** y el estándar arquitectónico de **Clean Architecture (Gentleman Programming)**.

---

## 2. Pilares Inviolables del Proyecto
1. **Precios Manuales Soberanos**: El sistema opera 100% sobre precios manuales del jugador. La consulta a Albion Data Project (ADP) es puramente opcional y referencial.
2. **Fidelidad Estricta a Albion Online**: Respeto al ciclo de 22 horas, bono de biomas (+10%), alimentos favoritos (Wild Blood), tasas de mercado (4% con Premium / 8% sin Premium + 2.5% orden) y límites de foco (10.000/día, tope 30.000).
3. **Clean Architecture (Gentleman Programming - Alan Buscaglia)**:
   - Dominio Puro (`/src/domain/models/` y `/src/domain/use-cases/`): Funciones puras, 100% testeables, desacopladas de React y JSX.
   - Patrón Hook / Contenedor (`/src/hooks/`): Estado y persistencia.
   - Componentes UI (`/src/components/`): Presentación, ergonomía visual oscura y tipografía tabular (`tabular-nums`).
4. **Cloudflare Security Audit**: Blindaje contra Prototype Pollution, inyección de fórmulas CSV, sanitización numérica estricta y limpieza de temporizadores.
5. **Spec-Driven Development (SDD - MoureDev)**: Cada fase anclada a especificaciones formales con sintaxis EARS (`RF-x`) y criterios de aceptación binarios (`CA-x`).

---

## 3. Hoja de Ruta de Módulos (29 Módulos Canónicos)

### Núcleo de Granja e Islas
- **Módulo 1**: Registro Diario de Cosecha (`DailyLogger.tsx`)
- **Módulo 2**: Historial & Balance Contable (`DailyHistory.tsx`) con filtro por Alt (SPEC-028)
- **Módulo 3**: Calendario & Alarmas 22h (`HarvestCalendar.tsx`)
- **Módulo 4**: Lista de Cosas por Hacer & Sincronización de Islas (`DailyTodoList.tsx`)
- **Módulo 20**: Simulador Rápido Preventivo (`QuickSimulator.tsx`)
- **Módulo 27**: Guía Oficial de Biomas & Bonos de Ciudad (+10%) (`CityBonusesGuide.tsx`)

### Dominio de Foco y Destino
- **Módulo 5**: Eficiencia de Foco (FCE) y Calculadora de Fama/Tomos (`FocusMasteryCalculator.tsx`, SPEC-029)
- **Módulo 6**: Optimizador de Foco Diario (`FocusOptimizerDashboard.tsx`)
- **Módulo 7**: Portafolio Consolidado de Foco Multi-Alt (`FocusPortfolioView.tsx`)

### Animales, Pastizales y Producción
- **Módulo 8**: Monturas & Pastizales con Asesor de Alimentación al Menor Coste (`MountsBreedingView.tsx`, SPEC-028)
- **Módulo 21**: Taller de Cocina & Alquimia (+15% RRR en Caerleon/Brecilien) (`ValueAddedCalculator.tsx`)
- **Módulo 22**: Carnicería & Matadero de Animales T3-T8 (`ButcherCalculatorView.tsx`)
- **Módulo 25**: Taller de Pesca, Fileteado y Salsas (.1, .2, .3) (`FishChoppingSaucesView.tsx`, SPEC-026)

### Industria, Crafteo y Refinado
- **Módulo 9**: Casas & Trabajadores con Planificador de Diarios (`LabourersCalculatorView.tsx`, SPEC-029)
- **Módulo 10**: Crafteo de Equipamiento & Diarios de Artesano (`EquipmentCraftingView.tsx`)
- **Módulo 11**: Refinado de Recursos con Bonos de Ciudad (`RefiningCalculatorView.tsx`)
- **Módulo 12**: Taller de Transmutación & Esquirlas (`TransmutationFoundryView.tsx`)
- **Módulo 13**: Taller de Encantamiento & Fusión de Equipo (`EnchantingCalculatorView.tsx`)
- **Módulo 23**: Isla de Gremio & Guild Hall (15 Trabajadores) (`GuildIslandLabourersView.tsx`)

### Comercio, Caerleon y Logística
- **Módulo 14**: Libro Mayor de Ventas con Monitor de Órdenes a 30 Días (`CraftingSalesLedgerView.tsx`, SPEC-028)
- **Módulo 15**: Detector & Auditor de Fugas de Plata (`SilverLeakDetectorView.tsx`)
- **Módulo 16**: Simulador de Órdenes del Mercado Negro (`BlackMarketSimulatorView.tsx`)
- **Módulo 17**: Calculadora de Rutas de Transporte & Arbitraje (`TransportCalculator.tsx`)
- **Módulo 18**: Cubicaje de Almacén & Logística de Monturas (`WarehouseLogisticsView.tsx`)
- **Módulo 24**: Transporte por Zona Roja & Riesgo de Gankers (`RedZoneTransportView.tsx`, SPEC-024)

### Nuevos Módulos y Metas de Alto Impacto
- **Módulo 26**: Sincronización en la Nube & Hosting Vercel (`CloudSyncModal.tsx`, SPEC-025)
- **Módulo 28**: Metas Financieras & Presupuesto de Siembra Masiva (`FinancialGoalsView.tsx`, SPEC-027)
- **Módulo 29**: Calculadora de Sets, Re-Gear & Presupuesto de Bajas PvP (`LoadoutsRegearView.tsx`, SPEC-029)

---

## 4. Estado de Validación y Calidad
- Arquitectura 100% verificada mediante suites de prueba de dominio (`node --test`), Playwright E2E (`e2e run`), validador de especificaciones SDD y suite de seguridad Cloudflare.
