import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { App } from '@capacitor/app';
import { MIN_RECORDED_SECONDS } from '../constants/history.constants';
import {
  EXTRA_SECONDS, LATE_ALERT_SECONDS, LONG_BREAK_EVERY, MAX_MINUTES, MILESTONES
} from '../constants/timer.constants';
import { readPref, writePref } from '../helpers/storage';
import { formatTime } from '../helpers/time';
import { I18nService } from '../i18n/i18n.service';
import type { I18nKey } from '../i18n/i18n.model';
import type { Alert } from '../models/alert.model';
import type { Preset, PresetKind } from '../models/preset.model';
import type { ActiveSession } from '../models/session.model';
import { HistoryService } from './history.service';
import { KeepAwakeService } from './keep-awake.service';
import { NotificationService } from './notification.service';
import { PreferencesService } from './preferences.service';
import { PresetService } from './preset.service';
import { SoundService } from './sound.service';
import { TimerService } from './timer.service';
import { WidgetService } from './widget.service';

/**
 * Session en cours : durée réglée, mode sélectionné, enchaînement travail → pause,
 * écriture dans l'historique, sons, notifications et widget.
 *
 * Cet état vit dans un service racine, et non dans la page : la page est détruite dès
 * que l'utilisateur ouvre la page d'accessibilité, et une session en cours serait perdue.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly timer = inject(TimerService);
  private readonly history = inject(HistoryService);
  private readonly presetService = inject(PresetService);
  private readonly prefs = inject(PreferencesService);
  private readonly sound = inject(SoundService);
  private readonly notifications = inject(NotificationService);
  private readonly keepAwake = inject(KeepAwakeService);
  private readonly widget = inject(WidgetService);
  private readonly i18n = inject(I18nService);

  private readonly selectedPresetId = signal(readPref('preset'));
  readonly selectedPreset = computed<Preset>(
    () => this.presetService.byId(this.selectedPresetId()) ?? this.presetService.presets()[0]
  );

  /** Durée réglée (secondes), utilisée au démarrage. */
  readonly durationSeconds = signal(0);
  readonly timeLeft = signal(0);
  readonly isRunning = signal(false);
  /** Vrai après la fin du décompte, jusqu'à la prochaine action. */
  readonly finished = signal(false);
  /** Vrai pendant les 5 minutes de prolongation (pas de nouvelle prolongation ensuite). */
  readonly inExtra = signal(false);
  /** Sessions de travail terminées depuis la dernière pause longue. */
  readonly focusRounds = signal(0);
  /** Réglage au doigt en cours : pas de son de palier. */
  readonly dragging = signal(false);
  /** Dernier message destiné aux lecteurs d'écran. */
  readonly announcement = signal('');

  readonly isPaused = computed(() => !this.isRunning() && this.timeLeft() > 0);

  /** Secondes affichées sur le cadran : temps restant, ou durée réglée au repos. */
  readonly displaySeconds = computed(() =>
    this.isRunning() || this.isPaused() ? this.timeLeft() : this.durationSeconds()
  );

  readonly displayMinutes = computed(() => Math.min(60, this.displaySeconds() / 60));

  readonly modeName = computed(() => {
    if (this.inExtra()) return this.i18n.t('mode.extra');
    const session = this.session();
    if (session) return session.name;
    return this.durationSeconds() === this.selectedPreset().seconds
      ? this.presetName(this.selectedPreset())
      : this.i18n.t('mode.custom');
  });

  readonly stateLabel = computed(() => {
    if (this.isRunning()) return this.i18n.t(this.inExtra() ? 'state.extra' : 'state.running');
    if (this.isPaused()) return this.i18n.t('state.paused');
    return this.i18n.t(this.finished() ? 'state.finished' : 'state.ready');
  });

  /** « Cycle n/4 » pendant une session de travail, si l'enchaînement est actif. */
  readonly cycleLabel = computed<string | null>(() => {
    const kind = this.session()?.kind ?? this.selectedPreset().kind;
    if (!this.prefs.autoChain() || kind !== 'focus') return null;
    return this.i18n.t('cycle', { n: (this.focusRounds() % LONG_BREAK_EVERY) + 1, total: LONG_BREAK_EVERY });
  });

  readonly mainActionLabel = computed(() =>
    this.i18n.t(this.isRunning() ? 'action.pause' : this.isPaused() ? 'action.resume' : 'action.start')
  );

  private readonly session = signal<ActiveSession | null>(null);
  private lastFocusPresetId: string | null = null;
  /** Vrai pendant un changement de temps manuel (doigt, curseur, reset) : pas de son de palier. */
  private manualChange = false;

  constructor() {
    this.durationSeconds.set(this.selectedPreset().seconds);
    this.sound.enabled = this.prefs.sound();
    this.notifications.setup({
      milestone45: this.i18n.t('notif.channel.milestone', { m: 45 }),
      milestone30: this.i18n.t('notif.channel.milestone', { m: 30 }),
      milestone15: this.i18n.t('notif.channel.milestone', { m: 15 }),
      end: this.i18n.t('notif.channel.end')
    });

    this.timer.timeLeft$.subscribe(t => {
      this.checkMilestones(this.timeLeft(), t);
      this.timeLeft.set(t);
    });
    this.timer.finished$.subscribe(lateBy => this.onFinished(lateBy));
    this.timer.isRunning$.subscribe(running => {
      this.isRunning.set(running);
      this.keepAwake.set(running && this.prefs.keepAwake());
      this.syncWidget();
    });

    // Stats du jour, objectif ou langue modifiés : le widget se met à jour
    effect(() => {
      this.history.today();
      this.history.dailyGoal();
      this.i18n.lang();
      untracked(() => this.syncWidget());
    });

    // Téléphone verrouillé / app en arrière-plan : notifications locales ; au retour, on les annule
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.notifications.cancelAll();
        this.keepAwake.refresh();
        this.history.refreshDay();
      } else {
        this.scheduleAlerts();
        this.syncWidget();
      }
    });
  }

  presetName(preset: Preset): string {
    return preset.name || (preset.nameKey ? this.i18n.t(preset.nameKey) : '');
  }

  // ---------- Commandes ----------

  /** Démarre, met en pause ou reprend le décompte. */
  toggle(): void {
    this.sound.unlock();
    this.finished.set(false);
    if (this.isRunning()) {
      this.timer.pause();
      this.pauseSession();
      this.announce(this.i18n.t('state.paused'));
    } else if (this.isPaused()) {
      this.timer.resume();
      const session = this.session();
      if (session) session.runningSince = Date.now();
      this.announce(this.i18n.t('state.running'));
    } else if (this.durationSeconds() > 0) {
      this.inExtra.set(false);
      this.startSession(this.selectedPreset(), this.durationSeconds());
      this.announce(this.i18n.t('state.running') + ', ' + formatTime(this.durationSeconds()));
    }
    if (this.isRunning()) {
      this.notifications.ensurePermission();
    }
  }

  reset(): void {
    this.finished.set(false);
    // Pendant la prolongation, la durée prévue est déjà atteinte : la session compte comme terminée
    this.endSession(this.inExtra());
    this.inExtra.set(false);
    this.manualChange = true;
    this.timer.reset();
    this.manualChange = false;
  }

  selectPreset(preset: Preset): void {
    this.setSelectedPreset(preset);
    this.durationSeconds.set(preset.seconds);
    this.reset();
  }

  /** Règle le temps affiché (cadran, curseur, clavier) ; arrondi et borné à 0-60 minutes. */
  setMinutes(minutes: number): void {
    const clamped = Math.max(0, Math.min(MAX_MINUTES, Math.round(minutes)));
    const seconds = clamped * 60;
    const current = Math.ceil(this.displaySeconds() / 60);

    if (this.isRunning() || this.isPaused()) {
      this.manualChange = true;
      if (seconds <= 0) {
        this.endSession(this.inExtra());
        this.inExtra.set(false);
        this.timer.reset();
        this.durationSeconds.set(0);
      } else {
        this.timer.setTimeLeft(seconds);
      }
      this.manualChange = false;
    } else {
      this.durationSeconds.set(seconds);
    }

    if (clamped !== current) {
      pulse();
    }
  }

  /** Après modification d'un mode : recale la durée si c'est celui qui est réglé et qu'aucune session ne tourne. */
  syncDurationWith(preset: Preset): void {
    if (preset.id === this.selectedPreset().id && !this.session()) {
      this.durationSeconds.set(preset.seconds);
    }
  }

  setSoundEnabled(on: boolean): void {
    this.prefs.setSound(on);
    this.sound.enabled = on;
    // Le son a besoin d'un geste de l'utilisateur pour se débloquer : on en profite pour l'essayer
    if (on) {
      this.sound.unlock();
      this.sound.milestone(45);
    }
  }

  setKeepAwake(on: boolean): void {
    this.prefs.setKeepAwake(on);
    this.keepAwake.set(on && this.isRunning());
  }

  // ---------- Sessions & enchaînement ----------

  private setSelectedPreset(preset: Preset): void {
    this.selectedPresetId.set(preset.id);
    writePref('preset', preset.id);
  }

  /** Démarre un décompte et ouvre une session d'historique (`lateBy` : secondes déjà écoulées). */
  private startSession(preset: Preset, seconds: number, lateBy = 0): void {
    const now = Date.now();
    const custom = seconds !== preset.seconds && lateBy === 0;
    this.session.set({
      name: custom ? this.i18n.t('mode.custom') : this.presetName(preset),
      color: preset.color,
      kind: preset.kind,
      plannedSeconds: lateBy ? preset.seconds : seconds,
      startedAt: now - lateBy * 1000,
      activeMs: lateBy * 1000,
      runningSince: now
    });
    if (preset.kind === 'focus') this.lastFocusPresetId = preset.id;
    this.timer.start(seconds);
  }

  private pauseSession(): void {
    const s = this.session();
    if (s?.runningSince) {
      s.activeMs += Date.now() - s.runningSince;
      s.runningSince = null;
    }
  }

  /** Clôt la session en cours ; `lateBy` retire le temps écoulé après la fin prévue (arrière-plan). */
  private endSession(completed: boolean, lateBy = 0): void {
    const s = this.session();
    if (!s) return;
    this.pauseSession();
    this.session.set(null);
    const activeSeconds = Math.max(0, Math.round(s.activeMs / 1000 - lateBy));
    if (!completed && activeSeconds < MIN_RECORDED_SECONDS) return;
    this.history.add({
      name: s.name,
      color: s.color,
      kind: s.kind,
      plannedSeconds: s.plannedSeconds,
      activeSeconds,
      startedAt: s.startedAt,
      endedAt: Date.now() - lateBy * 1000,
      completed
    });
    if (completed && s.kind === 'focus') this.focusRounds.update(n => n + 1);
    if (completed && s.kind === 'longBreak') this.focusRounds.set(0);
  }

  /** Mode suivant dans le cycle travail → pause (longue toutes les N sessions) → travail. */
  private nextInChain(kind: PresetKind, roundsAfter: number): Preset | undefined {
    if (kind === 'focus') {
      const long = roundsAfter > 0 && roundsAfter % LONG_BREAK_EVERY === 0;
      return (long && this.presetService.firstOfKind('longBreak')) || this.presetService.firstOfKind('break');
    }
    return this.presetService.byId(this.lastFocusPresetId) ?? this.presetService.firstOfKind('focus');
  }

  /** Son de palier quand le décompte passe sous 45, 30 ou 15 minutes restantes. */
  private checkMilestones(previous: number, current: number): void {
    // Uniquement un décompte normal : pas un réglage au doigt, au curseur ni un reset
    if (!this.isRunning() || this.dragging() || this.manualChange) return;
    for (const m of MILESTONES) {
      const at = m * 60;
      if (previous > at && current <= at) {
        // Palier franchi depuis longtemps (retour d'arrière-plan) : déjà notifié
        if (at - current <= LATE_ALERT_SECONDS) {
          this.sound.milestone(m);
          this.announce(this.i18n.t('notif.milestoneTitle', { m }));
        }
        return;
      }
    }
  }

  /** Fin du décompte, `lateBy` secondes après l'heure prévue (0 si l'app était au premier plan). */
  private onFinished(lateBy: number): void {
    if (lateBy <= LATE_ALERT_SECONDS) {
      this.sound.end();
    }
    const kind = this.session()?.kind ?? this.selectedPreset().kind;

    if (this.prefs.autoExtra() && !this.inExtra() && kind === 'focus') {
      // La prolongation part de l'heure de fin réelle, même si l'app était en arrière-plan
      const extraLeft = EXTRA_SECONDS - lateBy;
      if (extraLeft > 0) {
        this.inExtra.set(true);
        this.timer.start(extraLeft);
        this.announce(this.i18n.t('mode.extra'));
        return;
      }
      lateBy -= EXTRA_SECONDS;
    }

    this.inExtra.set(false);
    this.endSession(true, lateBy);

    const next = this.prefs.autoChain() ? this.nextInChain(kind, this.focusRounds()) : undefined;
    if (next && next.seconds - lateBy > 0) {
      this.setSelectedPreset(next);
      this.durationSeconds.set(next.seconds);
      this.startSession(next, next.seconds - lateBy, lateBy);
      this.announce(this.i18n.t('state.running') + ', ' + this.presetName(next));
      return;
    }
    this.finished.set(true);
    this.announce(this.i18n.t('state.finished'));
  }

  /** Alertes à programmer avant la mise en arrière-plan : paliers, fin, prolongation, session suivante. */
  private scheduleAlerts(): void {
    const endAt = this.timer.endTime;
    if (endAt === null) return;
    const t = (key: I18nKey, params?: Record<string, string | number>) => this.i18n.t(key, params);
    const kind = this.session()?.kind ?? this.selectedPreset().kind;
    const alerts: Alert[] = [];

    if (!this.inExtra()) {
      for (const m of MILESTONES) {
        alerts.push({
          id: 100 + m,
          at: endAt - m * 60_000,
          title: t('notif.milestoneTitle', { m }),
          body: t('notif.milestoneBody'),
          sound: `milestone${m}`
        });
      }
    }

    const willExtend = this.prefs.autoExtra() && !this.inExtra() && kind === 'focus';
    const roundsAfter = kind === 'focus' ? this.focusRounds() + 1 : this.focusRounds();
    const next = this.prefs.autoChain() ? this.nextInChain(kind, roundsAfter) : undefined;
    const afterBody = next ? t('notif.nextBody', { name: this.presetName(next) }) : t('notif.endBody');

    alerts.push({
      id: 1,
      at: endAt,
      title: t('notif.endTitle'),
      body: willExtend ? t('notif.endBodyExtra', { m: EXTRA_SECONDS / 60 }) : afterBody,
      sound: 'end'
    });

    let chainStart = endAt;
    if (willExtend) {
      chainStart = endAt + EXTRA_SECONDS * 1000;
      alerts.push({ id: 2, at: chainStart, title: t('notif.extraEndTitle'), body: afterBody, sound: 'end' });
    }
    if (next) {
      alerts.push({
        id: 3,
        at: chainStart + next.seconds * 1000,
        title: t('notif.endTitle'),
        body: t('notif.endBody'),
        sound: 'end'
      });
    }

    this.notifications.schedule(alerts, this.prefs.sound());
  }

  /** Transmet au widget l'état affiché (mode, fin du décompte, objectif du jour). */
  private syncWidget(): void {
    const endAt = this.timer.endTime;
    const state = endAt !== null ? 'running' : this.isPaused() ? 'paused' : 'idle';
    const t = (key: I18nKey) => this.i18n.t(key);
    this.widget.update({
      dayStart: this.history.dayStart(),
      focusMinutes: this.history.today().focusMinutes,
      goalMinutes: this.history.dailyGoal(),
      timer: {
        state,
        name: this.modeName(),
        color: this.session()?.color ?? this.selectedPreset().color,
        endAt: endAt ?? undefined,
        remainingSeconds: state === 'paused' ? Math.round(this.timeLeft()) : undefined
      },
      labels: {
        today: t('stats.focus'),
        goalReached: t('stats.goalReached'),
        paused: t('state.paused'),
        ready: this.stateLabel(),
        finished: t('state.finished')
      },
      rtl: this.i18n.dir() === 'rtl'
    });
  }

  private announce(message: string): void {
    this.announcement.set(message);
  }
}

/** Petite vibration de confirmation (appareil mobile). */
function pulse(): void {
  import('@capacitor/haptics')
    .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
    .catch(() => {});
}
