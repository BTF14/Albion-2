---
name: chrome-devtools-automation
description: Automatización e inspección de frontend con Chrome DevTools Protocol y Puppeteer (Model Context Protocol - MCP) según MoureDev Día 2.
---

# Skill: Chrome DevTools Automation (MCP)

Esta habilidad proporciona el protocolo para que agentes de IA utilicen Chrome DevTools a través de MCP (`@modelcontextprotocol/server-puppeteer`) para inspeccionar, depurar y validar la interfaz visual.

## 1. Capacidades Operativas con Chrome DevTools MCP

1. **Navegación e Inspección de Rutas (`puppeteer_navigate`)**:
   - Abrir la aplicación en `http://localhost:3000`.
   - Verificar tiempos de carga y respuesta de los componentes.
2. **Auditoría de Consola de JavaScript (`puppeteer_evaluate`)**:
   - Inspeccionar si hay errores de runtime no capturados (`window.onerror` o `console.error`).
   - Validar que no haya advertencias de hidratación o re-renders descontrolados en React.
3. **Inspección de Estado y Almacenamiento Local**:
   - Evaluar el contenido de `localStorage.getItem('albion_farm_logs')` para comprobar integridad.
4. **Verificación Visual mediante Capturas (`puppeteer_screenshot`)**:
   - Capturar el estado de los componentes para verificar contraste, alineación de badges por tier y formato de números tabulares (`tabular-nums`).
5. **Pruebas de Interacción del Usuario (`puppeteer_click`, `puppeteer_fill`)**:
   - Simular clics en pestañas, cambios de ciudad y entrada de números manuales para confirmar que la reactividad opera sin errores.

## 2. Comandos CLI de Verificación
```bash
node scripts/chrome-devtools-audit.cjs
```
