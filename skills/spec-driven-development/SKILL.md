---
name: spec-driven-development
description: Metodología oficial de Spec-Driven Development (SDD) basada en el marco de MoureDev (hello-sdd) para desarrollo de software asistido por IA.
---

# Skill: Spec-Driven Development (SDD)

Esta habilidad proporciona el protocolo formal para que los agentes de IA no programen mediante ocurrencias al vuelo (*vibe coding*), sino guiados por especificaciones formales aprobadas y criterios de aceptación binarios.

## 1. Taxonomía SDD

- **Spec-First**: La especificación se redacta, analiza y aprueba antes de crear cualquier modelo, función o componente.
- **Spec-Anchored**: En código existente, la especificación se actualiza junto con la evolución de la funcionalidad, sirviendo como fuente única de la verdad del sistema.

## 2. Sintaxis EARS (Easy Approach to Requirements Syntax)

Todos los requisitos funcionales (`RF-x`) deben redactarse utilizando una de las 5 estructuras EARS:
1. **Basado en Eventos (Event-driven)**: `Al [evento o acción del usuario], el sistema DEBE [respuesta].`
2. **Basado en Estado (State-driven)**: `Mientras [el sistema esté en determinado estado], el sistema DEBE [comportamiento continuo].`
3. **Comportamiento Indeseado / Excepciones (Unwanted behavior)**: `Si [condición de error o dato inválido], el sistema DEBE [acción de mitigación].`
4. **Opcional / Conmutador (Optional feature)**: `Donde [opción o toggle activado por el usuario], el sistema DEBE [comportamiento específico].`
5. **Ubicuo (Ubiquitous)**: `El sistema DEBE [requisito fundamental siempre activo].`

## 3. Criterios de Aceptación Binarios (Acceptance Criteria)

Cada especificación concluye con una lista de casillas de verificación:
- Deben ser estrictamente evaluables como **Pasa (True)** o **Falla (False)**.
- Ninguna tarea se considera completa si al menos un criterio `[ ]` permanece sin cumplir o sin justificación técnica.

## 4. Comandos de Validación

Para validar todas las especificaciones activas del repositorio:
```bash
npm run sdd:validate
```
