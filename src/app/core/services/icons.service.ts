import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

export type IconName =
  // Routine icons
  | 'sunrise' | 'shirt' | 'breakfast' | 'toothbrush' | 'fork' | 'cup'
  | 'running' | 'meditation' | 'gym' | 'bed' | 'shower' | 'backpack' | 'jacket' | 'bus'
  | 'medicine' | 'cleaning' | 'laundry' | 'shopping' | 'dog' | 'book' | 'pencil' | 'calculator'
  | 'art' | 'music' | 'tools' | 'wrench' | 'computer' | 'email' | 'phone' | 'folder' | 'files' | 'moon'
  | 'bookshelf' | 'yoga' | 'clock' | 'run'
  // Accessibility icons
  | 'blind' | 'keyboard' | 'search' | 'hearing' | 'vibration' | 'brain' | 'font' | 'image'
  // UI icons
  | 'play' | 'pause' | 'reset' | 'lock' | 'unlock' | 'edit' | 'delete' | 'add' | 'close'
  | 'settings' | 'theme-light' | 'theme-dark' | 'language' | 'help'
  // General
  | 'check' | 'warning' | 'error' | 'info' | 'menu' | 'back';

/** Map icon names to Iconify icon identifiers */
const ICON_MAP: Record<IconName, string> = {
  // Routine icons
  'sunrise': 'mdi:sunrise',
  'shirt': 'mdi:shirt',
  'breakfast': 'mdi:bowl-mix',
  'toothbrush': 'mdi:tooth',
  'fork': 'mdi:fork',
  'cup': 'mdi:cup',
  'running': 'mdi:run-fast',
  'meditation': 'mdi:meditation',
  'gym': 'mdi:dumbbell',
  'bed': 'mdi:bed',
  'shower': 'mdi:shower',
  'backpack': 'mdi:backpack',
  'jacket': 'mdi:jacket',
  'bus': 'mdi:bus',
  'medicine': 'mdi:pill',
  'cleaning': 'mdi:broom',
  'laundry': 'mdi:washer',
  'shopping': 'mdi:shopping-cart',
  'dog': 'mdi:dog',
  'book': 'mdi:book',
  'pencil': 'mdi:pencil',
  'calculator': 'mdi:calculator',
  'art': 'mdi:palette',
  'music': 'mdi:music',
  'tools': 'mdi:toolbox',
  'wrench': 'mdi:wrench',
  'computer': 'mdi:laptop',
  'email': 'mdi:email',
  'phone': 'mdi:phone',
  'folder': 'mdi:folder',
  'files': 'mdi:folder-multiple',
  'moon': 'mdi:moon-waning-crescent',
  'bookshelf': 'mdi:bookshelf',
  'yoga': 'mdi:yoga',
  'clock': 'mdi:clock-outline',
  'run': 'mdi:run',
  // Accessibility icons
  'blind': 'mdi:eye-off',
  'keyboard': 'mdi:keyboard',
  'search': 'mdi:magnify',
  'hearing': 'mdi:ear-hearing',
  'vibration': 'mdi:vibrate',
  'brain': 'mdi:brain',
  'font': 'mdi:format-text',
  'image': 'mdi:image',
  // UI icons
  'play': 'mdi:play',
  'pause': 'mdi:pause',
  'reset': 'mdi:restart',
  'lock': 'mdi:lock',
  'unlock': 'mdi:lock-open',
  'edit': 'mdi:pencil-outline',
  'delete': 'mdi:trash-can',
  'add': 'mdi:plus',
  'close': 'mdi:close',
  'settings': 'mdi:cog',
  'theme-light': 'mdi:white-balance-sunny',
  'theme-dark': 'mdi:moon-waning-crescent',
  'language': 'mdi:language',
  'help': 'mdi:help-circle',
  // General
  'check': 'mdi:check',
  'warning': 'mdi:alert',
  'error': 'mdi:alert-circle',
  'info': 'mdi:information',
  'menu': 'mdi:menu',
  'back': 'mdi:arrow-left'
};

// Emoji to IconName mapping for backward compatibility
export const EMOJI_TO_ICON_MAP: Record<string, IconName> = {
  '🌅': 'sunrise',
  '🛏️': 'bed',
  '🚿': 'shower',
  '🪥': 'toothbrush',
  '👕': 'shirt',
  '🥣': 'breakfast',
  '🍽️': 'breakfast',
  '🧃': 'breakfast',
  '🎒': 'backpack',
  '🧥': 'jacket',
  '🚌': 'bus',
  '💊': 'medicine',
  '🧹': 'cleaning',
  '🧺': 'laundry',
  '🛒': 'shopping',
  '🐕': 'dog',
  '📖': 'book',
  '✏️': 'pencil',
  '📚': 'book',
  '🔢': 'calculator',
  '🎨': 'art',
  '🎵': 'music',
  '🧰': 'tools',
  '🧠': 'brain',
  '💻': 'computer',
  '📧': 'email',
  '📞': 'phone',
  '🗂️': 'files',
  '🏃': 'running',
  '🧘': 'meditation',
  '🧸': 'gym',
  '🌙': 'moon',
  '💪': 'gym',
  // Accessibility icons
  '🦯': 'blind',
  '⌨️': 'keyboard',
  '🔍': 'search',
  '🦻': 'hearing',
  '📳': 'vibration',
  '🔤': 'font',
  '🖼️': 'image'
};

@Injectable({
  providedIn: 'root'
})
export class IconsService {
  private cache: Map<IconName, SafeHtml> = new Map();

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {}

  getSVG(name: IconName): SafeHtml {
    // Return cached icon if available
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    // Return placeholder while loading (preload icons in background)
    const placeholder = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" opacity="0.3"><circle cx="12" cy="12" r="1"/></svg>';
    return this.sanitizer.bypassSecurityTrustHtml(placeholder);
  }

  /** Preload all icons from Iconify CDN */
  async preloadIcons(): Promise<void> {
    const iconNames = Object.keys(ICON_MAP) as IconName[];

    for (const name of iconNames) {
      if (!this.cache.has(name)) {
        await this.loadIcon(name);
      }
    }
  }

  /** Load a single icon from Iconify */
  private async loadIcon(name: IconName): Promise<void> {
    const iconifyName = ICON_MAP[name];
    if (!iconifyName) return;

    try {
      const url = `https://api.iconify.design/${iconifyName}.svg?download=false`;
      const response = await firstValueFrom(this.http.get(url, { responseType: 'text' }));

      // Ensure SVG has proper attributes for styling
      const svg = response
        .replace(/<svg/, '<svg width="1em" height="1em" style="color: currentColor"')
        .replace(/viewBox=""/, 'viewBox="0 0 24 24"');

      const safeHtml = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.cache.set(name, safeHtml);
    } catch (error) {
      // Cache a fallback for this icon
      const fallbackSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><circle cx="12" cy="12" r="1"/></svg>';
      this.cache.set(name, this.sanitizer.bypassSecurityTrustHtml(fallbackSvg));
    }
  }

  getIconFromEmoji(emoji: string): IconName {
    return EMOJI_TO_ICON_MAP[emoji] || 'info';
  }
}
