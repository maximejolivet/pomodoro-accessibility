import { Component, ViewChild, computed, inject } from '@angular/core';
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
    SettingsSheetComponent
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

  @ViewChild(TimerControlsComponent) private controls?: TimerControlsComponent;

  showSheet = false;

  openSheet(): void {
    this.showSheet = true;
  }

  /** Le panneau rend la main : on remet le focus sur le bouton qui l'a ouvert. */
  onSheetClosed(): void {
    this.showSheet = false;
    // La page ne sort de `inert` qu'au rendu : un focus immédiat serait ignoré
    setTimeout(() => this.controls?.focusSettingsButton());
  }
}
