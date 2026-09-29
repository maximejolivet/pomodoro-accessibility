import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAX_MINUTES } from '../../../core/constants/timer.constants';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { Preset } from '../../../core/models/preset.model';
import { SessionService } from '../../../core/services/session.service';
import {
  BG_ARC_PATH, BG_FADE, BG_FILL_PATH, BG_HIGHLIGHT_PATH, CX, CY, DIAL_LABELS, DIAL_SEGMENTS,
  DIAL_SEPARATORS, DIAL_TRANSFORM, DISK_R, RING_INNER, minutesAtPointer, point, sectorPath
} from '../dial-geometry';

/** Déplacement à dépasser pour qu'un appui sur le cadran devienne un réglage. */
const DRAG_THRESHOLD_PX = 6;

/** Boîtier 3D et cadran : affichage du temps restant, réglage au doigt et au clavier. */
@Component({
  selector: 'app-timer-dial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer-dial.component.html',
  styleUrl: './timer-dial.component.css'
})
export class TimerDialComponent {
  Math = Math;  // Expose Math to templates
  readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);

  readonly cx = CX;
  readonly cy = CY;
  readonly ringInner = RING_INNER;
  readonly dialTransform = DIAL_TRANSFORM;
  readonly maxMinutes = MAX_MINUTES;
  readonly segments = DIAL_SEGMENTS;
  readonly separators = DIAL_SEPARATORS;
  readonly labels = DIAL_LABELS;
  readonly bgFillPath = BG_FILL_PATH;
  readonly bgArcPath = BG_ARC_PATH;
  readonly bgHighlightPath = BG_HIGHLIGHT_PATH;
  readonly bgFade = BG_FADE;

  @ViewChild('dial') dialRef!: ElementRef<SVGSVGElement>;

  tiltX = 0;
  tiltY = 0;

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
