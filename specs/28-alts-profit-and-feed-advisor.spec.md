# SPEC-028: Desglose por Personaje, Optimizador de Alimentación y Monitor de Órdenes

- **Estado**: Aprobado e Implementado
- **Autor / Arquitecto**: Arquitecto de Dominio & Clean Architecture (Gentleman Programming)
- **Taxonomía SDD**: Spec-Anchored
- **Fecha**: 2026-10-12
- **Versión**: 1.0.0

---

## 1. Contexto y Justificación
1. **Desglose de Ganancias por Personaje (Alts Breakdown)**:
   Los jugadores de Albion gestionan imperios agrícolas distribuidos en múltiples personajes (alts) para multiplicar sus 10,000 puntos de foco diarios y solares de islas. Hasta ahora, el historial consolidaba las ganancias de forma global. Discriminar por personaje permite saber exactamente qué alt es más rentable o qué isla necesita optimización.
2. **Optimizador de Alimentación al Menor Coste (*Least-Cost Feed Advisor*)**:
   Los animales de granja y pastizales (caballos, bueyes) consumen 10 unidades de cualquier verdura/grano al día, sin importar el tier. Los carnívoros consumen 10 unidades de carne cruda. Alimentar con zanahorias si el trigo o la patata están más baratos supone una fuga innecesaria de plata. Un recomendador calcula al instante el alimento más económico según los precios manuales de mercado.
3. **Monitor de Caducidad de Órdenes de Mercado (30 Días)**:
   En Albion, las órdenes de compra y venta puestas en los mercados caducan a los 30 días, perdiéndose la tasa de mercado pagada. Un monitor alerta con antelación de las órdenes próximas a vencer.

---

## 2. Actores y Casos de Uso
- **Actor Principal**: Magnate Agrícola, Criador de Monturas y Comerciante de Albion Online.
- **Historias de Usuario**:
  - **HU-01**: Como jugador con múltiples alts, quiero filtrar el historial por personaje para auditar la plata aportada por cada uno.
  - **HU-02**: Como criador de animales y monturas, quiero saber cuál es el vegetal o carne más barato del día para alimentar a mis animales al menor coste posible.
  - **HU-03**: Como comerciante, quiero rastrear mis órdenes de mercado activas y recibir alertas preventivas antes de que alcancen el límite de 30 días.

---

## 3. Requisitos Funcionales (Sintaxis EARS)
- **RF-01**: Al registrar una cosecha en `DailyLogger`, el sistema **DEBE** asociar el `characterId` y `characterName` del personaje activo actual.
- **RF-02**: En `DailyHistory`, el sistema **DEBE** proporcionar un selector de filtro por personaje y un panel de métricas con el total de plata neta generada por cada alt.
- **RF-03**: En el Optimizador de Alimentación, el sistema **DEBE** contrastar los precios de todos los vegetales (T3 a T7) y carnes (T3 a T8), identificar la opción con menor coste por ciclo de 10 unidades y calcular el ahorro porcentual frente al alimento más costoso.
- **RF-04**: En el Monitor de Órdenes, el sistema **DEBE** calcular los días restantes respecto a la caducidad oficial de 30 días (`(FechaCreación + 30d) - FechaActual`), destacando en rojo las órdenes con menos de 5 días.

---

## 4. Requisitos No Funcionales y Guardarraíles de Arquitectura
- **RNF-01 (Clean Architecture)**: La lógica matemática de ranking de alimentos y de cálculo de órdenes debe residir en funciones puras en `src/domain/use-cases/` y modelos en `src/domain/models/`.
- **RNF-02 (Defensa de Tipos)**: Prohibido `any`. Sanitización de todas las entradas numéricas y fechas con `Number.isFinite`.
- **RNF-03 (Seguridad Cloudflare)**: Sanitización estricta contra Prototype Pollution en almacenamiento local.
- **RNF-04 (Local-First)**: Funcionalidad autónoma y persistente en `localStorage`.

---

## 5. Casos Borde y Manejo de Errores
- **CB-01**: Cosechas históricas previas sin `characterId`: Asignar etiqueta defensiva "Sin Personaje Asignado" sin romper el filtro.
- **CB-02**: Precios de alimentos no registrados o en 0: Excluir de la recomendación de menor coste para no sugerir opciones ficticias.
- **CB-03**: Órdenes creadas hace más de 30 días: Mostrar estado "Caducada / Reclamar en Subasta".

---

## 6. Criterios de Aceptación (Binarios)
- [x] **CA-01**: Los modelos de dominio en `src/domain/models/feedAdvisor.ts` y `marketOrders.ts` definen las estructuras puras.
- [x] **CA-02**: El caso de uso puro `calculateLeastCostFeed` determina determinísticamente la opción más barata y el ahorro.
- [x] **CA-03**: El caso de uso puro `calculateMarketOrderExpirations` calcula con precisión los días restantes para el vencimiento de 30 días.
- [x] **CA-04**: `DailyHistory.tsx` permite filtrar cosechas por personaje con balance discriminado.
- [x] **CA-05**: Las pruebas unitarias de dominio y E2E pasan al 100%.
