---
name: karpathy-guidelines
origin: skills.sh/karpathy-coding-guidelines
description: Las 4 reglas esenciales de ingeniería y desarrollo asistido por IA formuladas por Andrej Karpathy en skills.sh.
---

# Skill: Karpathy Coding Guidelines (skills.sh)

Esta habilidad codifica las 4 reglas maestras de Andrej Karpathy (ex-OpenAI / Tesla AI) para programar con agentes de Inteligencia Artificial sin degradar el código ni generar bugs silenciosos.

## 1. Las 4 Reglas de Andrej Karpathy

### Regla 1: Nunca Adivines; Verifica con Datos o Pruebas (Never Guess)
- No asumas qué hace una función, cuál es el estado de `localStorage` o qué devuelve una fórmula.
- Inspecciona los archivos directamente (`view_file`), ejecuta pruebas (`npm run audit:test`) y verifica con números concretos antes de escribir código.

### Regla 2: Cambios Pequeños y Atómicos (Make Small, Atomic Changes)
- No intentes reescribir 10 archivos en un solo paso monumental.
- Realiza modificaciones quirúrgicas: diseña el tipo, crea la función pura, conéctala en el hook y luego actualiza el componente.
- Cada cambio debe compilar y pasar las pruebas de forma aislada.

### Regla 3: Lee los Mensajes de Error en su Totalidad (Read Errors Completely)
- Cuando el compilador TypeScript (`tsc`) o el test runner arroje un error, no asumas la causa tras leer la primera línea.
- Lee el stack trace completo, la línea exacta y el tipo de dato que causó la discrepancia.

### Regla 4: Escribe Pruebas para Demostrar Corrección, No Confianza (Prove Correctness)
- La intuición del modelo de lenguaje es falible; la matemática y los tests son deterministas.
- Si afirmas que una fórmula de RRR o un cálculo de beneficio es correcto, acompáñalo de una validación reproducible que demuestre que el resultado esperado es idéntico al calculado.
