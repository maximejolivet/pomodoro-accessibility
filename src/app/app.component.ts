import { ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, OnDestroy, OnInit, ViewChild, computed, effect, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { TimerService } from './timer.service';
import { SoundService } from './sound.service';
import { Alert, NotificationService } from './notification.service';
import { KeepAwakeService } from './keep-awake.service';
import { WidgetService } from './widget.service';
import { GOAL_MAX_MINUTES, GOAL_MIN_MINUTES, GOAL_STEP_MINUTES, HistoryService, MIN_RECORDED_SECONDS, Session } from './history.service';
import { PRESET_COLORS, Preset, PresetKind, PresetService } from './preset.service';
import { I18nKey, I18nService, LANGUAGES, LangChoice } from './i18n';
import { readFlag, readPref, writeFlag, writePref } from './storage';

// Géométrie du cadran (viewBox 420 x 420)
const CX = 217;
const CY = 218;
const RING_OUTER = 150;
const RING_INNER = 102;
const DISK_R = 147;
const LABEL_R = 181;
// Effet d'arrière-plan de 0 à 20, comme sur le Time Timer
const BG_R = 212;
const BG_TO_MIN = 20;
// Le bout arrondi dépasse le 0 (valeur négative = côté 55)
const BG_CAP_PAST_ZERO_MIN = 1.8;
// Le cadran est réduit pour laisser la place à l'arc au-dessus des chiffres
const DIAL_SCALE = 0.91;
const MAX_MINUTES = 60;
const DRAG_THRESHOLD_PX = 6;
const EXTRA_SECONDS = 5 * 60;
const MILESTONES = [45, 30, 15] as const;
// Au-delà de ce retard (app en arrière-plan), la notification a déjà prévenu : pas de son en rattrapage
const LATE_ALERT_SECONDS = 90;
/** Une pause longue toutes les N sessions de travail terminées. */
const LONG_BREAK_EVERY = 4;

// Couleurs des segments, de 0-5 min (rouge) à 55-60 min (magenta)
const SEGMENT_COLORS = [
  '#d63f4f', '#e5593a', '#ef7d2d', '#f3a52b', '#f0c52f', '#c3cd36',
  '#56b27b', '#5d9fb6', '#5d6db3', '#5a55a3', '#6c4b9c', '#b24f97'
];

type SheetTab = 'modes' | 'stats' | 'settings';

/** Session en cours, enregistrée dans l'historique à sa fin. */
interface ActiveSession {
  name: string;
  color: string;
  kind: PresetKind;
  plannedSeconds: number;
  startedAt: number;
  /** Temps décompté avant la dernière reprise (ms). */
  activeMs: number;
  /** Début du segment en cours de décompte (ms), null en pause. */
  runningSince: number | null;
}

interface PresetDraft {
  preset: Preset;
  name: string;
  minutes: number;
  color: string;
  kind: PresetKind;
  isNew: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  timerService = inject(TimerService);
  i18n = inject(I18nService);
  presetService = inject(PresetService);
  history = inject(HistoryService);
  private sound = inject(SoundService);
  private notifications = inject(NotificationService);
  private keepAwake = inject(KeepAwakeService);
  private cdr = inject(ChangeDetectorRef);
  private widget = inject(WidgetService);

  readonly cx = CX;
  readonly cy = CY;
  readonly ringInner = RING_INNER;
  readonly dialTransform = `translate(${CX} ${CY}) scale(${DIAL_SCALE}) translate(${-CX} ${-CY})`;
  readonly maxMinutes = MAX_MINUTES;
  readonly languages = LANGUAGES;
  readonly presetColors = PRESET_COLORS;
  readonly presetKinds: PresetKind[] = ['focus', 'break', 'longBreak'];
  readonly longBreakEvery = LONG_BREAK_EVERY;
  readonly cycleSlots = Array.from({ length: LONG_BREAK_EVERY }, (_, i) => i);
  readonly goalMin = GOAL_MIN_MINUTES;
  readonly goalMax = GOAL_MAX_MINUTES;
  readonly goalStep = GOAL_STEP_MINUTES;

  @ViewChild('dial') dialRef!: ElementRef<SVGSVGElement>;
  @ViewChild('settingsButton') settingsButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('announcements') announcements?: ElementRef<HTMLDivElement>;

  private selectedPresetId = readPref('preset');
  /** Durée réglée (secondes), utilisée au démarrage. */
  durationSeconds = this.selectedPreset.seconds;

  timeLeft = 0;
  isRunning = false;
  showSheet = false;
  sheetTab: SheetTab = 'modes';
  tiltX = 0;
  tiltY = 0;
  isDragging = false;
  /** Vrai après la fin du décompte, jusqu'à la prochaine action. */
  finished = false;

  @HostBinding('class.dark') darkMode = this.initialDarkMode();
  soundOn = readFlag('sound');
  /** À 0, relance automatiquement 5 minutes pour terminer ce qui est en cours (sessions de travail). */
  autoExtra = readFlag('auto-extra');
  /** Enchaîne automatiquement travail → pause → travail. */
  autoChain = readFlag('auto-chain', false);
  keepAwakeOn = readFlag('keep-awake');
  /** Vrai pendant les 5 minutes de prolongation (pas de nouvelle prolongation ensuite). */
  inExtra = false;
  /** Sessions de travail terminées depuis la dernière pause longue. */
  focusRounds = 0;

  draft: PresetDraft | null = null;
  /** Action destructive en attente de second tap. */
  confirming: 'delete' | 'restore' | 'clear' | null = null;

  private session: ActiveSession | null = null;
  private lastFocusPresetId: string | null = null;
  private dragStart: { x: number; y: number; id: number } | null = null;
  private dragMinutes = 0;
  private suppressClick = false;
  private reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly segments = SEGMENT_COLORS.map((color, i) => ({
    color,
    d: this.annulusPath(i * 5, (i + 1) * 5)
  }));

  readonly bgFillPath = this.roundedBandPath(true);
  readonly bgArcPath = this.roundedBandPath(false);
  readonly bgHighlightPath = this.arcBetween(BG_R - 1.5, this.bgCapMinutes, BG_TO_MIN);
  readonly bgFade = {
    start: this.point(BG_R, 0),
    end: this.point(BG_R, BG_TO_MIN)
  };

  readonly separators = Array.from({ length: 12 }, (_, i) => {
    const a = this.point(RING_INNER - 2, i * 5);
    const b = this.point(RING_OUTER + 1, i * 5);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });

  readonly labels = Array.from({ length: 12 }, (_, i) => {
    const p = this.point(LABEL_R, i * 5);
    return { text: String(i * 5), x: p.x, y: p.y };
  });

  readonly soundPreviews = [
    { value: 45, label: '45', color: '#5a55a3' },
    { value: 30, label: '30', color: '#c3cd36' },
    { value: 15, label: '15', color: '#f3a52b' },
    { value: 0, label: '0', color: '#d63f4f' }
  ] as const;

  /** Barres des 7 derniers jours (hauteur relative au meilleur jour). */
  readonly weekBars = computed(() => {
    const days = this.history.week();
    const max = Math.max(1, ...days.map(d => d.focusMinutes));
    const weekday = new Intl.DateTimeFormat(this.i18n.lang(), { weekday: 'short' });
    return days.map((d, i) => ({
      label: weekday.format(d.date).replace('.', ''),
      minutes: d.focusMinutes,
      pct: (d.focusMinutes / max) * 100,
      isToday: i === days.length - 1,
      isMax: d.focusMinutes === max && d.focusMinutes > 0
    }));
  });

  private subs = new Subscription();
  private appStateListener: Promise<PluginListenerHandle> | null = null;
  /** Vrai pendant un changement de temps manuel (doigt, curseur, reset) : pas de son de palier. */
  private manualChange = false;

  constructor() {
    // Stats du jour, objectif ou langue modifiés : le widget se met à jour
    effect(() => {
      this.history.today();
      this.history.dailyGoal();
      this.i18n.lang();
      untracked(() => this.syncWidget());
    });
  }

  ngOnInit(): void {
    this.sound.enabled = this.soundOn;
    this.notifications.setup({
      milestone45: this.i18n.t('notif.channel.milestone', { m: 45 }),
      milestone30: this.i18n.t('notif.channel.milestone', { m: 30 }),
      milestone15: this.i18n.t('notif.channel.milestone', { m: 15 }),
      end: this.i18n.t('notif.channel.end')
    });

    // App sans zone.js (défaut d'Angular 22) : les ticks du minuteur ne sont pas des événements du
    // template, il faut signaler chaque changement pour que le cadran se redessine
    this.subs.add(this.timerService.timeLeft$.subscribe(t => {
      this.checkMilestones(this.timeLeft, t);
      this.timeLeft = t;
      this.cdr.markForCheck();
    }));
    this.subs.add(this.timerService.finished$.subscribe(lateBy => {
      this.onFinished(lateBy);
      this.cdr.markForCheck();
    }));
    this.subs.add(this.timerService.isRunning$.subscribe(r => {
      this.isRunning = r;
      this.keepAwake.set(r && this.keepAwakeOn);
      this.syncWidget();
      this.cdr.markForCheck();
    }));

    // Téléphone verrouillé / app en arrière-plan : notifications locales ; au retour, on les annule
    this.appStateListener = App.addListener('appStateChange', ({ isActive }) => {
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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.appStateListener?.then(h => h.remove());
    this.keepAwake.set(false);
  }

  // ---------- État affiché ----------

  get selectedPreset(): Preset {
    return this.presetService.byId(this.selectedPresetId) ?? this.presetService.presets()[0];
  }

  get isPaused(): boolean {
    return !this.isRunning && this.timeLeft > 0;
  }

  /** Secondes affichées sur le cadran : temps restant, ou durée réglée au repos. */
  get displaySeconds(): number {
    return this.isRunning || this.isPaused ? this.timeLeft : this.durationSeconds;
  }

  get modeName(): string {
    if (this.inExtra) return this.i18n.t('mode.extra');
    if (this.session) return this.session.name;
    return this.durationSeconds === this.selectedPreset.seconds
      ? this.presetName(this.selectedPreset)
      : this.i18n.t('mode.custom');
  }

  get stateLabel(): string {
    if (this.isRunning) return this.i18n.t(this.inExtra ? 'state.extra' : 'state.running');
    if (this.isPaused) return this.i18n.t('state.paused');
    return this.i18n.t(this.finished ? 'state.finished' : 'state.ready');
  }

  /** « Cycle n/4 » pendant une session de travail, si l'enchaînement est actif. */
  get cycleLabel(): string | null {
    const kind = this.session?.kind ?? this.selectedPreset.kind;
    if (!this.autoChain || kind !== 'focus') return null;
    return this.i18n.t('cycle', { n: (this.focusRounds % LONG_BREAK_EVERY) + 1, total: LONG_BREAK_EVERY });
  }

  get mainActionLabel(): string {
    return this.i18n.t(this.isRunning ? 'action.pause' : this.isPaused ? 'action.resume' : 'action.start');
  }

  get displayMinutes(): number {
    return Math.min(60, this.displaySeconds / 60);
  }

  /** Angle (degrés, sens horaire depuis le haut) du bord du disque. */
  get edgeAngle(): number {
    return -this.displayMinutes * 6;
  }

  get diskOuterPath(): string {
    return this.sectorPath(DISK_R, this.displayMinutes);
  }

  get diskInnerPath(): string {
    return this.sectorPath(RING_INNER, this.displayMinutes);
  }

  get edgeLine() {
    return this.point(DISK_R, this.displayMinutes);
  }

  presetName(preset: Preset): string {
    return preset.name || (preset.nameKey ? this.i18n.t(preset.nameKey) : '');
  }

  kindLabel(kind: PresetKind): string {
    return this.i18n.t(`preset.kind.${kind}` as I18nKey);
  }

  // ---------- Commandes ----------

  toggle(): void {
    this.sound.unlock();
    this.finished = false;
    if (this.isRunning) {
      this.timerService.pause();
      this.pauseSession();
      this.announce(this.i18n.t('state.paused'));
    } else if (this.isPaused) {
      this.timerService.resume();
      if (this.session) this.session.runningSince = Date.now();
      this.announce(this.i18n.t('state.running'));
    } else if (this.durationSeconds > 0) {
      this.inExtra = false;
      this.startSession(this.selectedPreset, this.durationSeconds);
      this.announce(this.i18n.t('state.running') + ', ' + this.formatTime(this.durationSeconds));
    }
    if (this.isRunning) {
      this.notifications.ensurePermission();
    }
  }

  resetTimer(): void {
    this.finished = false;
    // Pendant la prolongation, la durée prévue est déjà atteinte : la session compte comme terminée
    this.endSession(this.inExtra);
    this.inExtra = false;
    this.manualChange = true;
    this.timerService.reset();
    this.manualChange = false;
  }

  selectPreset(preset: Preset): void {
    this.setSelectedPreset(preset);
    this.durationSeconds = preset.seconds;
    this.resetTimer();
  }

  setDurationMinutes(minutes: number): void {
    this.applyMinutes(Math.max(1, Math.min(MAX_MINUTES, Math.round(minutes))));
  }

  openSheet(tab: SheetTab = this.sheetTab): void {
    this.sheetTab = tab;
    this.showSheet = true;
    // Piéger le focus dans la modale au prochain tick
    setTimeout(() => {
      const sheet = document.querySelector('[role="dialog"]') as HTMLElement;
      sheet?.focus();
    });
  }

  closeSheet(): void {
    this.showSheet = false;
    this.draft = null;
    this.confirming = null;
    // Retourner le focus au bouton settings
    setTimeout(() => {
      const settingsBtn = document.querySelector('button[aria-label*="settings"]') as HTMLButtonElement;
      settingsBtn?.focus();
    });
  }

  @HostListener('keydown.escape')
  onEscapeKey(): void {
    if (this.showSheet) {
      this.closeSheet();
    }
  }

  setTab(tab: SheetTab): void {
    this.sheetTab = tab;
    this.draft = null;
    this.confirming = null;
  }

  // ---------- Réglages ----------

  setDarkMode(on: boolean): void {
    this.darkMode = on;
    writePref('theme', on ? 'dark' : 'light');
  }

  setSound(on: boolean): void {
    this.soundOn = on;
    this.sound.enabled = on;
    writeFlag('sound', on);
    if (on) {
      this.sound.unlock();
      this.sound.milestone(45);
    }
  }

  setAutoExtra(on: boolean): void {
    this.autoExtra = on;
    writeFlag('auto-extra', on);
  }

  setAutoChain(on: boolean): void {
    this.autoChain = on;
    writeFlag('auto-chain', on);
  }

  setKeepAwake(on: boolean): void {
    this.keepAwakeOn = on;
    writeFlag('keep-awake', on);
    this.keepAwake.set(on && this.isRunning);
  }

  setLanguage(choice: LangChoice): void {
    this.i18n.setChoice(choice);
  }

  previewSound(value: 45 | 30 | 15 | 0): void {
    this.sound.unlock();
    if (value === 0) {
      this.sound.end();
    } else {
      this.sound.milestone(value);
    }
  }

  // ---------- Modes personnalisables ----------

  editPreset(preset: Preset): void {
    this.confirming = null;
    this.draft = {
      preset,
      name: this.presetName(preset),
      minutes: Math.round(preset.seconds / 60),
      color: preset.color,
      kind: preset.kind,
      isNew: false
    };
  }

  newPreset(): void {
    const preset = this.presetService.newPreset();
    this.confirming = null;
    this.draft = { preset, name: '', minutes: preset.seconds / 60, color: preset.color, kind: preset.kind, isNew: true };
  }

  saveDraft(): void {
    const d = this.draft;
    if (!d) return;
    const name = d.name.trim();
    const original = d.preset;
    // Nom par défaut inchangé : on garde la traduction automatique
    const keepKey = !!original.nameKey && (name === '' || name === this.i18n.t(original.nameKey));
    const saved: Preset = {
      id: original.id,
      name: keepKey ? '' : name || this.i18n.t('preset.new'),
      nameKey: keepKey ? original.nameKey : undefined,
      seconds: Math.max(1, Math.min(MAX_MINUTES, Math.round(d.minutes))) * 60,
      color: d.color,
      kind: d.kind
    };
    this.presetService.save(saved);
    if (saved.id === this.selectedPreset.id && !this.session) {
      this.durationSeconds = saved.seconds;
    }
    this.draft = null;
  }

  deleteDraft(): void {
    if (!this.draft) return;
    if (this.confirming !== 'delete') {
      this.confirming = 'delete';
      return;
    }
    const id = this.draft.preset.id;
    // selectedPreset, et non selectedPresetId : sans choix enregistré, c'est le premier mode qui est affiché
    const wasSelected = id === this.selectedPreset.id;
    this.presetService.remove(id);
    if (wasSelected) {
      this.selectPreset(this.presetService.presets()[0]);
    }
    this.draft = null;
    this.confirming = null;
  }

  restorePresets(): void {
    if (this.confirming !== 'restore') {
      this.confirming = 'restore';
      return;
    }
    this.presetService.restoreDefaults();
    this.selectPreset(this.presetService.presets()[0]);
    this.confirming = null;
  }

  // ---------- Statistiques ----------

  clearHistory(): void {
    if (this.confirming !== 'clear') {
      this.confirming = 'clear';
      return;
    }
    this.history.clear();
    this.confirming = null;
  }

  sessionTime(session: Session): string {
    const lang = this.i18n.lang();
    const ended = new Date(session.endedAt);
    const isToday = ended.toDateString() === new Date().toDateString();
    const time = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(ended);
    if (isToday) return time;
    return `${new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(ended)} · ${time}`;
  }

  weekBarLabel(bar: { label: string; minutes: number }): string {
    return this.i18n.t('stats.weekLabel', { day: bar.label, m: bar.minutes });
  }

  // ---------- Réglage au doigt sur le cadran ----------

  onFaceClick(): void {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.toggle();
  }

  onDragStart(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.dragStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    this.dragMinutes = this.displayMinutes;
    this.suppressClick = false;
  }

  onDragMove(event: PointerEvent): void {
    if (!this.dragStart || event.pointerId !== this.dragStart.id) return;

    if (!this.isDragging) {
      const moved = Math.hypot(event.clientX - this.dragStart.x, event.clientY - this.dragStart.y);
      if (moved < DRAG_THRESHOLD_PX) return;
      this.isDragging = true;
      this.resetTilt();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    const minutes = this.minutesAtPointer(event);
    if (minutes === null) return;

    // Pas de saut entre 0 et 60 en passant par le haut : on bloque aux extrémités.
    let next = minutes;
    if (this.dragMinutes > 45 && minutes < 15) next = MAX_MINUTES;
    else if (this.dragMinutes < 15 && minutes > 45) next = 0;
    this.dragMinutes = next;

    this.applyMinutes(Math.round(next));
  }

  onDragEnd(event: PointerEvent): void {
    if (!this.dragStart || event.pointerId !== this.dragStart.id) return;
    if (this.isDragging) {
      this.suppressClick = true;
    }
    this.isDragging = false;
    this.dragStart = null;
  }

  onTilt(event: PointerEvent): void {
    if (this.isDragging || this.reduceMotion) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    this.tiltY = x * 14;
    this.tiltX = 10 - y * 14;
  }

  private announce(message: string): void {
    const el = document.getElementById('a11y-announcements');
    if (el) {
      el.textContent = message;
    }
  }

  resetTilt(): void {
    this.tiltX = 0;
    this.tiltY = 0;
  }

  formatTime(seconds: number): string {
    const total = Math.ceil(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // ---------- Sessions & enchaînement ----------

  private setSelectedPreset(preset: Preset): void {
    this.selectedPresetId = preset.id;
    writePref('preset', preset.id);
  }

  /** Démarre un décompte et ouvre une session d'historique (`lateBy` : secondes déjà écoulées). */
  private startSession(preset: Preset, seconds: number, lateBy = 0): void {
    const now = Date.now();
    const custom = seconds !== preset.seconds && lateBy === 0;
    this.session = {
      name: custom ? this.i18n.t('mode.custom') : this.presetName(preset),
      color: preset.color,
      kind: preset.kind,
      plannedSeconds: lateBy ? preset.seconds : seconds,
      startedAt: now - lateBy * 1000,
      activeMs: lateBy * 1000,
      runningSince: now
    };
    if (preset.kind === 'focus') this.lastFocusPresetId = preset.id;
    this.timerService.start(seconds);
  }

  private pauseSession(): void {
    const s = this.session;
    if (s?.runningSince) {
      s.activeMs += Date.now() - s.runningSince;
      s.runningSince = null;
    }
  }

  /** Clôt la session en cours ; `lateBy` retire le temps écoulé après la fin prévue (arrière-plan). */
  private endSession(completed: boolean, lateBy = 0): void {
    const s = this.session;
    if (!s) return;
    this.pauseSession();
    this.session = null;
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
    if (completed && s.kind === 'focus') this.focusRounds++;
    if (completed && s.kind === 'longBreak') this.focusRounds = 0;
  }

  /** Mode suivant dans le cycle travail → pause (longue toutes les N sessions) → travail. */
  private nextInChain(kind: PresetKind, roundsAfter: number): Preset | undefined {
    if (kind === 'focus') {
      const long = roundsAfter > 0 && roundsAfter % LONG_BREAK_EVERY === 0;
      return (long && this.presetService.firstOfKind('longBreak')) || this.presetService.firstOfKind('break');
    }
    return this.presetService.byId(this.lastFocusPresetId) ?? this.presetService.firstOfKind('focus');
  }

  private applyMinutes(minutes: number): void {
    const seconds = minutes * 60;
    const current = Math.ceil(this.displaySeconds / 60);

    if (this.isRunning || this.isPaused) {
      this.manualChange = true;
      if (seconds <= 0) {
        this.endSession(this.inExtra);
        this.inExtra = false;
        this.timerService.reset();
        this.durationSeconds = 0;
      } else {
        this.timerService.setTimeLeft(seconds);
      }
      this.manualChange = false;
    } else {
      this.durationSeconds = seconds;
    }

    if (minutes !== current) {
      this.tick();
    }
  }

  /** Minutes (0-60, sens anti-horaire depuis 0) sous le pointeur, ou null au centre. */
  private minutesAtPointer(event: PointerEvent): number | null {
    const svg = this.dialRef.nativeElement;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    const dx = pt.x - CX;
    const dy = pt.y - CY;
    if (Math.hypot(dx, dy) < 30) return null;
    const clockwise = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return (((-clockwise % 360) + 360) % 360) / 6;
  }

  private initialDarkMode(): boolean {
    const saved = readPref('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  /** Son de palier quand le décompte passe sous 45, 30 ou 15 minutes restantes. */
  private checkMilestones(previous: number, current: number): void {
    // Uniquement un décompte normal : pas un réglage au doigt, au curseur ni un reset
    if (!this.isRunning || this.isDragging || this.manualChange) return;
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
    const kind = this.session?.kind ?? this.selectedPreset.kind;

    if (this.autoExtra && !this.inExtra && kind === 'focus') {
      // La prolongation part de l'heure de fin réelle, même si l'app était en arrière-plan
      const extraLeft = EXTRA_SECONDS - lateBy;
      if (extraLeft > 0) {
        this.inExtra = true;
        this.timerService.start(extraLeft);
        this.announce(this.i18n.t('mode.extra'));
        return;
      }
      lateBy -= EXTRA_SECONDS;
    }

    this.inExtra = false;
    this.endSession(true, lateBy);

    const next = this.autoChain ? this.nextInChain(kind, this.focusRounds) : undefined;
    if (next && next.seconds - lateBy > 0) {
      this.setSelectedPreset(next);
      this.durationSeconds = next.seconds;
      this.startSession(next, next.seconds - lateBy, lateBy);
      this.announce(this.i18n.t('state.running') + ', ' + this.presetName(next));
      return;
    }
    this.finished = true;
    this.announce(this.i18n.t('state.finished'));
  }

  /** Alertes à programmer avant la mise en arrière-plan : paliers, fin, prolongation, session suivante. */
  private scheduleAlerts(): void {
    const endAt = this.timerService.endTime;
    if (endAt === null) return;
    const t = (key: I18nKey, params?: Record<string, string | number>) => this.i18n.t(key, params);
    const kind = this.session?.kind ?? this.selectedPreset.kind;
    const alerts: Alert[] = [];

    if (!this.inExtra) {
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

    const willExtend = this.autoExtra && !this.inExtra && kind === 'focus';
    const roundsAfter = kind === 'focus' ? this.focusRounds + 1 : this.focusRounds;
    const next = this.autoChain ? this.nextInChain(kind, roundsAfter) : undefined;
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

    this.notifications.schedule(alerts, this.soundOn);
  }

  /** Transmet au widget l'état affiché (mode, fin du décompte, objectif du jour). */
  private syncWidget(): void {
    const endAt = this.timerService.endTime;
    const state = endAt !== null ? 'running' : this.isPaused ? 'paused' : 'idle';
    const t = (key: I18nKey) => this.i18n.t(key);
    this.widget.update({
      dayStart: this.history.dayStart(),
      focusMinutes: this.history.today().focusMinutes,
      goalMinutes: this.history.dailyGoal(),
      timer: {
        state,
        name: this.modeName,
        color: this.session?.color ?? this.selectedPreset.color,
        endAt: endAt ?? undefined,
        remainingSeconds: state === 'paused' ? Math.round(this.timeLeft) : undefined
      },
      labels: {
        today: t('stats.focus'),
        goalReached: t('stats.goalReached'),
        paused: t('state.paused'),
        ready: this.stateLabel,
        finished: t('state.finished')
      },
      rtl: this.i18n.dir() === 'rtl'
    });
  }

  private tick(): void {
    import('@capacitor/haptics')
      .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light }))
      .catch(() => {});
  }

  /** Point à un rayon donné, pour une valeur en minutes (sens anti-horaire depuis 0). */
  private point(r: number, minutes: number) {
    const rad = (-minutes * 6 * Math.PI) / 180;
    return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
  }

  private sectorPath(r: number, minutes: number): string {
    if (minutes <= 0) return '';
    if (minutes >= 60) {
      return `M ${CX} ${CY - r} A ${r} ${r} 0 1 0 ${CX} ${CY + r} A ${r} ${r} 0 1 0 ${CX} ${CY - r} Z`;
    }
    const end = this.point(r, minutes);
    const large = minutes > 30 ? 1 : 0;
    return `M ${CX} ${CY} L ${CX} ${CY - r} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y} Z`;
  }

  /** Minute où commence la partie droite de la bande, pour que son bout arrondi dépasse le 0. */
  private get bgCapMinutes(): number {
    const capR = (BG_R - RING_OUTER) / 2;
    const midR = (BG_R + RING_OUTER) / 2;
    return (capR / midR) * (180 / Math.PI) / 6 - BG_CAP_PAST_ZERO_MIN;
  }

  /** Bande de 0 à 15 avec un bout arrondi côté 0 (remplie, ou seulement son contour). */
  private roundedBandPath(closed: boolean): string {
    const capR = (BG_R - RING_OUTER) / 2;
    const m = this.bgCapMinutes;
    const inner = this.point(RING_OUTER, m);
    const outer = this.point(BG_R, m);
    const outerEnd = this.point(BG_R, BG_TO_MIN);
    const contour = `M ${inner.x} ${inner.y} A ${capR} ${capR} 0 0 0 ${outer.x} ${outer.y} ` +
      `A ${BG_R} ${BG_R} 0 0 0 ${outerEnd.x} ${outerEnd.y}`;
    if (!closed) return contour;
    const innerEnd = this.point(RING_OUTER, BG_TO_MIN);
    return `${contour} L ${innerEnd.x} ${innerEnd.y} A ${RING_OUTER} ${RING_OUTER} 0 0 1 ${inner.x} ${inner.y} Z`;
  }

  private arcBetween(r: number, fromMin: number, toMin: number): string {
    const start = this.point(r, fromMin);
    const end = this.point(r, toMin);
    const large = toMin - fromMin > 30 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
  }

  private annulusPath(fromMin: number, toMin: number, outer = RING_OUTER, inner = RING_INNER): string {
    const o0 = this.point(outer, fromMin);
    const o1 = this.point(outer, toMin);
    const i1 = this.point(inner, toMin);
    const i0 = this.point(inner, fromMin);
    const large = toMin - fromMin > 30 ? 1 : 0;
    return `M ${o0.x} ${o0.y} A ${outer} ${outer} 0 ${large} 0 ${o1.x} ${o1.y} ` +
      `L ${i1.x} ${i1.y} A ${inner} ${inner} 0 ${large} 1 ${i0.x} ${i0.y} Z`;
  }
}
