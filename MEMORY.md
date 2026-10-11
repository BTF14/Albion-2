# Memoria Operativa Persistente del Sistema (Agent Memory)
<!-- Sistema de Memoria a Largo Plazo - Arquitectura MoureDev & Clean Architecture -->

> **PROPÓSITO:**  
> Este documento almacena el estado cognitivo consolidado del proyecto. Contiene las preferencias inmutables del usuario, el historial de decisiones arquitectónicas (ADRs), las lecciones aprendidas de errores previos y el estado actual de los módulos. Ningún agente debe actuar ignorando este registro.

---

## 1. Perfil y Preferencias Inmutables del Usuario

- **Precios 100% Manuales**: El usuario gestiona su propia economía en el juego. Cualquier consulta externa (Albion Data Project) es puramente un visor de referencia secundario (`[ADP]`) y jamás debe escribir en sus precios manuales sin un clic expreso en `Usar en Manual`.
- **Fidelidad Absoluta a Albion Online**: Cero invención de mecánicas. Los precios de islas deben estar actualizados al parche vigente (post-Wild Blood). Los trabajadores de casas no tienen diarios de agricultura/comida.
- **Metodología MoureDev como Disciplina Interna**: El usuario exige que el agente **trabaje y programe** como enseña MoureDev (Harness Engineering, Spec-Driven Development, EARS, MCP, Agent Skills, Constitución y Memorias), **NO** que cree interfaces o tutoriales didácticos dentro de la aplicación de Albion.
- **Estética Inmersiva de Albion**: Modo oscuro profundo (`slate-950`), badges cromáticos oficiales por tier (T3 a T8) y números tabulares (`tabular-nums`) para evitar vibraciones en la maquetación.

---

## 2. Mapa de Decisiones Arquitectónicas (Architecture Decision Records - ADRs)

| ADR # | Título | Decisión / Razón | Estado |
|---|---|---|---|
| **ADR-001** | Gentleman Clean Architecture | Desacoplar Dominio Puro (`/src/domain/`) de React para permitir testing puro sin DOM y cero acoplamiento. | **Aprobado** |
| **ADR-002** | Soberanía Local-First | Operatividad 100% offline mediante `localStorage` con validación defensiva de esquemas. | **Aprobado** |
| **ADR-003** | Cloudflare Security Audit | Mitigación activa de Prototype Pollution, CSV Formula Injection y DoS con suite reproducible (`npm run audit:test`). | **Aprobado** |
| **ADR-004** | Spec-Driven Development (SDD) | Prohibición del "vibe coding". Especificaciones formales en `/specs/` con sintaxis EARS y criterios binarios (`npm run sdd:validate`). | **Aprobado** |
| **ADR-005** | Orquestación Multiagente y MCP | División del trabajo en roles especializados (`/agents/`) y conexión de herramientas mediante Model Context Protocol (`mcp.config.json`). | **Aprobado** |
| **ADR-006** | Constitución Suprema | Jerarquía legal formalizada en `CONSTITUTION.md` que antepone las reglas y principios al prompt temporal. | **Aprobado** |
| **ADR-007** | Vercel Hosting & Cloud Sync Engine | Configuración oficial de `vercel.json` con reescritura SPA y motor de sincronización asíncrono multidispositivo preservando soberanía Local-First. | **Aprobado** |

---

## 3. Lecciones Críticas y Errores Corregidos (Anti-Pattern Registry)

1. **Error de Costes de Isla Desactualizados**:
   - *Problema*: Inicialmente los costes de expansión de isla estaban en valores pre-Wild Blood (112.500 🪙).
   - *Solución*: Se actualizaron a las tarifas oficiales actuales de Albion Online (hasta 31.750.000 🪙 + 1M de gremio) y se agregó opción de exclusión para islas ya adquiridas.
2. **Error de Omisión de Tab en Categoría "Todas" (`Navbar.tsx`)**:
   - *Problema*: La pestaña `red_zone_transport` no estaba en `NAV_CATEGORIES[0].tabs`, ocultándose cuando el filtro era "Todas".
   - *Solución*: Se unificaron las 24 pestañas en el array general.
3. **Error de Pantalla Didáctica en la App**:
   - *Problema*: Al pedir la metodología de MoureDev, se creó un componente visual en la app cuando el usuario lo quería como arnés y forma de programar del agente.
   - *Solución*: Se eliminó la pantalla extraña de la UI y se incorporó la metodología como estándar en el backend/arnés (`CONSTITUTION.md`, `/specs/`, `/agents/`, `/memories/`, `MCP`).
4. **Eliminación Total de `any`**:
   - *Problema*: Existían 3 casts residuales `as any` en `backupManager.ts`, `storage.ts` y `RedZoneTransportView.tsx`.
   - *Solución*: Se tiparon estrictamente con `RedZoneTransportInput`. Cero `any` en todo el codebase.

---

## 4. Estado de los 24 Módulos Canónicos de Albion Online

- Todos los 24 módulos funcionales están implementados, auditados, desacoplados en dominio puro y en producción activa.
- Pruebas automatizadas en ejecución: `npm run agent:verify` (SDD + Cloudflare Audit + TypeScript Lint).
