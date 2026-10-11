# Plantilla Oficial de Especificación (Spec-Driven Development - SDD)
<!-- Basado en la metodología de Brais Moure (MoureDev / hello-sdd) -->

# SPEC-000: [Título de la Funcionalidad o Módulo]

- **Estado**: [Borrador | En Revisión | Aprobado | Implementado]
- **Autor / Arquitecto**: [Nombre o Rol del Desarrollador]
- **Taxonomía SDD**: [Spec-First | Spec-Anchored]
- **Fecha**: [AAAA-MM-DD]
- **Versión**: 1.0.0

---

## 1. Contexto y Justificación
*¿Por qué existe esta funcionalidad? ¿Qué problema resuelve para el usuario o para el sistema?*

[Describe aquí el problema de negocio, mecánicas relevantes o necesidad técnica].

---

## 2. Actores y Casos de Uso
*¿Quién interactúa con esta funcionalidad y qué pretende lograr?*

- **Actor Principal**: [ej. Jugador de Albion / Usuario del sistema]
- **Historias de Usuario**:
  - **HU-01**: Como [actor], quiero [acción] para [beneficio].
  - **HU-02**: Como [actor], quiero [acción] para [beneficio].

---

## 3. Requisitos Funcionales (Sintaxis EARS)
*Easy Approach to Requirements Syntax: [Condición / Evento], el sistema DEBE [comportamiento esperado].*

- **RF-01**: Al iniciar la vista, el sistema **DEBE** cargar los valores por defecto sanitizados desde el almacenamiento local.
- **RF-02**: Cuando el usuario modifique una entrada numérica, el sistema **DEBE** recalcular las métricas instantáneamente en tiempo real.
- **RF-03**: Mientras el cálculo esté en progreso o ante valores inválidos, el sistema **DEBE** aplicar valores defensivos de fallback sin arrojar `NaN` ni errores en consola.
- **RF-04**: Si el usuario pulsa el botón de exportación, el sistema **DEBE** generar un archivo sanitizado libre de inyecciones maliciosas.

---

## 4. Requisitos No Funcionales y Guardarraíles de Arquitectura
- **RNF-01 (Clean Architecture)**: La lógica matemática y de dominio debe residir en `/src/domain/` como funciones puras sin dependencias de React ni del DOM.
- **RNF-02 (Defensa de Tipos)**: Prohibido el uso de `any`. Toda entrada debe validarse con `Number.isFinite`.
- **RNF-03 (Seguridad Cloudflare)**: Sanitización estricta contra Prototype Pollution en objetos y contra Formula Injection en exportaciones CSV.
- **RNF-04 (Rendimiento)**: Cero re-renders innecesarios; cálculos pesados encapsulados en `useMemo`.

---

## 5. Casos Borde y Manejo de Errores
- **CB-01**: Entrada numérica negativa o igual a cero: El sistema debe acotar el valor al mínimo permitido.
- **CB-02**: Almacenamiento local corrupto o vacío: El sistema debe inicializarse con la configuración por defecto sin fallar.
- **CB-03**: Desconexión o timeout de red: La funcionalidad debe operar 100% de manera offline (Local-First).

---

## 6. Fuera de Alcance (Out of Scope)
- No se incluye persistencia en bases de datos remotas obligatorias.
- No se crearán componentes sin desacoplar previamente el caso de uso en dominio puro.

---

## 7. Criterios de Aceptación (Acceptance Criteria)
*Lista de verificación binaria (Pasa / No Pasa) para considerar la tarea terminada:*

- [ ] **CA-01**: La capa de dominio puro (`/src/domain/models/` y `/src/domain/use-cases/`) cuenta con tipado estricto y 0 dependencias de UI.
- [ ] **CA-02**: El custom hook (`/src/hooks/`) maneja el ciclo de vida y la persistencia sin fugar memoria ni listeners.
- [ ] **CA-03**: La interfaz de usuario refleja los números con tipografía tabular (`tabular-nums`) y estética oscura oficial.
- [ ] **CA-04**: La suite de pruebas de auditoría (`npm run audit:test`) pasa al 100% con 0 fallos.
- [ ] **CA-05**: El compilador TypeScript (`lint_applet`) y la compilación (`compile_applet`) finalizan sin errores ni warnings.
