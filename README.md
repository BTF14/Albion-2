# Albion Farm & Economy Tracker

Suite profesional integral de gestión económica, agricultura, ganadería, refinado, crafteo, transmutación y arbitraje para **Albion Online**.

Diseñado bajo la arquitectura **Clean Architecture / Gentleman Programming (Alan Buscaglia)** y auditado bajo el estándar de ciberseguridad **Cloudflare Security Audit**.

## 📖 Documentación Oficial del Proyecto
- **Manual Maestro de Arquitectura y Módulos**: Consulta obligatoria en [`/PROJECT_DOCUMENTATION.md`](./PROJECT_DOCUMENTATION.md).
- **Compendio Oficial de Mecánicas de Albion Online**: [`/ALBION_KNOWLEDGE.md`](./ALBION_KNOWLEDGE.md).
- **Roadmap y Reglas Inviolables del Agente**: [`/AGENTS.md`](./AGENTS.md).
- **Framework de Auditoría de Seguridad Cloudflare**: [`/skills/security-audit/`](./skills/security-audit/).

## 🚀 Pila Tecnológica
- **Frontend**: React 19 + TypeScript (Strict Mode).
- **Estilos**: Tailwind CSS 4.0 con badges oficiales de Albion y números tabulares (`tabular-nums`).
- **Bundler**: Vite 6 con partición de chunks (`vendor-react`, `vendor-icons`, `vendor-charts`).
- **Iconografía**: `lucide-react`.
- **Pruebas**: Node.js Test Runner nativo (`npm run audit:test`).

## 🛠️ Comandos de Ejecución
```bash
# Iniciar servidor de desarrollo (puerto 3000)
npm run dev

# Compilar para producción
npm run build

# Validar tipos y sintaxis
npm run lint

# Ejecutar auditoría de seguridad Cloudflare
npm run audit:test
```
