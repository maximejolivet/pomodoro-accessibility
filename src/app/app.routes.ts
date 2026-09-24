import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { AccessibilityComponent } from './accessibility.component';

export const appRoutes: Routes = [
  { path: '', component: AppComponent },
  { path: 'accessibility', component: AccessibilityComponent }
];
