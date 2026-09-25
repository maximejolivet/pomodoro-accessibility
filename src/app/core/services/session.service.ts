import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { App } from '@capacitor/app';
import { MIN_RECORDED_SECONDS } from '../constants/history.constants';
import {
  CUE_MS, EXTRA_SECONDS, LATE_ALERT_SECONDS, LONG_BREAK_EVERY, MAX_MINUTES, MILESTONES, MIN_MINUTES
} from '../constants/timer.constants';
import { readPref, writePref } from '../helpers/storage';
import { formatTime } from '../helpers/time';
import { I18nService } from '../i18n/i18n.service';
import type { I18nKey } from '../i18n/i18n.model';
import type { Alert } from '../models/alert.model';
import type { SpeechMode, VisualAlert } from '../models/preferences.model';
import type { VisualCue } from '../models/session.model';
import type { Preset, PresetKind } from '../models/preset.model';
import type { Routine, RoutineStep } from '../models/routine.model';
import type { ActiveSession } from '../models/session.model';
import { HapticsService } from './haptics.service';
import { HistoryService } from './history.service';
import { KeepAwakeService } from './keep-awake.service';
import { NotificationService } from './notification.service';
import { PreferencesService } from './preferences.service';
import { PresetService } from './preset.service';
import { RoutineService } from './routine.service';
import { SoundService } from './sound.service';
import { SpeechService } from './speech.service';
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
  private readonly routineService = inject(RoutineService);
  private readonly prefs = inject(PreferencesService);
  private readonly sound = inject(SoundService);
  private readonly haptics = inject(HapticsService);
  private readonly speech = inject(SpeechService);
  private readonly notifications = inject(NotificationService);
  private readonly keepAwake = inject(KeepAwakeService);
  private readonly widget = inject(WidgetService);
  private readonly i18n = inject(I18nService);

  private readonly selectedPresetId = signal(readPref('preset'));

  /**
   * Routine en cours de déroulé, et le rang de l'étape où elle en est. Tant qu'une
   * routine est chargée, c'est son étape courante qui tient lieu de mode : le cadran,
   * l'historique et le widget n'ont rien à savoir des routines.
   */
  readonly activeRoutine = signal<Routine | null>(this.routineService.byId(readPref('routine')) ?? null);
  readonly routineIndex = signal(0);
  /** Dernière étape terminée : la bande reste affichée, toutes les étapes cochées. */
  readonly routineDone = signal(false);
  readonly currentStep = computed<RoutineStep | null>(() => {
    const routine = this.activeRoutine();
    return routine?.steps[this.routineIndex()] ?? null;
  });

  readonly selectedPreset = computed<Preset>(
    () =>
      this.currentStep() ?? this.presetService.byId(this.selectedPresetId()) ?? this.presetService.presets()[0]
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
  /** Alerte visuelle en cours, rendue en pulsation par la page : palier, fin, ou rien. */
  readonly visualCue = signal<VisualCue | null>(null);

  /**
   * Cadran verrouillé. Il neutralise tout ce qui peut faire *perdre* une session — réglage
   * au doigt, au clavier, boutons − / +, remise à zéro — et laisse Démarrer / Pause : une
   * pause involontaire se rattrape, une remise à zéro involontaire ne se rattrape pas.
   */
  readonly locked = this.prefs.locked;

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
    // Une routine a sa propre suite d'étapes : le cycle pomodoro ne la décrit pas
    if (this.activeRoutine() || !this.prefs.autoChain() || kind !== 'focus') return null;
    return this.i18n.t('cycle', { n: (this.focusRounds() % LONG_BREAK_EVERY) + 1, total: LONG_BREAK_EVERY });
  });

  readonly mainActionLabel = computed(() =>
    this.i18n.t(this.isRunning() ? 'action.pause' : this.isPaused() ? 'action.resume' : 'action.start')
  );

  private readonly session = signal<ActiveSession | null>(null);
  private cueTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFocusPresetId: string | null = null;
  /** Vrai pendant un changement de temps manuel (doigt, curseur, reset) : pas de son de palier. */
  private manualChange = false;

  constructor() {
    this.durationSeconds.set(this.selectedPreset().seconds);
    this.sound.enabled = this.prefs.sound();
    this.haptics.enabled = this.prefs.haptics();
    this.notifications.setup({
      milestone45: this.i18n.t('notif.channel.milestone', { m: 45 }),
      milestone30: this.i18n.t('notif.channel.milestone', { m: 30 }),
      milestone15: this.i18n.t('notif.channel.milestone', { m: 15 }),
      end: this.i18n.t('notif.channel.end')
    });

    this.timer.timeLeft$.subscribe(t => {
      this.checkMilestones(this.timeLeft(), t);
      this.speakRemaining(this.timeLeft(), t);
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

  routineName(routine: Routine): string {
    return routine.name || (routine.nameKey ? this.i18n.t(routine.nameKey) : '');
  }

  // ---------- Commandes ----------

  /** Démarre, met en pause ou reprend le décompte. */
  toggle(): void {
    this.sound.unlock();
    this.finished.set(false);
    if (this.isRunning()) {
      this.timer.pause();
      this.speech.stop();
      this.haptics.stop();
      this.pauseSession();
      this.announce(this.i18n.t('state.paused'));
    } else if (this.isPaused()) {
      this.timer.resume();
      const session = this.session();
      if (session) session.runningSince = Date.now();
      this.announce(this.i18n.t('state.running'));
    } else if (this.durationSeconds() > 0) {
      this.inExtra.set(false);
      this.routineDone.set(false);
      this.startSession(this.selectedPreset(), this.durationSeconds());
      this.announce(this.i18n.t('state.running') + ', ' + formatTime(this.durationSeconds()));
    }
    if (this.isRunning()) {
      this.notifications.ensurePermission();
    }
  }

  /** Bascule le verrou du cadran. */
  toggleLock(): void {
    this.prefs.setLocked(!this.locked());
  }

  reset(): void {
    if (this.locked()) return;
    this.resetTimer();
  }

  private resetTimer(): void {
    this.finished.set(false);
    this.speech.stop();
    this.haptics.stop();
    // Pendant la prolongation, la durée prévue est déjà atteinte : la session compte comme terminée
    this.endSession(this.inExtra());
    this.inExtra.set(false);
    this.manualChange = true;
    this.timer.reset();
    this.manualChange = false;
  }

  /** Choisir un mode dans le panneau reste possible verrouillé : le geste est délibéré. */
  selectPreset(preset: Preset): void {
    this.leaveRoutine();
    this.setSelectedPreset(preset);
    this.durationSeconds.set(preset.seconds);
    this.resetTimer();
  }

  // ---------- Routines ----------

  /**
   * Charge une routine et arme sa première étape, sans la démarrer : c'est le même
   * geste que choisir un mode, et rien ne part sans un appui sur ▶.
   */
  startRoutine(routine: Routine): void {
    this.activeRoutine.set(routine);
    writePref('routine', routine.id);
    // Comme choisir un mode, le geste vient du panneau : le verrou ne s'y oppose pas
    this.armStep(0);
  }

  /**
   * Va directement à une étape — la suivante quand elle est déjà faite, la précédente
   * quand on veut la refaire. C'est la seule façon de sortir d'une étape sans attendre
   * la fin, et elle passe par la bande, où chaque étape est un bouton. Le verrou la
   * neutralise : elle abandonne l'étape en cours, comme la remise à zéro.
   */
  goToStep(index: number): void {
    if (this.locked()) return;
    this.armStep(index);
  }

  /** Quitte la routine et revient au mode choisi avant elle. */
  exitRoutine(): void {
    if (!this.activeRoutine() || this.locked()) return;
    this.leaveRoutine();
    this.durationSeconds.set(this.selectedPreset().seconds);
    this.resetTimer();
    this.announce(this.i18n.t('state.ready'));
  }

  /** « Étape 2 sur 4 : Petit-déjeuner, 15 minutes », pour la bande et les annonces. */
  stepLabel(index: number): string {
    const routine = this.activeRoutine();
    const step = routine?.steps[index];
    if (!routine || !step) return '';
    return this.i18n.t('routine.step', {
      n: index + 1,
      total: routine.steps.length,
      name: this.presetName(step),
      m: Math.round(step.seconds / 60)
    });
  }

  /** Charge une étape sur le cadran, à l'arrêt, et la dit. */
  private armStep(index: number): void {
    const routine = this.activeRoutine();
    if (!routine) return;
    this.routineDone.set(false);
    this.routineIndex.set(Math.max(0, Math.min(routine.steps.length - 1, index)));
    this.durationSeconds.set(this.currentStep()?.seconds ?? 0);
    this.resetTimer();
    this.announce(this.stepLabel(this.routineIndex()));
  }

  private leaveRoutine(): void {
    this.activeRoutine.set(null);
    this.routineIndex.set(0);
    this.routineDone.set(false);
    writePref('routine', '');
  }

  /** Règle le temps affiché (cadran, curseur, clavier) ; arrondi et borné à 0-60 minutes. */
  setMinutes(minutes: number): void {
    if (this.locked()) return;
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
      this.haptics.impact();
    }
  }

  /**
   * Ajoute ou retire des minutes à partir de la valeur affichée : flèches du clavier et
   * boutons − / +, seule façon de régler la durée sans glisser sur le cadran (WCAG 2.5.7).
   * `speak` annonce la nouvelle valeur — inutile depuis le cadran, qui est un curseur et
   * dont le lecteur d'écran lit déjà `aria-valuetext`.
   */
  stepMinutes(delta: number, speak = false): void {
    if (this.locked()) return;
    // Un décompte tombe rarement sur une minute ronde : on part de l'entier situé du bon côté
    const from = delta < 0 ? Math.ceil(this.displayMinutes()) : Math.floor(this.displayMinutes());
    const minutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, from + delta));
    this.setMinutes(minutes);
    if (speak) {
      this.announce(`${minutes} ${this.i18n.t('unit.minutes')}`);
    }
  }

  /** Vrai si un pas dans ce sens changerait encore la durée (boutons − / + désactivés aux bornes). */
  canStep(delta: number): boolean {
    if (this.locked()) return false;
    const minutes = this.displayMinutes();
    return delta < 0 ? minutes > MIN_MINUTES : minutes < MAX_MINUTES;
  }

  /**
   * Après modification d'une routine : la routine en cours pointe sur l'objet d'avant
   * l'enregistrement. On la remplace, en gardant l'étape si elle existe encore, pour que
   * la bande et le décompte reflètent ce qui vient d'être édité.
   */
  syncRoutine(routine: Routine | null, id: string): void {
    if (this.activeRoutine()?.id !== id) return;
    // Routine supprimée : on en sort sans passer par le verrou, le geste vient du panneau
    if (!routine) {
      this.leaveRoutine();
      this.durationSeconds.set(this.selectedPreset().seconds);
      this.resetTimer();
      return;
    }
    this.activeRoutine.set(routine);
    const index = Math.min(this.routineIndex(), routine.steps.length - 1);
    this.routineIndex.set(index);
    if (!this.session()) {
      this.durationSeconds.set(routine.steps[index].seconds);
    }
  }

  /** Après modification d'un mode : recale la durée si c'est celui qui est réglé et qu'aucune session ne tourne. */
  syncDurationWith(preset: Preset): void {
    if (preset.id === this.selectedPreset().id && !this.session()) {
      this.durationSeconds.set(preset.seconds);
    }
  }

  /** Le motif de fin se fait sentir aussitôt : c'est l'essai du réglage, comme pour le son. */
  setHapticsEnabled(on: boolean): void {
    this.prefs.setHaptics(on);
    this.haptics.enabled = on;
    if (on) this.haptics.play('end');
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

  /** Aperçu du signal visuel depuis les réglages, comme les sons s'écoutent. */
  previewVisualAlert(level: VisualAlert): void {
    this.prefs.setVisualAlert(level);
    if (level === 'off') {
      this.visualCue.set(null);
      return;
    }
    this.showCue('end');
  }

  /**
   * Aperçu de la voix, au moment où le réglage change : c'est aussi le geste utilisateur
   * dont iOS a besoin pour autoriser la synthèse, comme le son a besoin d'un tap.
   */
  previewSpeech(mode: SpeechMode): void {
    this.prefs.setSpeech(mode);
    if (mode === 'off') {
      this.speech.stop();
      return;
    }
    this.say(this.i18n.t('notif.milestoneTitle', { m: MILESTONES[0] }));
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
          this.haptics.play(`milestone${m}`);
          this.showCue('milestone');
          this.announce(this.i18n.t('notif.milestoneTitle', { m }));
        }
        return;
      }
    }
  }

  /** Fin du décompte, `lateBy` secondes après l'heure prévue (0 si l'app était au premier plan). */
  private onFinished(lateBy: number): void {
    // Fin rattrapée longtemps après (app en arrière-plan) : la notification a déjà prévenu
    const fresh = lateBy <= LATE_ALERT_SECONDS;
    if (fresh) {
      this.sound.end();
      this.haptics.play('end');
      this.showCue('end');
    }
    const kind = this.session()?.kind ?? this.selectedPreset().kind;
    const routine = this.activeRoutine();

    // Pas de prolongation dans une routine : ce qui a été annoncé doit arriver à l'heure
    // dite, et cinq minutes de plus décaleraient toutes les étapes suivantes.
    if (this.prefs.autoExtra() && !this.inExtra() && kind === 'focus' && !routine) {
      // La prolongation part de l'heure de fin réelle, même si l'app était en arrière-plan
      const extraLeft = EXTRA_SECONDS - lateBy;
      if (extraLeft > 0) {
        this.inExtra.set(true);
        this.timer.start(extraLeft);
        this.announce(this.i18n.t('mode.extra'));
        if (fresh) {
          this.sayEnd(this.i18n.t('notif.endBodyExtra', { m: EXTRA_SECONDS / 60 }));
        }
        return;
      }
      lateBy -= EXTRA_SECONDS;
    }

    this.inExtra.set(false);
    this.endSession(true, lateBy);

    // Une routine s'enchaîne d'elle-même : c'est sa définition, pas l'option « enchaîner »
    const next = routine
      ? routine.steps[this.routineIndex() + 1]
      : this.prefs.autoChain()
        ? this.nextInChain(kind, this.focusRounds())
        : undefined;
    if (next && next.seconds - lateBy > 0) {
      if (routine) {
        this.routineIndex.update(i => i + 1);
      } else {
        this.setSelectedPreset(next);
      }
      this.durationSeconds.set(next.seconds);
      this.startSession(next, next.seconds - lateBy, lateBy);
      this.announce(this.i18n.t('state.running') + ', ' + this.presetName(next));
      if (fresh) {
        this.sayEnd(this.i18n.t('notif.nextBody', { name: this.presetName(next) }));
      }
      return;
    }
    this.finished.set(true);
    if (routine) {
      // Toutes les étapes cochées : la bande le montre, l'annonce le dit
      this.routineDone.set(true);
      const done = this.i18n.t('routine.finished', { name: this.routineName(routine) });
      this.announce(done);
      if (fresh) this.sayEnd(done);
      return;
    }
    this.announce(this.i18n.t('state.finished'));
    if (fresh) this.sayEnd();
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

    const routine = this.activeRoutine();
    const willExtend = this.prefs.autoExtra() && !this.inExtra() && kind === 'focus' && !routine;
    const roundsAfter = kind === 'focus' ? this.focusRounds() + 1 : this.focusRounds();
    const next = routine
      ? routine.steps[this.routineIndex() + 1]
      : this.prefs.autoChain()
        ? this.nextInChain(kind, roundsAfter)
        : undefined;
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

  /**
   * Allume le signal visuel pour la durée prévue. Il ne dépend pas du son : c'est
   * justement l'alerte de qui n'entend pas, ou a coupé le son en espace partagé.
   */
  private showCue(cue: VisualCue): void {
    if (this.prefs.visualAlert() === 'off') return;
    if (this.cueTimer !== null) clearTimeout(this.cueTimer);
    // Repasser par `null` redémarre l'animation si deux alertes se suivent de près
    this.visualCue.set(null);
    setTimeout(() => this.visualCue.set(cue));
    this.cueTimer = setTimeout(() => this.visualCue.set(null), CUE_MS[cue]);
  }

  /**
   * Dit le temps restant à voix haute quand le décompte franchit une minute ronde : aux
   * trois paliers, ou à chacune, selon le réglage. La voix est le seul canal qui donne la
   * valeur elle-même — le cadran demande de voir, les sons de palier demandent de savoir
   * lequel vient de sonner.
   */
  private speakRemaining(previous: number, current: number): void {
    const mode = this.prefs.speech();
    if (mode === 'off') return;
    // Uniquement un décompte normal : pas un réglage au doigt, au curseur ni un reset
    if (!this.isRunning() || this.dragging() || this.manualChange) return;

    // Minute ronde que le décompte vient de passer. Au retour d'un long arrière-plan,
    // plusieurs minutes ont été franchies d'un coup : seule la dernière est dite, et elle
    // reste juste puisqu'elle se déduit du temps restant à cet instant.
    const at = Math.ceil(current / 60) * 60;
    const minutes = at / 60;
    if (minutes < 1 || previous <= at) return;
    if (mode === 'milestones' && !(MILESTONES as readonly number[]).includes(minutes)) return;

    this.say(
      minutes === 1
        ? this.i18n.t('speech.oneMinute')
        : this.i18n.t('notif.milestoneTitle', { m: minutes })
    );
  }

  /** « Temps écoulé », suivi le cas échéant de ce qui prend la suite. */
  private sayEnd(next?: string): void {
    if (this.prefs.speech() === 'off') return;
    const end = this.i18n.t('notif.endTitle');
    this.say(next ? `${end}. ${next}` : end);
  }

  private say(text: string): void {
    this.speech.speak(text, this.i18n.lang());
  }

  private announce(message: string): void {
    this.announcement.set(message);
  }
}
