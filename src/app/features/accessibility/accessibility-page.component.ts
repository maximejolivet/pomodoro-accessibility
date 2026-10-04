import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { I18nService } from '../../core/i18n/i18n.service';
import type { IconName } from '../../core/services/icons.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { A11Y_TEXTS, DECLARATION_DATE } from './accessibility.i18n';

const PROFILE_ICONS: IconName[] = ['blind', 'keyboard', 'search', 'hearing', 'vibration', 'brain', 'font', 'image'];

@Component({
  selector: 'app-accessibility-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './accessibility-page.component.html',
  styleUrls: ['./accessibility-page.component.css']
})
export class AccessibilityPageComponent implements AfterViewInit, OnDestroy {
  readonly profileIcons = PROFILE_ICONS;
  readonly i18n = inject(I18nService);
  private readonly titleService = inject(Title);
  private readonly previousTitle = this.titleService.getTitle();

  readonly s = computed(() => A11Y_TEXTS[this.i18n.lang()]);

  /** Date d'établissement de la déclaration, écrite dans la langue affichée. */
  readonly declarationDate = computed(() =>
    new Intl.DateTimeFormat(this.i18n.lang(), { dateStyle: 'long' }).format(new Date(DECLARATION_DATE)));

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
