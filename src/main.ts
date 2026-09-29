import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Retire le voile d'amorçage. Appelé même si le démarrage échoue : un voile resté en place
 * sur une erreur laisserait un écran noir dont on ne saurait rien.
 */
function hideBoot(): void {
  document.documentElement.classList.remove('booting');
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('done');
  setTimeout(() => boot.remove(), 300);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err))
  .finally(hideBoot);
