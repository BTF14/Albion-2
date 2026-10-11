/**
 * Reproductor de alertas sonoras puras usando Web Audio API nativo.
 * No requiere archivos externos ni dependencias, funciona 100% offline.
 */

let audioCtx: AudioContext | null = null;

export function playHarvestChime(enabled: boolean = true): void {
  if (!enabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Primer tono: Nota D5 (587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0.01, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Segundo tono: Nota A5 (880 Hz) - Más brillante y alegre
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);

    gain2.gain.setValueAtTime(0.01, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.20);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.75);
  } catch (err) {
    // Si el navegador bloquea audio sin interacción del usuario, silenciar sin error
    console.warn('Audio chime notification prevented by browser policy', err);
  }
}
