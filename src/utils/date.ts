/**
 * Utilidades de fecha libres de desfase de zona horaria (Timezone Safe).
 * En navegadores en zonas horarias negativas (América Latina, Norteamérica, etc.),
 * llamar a .toISOString().split('T')[0] sobre una fecha local causa un retroceso de 1 día.
 * Estas funciones garantizan precisión local absoluta.
 */

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseYMDToLocalDate(ymd: string): Date {
  if (!ymd) return new Date();
  const parts = ymd.split('-');
  if (parts.length !== 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 12, 0, 0); // Mediodía para evitar cualquier salto de horario
}

export function formatLongSpanishDate(ymd: string): string {
  const dateObj = parseYMDToLocalDate(ymd);
  return dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
