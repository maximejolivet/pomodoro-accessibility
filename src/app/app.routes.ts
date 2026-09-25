import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/timer/timer-page.component').then(m => m.TimerPageComponent)
  },
  {
    path: 'accessibility',
    loadComponent: () =>
      import('./features/accessibility/accessibility-page.component').then(m => m.AccessibilityPageComponent)
  },
  { path: '**', redirectTo: '' }
];
