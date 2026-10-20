import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAX_MINUTES } from '../../../core/constants/timer.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Preset } from '../../../core/models/preset.model';
import { SessionService } from '../../../core/services/session.service';
import { TimerReadoutComponent } from '../readout/timer-readout.component';
import { TimerControlsComponent } from '../controls/timer-controls.component';
import {
  BG_ARC_PATH, BG_FADE, BG_FILL_PATH, BG_HIGHLIGHT_PATH, CX, CY, DIAL_LABELS, DIAL_SEGMENTS,
  DIAL_SEPARATORS, DIAL_TICKS, DIAL_TRANSFORM, DISK_R, RING_INNER, SEGMENT_COLORS, minutesAtPointer,
  point, sectorPath
} from '../dial-geometry';

/** Rapport de contraste WCAG entre deux couleurs hexadécimales. */
function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Arc du trait de progression, de la minute `from` à `to`, sur le cercle du boîtier (viewBox 100). */
function progressArc(from: number, to: number): string {
  const p = (minutes: number) => {
    // Même sens que les chiffres du cadran : 0 en haut, puis vers la gauche (sens inverse des aiguilles).
    const rad = (-minutes * 6 * Math.PI) / 180;
    return { x: 50 + 48 * Math.sin(rad), y: 50 - 48 * Math.cos(rad) };
  };
  const a = p(from);
  const b = p(to);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A 48 48 0 0 0 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}
/** Déplacement à dépasser pour qu'un appui sur le cadran devienne un réglage. */
const DRAG_THRESHOLD_PX = 6;

/** Boîtier 3D et cadran : affichage du temps restant, réglage au doigt et au clavier. */
@Component({
  selector: 'app-timer-dial',
  standalone: true,
  imports: [CommonModule, TimerReadoutComponent, TimerControlsComponent],
  templateUrl: './timer-dial.component.html',
  styleUrl: './timer-dial.component.css'
})
export class TimerDialComponent {
  Math = Math;  // Expose Math to templates
  readonly session = inject(SessionService);
  /** Relayé depuis les commandes du boîtier : ouvre les réglages. */
  @Output() readonly openSettings = new EventEmitter<void>();
  readonly i18n = inject(I18nService);

  readonly cx = CX;
  readonly cy = CY;
  readonly ringInner = RING_INNER;
  readonly dialTransform = DIAL_TRANSFORM;
  readonly maxMinutes = MAX_MINUTES;
  readonly segments = DIAL_SEGMENTS;
  readonly separators = DIAL_SEPARATORS;
  readonly ticks = DIAL_TICKS;
  readonly labels = DIAL_LABELS;
  readonly bgFillPath = BG_FILL_PATH;
  readonly bgArcPath = BG_ARC_PATH;
  readonly bgHighlightPath = BG_HIGHLIGHT_PATH;
  readonly bgFade = BG_FADE;

  @ViewChild('dial') dialRef!: ElementRef<SVGSVGElement>;

  private dragStart: { x: number; y: number; id: number } | null = null;
  private dragMinutes = 0;
  private suppressClick = false;
  private reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  get selectedPreset(): Preset {
    return this.session.selectedPreset();
  }

  get displayMinutes(): number {
    return this.session.displayMinutes();
  }

  /**
   * Ce que le cadran gradue : des minutes, ou des secondes quand l'étape en cours dure
   * moins d'une minute. La valeur va de 0 à 60 dans les deux cas — les chiffres de la
   * face, eux, ne changent pas.
   */
  get displayUnits(): number {
    return this.session.displayUnits();
  }

  /** Vrai quand la graduation vaut des secondes : le cadran le dit, et ne se règle plus. */
  get inSeconds(): boolean {
    return this.session.dialUnit() === 'seconds';
  }

  /** Ce que le lecteur d'écran annonce à chaque pas : « 24 minutes », « 20 secondes ». */
  get dialText(): string {
    return this.inSeconds
      ? this.session.durationLabel(Math.ceil(this.session.displaySeconds()))
      : this.session.minutesLabel(Math.ceil(this.displayMinutes));
  }

  get isDragging(): boolean {
    return this.session.dragging();
  }

  get locked(): boolean {
    return this.session.locked();
  }

  /** Le réglage seul est neutralisé : en secondes, glisser donnerait des minutes. */
  get settingLocked(): boolean {
    return this.session.settingLocked();
  }

  get mainActionLabel(): string {
    return this.session.mainActionLabel();
  }

  /** Angle (degrés, sens horaire depuis le haut) du bord du disque. */
  get edgeAngle(): number {
    return -this.displayUnits * 6;
  }

  /** Vrai pour le chiffre que l'aiguille désigne : il est écrit sur le rond de l'aiguille. */
  isOnTab(text: string): boolean {
    const units = this.displayUnits;
    const value = Number(text);
    const distance = Math.min(
      Math.abs(units - value),
      Math.abs(units - value - 60),
      Math.abs(units - value + 60)
    );
    return distance < 2.5;
  }

  /** Encre ou blanc, selon celui qui contraste le plus avec la tranche sous l'aiguille. */
  get tabTextColor(): string {
    return contrastRatio('#ffffff', this.tabColor) >= contrastRatio('#2f3336', this.tabColor)
      ? '#ffffff'
      : '#2f3336';
  }

  /** Couleur de la tranche de 5 minutes sous l'aiguille : le rond la reprend. */
  get tabColor(): string {
    // Couleur du mode courant : l'aiguille et le trait changent avec le préréglage.
    return this.selectedPreset.color;
  }

  /** Une seule couleur d'accent : la tranche sous l'aiguille. Les autres tranches sont grises. */
  segmentFill(index: number): string {
    // À zéro, il ne reste rien à colorer : toutes les tranches restent grises.
    if (this.displayUnits <= 0) return '#d6d1c4';
    return SEGMENT_COLORS[index];
  }

  /** Trait autour du boîtier : du 0 jusqu'au temps écoulé, en petits arcs d'une minute. */
  get progressArcs(): { d: string; color: string }[] {
    // À l'inverse : le trait montre le temps restant, plein au départ, il se vide ensuite.
    const total = Math.min(60, Math.max(0, this.displayUnits));
    const arcs: { d: string; color: string }[] = [];
    for (let m = 0; m < total; m += 1) {
      arcs.push({ d: progressArc(m, Math.min(total, m + 1)), color: this.tabColor });
    }
    return arcs;
  }

  trackArc(index: number): number {
    return index;
  }

  get diskOuterPath(): string {
    return sectorPath(DISK_R, this.displayUnits);
  }

  get diskInnerPath(): string {
    return sectorPath(RING_INNER, this.displayUnits);
  }

  get edgeLine() {
    return point(DISK_R, this.displayUnits);
  }

  toggleLock(): void {
    this.session.toggleLock();
  }

  onFaceClick(): void {
    // Verrouillé, le cadran ne démarre plus : une paume posée dessus ne fait plus rien
    if (this.locked) return;
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.session.toggle();
  }

  /** Flèches et Page ↑/↓ quand le cadran a le focus. */
  stepMinutes(delta: number): void {
    this.session.stepMinutes(delta);
  }

  setMinutes(minutes: number): void {
    this.session.setMinutes(minutes);
  }

  onDragStart(event: PointerEvent): void {
    if (event.button !== 0 || this.settingLocked) return;
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

}
