# SPEC-026: Taller de Pesca, Fileteado y Salsas de Comida (.1, .2, .3)

- **Estado**: Aprobado e Implementado
- **Autor / Arquitecto**: Arquitecto de Dominio & Clean Architecture
- **Taxonomía SDD**: Spec-Anchored
- **Fecha**: 2026-10-12
- **Versión**: 1.0.0

---

## 1. Contexto y Justificación
En Albion Online, la pesca de agua dulce y salada genera pescados de diferentes tiers (T3 a T8). Los pescadores y cocineros tienen tres caminos para monetizar sus capturas:
1. Venta directa del pescado entero crudo en los mercados de ciudades reales.
2. Fileteado y picado en pescadería/estación de cocina para producir **Pescado Picado (Chopped Fish)**, un recurso esencial para la industria gastronómica.
3. Combinación de pescado picado con **Algas Marinas (Seaweed)** para elaborar **Salsas de Pescado**:
   - Salsa Básica (.1 Menor): 10 u. Pescado Picado + 1 u. Algas -> Encanta comida plano a .1.
   - Salsa Elegante (.2 Media): 30 u. Pescado Picado + 3 u. Algas -> Encanta comida .1 a .2.
   - Salsa Especial (.3 Mayor): 90 u. Pescado Picado + 9 u. Algas -> Encanta comida .2 a .3.

Sin un comparador financiero exacto, los jugadores a menudo venden pescados enteros a precio de remate o compran salsas caras en subasta cuando podrían fabricarlas a una fracción del coste. Este módulo provee arbitraje instantáneo entre las 3 opciones con alerta de umbral de beneficio.

---

## 2. Actores y Casos de Uso
- **Actor Principal**: Pescador, Cocinero o Trader de Albion Online.
- **Historias de Usuario**:
  - **HU-01**: Como pescador, quiero comparar si gano más plata vendiendo mi lote de pescado entero vs fileteándolo en pescado picado.
  - **HU-02**: Como cocinero, quiero saber si me conviene fabricar mis propias salsas (.1, .2, .3) con algas o comprarlas ya hechas en el mercado.
  - **HU-03**: Como comerciante, quiero ver el desglose de plata por unidad y la ganancia neta diaria de mi jornada de pesca.

---

## 3. Requisitos Funcionales (Sintaxis EARS)
- **RF-01**: Al ingresar la cantidad y tier de pescados crudos capturados, el sistema **DEBE** calcular automáticamente las unidades totales de pescado picado devueltas según las tasas oficiales de conversión de Albion.
- **RF-02**: Cuando el usuario introduzca los precios manuales de mercado (pescado crudo, pescado picado, algas y salsas), el sistema **DEBE** contrastar el valor de venta directa vs el valor del pescado picado resultante.
- **RF-03**: Al evaluar la elaboración de salsas (.1, .2, .3), el sistema **DEBE** calcular el coste de fabricación por salsa (`CostePicado + CosteAlgas`) y compararlo contra el precio de compra directa en mercado, determinando el ahorro neto y el margen ROI %.
- **RF-04**: El sistema **DEBE** emitir un Veredicto Estratégico automático recomendando la vía más rentable: *Vender Crudo*, *Filetear a Picado*, o *Elaborar Salsas*.
- **RF-05**: El componente de interfaz **DEBE** contar con la barra de control oficial con el botón *Dar Resultado / Calcular Arbitraje*, indicador de cambios pendientes (*isStale*) y botón *Limpiar*.

---

## 4. Requisitos No Funcionales y Guardarraíles de Arquitectura
- **RNF-01 (Clean Architecture)**: La lógica matemática de fileteado, coste de salsas y arbitraje debe residir puramente en `src/domain/use-cases/calculateFishingSaucesEconomy.ts` y sus modelos en `src/domain/models/fishingSauces.ts`.
- **RNF-02 (Defensa de Tipos)**: Todo valor numérico debe validarse con `Number.isFinite` y acotarse a `>= 0` para prevenir `NaN` o divisiones por cero.
- **RNF-03 (Seguridad Cloudflare)**: Sanitización estricta de entradas y persistencia local sin mutaciones inseguras de prototipos (`__proto__`, `constructor`, `prototype`).
- **RNF-04 (Local-First)**: Funcionalidad 100% operativa offline con sincronización reactiva de precios en `albion_fishing_sauces_config_v1`.

---

## 5. Casos Borde y Manejo de Errores
- **CB-01**: Cantidad de pescado igual a cero: El sistema debe mostrar 0 plata sin arrojar error ni romper el renderizado.
- **CB-02**: Precio de salsas o algas vacío o en 0: El cálculo debe omitir la comparación de compra sin generar infinitos ni valores erróneos.
- **CB-03**: Persistencia vacía en primer inicio: Cargar valores por defecto de pescados T4 y recetas de salsas .1-.3.

---

## 6. Criterios de Aceptación (Binarios)
- [x] **CA-01**: El modelo de dominio en `src/domain/models/fishingSauces.ts` tipa exhaustivamente todas las entradas y resultados.
- [x] **CA-02**: El caso de uso puro `calculateFishingSaucesEconomy` calcula con exactitud matemática el rendimiento de picado y costes de salsas.
- [x] **CA-03**: La vista `FishChoppingSaucesView.tsx` incluye el botón oficial *"Dar Resultado / Calcular Arbitraje"* con estado de espera y botón *"Limpiar"*.
- [x] **CA-04**: La configuración y precios del taller se persisten en `localStorage` y se sincronizan reactivamente con el comparador de comida.
- [x] **CA-05**: El validador de especificaciones `npm run sdd:validate` pasa al 100% sin observaciones.
