---
name: local-first-storage
origin: skills.sh/local-first-architecture
description: Patrones de persistencia Local-First, integridad offline de datos, migraciones de esquema y sincronización multi-pestaña para localStorage.
---

# Skill: Local-First Storage Architecture (skills.sh)

Esta habilidad asegura que la aplicación opere con soberanía de datos del lado del cliente, garantizando persistencia confiable, tolerancia a fallos y sincronización reactiva entre pestañas sin requerir backend.

## 1. Principios de la Arquitectura Local-First

1. **Soberanía y Disponibilidad Offline**:
   - El 100% de los datos (logs de cosechas, memoria de precios, alts, diarios, tareas) reside en `localStorage`.
   - La aplicación jamás debe mostrar pantallas en blanco o deshabilitarse si el usuario pierde la conexión a internet.
2. **Sincronización Multi-Pestaña Reactiva**:
   - Escuchar activamente el evento `window.addEventListener('storage', handleSync)` para que cualquier cambio de precio o tarea en una pestaña se propague inmediatamente a las demás sin recargar.
   - Disparar eventos personalizados (`albion_storage_sync`, `albion_mastery_updated`) en mutaciones locales.
3. **Migración Defensiva de Versiones de Esquema**:
   - Toda estructura de datos debe contar con un número de versión (`schemaVersion: 2`).
   - Al cargar respaldos antiguos (v1), el sistema debe normalizar los datos al formato v2 sin descartar campos válidos existentes.
4. **Respaldo Defensivo e Inspección Previa**:
   - Antes de aplicar cualquier restauración (Merge o Replace), el sistema debe ejecutar una validación de esquema que verifique los campos mínimos obligatorios.
   - Prohibido sobrescribir datos si el archivo JSON cargado está corrupto o truncado.
