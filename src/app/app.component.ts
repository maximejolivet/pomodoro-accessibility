import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesService } from './core/services/preferences.service';

/**
 * Coquille de l'application : elle applique le thème choisi (les jetons de couleur
 * vivent dans src/theme/, posés sur son élément hôte donc hérités par les pages)
 * et accueille la page courante.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  host: {
    '[class.dark]': 'prefs.darkMode()',
    '[class.opendyslexic-mode]': 'prefs.opendyslexic()'
  }
})
export class AppComponent {
  protected readonly prefs = inject(PreferencesService);
}
