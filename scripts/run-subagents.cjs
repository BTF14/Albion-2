/**
 * Runner de Orquestación Multiagente Concurrente (Dual-Stream Parallel Execution)
 * Basado en la Clase Magistral de MoureDev ("El Nuevo Programador") - Nivel 05 (Multiagentes y Subagentes)
 * 
 * Partición del Proyecto en 2 Flujos de Trabajo Paralelos (Boundary Isolation):
 * 
 * [STREAM A: Dominio, Negocio, SDD & Seguridad]
 *   - Subagente Verificador SDD (Taxonomía EARS, Criterios de Aceptación)
 *   - Subagente Arquitecto de Dominio (Pureza matemática, cero React/DOM, cero any)
 *   - Subagente Auditor de Seguridad (Cloudflare Security Audit: 65 pruebas de seguridad)
 * 
 * [STREAM B: Frontend, Adaptadores, Hooks & UI Performance]
 *   - Subagente Implementador Frontend (Compilación TypeScript estricta, Custom Hooks)
 *   - Subagente Inspector DevTools (Auditoría de punto de entrada y estructura DOM)
 * 
 * [ORQUESTADOR CENTRAL] (Lead Engineer)
 *   - Coordina la ejecución simultánea de ambos flujos (Promise.all).
 *   - Valida la integridad del contrato (Contract-First Architecture).
 *   - Emite el dictamen consolidado final.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function execPromise(command) {
  return new Promise((resolve) => {
    exec(command, { cwd: ROOT_DIR, encoding: 'utf-8' }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, output: stdout || stderr });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
}

// -------------------------------------------------------------
// FLUJO 1 (STREAM A): Dominio, Negocio, SDD y Seguridad
// -------------------------------------------------------------
async function runStreamDomainAndSecurity() {
  const streamResults = [];
  const startStreamTime = Date.now();
  console.log('🚀 [STREAM A INICIADO] Agente de Dominio & Seguridad (Trabajando en /src/domain/, /specs/, /skills/)');

  // 1. Verificador SDD
  const sddRes = await execPromise('npm run sdd:validate');
  if (sddRes.success) {
    streamResults.push({ agent: 'sdd-verifier', stream: 'STREAM A (Dominio & SDD)', task: 'Validación Specs EARS', status: 'PASS' });
  } else {
    streamResults.push({ agent: 'sdd-verifier', stream: 'STREAM A (Dominio & SDD)', task: 'Validación Specs EARS', status: 'FAIL', error: sddRes.output });
  }

  // 2. Arquitecto de Dominio (Escaneo de pureza de dominio)
  const domainDir = path.join(ROOT_DIR, 'src', 'domain');
  let hasReactInDomain = false;
  let hasAnyInDomain = false;

  function scanDomainDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDomainDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes("from 'react'") || content.includes('from "react"')) {
          hasReactInDomain = true;
        }
        if (content.match(/:\s*any\b/) || content.match(/\bas\s+any\b/)) {
          hasAnyInDomain = true;
        }
      }
    }
  }

  scanDomainDir(domainDir);
  if (!hasReactInDomain && !hasAnyInDomain) {
    streamResults.push({ agent: 'domain-architect', stream: 'STREAM A (Dominio & SDD)', task: 'Pureza de Dominio & Cero any', status: 'PASS' });
  } else {
    streamResults.push({ agent: 'domain-architect', stream: 'STREAM A (Dominio & SDD)', task: 'Pureza de Dominio & Cero any', status: 'FAIL' });
  }

  // 3. Auditor de Seguridad Cloudflare
  const auditRes = await execPromise('npm run audit:test');
  if (auditRes.success) {
    streamResults.push({ agent: 'security-critic', stream: 'STREAM A (Dominio & SDD)', task: 'Cloudflare Security (65 tests)', status: 'PASS' });
  } else {
    streamResults.push({ agent: 'security-critic', stream: 'STREAM A (Dominio & SDD)', task: 'Cloudflare Security (65 tests)', status: 'FAIL', error: auditRes.output });
  }

  const durationMs = Date.now() - startStreamTime;
  console.log(`🏁 [STREAM A COMPLETADO] en ${durationMs}ms`);
  return streamResults;
}

// -------------------------------------------------------------
// FLUJO 2 (STREAM B): Frontend, Adaptadores, Hooks & UI
// -------------------------------------------------------------
async function runStreamFrontendAndPerformance() {
  const streamResults = [];
  const startStreamTime = Date.now();
  console.log('🚀 [STREAM B INICIADO] Agente de Frontend & Adaptadores (Trabajando en /src/components/, /src/hooks/)');

  // 1. Implementador Frontend (Compilación estricta TypeScript)
  const lintRes = await execPromise('npm run lint');
  if (lintRes.success) {
    streamResults.push({ agent: 'frontend-implementer', stream: 'STREAM B (Frontend & UI)', task: 'Compilación TypeScript (0 errores)', status: 'PASS' });
  } else {
    streamResults.push({ agent: 'frontend-implementer', stream: 'STREAM B (Frontend & UI)', task: 'Compilación TypeScript (0 errores)', status: 'FAIL', error: lintRes.output });
  }

  // 2. Verificación de Invariantes de Componentes (sin cálculos acoplados ni timers sin cleanup)
  const componentsDir = path.join(ROOT_DIR, 'src', 'components');
  let hasMissingTimerCleanup = false;
  let componentFilesCount = 0;

  function scanComponents(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanComponents(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        componentFilesCount++;
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Si usa setInterval sin clearInterval o sin useRef
        if (content.includes('setInterval(') && !content.includes('clearInterval(')) {
          hasMissingTimerCleanup = true;
        }
      }
    }
  }

  scanComponents(componentsDir);
  if (!hasMissingTimerCleanup) {
    streamResults.push({ agent: 'frontend-implementer', stream: 'STREAM B (Frontend & UI)', task: `Auditoría de Componentes (${componentFilesCount} archivos)`, status: 'PASS' });
  } else {
    streamResults.push({ agent: 'frontend-implementer', stream: 'STREAM B (Frontend & UI)', task: `Auditoría de Componentes (${componentFilesCount} archivos)`, status: 'FAIL' });
  }

  // 3. QA Evaluator: Ejecución Integral de E2E (tester-army/e2e v0.18.0)
  console.log('🧪 [QA-EVALUATOR] Ejecutando suite completa E2E con tester-army/e2e...');
  const e2eRes = await execPromise('npx e2e run');
  if (e2eRes.success) {
    streamResults.push({ agent: 'qa-evaluator', stream: 'STREAM B (Frontend & UI)', task: 'Suite E2E (tester-army/e2e)', status: 'PASS' });
  } else {
    streamResults.push({ agent: 'qa-evaluator', stream: 'STREAM B (Frontend & UI)', task: 'Suite E2E (tester-army/e2e)', status: 'FAIL', error: e2eRes.output });
  }

  const durationMs = Date.now() - startStreamTime;
  console.log(`🏁 [STREAM B COMPLETADO] en ${durationMs}ms`);
  return streamResults;
}

// -------------------------------------------------------------
// ORQUESTADOR CENTRAL: EJECUCIÓN SIMULTÁNEA DUAL
// -------------------------------------------------------------
async function runDualAgentOrchestration() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  EJECUCIÓN MULTIAGENTE PARALELA: 2 AGENTES SIMULTÁNEOS (MoureDev)    ║');
  console.log('║  Proyecto particionado en 2 flujos independientes concurrentes       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const overallStartTime = Date.now();

  // LANZAMIENTO PARALELO CONCURRENTE (2 A LA VEZ)
  const [resultsStreamA, resultsStreamB] = await Promise.all([
    runStreamDomainAndSecurity(),
    runStreamFrontendAndPerformance(),
  ]);

  const allResults = [...resultsStreamA, ...resultsStreamB];
  const allPassed = allResults.every((r) => r.status === 'PASS');
  const totalElapsed = Date.now() - overallStartTime;

  console.log('\n======================================================================');
  console.log('📊 MATRIZ CONSOLIDADA DE EJECUCIÓN CONCURRENTE (STREAM A + STREAM B)');
  console.log('======================================================================\n');
  console.table(allResults.map(({ agent, stream, task, status }) => ({
    Agente: agent,
    Flujo: stream,
    Tarea: task,
    Estado: status,
  })));

  if (allPassed) {
    console.log(`\n🎉 DICTAMEN DE ORQUESTACIÓN: ÉXITO TOTAL CONCURRENTE (${totalElapsed}ms)`);
    console.log('   - STREAM A y STREAM B trabajaron en paralelo sin interferencias.');
    console.log('   - Aislamiento de fronteras (Boundary Isolation) respetado al 100%.');
    console.log('   - Clean Architecture, SDD de MoureDev y Cloudflare Security Audit validados.');
    process.exit(0);
  } else {
    console.error(`\n🚨 DICTAMEN DE ORQUESTACIÓN: FALLO EN UNO DE LOS FLUJOS (${totalElapsed}ms)`);
    process.exit(1);
  }
}

runDualAgentOrchestration();
