/** Accès à localStorage tolérant aux erreurs (navigation privée, stockage bloqué). */

const PREFIX = 'pomodoro-tdah.';

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // stockage indisponible : le réglage reste valable pour la session
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readPref(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  writePref(key, JSON.stringify(value));
}

/** Préférence booléenne, vraie par défaut sauf si enregistrée à 'off'. */
export function readFlag(key: string, fallback = true): boolean {
  const raw = readPref(key);
  return raw === null ? fallback : raw !== 'off';
}

export function writeFlag(key: string, on: boolean): void {
  writePref(key, on ? 'on' : 'off');
}

/** Préférence à choix multiple : une valeur inconnue (version précédente, stockage bricolé) est ignorée. */
export function readOption<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const raw = readPref(key);
  return allowed.includes(raw as T) ? (raw as T) : fallback;
}
