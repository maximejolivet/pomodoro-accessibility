import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { I18nService } from './i18n';

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.css']
})
export class AccessibilityComponent {
  constructor(readonly i18n: I18nService) {}
}
