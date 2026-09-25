import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_GOAL_MINUTES, GOAL_MAX_MINUTES, GOAL_MIN_MINUTES, GOAL_STEP_MINUTES, MAX_SESSIONS
} from '../constants/history.constants';
import { readJson, readPref, writeJson, writePref } from '../helpers/storage';
import type { DayStat, Session } from '../models/session.model';

const STORAGE_KEY = 'history';
const GOAL_KEY = 'daily-goal';

function clampGoal(minutes: number): number {
  const stepped = Math.round(minutes / GOAL_STEP_MINUTES) * GOAL_STEP_MINUTES;
  return Math.max(GOAL_MIN_MINUTES, Math.min(GOAL_MAX_MINUTES, stepped));
}

function savedGoal(): number {
  const raw = Number(readPref(GOAL_KEY));
  return raw ? clampGoal(raw) : DEFAULT_GOAL_MINUTES;
}

function dayKey(time: number): string {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfDay(time: number): number {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly sessions = signal<Session[]>(readJson<Session[]>(STORAGE_KEY, []));
  /** Début du jour courant : les statistiques « du jour » se recalculent quand il change. */
  readonly dayStart = signal(startOfDay(Date.now()));
  /** Objectif quotidien de focus (minutes). */
  readonly dailyGoal = signal(savedGoal());

  constructor() {
    this.scheduleMidnight();
  }

  readonly recent = computed(() => this.sessions().slice(-10).reverse());

  readonly today = computed(() => {
    const from = this.dayStart();
    const todays = this.sessions().filter(s => s.endedAt >= from && s.kind === 'focus');
    return {
      focusMinutes: Math.round(todays.reduce((sum, s) => sum + s.activeSeconds, 0) / 60),
      sessions: todays.filter(s => s.completed).length
    };
  });

  /** Avancement vers l'objectif du jour (0 à 1, plafonné). */
  readonly goalProgress = computed(() => Math.min(1, this.today().focusMinutes / this.dailyGoal()));

  /** Minutes de focus par jour sur les 7 derniers jours (aujourd'hui en dernier). */
  readonly week = computed<DayStat[]>(() => {
    const totals = new Map<string, number>();
    for (const s of this.sessions()) {
      if (s.kind !== 'focus') continue;
      const key = dayKey(s.endedAt);
      totals.set(key, (totals.get(key) ?? 0) + s.activeSeconds);
    }
    const today = this.dayStart();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return { date, focusMinutes: Math.round((totals.get(dayKey(date.getTime())) ?? 0) / 60) };
    });
  });

  /** Jours consécutifs (jusqu'à aujourd'hui, ou hier si rien encore aujourd'hui) avec une session de travail terminée. */
  readonly streak = computed(() => {
    const days = new Set(
      this.sessions().filter(s => s.kind === 'focus' && s.completed).map(s => dayKey(s.endedAt))
    );
    const cursor = new Date(this.dayStart());
    if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (days.has(dayKey(cursor.getTime()))) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  });

  add(session: Session): void {
    const next = [...this.sessions(), session].slice(-MAX_SESSIONS);
    this.sessions.set(next);
    writeJson(STORAGE_KEY, next);
  }

  setDailyGoal(minutes: number): void {
    const goal = clampGoal(minutes);
    this.dailyGoal.set(goal);
    writePref(GOAL_KEY, String(goal));
  }

  /** Passe au jour suivant si minuit est passé (à appeler aussi au retour d'arrière-plan). */
  refreshDay(): void {
    const day = startOfDay(Date.now());
    if (day !== this.dayStart()) this.dayStart.set(day);
  }

  clear(): void {
    this.sessions.set([]);
    writeJson(STORAGE_KEY, []);
  }

  private scheduleMidnight(): void {
    const next = new Date(this.dayStart());
    next.setDate(next.getDate() + 1);
    setTimeout(() => {
      this.refreshDay();
      this.scheduleMidnight();
    }, Math.max(1000, next.getTime() - Date.now()));
  }
}
