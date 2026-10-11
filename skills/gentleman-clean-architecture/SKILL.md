---
name: gentleman-clean-architecture
description: Protocolo y guardarraíles de Clean Architecture para TypeScript y React basado en el estándar de Alan Buscaglia (Gentleman Programming).
---

# Skill: Gentleman Clean Architecture

Este protocolo impone el desacoplamiento estricto entre el dominio de negocio y la interfaz de usuario, garantizando que el código sea testeable, mantenible y libre de acoplamientos al framework.

## 1. La Regla del Ámbito (Scope Rule)

1. **Capa de Dominio Puro (`/src/domain/`)**:
   - Reside en `/src/domain/models/` y `/src/domain/use-cases/`.
   - **Prohibición absoluta**: No importar React, hooks (`useState`, `useEffect`), JSX, ni referencias al objeto `window` o `document`.
   - Todas las funciones deben ser puras: dados los mismos parámetros de entrada, siempre devuelven el mismo resultado sin efectos secundarios.
2. **Capa de Adaptadores y Estado (`/src/hooks/`)**:
   - Encapsula la reactividad (`useState`, `useMemo`, `useCallback`).
   - Maneja la sincronización con `localStorage` y la escucha de eventos (`storage`, `custom events`).
   - Garantiza la limpieza estricta de suscripciones y temporizadores en el retorno de `useEffect`.
3. **Capa de Presentación (`/src/components/`)**:
   - Su única responsabilidad es renderizar la interfaz de usuario y capturar eventos de interacción.
   - **Prohibido**: Calcular fórmulas matemáticas complejas o lógica de negocio directamente dentro del render del componente. Debe consumir los casos de uso a través de los custom hooks.

## 2. Código Defensivo y Tipado Estricto

- **Cero `any`**: Cualquier uso de `any` está prohibido. Utilizar tipos discriminados, genéricos o `unknown` con type guards.
- **Sanitización Numérica**: Toda entrada del usuario debe pasar por validadores:
  ```ts
  const safeValue = Number.isFinite(input) ? Math.max(0, input) : fallback;
  ```
- **Barrel Files**: Toda exportación debe estar unificada en `src/domain/index.ts` y `src/hooks/index.ts`.
