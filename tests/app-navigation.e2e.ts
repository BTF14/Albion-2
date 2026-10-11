import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('E2E UI: Abre la aplicación y renderiza el título oficial', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByText('Albion Farm & Livestock')).toBeVisible();
});

test('E2E UI: Barra de navegación superior muestra las pestañas clave', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('button', { name: /Registrar Cosecha/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Cocina & Alquimia/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Optimizador de Foco/i })).toBeVisible();
  await expect(screen.getByRole('button', { name: /Cosas por Hacer/i })).toBeVisible();
});

test('E2E UI: Cambio a la pestaña de Cocina & Alquimia y verificación de recetas', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', { name: /Cocina & Alquimia/i }).click();
  await expect(screen.getByRole('heading', { name: /Valor Agregado: Cocina & Alquimia/i })).toBeVisible();
});

test('E2E UI: Navegación a Optimizador de Foco y Cosas por Hacer', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', { name: /Optimizador de Foco/i }).click();
  await expect(screen.getByRole('heading', { name: /Optimizador de Foco Diario/i })).toBeVisible();

  await screen.getByRole('button', { name: /Cosas por Hacer/i }).click();
  await expect(screen.getByRole('heading', { name: /Lista de Cosas por Hacer/i })).toBeVisible();
});
