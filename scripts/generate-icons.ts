/**
 * Icônes et écrans de lancement, pour iOS et pour Android, depuis les deux SVG de
 * `resources/`. Le rendu passe par Chromium (déjà installé pour les tests) : c'est le même
 * moteur que celui qui affiche l'app, donc les dégradés et le `mix-blend-mode` du cadran
 * sortent identiques à ce qu'on voit à l'écran.
 *
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/generate-icons.ts
 */
import { chromium, type Browser } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const ICON = readFileSync(join(ROOT, 'resources/app-icon.svg'), 'utf8');
const FOREGROUND = readFileSync(join(ROOT, 'resources/app-icon-foreground.svg'), 'utf8');

/** Fond de l'écran de lancement : le haut du dégradé de l'app en thème clair (`--bg-top`). */
const SPLASH_BG = '#f1f3f2';

/** Densités Android, et le facteur qui les sépare de mdpi. */
const DENSITIES = [
  { dir: 'mdpi', scale: 1 },
  { dir: 'hdpi', scale: 1.5 },
  { dir: 'xhdpi', scale: 2 },
  { dir: 'xxhdpi', scale: 3 },
  { dir: 'xxxhdpi', scale: 4 }
] as const;

/** Écrans de lancement Android : les tailles posées par Capacitor, reprises telles quelles. */
const SPLASHES = [
  { dir: 'port-mdpi', w: 320, h: 480 },
  { dir: 'port-hdpi', w: 480, h: 800 },
  { dir: 'port-xhdpi', w: 720, h: 1280 },
  { dir: 'port-xxhdpi', w: 960, h: 1600 },
  { dir: 'port-xxxhdpi', w: 1280, h: 1920 },
  { dir: 'land-mdpi', w: 480, h: 320 },
  { dir: 'land-hdpi', w: 800, h: 480 },
  { dir: 'land-xhdpi', w: 1280, h: 720 },
  { dir: 'land-xxhdpi', w: 1600, h: 960 },
  { dir: 'land-xxxhdpi', w: 1920, h: 1280 }
] as const;

function write(path: string, data: Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`✓ ${path.replace(ROOT + '/', '')} (${data.length >= 1024 ? Math.round(data.length / 1024) + ' Ko' : data.length + ' o'})`);
}

/** Une page qui ne montre que ce qu'on lui donne : ni marge, ni fond, ni barre de défilement. */
async function shoot(
  browser: Browser, html: string, width: number, height: number, transparent: boolean
): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
       html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden}
       svg{display:block}
     </style></head><body>${html}</body></html>`
  );
  const shot = await page.screenshot({ omitBackground: transparent });
  await page.close();
  return shot;
}

/** Le SVG à une taille donnée : la balise porte ses dimensions, la page fait le reste. */
function sized(svg: string, size: number): string {
  return svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
}

async function main(): Promise<void> {
  const browser = await chromium.launch();

  // --- iOS : une seule icône, le catalogue d'assets décline les tailles lui-même.
  write(
    join(ROOT, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'),
    await shoot(browser, sized(ICON, 1024), 1024, 1024, false)
  );

  // --- Android : icône pleine, icône ronde, et l'avant-plan de l'icône adaptative.
  for (const { dir, scale } of DENSITIES) {
    const base = join(ROOT, 'android/app/src/main/res/mipmap-' + dir);
    const px = Math.round(48 * scale);
    write(join(base, 'ic_launcher.png'), await shoot(browser, sized(ICON, px), px, px, true));
    write(
      join(base, 'ic_launcher_round.png'),
      await shoot(
        browser,
        `<div style="width:${px}px;height:${px}px;border-radius:50%;overflow:hidden">${sized(ICON, px)}</div>`,
        px, px, true
      )
    );
    const fg = Math.round(108 * scale);
    write(join(base, 'ic_launcher_foreground.png'), await shoot(browser, sized(FOREGROUND, fg), fg, fg, true));
  }

  /**
   * Écrans de lancement : le cadran seul, sans le boîtier de l'icône — son cadre carré ferait
   * une vignette posée au milieu de l'écran, là où le cadran se pose sur le fond de l'app.
   * L'avant-plan porte déjà sa marge (63 unités de dessin sur 108), d'où le facteur généreux.
   */
  const centered = (w: number, h: number) => {
    const icon = Math.round(Math.min(w, h) * 0.55);
    return `<div style="width:${w}px;height:${h}px;background:${SPLASH_BG};display:flex;
      align-items:center;justify-content:center">${sized(FOREGROUND, icon)}</div>`;
  };

  for (const { dir, w, h } of SPLASHES) {
    write(
      join(ROOT, `android/app/src/main/res/drawable-${dir}/splash.png`),
      await shoot(browser, centered(w, h), w, h, false)
    );
  }

  // Le repli sans qualificatif : Android s'en sert quand aucune densité ne correspond.
  write(
    join(ROOT, 'android/app/src/main/res/drawable/splash.png'),
    await shoot(browser, centered(720, 1280), 720, 1280, false)
  );

  // iOS pose la même image carrée aux trois échelles : c'est le storyboard qui la cadre.
  const iosSplash = await shoot(browser, centered(2732, 2732), 2732, 2732, false);
  for (const name of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) {
    write(join(ROOT, 'ios/App/App/Assets.xcassets/Splash.imageset/' + name), iosSplash);
  }

  // --- Web : l'icône de l'écran d'accueil iOS quand l'app est ajoutée depuis Safari.
  write(join(ROOT, 'public/apple-touch-icon.png'), await shoot(browser, sized(ICON, 180), 180, 180, false));

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
