import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconsService, IconName } from '../../../core/services/icons.service';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<span [innerHTML]="iconSvg" [class]="'icon icon-' + name" [style.color]="iconColor" [attr.aria-hidden]="ariaHidden"></span>`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
      line-height: 1;
      flex-shrink: 0;
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }
  `]
})
export class IconComponent {
  @Input() name!: IconName;
  @Input() ariaHidden: boolean | 'true' | 'false' = 'true';

  private iconsService = inject(IconsService);

  get iconSvg() {
    return this.iconsService.getSVG(this.name);
  }

  get iconColor() {
    return this.iconsService.getColor(this.name);
  }
}
