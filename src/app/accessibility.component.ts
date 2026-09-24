import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { I18nService } from './i18n';

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accessibility.component.html',
  styleUrls: ['./accessibility.component.css']
})
export class AccessibilityComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly titleService = inject(Title);
  private readonly previousTitle = this.titleService.getTitle();

  @ViewChild('pageTitle') private pageTitle?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.titleService.setTitle('Accessibilité – Pomodoro TDAH');
    this.pageTitle?.nativeElement.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    this.titleService.setTitle(this.previousTitle);
  }
}
