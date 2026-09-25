import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

/** Attend que l'app soit rendue : les routes sont chargées à la demande. */
async function ready(page: Page) {
  await expect(page.locator('main')).toBeVisible();
}

/** Ouvre le panneau de réglages et attend la fin du glissement. */
async function openSheet(page: Page) {
  await page.getByRole('button', { name: /réglages|settings/i }).click();
  await expect(page.locator('.sheet.open')).toBeVisible();
}

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  return violations.map(v => `${v.id} (${v.impact}) × ${v.nodes.length} — ${v.nodes[0].failureSummary}`);
}

test.describe('axe-core', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`accueil, thème ${theme}`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await page.reload();
      await ready(page);
      expect(await violations(page)).toEqual([]);
    });

    test(`panneau de réglages, thème ${theme}`, async ({ page }) => {
      await page.goto('/');
      await page.evaluate(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await page.reload();
      await ready(page);
      await openSheet(page);
      for (const tab of [1, 2, 3]) {
        await page.locator(`.tabs button:nth-child(${tab})`).click();
        expect(await violations(page), `onglet ${tab}`).toEqual([]);
      }
    });
  }

  test("éditeur de mode, état de confirmation", async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.preset-edit').first().click();
    await expect(page.locator('.editor')).toBeVisible();
    // Premier appui : le bouton passe en « confirmer ? », en rouge
    await page.locator('.editor-actions .link-btn').first().click();
    await expect(page.locator('.link-btn.danger')).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test('page accessibilité, et en arabe (RTL)', async ({ page }) => {
    await page.goto('/accessibility');
    await ready(page);
    expect(await violations(page)).toEqual([]);
    await page.evaluate(() => localStorage.setItem('pomodoro-tdah.lang', 'ar'));
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await ready(page);
    expect(await violations(page)).toEqual([]);
  });
});

test.describe('clavier', () => {
  test('le cadran se règle aux flèches, Page ↑/↓, Début et Fin', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.locator('.face').focus();
    const time = () => page.locator('.readout-time').textContent();

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.readout-time')).toHaveText('24:00');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.readout-time')).toHaveText('25:00');
    await page.keyboard.press('PageDown');
    await expect(page.locator('.readout-time')).toHaveText('30:00');
    await page.keyboard.press('End');
    await expect(page.locator('.readout-time')).toHaveText('60:00');
    await page.keyboard.press('Home');
    await expect(page.locator('.readout-time')).toHaveText('00:00');
    expect(await time()).toBe('00:00');
  });

  test('le focus reste piégé dans le panneau ouvert', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    const outside: string[] = [];
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      const where = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return 'body';
        return el.closest('.sheet') ? 'sheet' : `${el.tagName}.${(el.className || '').toString().split(' ')[0]}`;
      });
      if (where !== 'sheet' && where !== 'body') outside.push(where);
    }
    expect(outside, 'aucun arrêt de tabulation derrière la modale').toEqual([]);
  });

  test('Échap ferme le panneau et rend le focus au bouton qui l’a ouvert', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.sheet.open')).toHaveCount(0);
    await expect(page.locator('.controls button').last()).toBeFocused();
  });

  test('les flèches changent d’onglet depuis la liste d’onglets', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await expect(page.locator('.tab.active')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.tab.active')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-stats')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#panel-modes')).toBeVisible();
  });
});

test.describe('sémantique du cadran', () => {
  test("il est nommé, décrit, et n'annonce que sa valeur", async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await page.reload();
    await ready(page);

    const dial = page.getByRole('slider');
    // Le nom est un nom, pas le mode d'emploi : celui-ci est une description
    await expect(dial).toHaveAccessibleName('Durée');
    await expect(dial).toHaveAccessibleDescription(/glisser.*flèches.*démarrer/i);
    await expect(dial).toHaveAttribute('aria-valuetext', /^\d+ minutes$/);
    await expect(dial).toHaveAttribute('aria-valuenow', '25');

    await dial.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(dial).toHaveAttribute('aria-valuenow', '24');
    await expect(dial).toHaveAttribute('aria-valuetext', '24 minutes');
  });
});

test.describe('mise en page', () => {
  test('aucun défilement horizontal à 320 px (WCAG 1.4.10)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const url of ['/', '/accessibility']) {
      await page.goto(url);
      await ready(page);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `débordement sur ${url}`).toBe(0);
    }
  });

  test('texte agrandi à 200 %, sans défilement horizontal (WCAG 1.4.4)', async ({ page }) => {
    for (const url of ['/', '/accessibility']) {
      await page.goto(url);
      await ready(page);
      // Zoom « texte seul » : lire toutes les tailles d'abord, les doubler ensuite,
      // sinon l'héritage se compose et la page explose.
      await page.evaluate(() => {
        const els = [...document.querySelectorAll('*')];
        const sizes = els.map(el => parseFloat(getComputedStyle(el).fontSize));
        els.forEach((el, i) => {
          if (sizes[i]) el.style.setProperty('font-size', `${sizes[i] * 2}px`, 'important');
        });
      });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `débordement sur ${url} à 200 %`).toBe(0);
    }
  });

  test("l'espacement du texte ne tronque rien (WCAG 1.4.12)", async ({ page }) => {
    await page.goto('/accessibility');
    await ready(page);
    await page.addStyleTag({ content: `*, *::before, *::after {
      line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
      p { margin-bottom: 2em !important; }` });
    const truncated = await page.evaluate(() => [...document.querySelectorAll('main *')]
      .filter(el => el.children.length === 0 && el.textContent?.trim() && !el.closest('.sr-only') && !el.classList.contains('sr-only'))
      .filter(el => {
        const cs = getComputedStyle(el);
        const hidden = cs.overflow === 'hidden' || cs.overflowY === 'hidden' || cs.textOverflow === 'ellipsis';
        return hidden && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2);
      })
      .map(el => `${el.tagName}.${(el.className || '').toString().split(' ')[0]}`));
    expect(truncated).toEqual([]);
  });
});

test.describe('contraste des composants (WCAG 1.4.11)', () => {
  const luminance = ([r, g, b]: number[]) => {
    const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  /**
   * Contraste maximal entre un composant et le fond qui l'entoure, mesuré sur les
   * pixels rendus : les ombres et dégradés échappent à une lecture du CSS.
   */
  async function maxContrast(browser: Browser, page: Page, target: Locator) {
    const box = await target.boundingBox();
    if (!box) throw new Error('élément introuvable');
    const m = 10;
    const png = (await page.screenshot({ clip: {
      x: Math.round(box.x - m), y: Math.round(box.y - m),
      width: Math.round(box.width + 2 * m), height: Math.round(box.height + 2 * m)
    } })).toString('base64');

    const reader = await browser.newPage();
    const { bg, inside } = await reader.evaluate(async ({ data, m }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + data;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, img.width, img.height).data;
      const at = (x: number, y: number) => [d[(y * img.width + x) * 4], d[(y * img.width + x) * 4 + 1], d[(y * img.width + x) * 4 + 2]];
      const pixels: number[][] = [];
      for (let y = m + 1; y < img.height - m - 1; y++)
        for (let x = m + 1; x < img.width - m - 1; x++) pixels.push(at(x, y));
      return { bg: at(1, 1), inside: pixels };
    }, { data: png, m });
    await reader.close();

    return inside.reduce((best, px) => Math.max(best, ratio(px, bg)), 0);
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`les interrupteurs restent identifiables, thème ${theme}`, async ({ page, browser }) => {
      await page.goto('/');
      await page.evaluate(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await page.reload();
      await ready(page);
      await openSheet(page);
      await page.locator('.tabs button:nth-child(3)').click();
      await expect(page.locator('#panel-settings')).toBeVisible();
      // le panneau glisse : on attend qu'il soit stable avant de photographier
      await expect(page.locator('.switch').first()).toBeVisible();
      await page.waitForTimeout(400);
      const switches = page.locator('.switch');
      const count = await switches.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const contrast = await maxContrast(browser, page, switches.nth(i));
        const state = (await switches.nth(i).isChecked()) ? 'allumé' : 'éteint';
        expect(contrast, `interrupteur ${state} n° ${i + 1}`).toBeGreaterThanOrEqual(3);
      }
    });
  }
});
