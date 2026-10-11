# Guía Oficial de Conexión de Servidores MCP (Model Context Protocol)
<!-- Basado en la Clase Magistral de MoureDev: "El nuevo programador - Día 2: Harness & MCP" -->

## 1. ¿Qué es el Model Context Protocol (MCP)?

El **Model Context Protocol (MCP)** es un estándar abierto desarrollado por Anthropic que permite a modelos de lenguaje (LLMs) y agentes de IA conectarse de forma segura y estandarizada a:
- Herramientas locales (*Tools*)
- Fuentes de datos y contexto (*Resources*)
- Plantillas de interacción (*Prompts*)

En lugar de crear integraciones propietarias para cada IDE o modelo, MCP actúa como el **conector universal** entre el agente y el entorno de trabajo.

---

## 2. Servidores MCP Configurados para este Proyecto (`mcp.config.json`)

En la raíz del repositorio se encuentra `mcp.config.json` con los siguientes servidores preconfigurados:

| Servidor MCP | Propósito | Comando |
|---|---|---|
| **`albion-data-service`** | Consulta referencial de precios en Albion Data Project (Europa, América, Asia). | `node scripts/mcp-albion-data.cjs` |
| **`sdd-spec-engine`** | Validador y motor de consulta de especificaciones SDD en `/specs/`. | `node skills/spec-driven-development/scripts/validate-specs.cjs` |
| **`cloudflare-security-audit`** | Escáner y verificador de vulnerabilidades y Prototype Pollution. | `node skills/security-audit/validate-findings.cjs` |
| **`filesystem`** | Lectura/escritura acotada y segura sobre `/src` y `/specs`. | `npx @modelcontextprotocol/server-filesystem ./src ./specs` |
| **`git`** | Inspección de diffs, historial y commits por especificación. | `npx @modelcontextprotocol/server-git .` |

---

## 3. Cómo Conectar los Servidores MCP en tu Entorno de Desarrollo

### Opción A: En Cursor IDE / Windsurf
1. Ve a **Settings** -> **Features** -> **MCP Servers**.
2. Pulsa en **Add New MCP Server**.
3. Selecciona tipo **stdio**.
4. Apunta al archivo `mcp.config.json` del proyecto.

### Opción B: En Claude Desktop
1. Abre tu archivo de configuración de Claude Desktop:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
2. Copia el bloque `"mcpServers"` de `mcp.config.json` en tu archivo de configuración.
3. Reinicia Claude Desktop. Verás el icono del martillo (🔨) con las herramientas disponibles.

### Opción C: En VS Code (con extensión Roo Code o Cline)
1. Abre los ajustes de la extensión MCP en VS Code.
2. Añade la ruta absoluta hacia `mcp.config.json`.
3. Los subagentes configurados podrán invocar automáticamente la validación de specs y auditorías de seguridad.

---

## 4. Flujo de Trabajo Multiagente con MCP

1. El **Subagente Verificador SDD** utiliza `sdd-spec-engine` para validar que las especificaciones cumplan la sintaxis EARS.
2. El **Subagente Arquitecto** consulta `albion-data-service` para verificar precios y nombres de ítems de Albion Online.
3. El **Subagente de Seguridad** ejecuta `cloudflare-security-audit` para validar la ausencia de vulnerabilidades.
4. El **Agente Orquestador** revisa con `git` que todos los cambios correspondan estrictamente a los criterios de aceptación pactados.
