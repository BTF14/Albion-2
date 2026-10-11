---
name: performance-optimization
description: Protocolo de optimización de rendimiento frontend, empaquetado Vite, aislamiento de chunks y ergonomía de Albion Online.
---

# Skill: Performance Optimization & Ergonomics

Esta habilidad garantiza que la aplicación cargue en menos de 1 segundo, use eficientemente la memoria y mantenga una tasa de refresco fluida de 60 FPS sin parpadeos visuales.

## 1. Reglas de Rendimiento de Renderizado
- Encapsular cálculos derivados costosos en `useMemo` con dependencias mínimas y estables.
- Envolver manejadores pasados a componentes hijos en `useCallback` para evitar re-renderizados innecesarios.
- Evitar bucles de suscripción en `useEffect`; utilizar banderas o referencias `useRef` para controlar invocaciones concurrentes.

## 2. Partición de Módulos (Vite Chunk Splitting)
- Conservar la segregación en `vite.config.ts`:
  - `vendor-react`: `react`, `react-dom`
  - `vendor-charts`: `recharts`
  - `vendor-icons`: `lucide-react`
- Asegurar que las librerías pesadas se almacenen en la caché HTTP del navegador de forma independiente.

## 3. Ergonomía Numérica
- Utilizar siempre la clase `tabular-nums` en todas las cantidades de plata, costes, tasas y puntos de foco para garantizar ancho idéntico en dígitos y evitar saltos de maquetación en tiempo real.
