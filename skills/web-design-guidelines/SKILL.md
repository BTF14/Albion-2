---
name: web-design-guidelines
origin: skills.sh/anthropics/web-design-guidelines
description: Guía de diseño frontend profesional, accesibilidad, jerarquía visual, números tabulares y eliminación de interfaces genéricas (Anti-AI Slop) basada en skills.sh.
---

# Skill: Web Design Guidelines (Anthropic / skills.sh)

Esta habilidad define los estándares de diseño de interfaces web de nivel de producción, adaptados a la estética inmersiva de Albion Online.

## 1. Reglas de Diseño Anti-AI Slop

1. **Cero Componentes "Pill" Genéricos Injustificados**:
   - Evitar saturar la pantalla con badges redondeados genéricos. Cada badge debe tener significado cromático de negocio (Tier de Albion, Encantamiento, o Estado de Riesgo).
2. **Jerarquía Visual y Contraste**:
   - Fondos en escala de grises oscuros profundos (`slate-950` a `slate-900`) con bordes sutiles (`border-slate-800` o acentos con opacidad `border-amber-500/30`).
   - El dato económico primario (Plata neta, Ganancia por Foco) debe destacar con tipografía grande y contraste elevado (`text-emerald-400`, `text-amber-400`).
3. **Tipografía Numérica Defensiva**:
   - **Obligatorio**: Aplicar `tabular-nums` y fuentes monoespaciadas (`font-mono`) en todas las cantidades financieras, costes, porcentajes de RRR y puntos de foco.
   - Usar siempre separadores de miles (`1.500.000 🪙`) para lectura instantánea sin fatiga visual.
4. **Paleta Canónica de Tiers de Albion Online**:
   - T3: Bronce / Marrón (`#cd7f32` / `text-amber-600`)
   - T4: Azul Real (`#3b82f6` / `text-blue-500`)
   - T5: Rojo Carmesí (`#ef4444` / `text-red-500`)
   - T6: Naranja Fuego (`#f97316` / `text-orange-500`)
   - T7: Amarillo Oro (`#eab308` / `text-yellow-500`)
   - T8: Marfil / Blanco Puro (`#f8fafc` / `text-slate-100`)
5. **Accesibilidad y Foco (WCAG 2.1 AA)**:
   - Todo botón debe tener `type="button"` explícito y título descriptivo (`title`).
   - Los elementos interactivos deben poseer un estado visual visible al recibir foco (`focus:outline-none focus:border-cyan-500`).
