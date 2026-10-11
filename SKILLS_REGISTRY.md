# Registro Maestro de Agent Skills (`skills.sh`)
<!-- Ecosistema de Habilidades Modulares para Agentes de IA -->

Este proyecto adopta el estándar abierto de **skills.sh** (mantenido por Vercel Labs y la comunidad de IA) para estructurar el conocimiento procedimental y los guardarraíles de los agentes.

---

## 1. Catálogo de Skills Integradas en el Proyecto

| # | Skill ID | Fuente / Origen (`skills.sh`) | Subagente Asignado | Propósito Central |
|---|---|---|---|---|
| **1** | `react-best-practices` | `skills.sh/vercel-labs/vercel-react-best-practices` | `frontend-implementer` | Optimización de renderizado, colocación de estado y eliminación de props booleanas en React 19. |
| **2** | `web-design-guidelines` | `skills.sh/anthropics/web-design-guidelines` | `frontend-implementer` | +100 reglas de UI profesional, jerarquía visual, accesibilidad y números tabulares (`tabular-nums`). |
| **3** | `karpathy-guidelines` | `skills.sh/karpathy-coding-guidelines` | `orchestrator` | Las 4 reglas de Andrej Karpathy: nunca adivinar, cambios atómicos, leer errores y verificar con tests. |
| **4** | `local-first-storage` | `skills.sh/local-first-architecture` | `domain-architect` | Persistencia offline soberana en `localStorage`, sincronización multi-pestaña y migraciones de esquema. |
| **5** | `spec-driven-development` | `skills.sh/mouredev/hello-sdd` | `sdd-verifier` | Taxonomía SDD, especificaciones formales con sintaxis EARS (`RF-x`) y validación de criterios (`CA-x`). |
| **6** | `gentleman-clean-architecture`| `skills.sh/gentleman-programming/clean-architecture` | `domain-architect` | Regla del ámbito de Alan Buscaglia, desacoplamiento estricto de Dominio Puro (`/src/domain/`) y cero `any`. |
| **7** | `security-audit` | `skills.sh/cloudflare/security-audit-skill` | `security-critic` | Suite de 65 pruebas de seguridad de Cloudflare contra Prototype Pollution, Formula Injection y DoS. |
| **8** | `chrome-devtools-automation` | `skills.sh/modelcontextprotocol/chrome-devtools` | `frontend-implementer` | Automatización de Chrome DevTools y Puppeteer MCP para inspección de consola y pruebas visuales. |
| **9** | `constitution-compliance` | Gobernanza Interna | `orchestrator` | Chequeo de observancia de los 7 artículos de `CONSTITUTION.md` antes de autorizar código. |
| **10** | `memory-lifecycle` | Arquitectura Cognitiva | `orchestrator` | Ciclo de vida y consulta de memoria a largo plazo (`MEMORY.md` y `/memories/`). |
| **11** | `performance-optimization`| Optimización Vite | `frontend-implementer` | Segregación de paquetes (`manualChunks`), 60 FPS y prevención de re-renders. |
| **12** | `albion-game-mechanics` | Dominio Canónico | `domain-architect` | Guardarraíles oficiales de Albion Online (22h, 10 u. alimento, RRR, Caerleon/Brecilien, monturas Courier). |

---

## 2. Cómo se Instalan y Actualizan Skills desde `skills.sh`

Cualquier desarrollador o agente que trabaje en un entorno con la CLI de `skills.sh` puede sincronizar o incorporar nuevas habilidades mediante el comando oficial:

```bash
# Ejemplo: Instalar la skill oficial de React Best Practices de Vercel
npx skills add vercel-labs/agent-skills/vercel-react-best-practices

# Ejemplo: Instalar las guías de diseño web de Anthropic
npx skills add anthropics/skills/web-design-guidelines

# Ejemplo: Validar las skills locales
npm run sdd:validate
npm run audit:test
```

---

## 3. Asignación de Skills por Rol de Subagente

```
                          [AGENTE ORCHESTRATOR]
                     ├── constitution-compliance
                     ├── karpathy-guidelines
                     └── memory-lifecycle
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
[DOMAIN ARCHITECT]   [FRONTEND IMPLEMENTER]    [SECURITY CRITIC]
├── clean-architecture  ├── react-best-practices   └── security-audit (Cloudflare)
├── albion-mechanics    ├── web-design-guidelines
└── local-first-storage ├── chrome-devtools-mcp
                        └── performance-optim.
                               │
                               ▼
                       [SDD VERIFIER]
                       └── spec-driven-development
```
