# Historial de Problemas Conocidos y Soluciones (Anti-Pattern Registry)
<!-- Lecciones Aprendidas del Proyecto para Evitar Reincidencias -->

1. **Precios Antiguos de Isla (Pre-Wild Blood)**:
   - *Causa*: Sandbox Interactive actualizó los precios de las islas multiplicándolos como medida de silver sink.
   - *Solución*: Se cargó la tabla oficial completa en `GUILD_ISLAND_LEVELS` (5M a 8M por nivel, 31.75M total + 1M de fundación). Se agregaron checkboxes para excluir costes si el usuario ya posee la isla.

2. **Omisión de Pestaña en Filtro "Todas"**:
   - *Causa*: La pestaña `red_zone_transport` se agregó a la categoría "Mercado", pero faltaba en el array de la categoría general "Todas".
   - *Solución*: Se auditaron todas las categorías en `Navbar.tsx` para garantizar que la lista de 24 módulos esté íntegra.

3. **Inclusión de Interfaz Didáctica en Lugar de Metodología de Trabajo**:
   - *Causa*: Al recibir la solicitud de MoureDev, se implementó una pantalla educativa en la app en lugar de asimilar el marco metodológico en el arnés del agente.
   - *Solución*: Se eliminó la pantalla extraña de la UI de la app y se formalizó el marco en `CONSTITUTION.md`, `MEMORY.md`, `/specs/`, `/agents/` y `mcp.config.json`.

4. **Uso Residual de `any` en TypeScript**:
   - *Causa*: Tres casts `as any` en `backupManager.ts`, `storage.ts` y `RedZoneTransportView.tsx`.
   - *Solución*: Se tiparon con `RedZoneTransportInput`. El compilador corre con 0 warnings y 0 errores.
