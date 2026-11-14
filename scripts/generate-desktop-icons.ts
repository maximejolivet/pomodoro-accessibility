/**
 * Icônes du bureau (Electron) : `build/icon.icns` (macOS) et `build/icon.ico` (Windows), depuis
 * `resources/app-icon.svg`. Le SVG est plein cadre, avec un fond sombre que seul iOS recadre ;
 * sur le bureau, on garde la tuile arrondie seule, sur fond transparent.
 *   - macOS : tuile à ~80 % du canevas, la marge transparente que Big Sur attend.
 *   - Windows : tuile presque plein cadre, pour rester lisible à 16 et 32 px.
 *
 *   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/generate-desktop-icons.ts
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SVG = readFileSync(join(ROOT, 'resources/app-icon.svg'), 'utf8');

/** La tuile occupe x,y = 5..59 dans le viewBox 64 ; `pad` est la marge gardée autour. */
function tile(pad: number): string {
  const size = 54 + pad * 2;
  return SVG
    .replace(/<rect width="64" height="64" fill="#1d2b3a"\/>/, '')
    .replace(/viewBox="[^"]*"/, `viewBox="${5 - pad} ${5 - pad} ${size} ${size}"`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(svg: string, px: number): Promise<Buffer> {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${px}px;height:${px}px}</style>${svg}`,
  );
  return page.screenshot({ omitBackground: true, type: 'png' });
}

// macOS
const work = mkdtempSync(join(tmpdir(), 'icns-'));
const iconset = join(work, 'icon.iconset');
mkdirSync(iconset);
const MAC_PAD = (1024 / 0.805 - 1024) / 2 / (1024 / 54); // → tuile à 80,5 % du canevas
const mac = tile(MAC_PAD);
for (const base of [16, 32, 128, 256, 512]) {
  writeFileSync(join(iconset, `icon_${base}x${base}.png`), await render(mac, base));
  writeFileSync(join(iconset, `icon_${base}x${base}@2x.png`), await render(mac, base * 2));
}
execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(ROOT, 'build/icon.icns')]);
rmSync(work, { recursive: true });

// Windows : un .ico est un en-tête, puis des PNG bruts.
const win = tile(1);
const sizes = [16, 24, 32, 48, 64, 128, 256];
const pngs: Buffer[] = [];
for (const s of sizes) pngs.push(await render(win, s));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const o = 6 + i * 16;
  head.writeUInt8(s === 256 ? 0 : s, o);
  head.writeUInt8(s === 256 ? 0 : s, o + 1);
  head.writeUInt16LE(1, o + 4);
  head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(pngs[i].length, o + 8);
  head.writeUInt32LE(offset, o + 12);
  offset += pngs[i].length;
});
writeFileSync(join(ROOT, 'build/icon.ico'), Buffer.concat([head, ...pngs]));

await browser.close();
