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
  'fork': 'mdi:silverware-fork-knife',
  'cup': 'mdi:coffee',
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

// Color map for icons by thematic category
export const ICON_COLOR_MAP: Record<IconName, string> = {
  // Morning/Night routine - warm & cool tones
  'sunrise': '#f3a52b', // orange
  'moon': '#8b6fd6', // purple
  'clock': '#5aa9c4', // light blue
  // Sleep & clothing - cool tones
  'bed': '#5aa9c4', // light blue
  'shirt': '#a67c52', // brown
  'jacket': '#8b7355', // dark brown
  'laundry': '#56b27b', // green
  // Hygiene - turquoise
  'shower': '#5aa9c4', // light blue
  'toothbrush': '#5aa9c4', // light blue
  'cleaning': '#5aa9c4', // light blue
  // Food & drink - orange/brown
  'breakfast': '#f3a52b', // orange
  'fork': '#d4a574', // tan
  'cup': '#d4a574', // tan
  // Transport & work prep - blue
  'bus': '#5aa9c4', // light blue
  'backpack': '#5aa9c4', // light blue
  // Health & fitness - red/green
  'medicine': '#d63f4f', // red
  'run': '#56b27b', // green
  'yoga': '#56b27b', // green
  'gym': '#d63f4f', // red
  // Work & study - purple/blue
  'book': '#8b6fd6', // purple
  'bookshelf': '#8b6fd6', // purple
  'pencil': '#8b6fd6', // purple
  'calculator': '#8b6fd6', // purple
  'brain': '#8b6fd6', // purple
  'computer': '#5aa9c4', // light blue
  'email': '#5aa9c4', // light blue
  'phone': '#5aa9c4', // light blue
  'folder': '#5aa9c4', // light blue
  'files': '#5aa9c4', // light blue
  // Leisure & hobbies - pink/multicolor
  'dog': '#d4a574', // tan
  'art': '#e91e63', // pink
  'music': '#e91e63', // pink
  'tools': '#a67c52', // brown
  'wrench': '#a67c52', // brown
  'shopping': '#56b27b', // green
  // Accessibility & UI icons - default gray
  'blind': '#666666',
  'keyboard': '#666666',
  'search': '#666666',
  'hearing': '#666666',
  'vibration': '#666666',
  'font': '#666666',
  'image': '#666666',
  'play': '#666666',
  'pause': '#666666',
  'reset': '#666666',
  'lock': '#666666',
  'unlock': '#666666',
  'edit': '#666666',
  'delete': '#d63f4f',
  'add': '#56b27b',
  'close': '#666666',
  'settings': '#666666',
  'theme-light': '#f3a52b',
  'theme-dark': '#8b6fd6',
  'language': '#666666',
  'help': '#666666',
  'check': '#56b27b',
  'warning': '#f3a52b',
  'error': '#d63f4f',
  'info': '#5aa9c4',
  'menu': '#666666',
  'back': '#666666',
  'running': '#56b27b',
  'meditation': '#56b27b'
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

  getColor(name: IconName): string {
    return ICON_COLOR_MAP[name] || '#666666';
  }
}
