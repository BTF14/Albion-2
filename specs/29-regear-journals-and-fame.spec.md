# SPEC-029: Presupuesto de Re-Gear, Suministro de Diarios y Calculadora de Fama de Destino

- **Estado**: Aprobado e Implementado
- **Autor / Arquitecto**: Arquitecto de Dominio & Clean Architecture (Gentleman Programming)
- **Taxonomía SDD**: Spec-Anchored
- **Fecha**: 2026-10-13
- **Versión**: 1.0.0

---

## 1. Contexto y Justificación
1. **Presupuesto de Re-Gear & Sets PvP/PvE**:
   En Albion Online, la pérdida de equipamiento por muerte en zona roja, zona negra, Caminos de Avalon o Hellgates requiere una gestión de liquidez estricta. Una calculadora de Re-Gear permite presupuestar sets completos (arma, armaduras, accesorios, consumibles y montura) para calcular el coste por muerte y el fondo de reserva para múltiples bajas.
2. **Planificador de Suministro de Diarios para Trabajadores (Labourer Journal Supply Planner)**:
   Los jugadores con islas de trabajadores o Casas Gremiales (Guild Halls) de hasta 15 obreros por edificio deben entregar diarios llenos cada 22 horas. El planificador calcula la demanda cíclica y evalúa la decisión económica entre comprar diarios llenos o comprar vacíos y llenarlos forjando.
3. **Calculadora de Fama & Tomos de Perspicacia para la Tabla del Destino**:
   Alcanzar nivel 100 de especialización en crafteo, refinado o agricultura otorga hasta 125 FCE (reduciendo el gasto de foco al mínimo). Este módulo calcula la fama exacta restante entre niveles y el número de Tomos de la Perspicacia (10.000 fama c/u) necesarios con su coste en plata.

---

## 2. Actores y Casos de Uso
- **Actor Principal**: Jugador competitivo, maestro artesano y terrateniente de Albion Online.
- **Historias de Usuario**:
  - **HU-01**: Como combatiente o transportista, quiero calcular el coste total de mi set de equipamiento y saber cuánta plata necesito para 3, 5 o 10 muertes.
  - **HU-02**: Como dueño de casas y obreros, quiero auditar cuántos diarios llenos necesito al día/semana y contrastar el coste de comprarlos llenos frente a llenarlos yo mismo.
  - **HU-03**: Como artesano que busca optimizar foco, quiero saber cuántos Tomos de Perspicacia necesito para llevar mi especialización a 100 y cuánto me costará en el mercado.

---

## 3. Requisitos Funcionales (Sintaxis EARS)
- **RF-01**: En la calculadora de Re-Gear, el sistema **DEBE** permitir componer un set con ranuras oficiales (arma, mano secundaria, cabeza, pecho, zapatos, capa, montura, comida, poción) y calcular el coste unitario del set.
- **RF-02**: El sistema **DEBE** multiplicar el coste del set por multiplicadores de bajas predefinidos (1, 3, 5, 10 muertes) para proyectar el fondo de liquidez necesario.
- **RF-03**: En el Planificador de Diarios, el sistema **DEBE** calcular la demanda de diarios por ciclo de 22 horas y por semana (7 ciclos) en función del número de trabajadores y su oficio/tier.
- **RF-04**: En la Calculadora de Fama, el sistema **DEBE** calcular la fama requerida entre un nivel inicial y un nivel objetivo (1 a 100) según las tablas oficiales de Albion Online y determinar los tomos de 10.000 fama requeridos.

---

## 4. Requisitos No Funcionales y Guardarraíles de Arquitectura
- **RNF-01 (Gentleman Programming - Clean Architecture)**: Toda fórmula matemática debe implementarse como caso de uso puro desacoplado de React en `/src/domain/use-cases/`.
- **RNF-02 (Defensa de Tipos)**: Prohibido el uso de `any`. Todas las entradas numéricas deben sanitizarse con validaciones estrictas (`Math.max`, `Math.min`, `Number.isFinite`).
- **RNF-03 (Seguridad Cloudflare)**: Sanitización estricta contra Prototype Pollution en `localStorage` y en la deserialización de sets.
- **RNF-04 (Local-First)**: Funcionalidad 100% autónoma en el navegador sin requerir conectividad de red.

---

## 5. Casos Borde y Manejo de Errores
- **CB-01**: Ranura vacía en el set (ej. arma 2 manos sin mano secundaria): No sumar coste ni emitir errores.
- **CB-02**: Nivel actual mayor o igual al nivel objetivo en la calculadora de fama: Devolver 0 fama y 0 tomos requeridos.
- **CB-03**: Precios de tomos o piezas en 0 o negativos: Sanitizar a valores mínimos seguros.

---

## 6. Criterios de Aceptación (Binarios)
- [x] **CA-01**: Los modelos de dominio en `/src/domain/models/` y casos de uso en `/src/domain/use-cases/` están implementados y exportados en el barrel file.
- [x] **CA-02**: El módulo de Sets & Re-Gear permite guardar sets favoritos y proyectar presupuesto de bajas.
- [x] **CA-03**: El Planificador de Diarios está integrado en la gestión de trabajadores.
- [x] **CA-04**: La Calculadora de Fama y Tomos está integrada en la Tabla del Destino.
- [x] **CA-05**: Las pruebas unitarias de dominio y E2E pasan al 100%.
