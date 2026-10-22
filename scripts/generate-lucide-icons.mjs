// Génère src/app/core/helpers/lucide-icons.ts depuis lucide-static (https://lucide.dev, licence ISC).
// Les icônes sont embarquées dans le bundle : plus aucun appel réseau au démarrage.
// Usage : node scripts/generate-lucide-icons.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS_DIR = join(ROOT, 'node_modules/lucide-static/icons');
const OUT = join(ROOT, 'src/app/core/helpers/lucide-icons.ts');

/** Nom interne de l'app → icône Lucide (nom de fichier sans .svg). */
const MAP = {
  // Routines
  sunrise: 'sunrise',
  shirt: 'shirt',
  breakfast: 'croissant',
  toothbrush: 'toothbrush',
  fork: 'utensils',
  cup: 'coffee',
  running: 'footprints',
  meditation: 'flower-2',
  gym: 'dumbbell',
  bed: 'bed',
  shower: 'shower-head',
  backpack: 'backpack',
  jacket: 'layers',
  bus: 'bus',
  medicine: 'pill',
  cleaning: 'broom-sparkles',
  laundry: 'washing-machine',
  shopping: 'shopping-cart',
  dog: 'dog',
  book: 'book-open',
  pencil: 'pencil',
  calculator: 'calculator',
  art: 'palette',
  music: 'music',
  tools: 'hammer',
  wrench: 'wrench',
  computer: 'laptop',
  email: 'mail',
  phone: 'phone',
  folder: 'folder',
  files: 'files',
  moon: 'moon',
  bookshelf: 'library',
  yoga: 'person-standing',
  clock: 'clock',
  run: 'activity',
  // Accessibilité
  blind: 'eye-off',
  keyboard: 'keyboard',
  search: 'search',
  hearing: 'ear',
  vibration: 'vibrate',
  brain: 'brain',
  font: 'type',
  image: 'image',
  accessibility: 'accessibility',
  opendyslexic: 'a-large-small',
  // Interface
  play: 'play',
  pause: 'pause',
  reset: 'rotate-ccw',
  lock: 'lock',
  unlock: 'lock-open',
  edit: 'pencil',
  delete: 'trash-2',
  add: 'plus',
  close: 'x',
  settings: 'settings',
  'theme-light': 'sun',
  'theme-dark': 'moon',
  language: 'languages',
  help: 'circle-help',
  // Général
  check: 'check',
  warning: 'triangle-alert',
  error: 'circle-alert',
  info: 'info',
  menu: 'menu',
  back: 'arrow-left',
};

const entries = Object.entries(MAP).map(([name, lucide]) => {
  let svg;
  try {
    // Commentaire de licence et espaces retirés : le SVG reste identique à l'écran
    svg = readFileSync(join(ICONS_DIR, `${lucide}.svg`), 'utf8')
      .replace(/<!--.*?-->/gs, '')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    throw new Error(`Icône Lucide introuvable : « ${lucide} » (pour « ${name} »)`);
  }
  return `  '${name}': ${JSON.stringify(svg)},`;
});

writeFileSync(
  OUT,
  `// Généré par scripts/generate-lucide-icons.mjs : ne pas éditer à la main.
// Icônes Lucide (https://lucide.dev), licence ISC.
import type { IconName } from '../services/icons.service';

export const LUCIDE_ICONS: Record<IconName, string> = {
${entries.join('\n')}
};
`,
);

console.log(`✓ ${entries.length} icônes Lucide écrites dans ${OUT}`);
