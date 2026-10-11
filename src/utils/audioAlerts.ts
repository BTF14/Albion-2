/**
 * Módulo de Alertas Sonoras y Notificaciones del Navegador (Web Audio API & Notifications)
 * Albion Online - Clean Architecture (Gentleman Programming)
 * 
 * Principio: Cero dependencias de archivos de audio externos para funcionamiento 100% offline.
 * Sintetiza un timbre armónico suave usando osciladores nativos de la Web Audio API.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Reproduce un tono armónico de campana de Albion (528 Hz -> 1056 Hz)
 */
export function playAlbionChime(type: 'harvest_ready' | 'focus_cap_warning' | 'success' = 'harvest_ready'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';

    if (type === 'focus_cap_warning') {
      // Tono de advertencia doble
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Campana de cosecha lista / éxito
      osc.frequency.setValueAtTime(528, now); // Frecuencia Solfeggio 528Hz
      osc.frequency.exponentialRampToValueAtTime(1056, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.65);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch {
    // Manejo silencioso si el navegador bloquea audio sin interacción previa
  }
}

/**
 * Solicita permiso de notificaciones de escritorio al usuario
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }
  return false;
}

/**
 * Despacha una notificación del navegador con sonido
 */
export function sendAlbionNotification(title: string, body: string, type: 'harvest_ready' | 'focus_cap_warning' = 'harvest_ready'): void {
  playAlbionChime(type);
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icon.svg',
      });
    } catch {}
  }
}
