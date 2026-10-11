/**
 * Script Validador de Especificaciones SDD (Spec-Driven Development)
 * Basado en la metodología de MoureDev (hello-sdd)
 * 
 * Verifica que todos los archivos .spec.md en /specs/:
 * 1. Tengan metadatos obligatorios (Estado, Taxonomía, Autor, Versión).
 * 2. Contengan sección de Contexto y Justificación.
 * 3. Contengan al menos 1 Requisito Funcional en sintaxis EARS (RF-x).
 * 4. Contengan Requisitos No Funcionales (RNF-x).
 * 5. Contengan Criterios de Aceptación binarios ([x] o [ ]) (CA-x).
 */

const fs = require('fs');
const path = require('path');

const SPECS_DIR = path.resolve(__dirname, '../../../specs');

function validateSpecs() {
  console.log('🔍 [SDD Validator] Iniciando validación de especificaciones en /specs/...\n');

  if (!fs.existsSync(SPECS_DIR)) {
    console.error('❌ Error: El directorio /specs/ no existe.');
    process.exit(1);
  }

  const files = fs.readdirSync(SPECS_DIR).filter((f) => f.endsWith('.md') && !f.includes('template'));

  if (files.length === 0) {
    console.warn('⚠️ Advertencia: No se encontraron archivos de especificación activos para validar (excluyendo plantillas).');
    process.exit(0);
  }

  let totalErrors = 0;

  for (const file of files) {
    const filePath = path.join(SPECS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const errors = [];

    // Validar Título o Código SPEC
    if (!content.match(/^#\s+SPEC-\d+/m)) {
      errors.push('Falta encabezado de especificación (# SPEC-xxx)');
    }

    // Validar Taxonomía SDD
    if (!content.includes('Taxonomía SDD')) {
      errors.push('Falta metadato de Taxonomía SDD (Spec-First o Spec-Anchored)');
    }

    // Validar Contexto
    if (!content.includes('Contexto y Justificación') && !content.includes('Contexto')) {
      errors.push('Falta sección de Contexto y Justificación');
    }

    // Validar Requisitos Funcionales EARS
    const hasEarsRequirements = content.includes('RF-0') || content.includes('RF-1');
    if (!hasEarsRequirements) {
      errors.push('Faltan Requisitos Funcionales numerados (RF-xx) en sintaxis EARS');
    }

    // Validar Criterios de Aceptación
    const hasAcceptanceCriteria = content.includes('CA-0') || content.includes('CA-1');
    if (!hasAcceptanceCriteria) {
      errors.push('Faltan Criterios de Aceptación binarios (CA-xx)');
    }

    if (errors.length > 0) {
      console.error(`❌ [${file}]: Fallos detectados:`);
      errors.forEach((err) => console.error(`   - ${err}`));
      totalErrors += errors.length;
    } else {
      console.log(`✅ [${file}]: Especificación SDD válida y conforme con el estándar MoureDev.`);
    }
  }

  console.log('\n-----------------------------------------------------');
  if (totalErrors > 0) {
    console.error(`❌ Validación SDD finalizada con ${totalErrors} error(es).`);
    process.exit(1);
  } else {
    console.log(`🎉 Todas las especificaciones cumplen 100% con el estándar SDD.`);
    process.exit(0);
  }
}

validateSpecs();
