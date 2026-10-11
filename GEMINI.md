# Directrices de Seguridad y Auditoría Cloudflare (Memoria Activa)

Este proyecto incorpora el framework completo de auditoría y defensa de vulnerabilidades de **Cloudflare Security Audit Skill** (`skills/security-audit/`).

## Principios Operativos Inviolables:
1. **Adversarial Validation**: Toda propuesta o refactorización debe someterse a prueba contra vectores de ataque reales documentados en `skills/security-audit/`.
2. **Sanitización Estricta en Fronteras**:
   - `localStorage` y copias de seguridad JSON: Blindaje contra Prototype Pollution (`__proto__`, `constructor`, `prototype`), tipos inválidos, números infinitos o negativos maliciosos.
   - APIs de terceros (Albion Data Project): Timeouts defensivos (5-8 segundos), validación de estructuras JSON mediante esquemas o validadores puros, tipado fuerte y mitigación de spoofing o DoS por respuestas gigantes.
   - Inputs de usuario: Sanitización numérica exhaustiva (`Number.isFinite`, `Math.max`, `Math.min`).
   - Exportación de Archivos (CSV/Excel): Mitigación estricta de inyección de fórmulas CSV (`CSV Injection / Formula Injection`) escapando celdas que inicien con `=`, `+`, `-`, `@`, `\t` o `\r`.
   - Invariantes de Dominio: Contadores de foco acotados estrictamente entre `0` y `30.000`, tasas de uso de estaciones acotadas a `1.000` de plata por 100 de nutrición y tiempos de ciclo regulados a `22h`.
3. **Inmutabilidad de Estado y Prevención de Fugas**:
   - Manejadores de temporizadores (`setInterval`, `setTimeout`) y observadores (`ResizeObserver`) deben limpiar adecuadamente sus suscripciones al desmontar para prevenir fugas de memoria.
   - Operaciones de fusión de datos locales (`combineAndMergeBackups`) deben operar sobre copias inmutables sin mutar referencias directas de objetos compartidos.
4. **Validadores Automatizados**:
   - `npm run audit:test`: Valida el motor de hallazgos y el ledger de cobertura según `report-schema.json`.

