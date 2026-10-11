---
name: react-best-practices
origin: skills.sh/vercel-labs/vercel-react-best-practices
description: Reglas y patrones de optimización de rendimiento, diseño de componentes y gestión de estado para React 19 basados en el paquete oficial de Vercel Labs en skills.sh.
---

# Skill: React Best Practices (Vercel Labs / skills.sh)

Esta habilidad proporciona las mejores prácticas de la industria para React 19 y Vite, garantizando que el código sea de alto rendimiento, libre de re-renders innecesarios y mantenible.

## 1. Reglas Fundamentales de Rendimiento (Vercel Labs)

1. **Colocación de Estado (State Colocation)**:
   - Mantén el estado lo más cerca posible de donde se utiliza. No eleves el estado (`lift state up`) a menos que múltiples componentes hijos realmente lo necesiten.
2. **Evitar la Proliferación de Props Booleanas (Avoid Boolean Prop Proliferation)**:
   - En lugar de pasar múltiples banderas booleanas (`isLoading`, `isError`, `isSuccess`, `isEmpty`), modela el estado como una máquina de estados discriminada con un enum o tipo string union (`status: 'idle' | 'loading' | 'success' | 'error'`).
3. **Memorización Defensiva con `useMemo` y `useCallback`**:
   - Memoriza cálculos económicos costosos (rankings de foco, matrices de RRR, cubicaje de carga) con `useMemo`.
   - Asegura que los arrays de dependencias contengan referencias estables.
   - Pasa funciones memorizadas con `useCallback` a componentes secundarios para evitar invalidar el Virtual DOM.
4. **Prevención de Renders en Cascada**:
   - Nunca actualices el estado dentro de `useEffect` en respuesta a cambios de otro estado si el valor puede calcularse derivadamente en el render.
   - Todo valor determinista derivado de props o estado debe calcularse al vuelo (`const filtered = useMemo(...)`).
5. **Inmutabilidad y Clonación Segura**:
   - Al mutar arrays o registros en el estado, utiliza siempre operadores de propagación inmutables (`[...prev, newItem]`) o copias limpias.
   - Prohibido mutar referencias de objetos compartidos directamente.

## 2. Checklist de Validación React 19
- [ ] ¿Los manejadores de eventos están tipados con `React.MouseEvent` / `React.ChangeEvent`?
- [ ] ¿Los hooks respetan las reglas de React (top-level, sin condiciones)?
- [ ] ¿Los arrays renderizados tienen una clave `key` única y estable (nunca el índice del array si los elementos pueden reordenarse)?
- [ ] ¿Los efectos con suscripciones devuelven una función de limpieza?
