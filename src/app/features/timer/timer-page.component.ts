import { Component, HostListener, ViewChild, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { SessionService } from '../../core/services/session.service';
import { TimerControlsComponent } from './controls/timer-controls.component';
import { TimerDialComponent } from './dial/timer-dial.component';
import { TimerReadoutComponent } from './readout/timer-readout.component';
import { RoutineStripComponent } from './routine/routine-strip.component';
import { SettingsSheetComponent } from './sheet/settings-sheet.component';
import { TutorialComponent } from './tutorial/tutorial.component';

/**
 * Page du minuteur : assemble le cadran, l'affichage, les contrôles et le panneau
 * de réglages. L'état du décompte vit dans `SessionService` ; il ne reste ici que
 * l'ouverture du panneau et la zone d'annonces pour les lecteurs d'écran.
 */
@Component({
  selector: 'app-timer-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TimerDialComponent,
    TimerReadoutComponent,
    RoutineStripComponent,
    TimerControlsComponent,
    SettingsSheetComponent,
    TutorialComponent
  ],
  templateUrl: './timer-page.component.html',
  styleUrl: './timer-page.component.css'
})
export class TimerPageComponent {
  readonly session = inject(SessionService);
  readonly prefs = inject(PreferencesService);
  readonly i18n = inject(I18nService);

  /**
   * Bandeau de fin : il reste tant que rien n'a été touché, là où la pulsation passe.
   * Sans lui, une personne sourde qui regardait ailleurs ne saurait pas que c'est fini.
   */
  readonly showEndBanner = computed(
    () => this.session.finished() && this.prefs.visualAlert() !== 'off'
  );

  /**
   * Tutoriel d'accueil : montré tant qu'il n'a pas été vu, c'est-à-dire au premier
   * lancement. « Revoir le tutoriel » remet la préférence à faux, ce qui le rouvre.
   */
  readonly showTutorial = computed(() => !this.prefs.tutorialSeen());

  @ViewChild(TimerControlsComponent) private controls?: TimerControlsComponent;

  showSheet = false;

  openSheet(): void {
    this.showSheet = true;
  }

  /** Le panneau rend la main : on remet le focus sur le bouton qui l'a ouvert. */
  onSheetClosed(): void {
    this.showSheet = false;
    // Sauf si le panneau s'est fermé pour laisser place au tutoriel, qui prend le focus
    if (this.showTutorial()) return;
    // La page ne sort de `inert` qu'au rendu : un focus immédiat serait ignoré
    setTimeout(() => this.controls?.focusSettingsButton());
  }

  /** Sortie du mode table par le bouton. */
  leaveTable(): void {
    this.session.setTableMode(false);
  }

  /**
   * Échap sort du mode table, comme il ferme une modale — mais pas quand une vraie modale
   * est ouverte : elle a la priorité, c'est elle qu'on veut fermer d'abord.
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showSheet || this.showTutorial()) return;
    if (this.session.tableMode()) this.session.setTableMode(false);
  }

  /** Vu, passé ou revu : dans les trois cas il ne se remontrera pas tout seul. */
  onTutorialClosed(): void {
    this.prefs.setTutorialSeen(true);
    setTimeout(() => this.controls?.focusMainButton());
  }
}
