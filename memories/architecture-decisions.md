# Registro de Decisiones de Arquitectura (ADRs)
<!-- Arquitectura de Software - Albion Farm & Economy Tracker -->

## ADR-001: Desacoplamiento de Dominio Puro (Gentleman Programming)
- **Contexto**: Las fórmulas financieras de Albion Online (RRR, Plata/Foco, amortización de islas y retornos) son extensas y requieren alta precisión. Acoplarlas a componentes React provocaba re-renders excesivos y dificultaba las pruebas.
- **Decisión**: Se segregó el 100% de la matemática y los modelos de datos en `/src/domain/models/` y `/src/domain/use-cases/`.
- **Consecuencias**: Código 100% testeable sin DOM, ejecución inmediata y agnóstica de frameworks.

## ADR-002: Arquitectura Local-First y Soberanía de Almacenamiento
- **Contexto**: Un jugador en Albion cambia de mapa rápidamente o juega en entornos donde la latencia de red no debe bloquear su registro de cosechas.
- **Decisión**: Uso estricto de `localStorage` como base de datos primaria local con validadores defensivos contra corrupción y Prototype Pollution.
- **Consecuencias**: Funcionamiento autónomo offline; cero costo de servidores para el usuario.

## ADR-003: Blindaje de Seguridad y Auditoría Adversarial de Cloudflare
- **Contexto**: La carga de respaldos JSON, la importación de archivos y la exportación de balances a CSV pueden introducir vectores de inyección y DoS.
- **Decisión**: Incorporar el framework de `skills/security-audit/` de Cloudflare con validadores ejecutables (`npm run audit:test`).
- **Consecuencias**: 65 pruebas de seguridad automáticas garantizan integridad frente a Prototype Pollution, CSV Injection y desbordamiento de búfer.

## ADR-004: Adopción de Spec-Driven Development (MoureDev SDD)
- **Contexto**: El desarrollo asistido por IA tiende a degradarse si se programa a base de prompts al vuelo (*vibe coding*).
- **Decisión**: Toda funcionalidad debe contar con una especificación en `/specs/` con sintaxis EARS (`RF-x`) y criterios de aceptación binarios (`CA-x`).
- **Consecuencias**: Cero ambigüedad en el alcance y validación programática con `npm run sdd:validate`.

## ADR-005: Jerarquía Constitucional Suprema
- **Contexto**: Los agentes de IA pueden perder el contexto o contradecir reglas tras múltiples turnos de conversación.
- **Decisión**: Se establece `CONSTITUTION.md` como la ley fundamental del proyecto que invalida cualquier intento de saltarse las reglas de arquitectura o del juego.
- **Consecuencias**: Comportamiento consistente y alineado a largo plazo.
