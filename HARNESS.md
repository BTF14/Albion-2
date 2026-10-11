# Arquitectura del Arnés de IA (Harness Engineering) & Marco "El Nuevo Programador"
<!-- Basado en las 3 Clases Magistrales de MoureDev: "El nuevo programador - Curso de Desarrollo con IA" -->

## 1. El Marco Mental de las 6 Capas de MoureDev

En el desarrollo de software moderno con Inteligencia Artificial, el programador ya no es un mero redactor de sintaxis; es el núcleo que aporta **CRITERIO DE INGENIERÍA** a través de 6 capas concéntricas de apalancamiento:

```
              [CRITERIO]
                 05 (Multiagentes y subagentes)
                 04 (Spec-driven development - SDD)
                 03 (Harness avanzado: Skills & MCP)
                 02 (Harness engineering: Guardarraíles y Contexto)
                 01 (Fundamentos de IA: Modelos y Prompting)
                 00 (Fundamentos de programación: Lógica y Arquitectura)
              [PROGRAMADOR]
```

### Capa 00: Fundamentos de Programación
- **Lógica y Algoritmia**: Sin bases sólidas, el programador no puede juzgar si el código sugerido por la IA es óptimo o defectuoso.
- **Arquitectura de Software**: Clean Architecture (Alan Buscaglia / Gentleman Programming) separando Dominio Puro de UI y Frameworks.
- **Testing y Depuración**: Automatización de pruebas (Node.js test runner) para verificar invariantes de negocio.

### Capa 01: Fundamentos de IA
- **Comprensión de LLMs**: Ventanas de contexto, límites de tokens, latencia, comportamiento no determinista.
- **Modelos y Herramientas**: Selección del modelo adecuado (razonamiento vs ejecución rápida) y ejecución de herramientas (Tool Calling).
- **Prompting Estructurado**: Pasar de preguntas informales a instrucciones deterministas, directivas de rol y delimitadores.

### Capa 02: Harness Engineering (Ingeniería del Arnés)
- **Definición de Arnés**: El conjunto de reglas, restricciones, contexto pre-cargado y guardarraíles que guían a un agente autónomo para evitar que alucine o se desvíe.
- **Guardarraíles (Guardrails)**: Prohibición de dependencias innecesarias, tipado estricto sin `any`, sanitización en fronteras.
- **Contexto Controlado**: Documentos maestros como `PROJECT_DOCUMENTATION.md` y `ALBION_KNOWLEDGE.md` leídos obligatoriamente antes de codificar.
- **Planificación Estricta**: Dividir problemas complejos en planes secuenciales antes de tocar código.

### Capa 03: Harness Avanzado
- **Agent Skills**: Habilidades modulares especializadas (ej. `/skills/security-audit/` de Cloudflare) con herramientas ejecutables y contratos formales.
- **Comandos Personalizados**: Scripts npm reproducibles (`npm run audit:test`, `npm run lint`).
- **Model Context Protocol (MCP)**: Protocolo estándar para conectar modelos con servidores de datos, APIs y herramientas locales de forma segura.

### Capa 04: Spec-Driven Development (SDD)
- **Fin del "Vibe Coding"**: La IA no debe adivinar lo que el usuario quiere; debe implementar **especificaciones formales consensuadas**.
- **Taxonomía SDD**:
  - *Spec-First*: La especificación se redacta, revisa y aprueba antes de escribir una sola línea de código.
  - *Spec-Anchored*: La especificación se actualiza junto con la evolución del código como fuente única de la verdad.
- **Estructura de Especificación (`/specs/`)**:
  - Requisitos Funcionales en sintaxis **EARS** (*Easy Approach to Requirements Syntax*).
  - Casos Borde (*Edge Cases*).
  - Límites de Alcance (*Out of Scope*).
  - Criterios de Aceptación binarios (*Acceptance Criteria*).

### Capa 05: Multiagentes y Subagentes
- **Especialización de Roles**:
  - *Agente Arquitecto*: Diseña el modelo de datos y las entidades puras.
  - *Agente Implementador*: Desarrolla el caso de uso y componentes UI siguiendo los patrones de diseño.
  - *Agente Auditor de Seguridad*: Realiza pruebas adversariales basadas en Cloudflare Security Audit.
  - *Agente Revisor de Calidad*: Verifica los criterios de aceptación de la especificación SDD.
- **Subagentes Delegados**: Ejecución de microtareas acotadas para evitar la contaminación de la ventana de contexto principal.

---

## 2. Aplicación Práctica en este Proyecto
Este repositorio es una implementación viva de este paradigma:
1. **Regla 0 (Harness)**: El agente está forzado a leer documentación maestra antes de actuar.
2. **Dominio Puro (Fundamentos 00)**: Matemáticas financieras desacopladas de React en `/src/domain/`.
3. **Skill Activo (Harness 03)**: Auditoría Cloudflare automatizada (`skills/security-audit/`).
4. **Directorio de Specs (SDD 04)**: `/specs/` contiene las especificaciones formales con sintaxis EARS.
5. **Criterios de Aceptación Inviolables**: Validación automática mediante `npm run audit:test` y `tsc --noEmit`.
