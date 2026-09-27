import { Injectable, signal } from '@angular/core';
import { PRESET_COLORS } from '../constants/preset.constants';
import {
  DEFAULT_ROUTINES, MAX_ROUNDS, MAX_STEP_SECONDS, MIN_STEP_SECONDS, STEP_ICONS
} from '../constants/routine.constants';
import { readJson, writeJson } from '../helpers/storage';
import { normalizeReminder, type Routine, type RoutineStep } from '../models/routine.model';

const STORAGE_KEY = 'routines';

/** Tours relus du stockage : un entier de 1 à `MAX_ROUNDS`, sinon un seul tour. */
function normalizeRounds(rounds: unknown): number {
  if (!Number.isInteger(rounds)) return 1;
  return Math.max(1, Math.min(MAX_ROUNDS, rounds as number));
}

/** Routines enregistrées : mêmes règles que les modes, mais la liste peut être vide. */
@Injectable({ providedIn: 'root' })
export class RoutineService {
  readonly routines = signal<Routine[]>(this.load());

  byId(id: string | null | undefined): Routine | undefined {
    return this.routines().find(r => r.id === id);
  }

  save(routine: Routine): void {
    const list = this.routines();
    const exists = list.some(r => r.id === routine.id);
    this.update(exists ? list.map(r => (r.id === routine.id ? routine : r)) : [...list, routine]);
  }

  remove(id: string): void {
    this.update(this.routines().filter(r => r.id !== id));
  }

  restoreDefaults(): void {
    this.update(DEFAULT_ROUTINES.map(r => ({ ...r, steps: r.steps.map(s => ({ ...s })) })));
  }

  newRoutine(): Routine {
    return { id: `routine-${Date.now().toString(36)}`, name: '', icon: STEP_ICONS[0], steps: [this.newStep()] };
  }

  newStep(): RoutineStep {
    return {
      id: `step-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
      name: '',
      icon: STEP_ICONS[Math.floor(Math.random() * STEP_ICONS.length)],
      seconds: 10 * 60,
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      kind: 'focus'
    };
  }

  private update(list: Routine[]): void {
    this.routines.set(list);
    writeJson(STORAGE_KEY, list);
  }

  /**
   * Une routine sans étape ne peut pas se jouer : elle est écartée au chargement,
   * comme un mode sans durée l'est côté modes.
   */
  private load(): Routine[] {
    const saved = readJson<Routine[] | null>(STORAGE_KEY, null);
    if (!Array.isArray(saved)) return DEFAULT_ROUTINES.map(r => ({ ...r, steps: r.steps.map(s => ({ ...s })) }));
    return saved
      .filter(
        r =>
          r &&
          typeof r.id === 'string' &&
          Array.isArray(r.steps) &&
          r.steps.length > 0 &&
          r.steps.every(s => s && typeof s.id === 'string' && s.seconds > 0 && typeof s.color === 'string')
      )
      // Un rappel illisible est écarté sans emporter la routine, qui se lance très bien à la main
      .map(r => ({
        ...r,
        rounds: normalizeRounds(r.rounds),
        steps: r.steps.map(step => ({
          ...step,
          seconds: Math.max(MIN_STEP_SECONDS, Math.min(MAX_STEP_SECONDS, Math.round(step.seconds)))
        })),
        reminder: normalizeReminder(r.reminder)
      }));
  }
}
