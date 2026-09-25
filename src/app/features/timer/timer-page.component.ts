import { Component, ElementRef, HostListener, ViewChild, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  GOAL_MAX_MINUTES, GOAL_MIN_MINUTES, GOAL_STEP_MINUTES
} from '../../core/constants/history.constants';
import { PRESET_COLORS } from '../../core/constants/preset.constants';
import { LONG_BREAK_EVERY, MAX_MINUTES } from '../../core/constants/timer.constants';
import { formatTime } from '../../core/helpers/time';
import { I18nService } from '../../core/i18n/i18n.service';
import { I18nKey, LANGUAGES, LangChoice } from '../../core/i18n/i18n.model';
import type { Preset, PresetKind } from '../../core/models/preset.model';
import type { Session } from '../../core/models/session.model';
import { HistoryService } from '../../core/services/history.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { PresetService } from '../../core/services/preset.service';
import { SessionService } from '../../core/services/session.service';
import { SoundService } from '../../core/services/sound.service';
import {
  BG_ARC_PATH, BG_FADE, BG_FILL_PATH, BG_HIGHLIGHT_PATH, CX, CY, DIAL_LABELS, DIAL_SEGMENTS,
  DIAL_SEPARATORS, DIAL_TRANSFORM, DISK_R, RING_INNER, minutesAtPointer, point, sectorPath
} from './dial-geometry';
import { PresetDraft, SheetTab } from './timer.model';

/** Déplacement à dépasser pour qu'un appui sur le cadran devienne un réglage. */
const DRAG_THRESHOLD_PX = 6;

/**
 * Page du minuteur : cadran, contrôles et panneau Modes / Stats / Réglages.
 * Elle n'affiche et ne pilote que l'état porté par `SessionService` ; elle ne
 * détient elle-même que ce qui peut disparaître avec elle (panneau, brouillon, geste).
 */
@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './timer-page.component.html',
  styleUrl: './timer-page.component.css'
})
export class TimerPageComponent {
  Math = Math;  // Expose Math to templates
  readonly session = inject(SessionService);
  i18n = inject(I18nService);
  presetService = inject(PresetService);
  history = inject(HistoryService);
  readonly prefs = inject(PreferencesService);
  private sound = inject(SoundService);

  readonly cx = CX;
  readonly cy = CY;
  readonly ringInner = RING_INNER;
  readonly dialTransform = DIAL_TRANSFORM;
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

  showSheet = false;
  sheetTab: SheetTab = 'modes';
  tiltX = 0;
  tiltY = 0;

  draft: PresetDraft | null = null;
  /** Action destructive en attente de second tap. */
  confirming: 'delete' | 'restore' | 'clear' | null = null;

  private dragStart: { x: number; y: number; id: number } | null = null;
  private dragMinutes = 0;
  private suppressClick = false;
  private reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  readonly segments = DIAL_SEGMENTS;
  readonly separators = DIAL_SEPARATORS;
  readonly labels = DIAL_LABELS;
  readonly bgFillPath = BG_FILL_PATH;
  readonly bgArcPath = BG_ARC_PATH;
  readonly bgHighlightPath = BG_HIGHLIGHT_PATH;
  readonly bgFade = BG_FADE;

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

  // ---------- État affiché (porté par SessionService) ----------

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  get durationSeconds(): number {
    return this.session.durationSeconds();
  }

  get isRunning(): boolean {
    return this.session.isRunning();
  }

  get isPaused(): boolean {
    return this.session.isPaused();
  }

  get isDragging(): boolean {
    return this.session.dragging();
  }

  get finished(): boolean {
    return this.session.finished();
  }

  get focusRounds(): number {
    return this.session.focusRounds();
  }

  get displaySeconds(): number {
    return this.session.displaySeconds();
  }

  get displayMinutes(): number {
    return this.session.displayMinutes();
  }

  get modeName(): string {
    return this.session.modeName();
  }

  get stateLabel(): string {
    return this.session.stateLabel();
  }

  get cycleLabel(): string | null {
    return this.session.cycleLabel();
  }

  get mainActionLabel(): string {
    return this.session.mainActionLabel();
  }

  /** Angle (degrés, sens horaire depuis le haut) du bord du disque. */
  get edgeAngle(): number {
    return -this.displayMinutes * 6;
  }

  get diskOuterPath(): string {
    return sectorPath(DISK_R, this.displayMinutes);
  }

  get diskInnerPath(): string {
    return sectorPath(RING_INNER, this.displayMinutes);
  }

  get edgeLine() {
    return point(DISK_R, this.displayMinutes);
  }

  presetName(preset: Preset): string {
    return this.session.presetName(preset);
  }

  formatTime(seconds: number): string {
    return formatTime(seconds);
  }

  kindLabel(kind: PresetKind): string {
    return this.i18n.t(`preset.kind.${kind}` as I18nKey);
  }

  colorLabel(hex: string): string {
    const colorNames: Record<string, I18nKey> = {
      '#8b6fd6': 'color.purple',
      '#d63f4f': 'color.red',
      '#ef7d2d': 'color.orange',
      '#f3a52b': 'color.amber',
      '#c3cd36': 'color.lime',
      '#56b27b': 'color.green',
      '#5aa9c4': 'color.cyan',
      '#5d6db3': 'color.blue',
      '#b24f97': 'color.magenta',
      '#56636a': 'color.gray'
    };
    const key = colorNames[hex];
    return key ? this.i18n.t(key) : hex;
  }

  // ---------- Commandes ----------

  toggle(): void {
    this.session.toggle();
  }

  resetTimer(): void {
    this.session.reset();
  }

  selectPreset(preset: Preset): void {
    this.session.selectPreset(preset);
  }

  setDurationMinutes(minutes: number): void {
    this.session.setMinutes(Math.max(1, Math.min(MAX_MINUTES, minutes)));
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

  @HostListener('keydown.arrowLeft')
  onArrowLeft(): void {
    // Navigation onglets en mode sheet, ou réglage cadran en focus
    if (this.showSheet) {
      this.selectPrevTab();
    } else if (document.activeElement?.className.includes('face')) {
      this.session.setMinutes(Math.max(1, Math.ceil(this.displayMinutes) - 1));
    }
  }

  @HostListener('keydown.arrowRight')
  onArrowRight(): void {
    if (this.showSheet) {
      this.selectNextTab();
    } else if (document.activeElement?.className.includes('face')) {
      this.session.setMinutes(Math.min(MAX_MINUTES, Math.floor(this.displayMinutes) + 1));
    }
  }

  @HostListener('keydown.pageUp')
  onPageUp(): void {
    if (document.activeElement?.className.includes('face')) {
      this.session.setMinutes(Math.max(1, Math.ceil(this.displayMinutes) - 5));
    }
  }

  @HostListener('keydown.pageDown')
  onPageDown(): void {
    if (document.activeElement?.className.includes('face')) {
      this.session.setMinutes(Math.min(MAX_MINUTES, Math.floor(this.displayMinutes) + 5));
    }
  }

  @HostListener('keydown.home')
  onHome(): void {
    if (document.activeElement?.className.includes('face')) {
      this.session.setMinutes(0);
    }
  }

  @HostListener('keydown.end')
  onEnd(): void {
    if (document.activeElement?.className.includes('face')) {
      this.session.setMinutes(MAX_MINUTES);
    }
  }

  private selectPrevTab(): void {
    const tabs: SheetTab[] = ['modes', 'stats', 'settings'];
    const idx = tabs.indexOf(this.sheetTab);
    this.setTab(tabs[(idx - 1 + 3) % 3]);
  }

  private selectNextTab(): void {
    const tabs: SheetTab[] = ['modes', 'stats', 'settings'];
    const idx = tabs.indexOf(this.sheetTab);
    this.setTab(tabs[(idx + 1) % 3]);
  }

  setTab(tab: SheetTab): void {
    this.sheetTab = tab;
    this.draft = null;
    this.confirming = null;
  }

  // ---------- Réglages ----------

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
    this.session.syncDurationWith(saved);
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
      this.session.dragging.set(true);
      this.resetTilt();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    const minutes = minutesAtPointer(this.dialRef.nativeElement, event);
    if (minutes === null) return;

    // Pas de saut entre 0 et 60 en passant par le haut : on bloque aux extrémités.
    let next = minutes;
    if (this.dragMinutes > 45 && minutes < 15) next = MAX_MINUTES;
    else if (this.dragMinutes < 15 && minutes > 45) next = 0;
    this.dragMinutes = next;

    this.session.setMinutes(next);
  }

  onDragEnd(event: PointerEvent): void {
    if (!this.dragStart || event.pointerId !== this.dragStart.id) return;
    if (this.isDragging) {
      this.suppressClick = true;
    }
    this.session.dragging.set(false);
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

  resetTilt(): void {
    this.tiltX = 0;
    this.tiltY = 0;
  }
}
