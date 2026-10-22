import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LUCIDE_ICONS } from '../helpers/lucide-icons';

export type IconName =
  // Routine icons
  | 'sunrise' | 'shirt' | 'breakfast' | 'toothbrush' | 'fork' | 'cup'
  | 'running' | 'meditation' | 'gym' | 'bed' | 'shower' | 'backpack' | 'jacket' | 'bus'
  | 'medicine' | 'cleaning' | 'laundry' | 'shopping' | 'dog' | 'book' | 'pencil' | 'calculator'
  | 'art' | 'music' | 'tools' | 'wrench' | 'computer' | 'email' | 'phone' | 'folder' | 'files' | 'moon'
  | 'bookshelf' | 'yoga' | 'clock' | 'run'
  // Accessibility icons
  | 'blind' | 'keyboard' | 'search' | 'hearing' | 'vibration' | 'brain' | 'font' | 'image' | 'accessibility' | 'opendyslexic'
  // UI icons
  | 'play' | 'pause' | 'reset' | 'lock' | 'unlock' | 'edit' | 'delete' | 'add' | 'close'
  | 'settings' | 'theme-light' | 'theme-dark' | 'language' | 'help'
  // General
  | 'check' | 'warning' | 'error' | 'info' | 'menu' | 'back';

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
  'accessibility': '#5b3fb0',
  'opendyslexic': '#5b3fb0',
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

/** Affiché tant qu'une icône n'a pas de SVG (ne devrait pas arriver : toutes sont embarquées). */
const FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><circle cx="12" cy="12" r="1"/></svg>';

@Injectable({
  providedIn: 'root'
})
export class IconsService {
  private cache = new Map<IconName, SafeHtml>();

  constructor(private sanitizer: DomSanitizer) {}

  /** SVG Lucide embarqué dans le bundle : disponible immédiatement, hors ligne compris. */
  getSVG(name: IconName): SafeHtml {
    let icon = this.cache.get(name);
    if (!icon) {
      icon = this.sanitizer.bypassSecurityTrustHtml(LUCIDE_ICONS[name] ?? FALLBACK_SVG);
      this.cache.set(name, icon);
    }
    return icon;
  }

  getIconFromEmoji(emoji: string): IconName {
    return EMOJI_TO_ICON_MAP[emoji] || 'info';
  }

  /**
   * Icône d'une étape ou d'une routine : la valeur est soit un emoji (anciennes données),
   * soit directement le nom de l'icône (choix actuel de l'éditeur).
   */
  resolveIcon(value: string): IconName {
    if (EMOJI_TO_ICON_MAP[value]) return EMOJI_TO_ICON_MAP[value];
    return value in ICON_COLOR_MAP ? (value as IconName) : 'info';
  }

  getColor(name: IconName): string {
    return ICON_COLOR_MAP[name] || '#666666';
  }
}
