import {
  Component, ElementRef, HostListener, computed, effect, inject, output, signal, untracked, viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../core/i18n/i18n.service';
import type { I18nKey } from '../../../core/i18n/i18n.model';
import { TUTORIAL_SLIDES } from '../../../core/constants/tutorial.constants';

/** Distance minimale d'un glissement pour changer de vue, en pixels. */
const SWIPE_PX = 50;

/**
 * Tutoriel d'accueil : cinq vues qui disent ce que fait l'application, montrées une
 * fois au premier lancement.
 *
 * Il tient dans les mêmes contraintes que le reste : un pictogramme avant le texte pour
 * qui ne lit pas, du texte court, aucune avance automatique (WCAG 2.2.2 — on n'impose
 * pas son rythme à quelqu'un qui lit lentement), et trois façons d'avancer : le doigt,
 * les boutons, le clavier. Il se passe d'un appui, et se revoit depuis les réglages.
 */
@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.css'
})
export class TutorialComponent {
  readonly i18n = inject(I18nService);

  /** Émis à la fin comme au passage : dans les deux cas, le tutoriel est vu. */
  readonly closed = output<void>();

  readonly slides = TUTORIAL_SLIDES;
  readonly index = signal(0);

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly nextButton = viewChild<ElementRef<HTMLButtonElement>>('nextButton');
  private swipeFrom: { x: number; id: number } | null = null;

  readonly isLast = computed(() => this.index() === this.slides.length - 1);

  /**
   * Ce que le lecteur d'écran entend au changement de vue : le rang et le titre, pas
   * le texte entier — il est juste là, lisible en parcourant la vue, et l'entendre deux
   * fois ne renseigne personne.
   */
  readonly liveLabel = computed(() =>
    this.i18n.t('tutorial.step', {
      n: this.index() + 1,
      total: this.slides.length,
      title: this.i18n.t(this.slides[this.index()].titleKey)
    })
  );

  title(key: I18nKey): string {
    return this.i18n.t(key);
  }

  next(): void {
    if (this.isLast()) {
      this.close();
      return;
    }
    this.index.update(i => i + 1);
  }

  previous(): void {
    this.index.update(i => Math.max(0, i - 1));
  }

  goTo(index: number): void {
    this.index.set(Math.max(0, Math.min(this.slides.length - 1, index)));
  }

  close(): void {
    this.closed.emit();
  }

  /** Échap passe le tutoriel : il ne retient personne. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  /**
   * Flèches gauche / droite, dans l'ordre de lecture des boutons et non de la langue :
   * c'est déjà le choix fait sur le cadran, où → ajoute une minute en arabe aussi.
   */
  onArrowRight(): void {
    if (!this.isLast()) this.index.update(i => i + 1);
  }

  onArrowLeft(): void {
    this.previous();
  }

  onSwipeStart(event: PointerEvent): void {
    this.swipeFrom = { x: event.clientX, id: event.pointerId };
  }

  /** Glisser d'une vue à l'autre, sans que ce soit le seul moyen (WCAG 2.5.1). */
  onSwipeEnd(event: PointerEvent): void {
    const from = this.swipeFrom;
    this.swipeFrom = null;
    if (!from || from.id !== event.pointerId) return;
    const moved = event.clientX - from.x;
    if (Math.abs(moved) < SWIPE_PX) return;
    // En arabe, les vues défilent dans l'autre sens : le geste suit ce qu'on voit
    const forward = this.i18n.dir() === 'rtl' ? moved > 0 : moved < 0;
    if (forward) this.onArrowRight();
    else this.previous();
  }
}
