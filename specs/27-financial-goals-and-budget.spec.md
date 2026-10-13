# SPEC-027: Metas Financieras, Hitos de Albion y Presupuesto de Siembra Masiva

- **Estado**: Aprobado e Implementado
- **Autor / Arquitecto**: Arquitecto de Dominio & Clean Architecture (Gentleman Programming)
- **Taxonomía SDD**: Spec-Anchored
- **Fecha**: 2026-10-12
- **Versión**: 1.0.0

---

## 1. Contexto y Justificación
En Albion Online, la economía y la agricultura no son un fin en sí mismas, sino el medio para financiar grandes objetivos dentro del juego:
1. Pagar la suscripción Premium mensual (25,000,000 🪙) con plata generada en el juego.
2. Adquirir monturas de transporte de máximo volumen como el Mamut de Transporte (~190,000,000 🪙).
3. Financiar la expansión de Islas de Gremio (31.75M 🪙 Nivel 6) y Casas Gremiales (Guild Hall T8).
4. Equipar sets de combate de alto nivel (8.3 / 8.4 Maestro).

Adicionalmente, los jugadores que gestionan múltiples islas o alts enfrentan el problema de **Capital de Trabajo y Presupuesto de Siembra**: necesitan saber exactamente cuánta plata líquida deben retirar del banco para resembrar decenas de parcelas (ej. 225 o 450 casillas) antes de viajar al mercado de semillas, evitando quedarse sin liquidez o comprar semillas de más.

---

## 2. Actores y Casos de Usuario
- **Actor Principal**: Magnate Agrícola, Gestor de Alts o Jugador Progresivo de Albion Online.
- **Historias de Usuario**:
  - **HU-01**: Como jugador, quiero definir una o varias metas financieras (ej. Suscripción Premium o Mamut de Transporte) y ver mi barra de progreso acumulada basada en las ganancias registradas.
  - **HU-02**: Como jugador, quiero ver cuántos días exactos me faltan (*ETA*) para cumplir cada meta según mi velocidad histórica diaria de plata (`Plata neta / día`).
  - **HU-03**: Como gestor de múltiples islas, quiero calcular de antemano el presupuesto exacto de siembra en plata necesario para comprar semillas para todas mis parcelas activas.

---

## 3. Requisitos Funcionales (Sintaxis EARS)
- **RF-01**: Al iniciar la vista, el sistema **DEBE** cargar las metas guardadas en `localStorage` o inicializar las metas canónicas oficiales de Albion (Premium 30d, Mamut, Isla Gremial N6, Guild Hall T8).
- **RF-02**: Cuando el sistema evalúe el progreso de una meta, **DEBE** calcular el porcentaje completado (`(PlataAcumulada / CosteMeta) * 100`) acotado estrictamente entre 0% y 100%.
- **RF-03**: A partir del historial de cosechas y ventas de los últimos 30 días, el sistema **DEBE** calcular la velocidad diaria promedio de ganancia neta y los días restantes estimados (`(CosteMeta - PlataAcumulada) / GananciaDiariaPromedio`).
- **RF-04**: En la calculadora de Presupuesto de Siembra Masiva, el sistema **DEBE** multiplicar casillas totales (`Parcelas * 9`) por el precio manual de semilla, restar las semillas que el jugador ya tiene en almacén, y devolver el desembolso líquido total requerido y la ganancia esperada.
- **RF-05**: El componente de interfaz **DEBE** implementar la barra oficial de control con el botón *"Dar Resultado / Evaluar Metas y Presupuesto"*, detección de cambios pendientes (*isStale*) y botón *"Limpiar"*.

---

## 4. Requisitos No Funcionales y Guardarraíles de Arquitectura
- **RNF-01 (Clean Architecture)**: Toda la lógica de cálculo de progreso, velocidad diaria y presupuesto de siembra debe residir en funciones puras en `src/domain/use-cases/calculateGoalProgress.ts` y `src/domain/use-cases/calculateSeedBudget.ts`.
- **RNF-02 (Defensa Numérica)**: Todas las entradas numéricas deben validarse con `Number.isFinite` y sanitizarse contra valores negativos o no válidos para evitar `NaN` o divisiones por cero.
- **RNF-03 (Seguridad Cloudflare)**: Sanitización estricta de entradas y persistencia local sin mutaciones inseguras de prototipos (`__proto__`, `constructor`, `prototype`).
- **RNF-04 (Local-First)**: Funcionalidad 100% operativa sin requerir conexión a internet ni dependencias de servidores externos.

---

## 5. Casos Borde y Manejo de Errores
- **CB-01**: Ganancia diaria promedio igual a cero o negativa (sin registros recientes): El sistema debe reportar días restantes como `null` con mensaje instructivo en lugar de `Infinity` o valores erróneos.
- **CB-02**: Plata acumulada mayor o igual al coste de la meta: El sistema debe indicar estado de *¡Meta Cumplida! 🎉* con 100% de progreso y 0 días restantes.
- **CB-03**: Parcelas o casillas en 0 en el presupuesto de siembra: El cálculo debe arrojar 0 plata requerida sin fallos en tiempo de ejecución.

---

## 6. Criterios de Aceptación (Binarios)
- [x] **CA-01**: Los modelos de dominio en `src/domain/models/goals.ts` tipan exhaustivamente las metas, presets y presupuestos.
- [x] **CA-02**: Los casos de uso puros `calculateGoalProgress` y `calculateSeedBudget` calculan con exactitud matemática el progreso, ETA y costes de siembra.
- [x] **CA-03**: La vista `FinancialGoalsView.tsx` incluye el botón oficial *"Dar Resultado / Evaluar Metas y Presupuesto"* con estado de espera y botón *"Limpiar"*.
- [x] **CA-04**: Las metas se persisten en `localStorage` bajo `albion_financial_goals_v1` y se integran en el sistema de respaldo completo (JSON v2).
- [x] **CA-05**: El validador de especificaciones `npm run sdd:validate` y la suite de pruebas pasan al 100%.
