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

test.describe('réglage sans glisser (WCAG 2.5.7)', () => {
  const minus = (page: Page) => page.locator('.step').first();
  const plus = (page: Page) => page.locator('.step').last();

  test('les boutons − et + règlent la durée en un seul appui', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const time = page.locator('.readout-time');
    await expect(time).toHaveText('25:00');

    // Un appui = une minute : ni le `pointerdown` ni le clic qui suit ne doivent doubler le pas
    await plus(page).click();
    await expect(time).toHaveText('26:00');
    await minus(page).click();
    await expect(time).toHaveText('25:00');
  });

  test('ils s’activent aussi au clavier et annoncent la nouvelle durée', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await page.reload();
    await ready(page);

    await plus(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.readout-time')).toHaveText('26:00');
    await expect(page.locator('#a11y-announcements')).toHaveText('26 minutes');
  });

  test('ils s’arrêtent aux bornes du cadran', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await page.locator('.face').focus();

    await page.keyboard.press('End');
    await expect(page.locator('.readout-time')).toHaveText('60:00');
    // `aria-disabled` plutôt que `disabled` : le bouton garde le focus, mais n'agit plus
    await expect(plus(page)).toHaveAttribute('aria-disabled', 'true');
    await plus(page).click({ force: true });
    await expect(page.locator('.readout-time')).toHaveText('60:00');

    // Le clic a déplacé le focus : le cadran doit le reprendre pour recevoir « Début »
    await page.locator('.face').focus();
    await page.keyboard.press('Home');
    await expect(page.locator('.readout-time')).toHaveText('00:00');
    await expect(minus(page)).toHaveAttribute('aria-disabled', 'true');
  });

  test('leurs cibles font au moins 44 px (WCAG 2.5.8)', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    for (const button of [minus(page), plus(page)]) {
      const box = await button.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
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

test.describe('annonce vocale', () => {
  /** Enregistre ce que l'app demande à la synthèse : rien n'est prononcé pendant le test. */
  async function captureSpeech(page: Page, mode?: 'milestones' | 'minutes') {
    await page.addInitScript(m => {
      (window as any).__spoken = [];
      SpeechSynthesis.prototype.speak = function (u: SpeechSynthesisUtterance) {
        (window as any).__spoken.push({ text: u.text, lang: u.lang });
      };
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      if (m) localStorage.setItem('pomodoro-tdah.speech', m);
    }, mode);
  }

  /** Lance un décompte de deux minutes, horloge simulée : le test ne dure pas deux minutes. */
  async function startTwoMinutes(page: Page) {
    await page.clock.install();
    await page.goto('/');
    await ready(page);
    await page.locator('.face').focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.readout-time')).toHaveText('02:00');
    await page.getByRole('button', { name: /démarrer/i }).click();
  }

  const spoken = (page: Page) =>
    page.evaluate(() => (window as any).__spoken as { text: string; lang: string }[]);

  test('le choix se fait au clavier, se fait entendre et se retient', async ({ page }) => {
    await captureSpeech(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();

    const group = page.getByRole('group', { name: 'Annonce vocale' });
    await expect(group).toBeVisible();
    const milestones = group.getByRole('button', { name: 'Paliers' });
    await expect(milestones).toHaveAttribute('aria-pressed', 'false');

    // Au clavier seul : le réglage ne dépend pas de la souris
    await milestones.focus();
    await page.keyboard.press('Enter');
    await expect(milestones).toHaveAttribute('aria-pressed', 'true');

    // La voix se fait entendre tout de suite, dans la langue de l'interface :
    // sans cet essai, on choisit un réglage sans savoir ce qu'il fait
    expect(await spoken(page)).toEqual([{ text: 'Plus que 45 minutes', lang: 'fr' }]);
    expect(await page.evaluate(() => localStorage.getItem('pomodoro-tdah.speech'))).toBe('milestones');
  });

  test('« Aucune » ne dit rien, et reste le réglage par défaut', async ({ page }) => {
    await captureSpeech(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();

    const group = page.getByRole('group', { name: 'Annonce vocale' });
    await expect(group.getByRole('button', { name: 'Aucune' })).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: 'Chaque minute' }).click();
    await group.getByRole('button', { name: 'Aucune' }).click();
    expect(await spoken(page)).toHaveLength(1);
  });

  test('ses cibles font au moins 44 px (WCAG 2.5.5)', async ({ page }) => {
    await captureSpeech(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();
    const buttons = page.getByRole('group', { name: 'Annonce vocale' }).getByRole('button');
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box!.height, await button.textContent() ?? '').toBeGreaterThanOrEqual(44);
    }
  });

  test('le décompte dit chaque minute, puis la fin et ce qui suit', async ({ page }) => {
    await captureSpeech(page, 'minutes');
    await startTwoMinutes(page);
    // Rien au démarrage : la durée réglée vient d'être lue, la répéter n'apporte rien
    expect(await spoken(page)).toEqual([]);

    await page.clock.runFor(61_000);
    expect(await spoken(page)).toEqual([{ text: "Plus qu'une minute", lang: 'fr' }]);

    // À la fin, une seule phrase dit aussi la suite : deux voix se couperaient l'une l'autre
    await page.clock.runFor(61_000);
    expect(await spoken(page)).toEqual([
      { text: "Plus qu'une minute", lang: 'fr' },
      { text: 'Temps écoulé. +5 min pour terminer.', lang: 'fr' }
    ]);
  });

  test('en mode Paliers, les minutes ordinaires restent silencieuses', async ({ page }) => {
    await captureSpeech(page, 'milestones');
    await startTwoMinutes(page);
    await page.clock.runFor(61_000);
    expect(await spoken(page), 'la minute 1 n\'est pas un palier').toEqual([]);

    // La fin, elle, se dit dans tous les modes
    await page.clock.runFor(61_000);
    expect(await spoken(page)).toEqual([{ text: 'Temps écoulé. +5 min pour terminer.', lang: 'fr' }]);
  });
});

test.describe('alerte visuelle', () => {
  async function openSettings(page: Page) {
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();
  }

  test('le choix se fait au clavier, se montre aussitôt et se retient', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await openSettings(page);

    const group = page.getByRole('group', { name: 'Alerte visuelle' });
    const strong = group.getByRole('button', { name: 'Forte' });
    await strong.focus();
    await page.keyboard.press('Enter');
    await expect(strong).toHaveAttribute('aria-pressed', 'true');

    // L'éclat se montre pendant qu'on choisit : on juge une intensité en la voyant
    await expect(page.locator('.cue')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('pomodoro-tdah.visual-alert'))).toBe('strong');
  });

  test("« Aucune » n'allume rien du tout", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await openSettings(page);
    await page.getByRole('group', { name: 'Alerte visuelle' }).getByRole('button', { name: 'Aucune' }).click();
    await expect(page.locator('.cue')).toHaveCount(0);
  });

  test('la fin allume l’éclat puis laisse un bandeau qui ne disparaît pas', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      localStorage.setItem('pomodoro-tdah.visual-alert', 'soft');
      // Sans prolongation, la fin est une vraie fin : c'est l'état que le bandeau annonce
      localStorage.setItem('pomodoro-tdah.auto-extra', 'off');
    });
    await page.clock.install();
    await page.goto('/');
    await ready(page);

    await page.locator('.face').focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: /démarrer/i }).click();
    await expect(page.locator('.cue')).toHaveCount(0);

    await page.clock.runFor(61_000);
    await expect(page.locator('.cue')).toBeVisible();
    const banner = page.getByText('Temps écoulé');
    await expect(banner).toBeVisible();

    // L'éclat s'éteint au bout de 4,8 s (trois battements), le bandeau reste
    await page.clock.runFor(6_000);
    await expect(page.locator('.cue')).toHaveCount(0);
    await expect(banner).toBeVisible();
  });

  test("l'éclat n'est pas lu par les lecteurs d'écran, qui reçoivent déjà l'annonce", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await openSettings(page);
    await page.getByRole('group', { name: 'Alerte visuelle' }).getByRole('button', { name: 'Douce' }).click();
    await expect(page.locator('.cue')).toHaveAttribute('aria-hidden', 'true');
    // Et il ne doit jamais intercepter un clic destiné au minuteur
    expect(await page.locator('.cue').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  });
});
