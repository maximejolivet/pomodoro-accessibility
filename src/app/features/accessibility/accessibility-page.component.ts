import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import { A11Y_TEXTS } from './accessibility.i18n';

@Component({
  selector: 'app-accessibility-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accessibility-page.component.html',
  styleUrls: ['./accessibility-page.component.css']
})
export class AccessibilityPageComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(I18nService);
  private readonly titleService = inject(Title);
  private readonly previousTitle = this.titleService.getTitle();

  readonly s = computed(() => A11Y_TEXTS[this.i18n.lang()]);

  @ViewChild('pageTitle') private pageTitle?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => this.titleService.setTitle(this.s().pageTitle));
  }

  ngAfterViewInit(): void {
    this.pageTitle?.nativeElement.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    this.titleService.setTitle(this.previousTitle);
  }
}
