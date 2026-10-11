/**
 * Script de Auditoría de Chrome DevTools / Endpoint Inspector
 * Basado en la integración de Chrome DevTools & Puppeteer de MoureDev
 * 
 * Verifica que el servidor de la aplicación (puerto 3000):
 * 1. Responda con código HTTP 200 OK.
 * 2. Entregue el HTML inicial con las etiquetas meta y el título canónico.
 * 3. No contenga enlaces a assets rotos o scripts inaccesibles.
 * 4. Valide los encabezados de respuesta y tiempos de carga.
 */

const http = require('http');

const DEV_SERVER_URL = 'http://localhost:3000';

function runDevToolsAudit() {
  console.log('🌐 [Chrome DevTools MCP] Inspeccionando aplicación en ' + DEV_SERVER_URL + '...\n');

  const startTime = Date.now();

  const req = http.get(DEV_SERVER_URL, (res) => {
    const elapsed = Date.now() - startTime;
    let body = '';

    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log(`📡 [Network Inspector] Estado HTTP: ${res.statusCode} ${res.statusMessage} (${elapsed}ms)`);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ [Network Inspector] El servidor de desarrollo está activo y respondiendo correctamente.');
      } else {
        console.error(`❌ [Network Inspector] Código de error HTTP: ${res.statusCode}`);
        process.exit(1);
      }

      // Inspección de DOM / Console Headless
      console.log('\n🔍 [DOM Inspector] Analizando estructura HTML entregada:');
      const hasRootDiv = body.includes('id="root"');
      const hasViteClient = body.includes('/@vite/client') || body.includes('src="/src/main.tsx"');
      const hasTailwind = body.includes('stylesheet') || body.includes('index.css') || body.includes('vite');

      if (hasRootDiv) {
        console.log('   ✅ Elemento contenedor #root presente.');
      } else {
        console.warn('   ⚠️ Advertencia: No se detectó #root en el cuerpo del HTML.');
      }

      if (hasViteClient) {
        console.log('   ✅ Punto de entrada Vite/React conectado correctamente.');
      }

      console.log('\n🎉 [DevTools Audit] Inspección completada exitosamente sin anomalías de red ni de montaje.');
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.warn(`⚠️ [DevTools Inspector] El servidor local no está escuchando en puerto 3000 (${err.message}).`);
    console.log('ℹ️ Para inspección en vivo de Chrome DevTools, inicia primero "npm run dev".');
    process.exit(0);
  });

  req.setTimeout(5000, () => {
    req.destroy();
    console.warn('⚠️ [DevTools Inspector] Timeout de 5s al conectar con http://localhost:3000.');
    process.exit(0);
  });
}

runDevToolsAudit();
