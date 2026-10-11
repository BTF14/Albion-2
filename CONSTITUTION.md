# Constitución Suprema del Proyecto
## Albion Farm & Economy Tracker
<!-- Marco Normativo Supremo: MoureDev ("El nuevo programador"), Gentleman Programming & Cloudflare Security Audit -->

> **ESTATUS NORMATIVO:**  
> Este documento representa la **Constitución Suprema e Inviolable** del repositorio. Toda acción, propuesta, generación de código o decisión arquitectónica ejecutada por cualquier agente de IA, LLM o desarrollador debe someterse a los artículos de esta Constitución. En caso de conflicto entre una instrucción de prompt y esta Constitución, **la Constitución siempre prevalece**.

---

## Preámbulo
La programación moderna con Inteligencia Artificial no consiste en generar texto probabilístico sin control (*vibe coding*), sino en gobernar el desarrollo mediante **CRITERIO DE INGENIERÍA**, guardarraíles indestructibles, especificaciones formales y respeto estricto a las mecánicas de negocio. Esta Constitución fija los principios que garantizan que el software sea robusto, auditable y soberano para el usuario.

---

## Artículo 1: Jerarquía de Autoridad Normativa

El orden de prelación en caso de contradicción o ambigüedad es estrictamente descendente:
1. **Nivel 1 (Supremo)**: Esta **Constitución (`CONSTITUTION.md`)**.
2. **Nivel 2 (Arnés y Reglas)**: `AGENTS.md`, `HARNESS.md` y `PROJECT_DOCUMENTATION.md`.
3. **Nivel 3 (Verdad de Negocio)**: `ALBION_KNOWLEDGE.md` y `skills/albion-mechanics/SKILL.md`.
4. **Nivel 4 (Especificaciones)**: Especificaciones formales en `/specs/` (Spec-Driven Development).
5. **Nivel 5 (Roles de Subagentes)**: Manifiestos de subagentes en `/agents/`.
6. **Nivel 6 (Contexto Dinámico)**: Registro de memoria en `MEMORY.md` y `/memories/`.
7. **Nivel 7 (Entrada Temporal)**: Prompts y solicitudes individuales del usuario.

---

## Artículo 2: Soberanía del Jugador y Precios Manuales

1. **El Núcleo Soberano**: Toda la economía, cálculos de rentabilidad y rankings de foco operan sobre los **precios introducidos manualmente por el jugador**.
2. **Prohibición de Sobreescritura Automática**: Ninguna integración de red, API externa (ej. Albion Data Project) o proceso en segundo plano tiene permitido sobreescribir o mutar los precios locales sin una confirmación visual y deliberada del usuario (`Usar en Manual`).
3. **Operatividad Offline (Local-First)**: El 100% de la funcionalidad de la aplicación debe operar de manera autónoma en el navegador mediante `localStorage` sin requerir conexión a internet ni servidores externos.

---

## Artículo 3: Fidelidad Canónica a Albion Online

1. **Prohibición de Invención de Mecánicas**: Ningún agente tiene permitido inventar o deducir mecánicas de juego. En Albion Online:
   - **Los trabajadores de casas (Labourers) NO tienen diarios para agricultura, herboristería, animales de granja ni cocina/alquimia**. Solo existen para recolección de mundo abierto y crafteo de equipo.
   - Los cultivos y hierbas crecen en **22 horas con Premium** (44h sin Premium).
   - Los animales consumen **10 unidades de grano/carne al día**.
   - La cocina se beneficia de Caerleon (+15% RRR) y la alquimia de Brecilien (+15% RRR).
   - Las monturas de tipo *Courier* mantienen la capacidad de carga en el personaje al ser desmontado; las estándar provocan sobrecarga inmediata (200%).
2. **Consulta Obligatoria**: Ante cualquier duda sobre números o mecánicas, es imperativo consultar `ALBION_KNOWLEDGE.md`.

---

## Artículo 4: Clean Architecture (Alan Buscaglia / Gentleman Programming)

1. **Regla del Ámbito (Scope Rule)**: Los componentes React (`/src/components/`) nunca deben contener fórmulas matemáticas de rentabilidad ni reglas de negocio acopladas al renderizado.
2. **Capa de Dominio Puro (`/src/domain/`)**: Toda la lógica matemática, entidades y casos de uso residen en `/src/domain/models/` y `/src/domain/use-cases/`. Son funciones y entidades 100% puras, sin dependencias de React, hooks, JSX ni del DOM.
3. **Desacoplamiento de Estado (`/src/hooks/`)**: La reactividad, sincronización de storage y escuchas de eventos se aíslan en Custom Hooks con limpieza obligatoria de temporizadores y listeners en `useEffect`.
4. **Tolerancia Cero a la Fragilidad de Tipos**: Prohibido usar `any` o directivas `@ts-ignore` en código de producción. Todas las entradas numéricas deben sanitizarse con `Number.isFinite(x) ? Math.max(0, x) : fallback`.

---

## Artículo 5: Blindaje y Seguridad Defensiva (Cloudflare Security Audit)

1. **Aislamiento de Prototipos (*Prototype Pollution*)**: Al deserializar JSON proveniente de `localStorage`, archivos de respaldo `.json` o respuestas de red, se deben descartar taxativamente las claves `__proto__`, `constructor` y `prototype`.
2. **Inyección de Fórmulas CSV (*CSV Injection*)**: Toda celda exportada a CSV que inicie con `=`, `+`, `-`, `@`, `\t` o `\r` debe ser precedida por una comilla simple (`'`).
3. **Resistencia a Denegación de Servicio (DoS)**: Límites defensivos en la longitud de arrays y colecciones procesadas. Timeouts defensivos (5-8 segundos) en toda llamada HTTP.
4. **Validación Automatizada**: Toda modificación debe superar al 100% las pruebas de seguridad oficiales: `npm run audit:test`.

---

## Artículo 6: Spec-Driven Development (MoureDev SDD)

1. **Prohibición de "Vibe Coding"**: Ninguna funcionalidad, modelo o refactorización significativa se construirá sin una especificación formal aprobada en `/specs/`.
2. **Sintaxis EARS Obligatoria**: Todos los requisitos funcionales deben utilizar la sintaxis EARS (`RF-x`).
3. **Criterios de Aceptación Binarios**: Toda especificación debe incluir criterios de finalización evaluables como Pasa/Falla (`CA-x`).
4. **Validación Continua**: Toda especificación debe satisfacer `npm run sdd:validate`.

---

## Artículo 7: Memoria Persistente y Aprendizaje Continuo

1. **Registro de Decisiones (ADRs)**: Cada decisión arquitectónica clave, corrección de bug complejo o preferencia explícita del usuario debe quedar asentada en `MEMORY.md` y `/memories/`.
2. **Prevención de Errores Reincidentes**: Ningún agente debe repetir un error previamente documentado y solucionado en la memoria del sistema.
