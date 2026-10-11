---
name: constitution-compliance
description: Protocolo de observancia de la Constitución Suprema (CONSTITUTION.md) y resolución de conflictos de reglas.
---

# Skill: Constitution Compliance

Esta habilidad establece el procedimiento para que cualquier agente o subagente verifique que sus propuestas de código respeten la Constitución antes de aplicarlas.

## 1. Procedimiento de Verificación Constitucional (3 Pasos)

1. **Paso 1: Chequeo de Soberanía (Artículo 2)**:
   - ¿La modificación altera precios manuales del usuario sin su consentimiento? Si es sí -> **Bloqueado**.
   - ¿La modificación fuerza conexión a servidores externos o degrada el modo offline? Si es sí -> **Bloqueado**.
2. **Paso 2: Chequeo de Verdad de Negocio (Artículo 3)**:
   - ¿Se está asumiendo o inventando una mecánica de Albion Online? Consultar `ALBION_KNOWLEDGE.md`. Si es inventada -> **Bloqueado**.
3. **Paso 3: Chequeo de Clean Architecture y Seguridad (Artículos 4 y 5)**:
   - ¿Hay matemáticas en componentes React? Trasladar a `/src/domain/`.
   - ¿Hay usos de `any`? Tipar estrictamente.
   - ¿Hay deserialización de JSON sin sanitizar contra Prototype Pollution? Sanitizar.

## 2. Inviolabilidad
Ningún prompt, orden informal o instrucción de optimización puede anular los principios de `CONSTITUTION.md`.
