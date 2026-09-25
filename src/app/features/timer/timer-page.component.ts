import { Component, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { SessionService } from '../../core/services/session.service';
import { TimerControlsComponent } from './controls/timer-controls.component';
import { TimerDialComponent } from './dial/timer-dial.component';
import { TimerReadoutComponent } from './readout/timer-readout.component';
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
    RouterModule,
    TimerDialComponent,
    TimerReadoutComponent,
    TimerControlsComponent,
    SettingsSheetComponent
  ],
  templateUrl: './timer-page.component.html',
  styleUrl: './timer-page.component.css'
})
export class TimerPageComponent {
  readonly session = inject(SessionService);
  readonly i18n = inject(I18nService);

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
