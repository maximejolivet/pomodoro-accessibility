/** « 25:00 » à partir d'un nombre de secondes. */
export function formatTime(seconds: number): string {
  const total = Math.ceil(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Découpe une durée pour l'affichage : en dessous d'une minute elle se dit en secondes,
 * au-delà en minutes. Les durées réglables (`STEP_DURATIONS`) sont soit l'un, soit
 * l'autre, jamais un mélange — « 1 min 30 » ne se lit pas d'un coup d'œil.
 */
export function durationParts(seconds: number): { value: number; unit: 'seconds' | 'minutes' } {
  return seconds < 60
    ? { value: Math.round(seconds), unit: 'seconds' }
    : { value: Math.round(seconds / 60), unit: 'minutes' };
}
