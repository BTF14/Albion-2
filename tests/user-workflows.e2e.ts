import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('E2E Workflow: Apertura y cierre de la Paleta de Comandos (Ctrl+K)', async ({ app, screen }) => {
  await app.open('/');
  
  // Abrir la paleta con el botón "Buscar" del Navbar
  const searchButton = screen.getByRole('button', { name: /Buscar/i });
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  // Verificar que el modal de búsqueda se abre con su input
  const searchInput = screen.getByRole('textbox', { name: /Buscar módulo/i });
  await expect(searchInput).toBeVisible();

  // Escribir en el buscador
  await searchInput.fill('Cocina');

  // Verificar que aparece el resultado y hacer clic para navegar
  const resultItem = screen.getByRole('button', { name: /Calculadora de Valor Agregado/i });
  await expect(resultItem).toBeVisible();
  await resultItem.click();

  // Verificar que navega a la vista de Cocina & Alquimia
  await expect(screen.getByRole('heading', { name: /Valor Agregado: Cocina & Alquimia/i })).toBeVisible();
});

test('E2E Workflow: Apertura y controles del Modal de Respaldo de Datos (JSON v2)', async ({ app, screen }) => {
  await app.open('/');

  // Abrir el modal de respaldo
  const backupBtn = screen.getByRole('button', { name: /Respaldo/i });
  await expect(backupBtn).toBeVisible();
  await backupBtn.click();

  // Verificar que el modal de respaldo renderiza opciones oficiales
  await expect(screen.getByRole('heading', { name: /Respaldo Completo de Datos/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Descargar Archivo de Respaldo/i })).toBeVisible();
  await expect(screen.getByRole('heading', { name: /Restaurar Copia de Seguridad/i })).toBeVisible();

  // Cerrar el modal con su botón Cerrar
  await screen.getByRole('button', { name: /Cerrar/i }).click();
});

test('E2E Workflow: Navegación por categorías de cultivo en Registro Diario', async ({ app, screen }) => {
  await app.open('/');

  // Verificar selectores de categoría en el formulario
  await expect(screen.getByRole('button', { name: /Cultivos \(Vegetales\)/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Huerto de Hierbas/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Huevos & Leche/i })).toBeVisible();

  // Cambiar a la categoría de Hierbas
  await screen.getByRole('button', { name: /Huerto de Hierbas/i }).click();

  // Verificar que se listan hierbas de Albion mediante su botón de ítem
  await expect(screen.getByRole('button', { name: /Agárico arcano/i })).toBeVisible();

  // Cambiar a Huevos & Leche (Ganadería)
  await screen.getByRole('button', { name: /Huevos & Leche/i }).click();
  await expect(screen.getByRole('button', { name: /Gallina/i })).toBeVisible();
});

test('E2E Workflow: Navegación a Cosas por Hacer y Rutinas Diarias', async ({ app, screen }) => {
  await app.open('/');

  // Navegar a Cosas por Hacer
  await screen.getByRole('button', { name: /Cosas por Hacer/i }).click();

  // Verificar que renderiza el panel de tareas con sus botones
  await expect(screen.getByRole('heading', { name: /Lista de Cosas por Hacer/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Sincronizar Islas/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Plantillas Albion/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Agregar Tarea o Isla/i })).toBeVisible();
});

test('E2E Workflow: Pestaña de Pesca & Salsas tiene botón de Dar Resultado y ciclo de cálculo', async ({ app, screen }) => {
  await app.open('/');

  // Navegar a la pestaña de Pesca & Salsas
  const navBtn = screen.getByRole('button', { name: /Pesca & Salsas/i });
  await expect(navBtn).toBeVisible();
  await navBtn.click();

  // Verificar título del taller
  await expect(screen.getByRole('heading', { name: /Taller de Pesca, Fileteado y Salsas de Comida/i })).toBeVisible();

  // Verificar que antes de presionar el botón está en estado de espera
  await expect(screen.getByText(/Listo para Calcular/i)).toBeVisible();
  const calcBtn = screen.getByRole('button', { name: /Dar Resultado \/ Calcular Arbitraje/i });
  await expect(calcBtn).toBeVisible();

  // Presionar el botón Dar Resultado
  await calcBtn.click();

  // Verificar que se revelan los resultados calculados
  await expect(screen.getByText(/Veredicto del Analizador/i)).toBeVisible();
  await expect(screen.getByText(/Venta Cruda Entera/i)).toBeVisible();
  await expect(screen.getByText(/Filetear Picado/i)).toBeVisible();
  await expect(screen.getByText(/Análisis Detallado por Receta de Salsa de Cocina/i)).toBeVisible();

  // Verificar que aparece el botón Limpiar
  const clearBtn = screen.getByRole('button', { name: /Limpiar/i });
  await expect(clearBtn).toBeVisible();
  await clearBtn.click();

  // Verificar que vuelve al estado de espera
  await expect(screen.getByText(/Listo para Calcular/i)).toBeVisible();
});

test('E2E Workflow: Optimizador de Foco ciclo oficial con botón Dar Resultado', async ({ app, screen }) => {
  await app.open('/');

  // Navegar a la pestaña Optimizador de Foco
  const navBtn = screen.getByRole('button', { name: /Optimizador de Foco/i });
  await expect(navBtn).toBeVisible();
  await navBtn.click();

  // Verificar título
  await expect(screen.getByRole('heading', { name: /Optimizador de Foco Diario/i })).toBeVisible();

  // Estado inicial de espera
  await expect(screen.getByText(/Listo para Optimizar/i)).toBeVisible();
  const calcBtn = screen.getByRole('button', { name: /Dar Resultado \/ Optimizar Foco Diario/i });
  await expect(calcBtn).toBeVisible();

  // Ejecutar cálculo
  await calcBtn.click();

  // Verificar que se revelan los resultados calculados
  await expect(screen.getByText(/Opción Más Rentable Hoy/i)).toBeVisible();
  await expect(screen.getByText(/Ranking de Foco Calculado/i)).toBeVisible();

  // Probar botón Limpiar
  const clearBtn = screen.getByRole('button', { name: /Limpiar/i });
  await expect(clearBtn).toBeVisible();
  await clearBtn.click();

  // Vuelve a estar en espera
  await expect(screen.getByText(/Listo para Optimizar/i)).toBeVisible();
});



