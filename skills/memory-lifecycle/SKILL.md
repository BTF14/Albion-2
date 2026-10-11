---
name: memory-lifecycle
description: Protocolo de ciclo de vida, actualización inmutable y consulta de memorias persistentes (MEMORY.md y /memories/).
---

# Skill: Memory Lifecycle Management

Esta habilidad gestiona cómo los agentes acceden, consultan y enriquecen la memoria a largo plazo del sistema para asegurar continuidad cognitiva entre sesiones.

## 1. Reglas de Consulta de Memoria
- Al inicio de cualquier tarea compleja, el agente debe consultar `MEMORY.md`.
- Debe prestar especial atención a la sección de **Preferencias Inmutables del Usuario** y al **Registro de Errores Corregidos (Anti-Pattern Registry)** para no tropezar en los mismos problemas.

## 2. Reglas de Escritura de Memoria
- Toda decisión de arquitectura mayor debe registrarse en `memories/architecture-decisions.md` con su contexto, decisión y consecuencias (formato ADR).
- Todo error complejo identificado y resuelto debe documentarse en `memories/known-issues-and-solutions.md`.
- No mutar ni borrar preferencias del usuario sin su solicitud explícita.
