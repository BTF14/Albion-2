import { AlbionServerRegion, ALBION_SERVERS, ServerResetTimeInfo } from '../models/dailyEvents';

/**
 * Caso de Uso Puro (Gentleman Programming):
 * Calcula la hora UTC oficial del servidor de Albion Online y el tiempo
 * restante exacto hasta el reinicio diario del servidor según la región (América, Europa o Asia).
 * 
 * Reglas de Albion:
 * - América (Washington D.C.): Reinicio a las 10:00:00 UTC
 * - Europa (Ámsterdam): Reinicio a las 10:00:00 UTC
 * - Asia (Singapur): Reinicio a las 23:00:00 UTC
 */
export function calculateServerResetCountdown(
  serverRegion: AlbionServerRegion = 'americas',
  now: Date = new Date()
): ServerResetTimeInfo {
  const serverConfig = ALBION_SERVERS[serverRegion] || ALBION_SERVERS.americas;
  const maintenanceHour = serverConfig.maintenanceHourUtc;

  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();

  // Fecha objetivo: hoy a la hora de mantenimiento UTC correspondiente
  const resetToday = new Date(Date.UTC(utcYear, utcMonth, utcDate, maintenanceHour, 0, 0, 0));
  let targetReset = resetToday;

  // Si ya pasó la hora de reinicio UTC hoy, el próximo reinicio es mañana
  if (now.getTime() >= resetToday.getTime()) {
    targetReset = new Date(Date.UTC(utcYear, utcMonth, utcDate + 1, maintenanceHour, 0, 0, 0));
  }

  const diffMs = Math.max(0, targetReset.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Ventana de mantenimiento diario de Albion (habitualmente los primeros 30 minutos)
  const isMaintenanceWindow = utcHours === maintenanceHour && utcMinutes < 30;

  // Fecha de inicio del ciclo diario de 24h actual
  const cycleStart =
    now.getTime() >= resetToday.getTime()
      ? resetToday
      : new Date(Date.UTC(utcYear, utcMonth, utcDate - 1, maintenanceHour, 0, 0, 0));
  const currentCycleDateUtc = cycleStart.toISOString().split('T')[0];

  const currentUtcString = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:${String(
    utcSeconds
  ).padStart(2, '0')} UTC`;

  return {
    currentUtcString,
    secondsUntilReset: totalSeconds,
    hoursRemaining: hours,
    minutesRemaining: minutes,
    secondsRemaining: seconds,
    formattedCountdown: `${hours} h ${minutes} m`,
    formattedCountdownDetailed: `${hours} h ${minutes} m ${seconds} s`,
    isMaintenanceWindow,
    currentCycleDateUtc,
  };
}
