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

/** Règle le cadran au clavier : Home remet à zéro, PageDown avance de 5 min, → de 1 min. */
async function setMinutes(page: Page, minutes: number) {
  await page.locator('.face').focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < Math.floor(minutes / 5); i++) await page.keyboard.press('PageDown');
  for (let i = 0; i < minutes % 5; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('.readout-time')).toHaveText(`${String(minutes).padStart(2, '0')}:00`);
}

/**
 * Le tutoriel d'accueil se montre au premier lancement, donc dans chaque test : sans ce
 * drapeau, il couvrirait l'application partout ailleurs. Les tests qui le visent le
 * retirent avec `showTutorial`.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.tutorial-seen', 'on'));
});

/**
 * Remet l'application dans l'état d'un premier lancement. Le drapeau n'est retiré qu'au
 * tout premier chargement de l'onglet : un script d'initialisation rejoue à chaque
 * navigation, et le tutoriel reviendrait après un rechargement censé prouver le contraire.
 */
async function showTutorial(page: Page, lang = 'fr') {
  await page.addInitScript(l => {
    localStorage.setItem('pomodoro-tdah.lang', l);
    if (sessionStorage.getItem('first-load')) return;
    sessionStorage.setItem('first-load', 'done');
    localStorage.removeItem('pomodoro-tdah.tutorial-seen');
  }, lang);
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

  /** Règle puis lance un décompte, horloge simulée : le test ne dure pas le temps réglé. */
  async function startCountdown(page: Page, minutes: number) {
    await page.clock.install();
    await page.goto('/');
    await ready(page);
    await setMinutes(page, minutes);
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
    await startCountdown(page, 2);
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

  test('en mode Paliers, seuls les paliers de la session se disent', async ({ page }) => {
    // Six minutes d'horloge simulée, six cents ticks : le décompte est bavard
    test.setTimeout(90_000);
    await captureSpeech(page, 'milestones');
    await startCountdown(page, 6);

    // Une minute ordinaire ne dit rien : c'est ce qui distingue « Paliers » de « Chaque minute »
    await page.clock.runFor(61_000);
    expect(await spoken(page), 'la 5e minute n\'est pas un palier').toEqual([]);

    // Les paliers, eux, sont calculés sur la durée réglée : la moitié, le dernier quart,
    // puis la dernière minute. Des paliers fixes à 45 / 30 / 15 ne préviendraient jamais
    // une session de six minutes — ni une étape de routine.
    await page.clock.runFor(2 * 60_000);
    await page.clock.runFor(60_000);
    await page.clock.runFor(60_000);
    expect((await spoken(page)).map(s => s.text)).toEqual([
      'Plus que 3 minutes',
      'Plus que 2 minutes',
      "Plus qu'une minute"
    ]);

    // La fin, elle, se dit dans tous les modes
    await page.clock.runFor(61_000);
    expect((await spoken(page)).at(-1)?.text).toBe('Temps écoulé. +5 min pour terminer.');
  });
});

test.describe('vibration', () => {
  /** Enregistre ce que l'app demande au vibreur : le navigateur de test ne vibre pas. */
  async function captureVibration(page: Page) {
    await page.addInitScript(() => {
      (window as any).__vibrations = [];
      Object.defineProperty(navigator, 'vibrate', {
        // Capacitor passe un tableau d'une valeur au vibreur du navigateur
        value: (pattern: number | number[]) => {
          (window as any).__vibrations.push(Array.isArray(pattern) ? pattern[0] : pattern);
          return true;
        }
      });
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
    });
  }

  const vibrations = (page: Page) =>
    page.evaluate(() => (window as any).__vibrations as number[]);

  test('la fin joue trois longues impulsions, et le réglage les fait sentir', async ({ page }) => {
    await captureVibration(page);
    await page.clock.install();
    await page.goto('/');
    await ready(page);

    await setMinutes(page, 1);
    // Le pas de réglage se confirme par une impulsion légère, distincte des motifs.
    // Le module natif est chargé à la demande : on attend qu'il réponde plutôt que de le supposer.
    await expect.poll(() => vibrations(page)).toHaveLength(2);

    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.clock.runFor(63_000);
    // Trois impulsions de 500 ms : le motif du carillon, dans la main
    expect((await vibrations(page)).slice(2)).toEqual([500, 500, 500]);
  });

  test('chaque palier a son propre motif, reconnaissable sans voir ni entendre', async ({ page }) => {
    // Six minutes d'horloge simulée, six cents ticks : le décompte est bavard
    test.setTimeout(90_000);
    await captureVibration(page);
    await page.clock.install();
    await page.goto('/');
    await ready(page);

    // 6 min : les paliers tombent à 3, 2 et 1 minute restantes — une session courte est
    // prévenue elle aussi, ce que des paliers fixes à 45 / 30 / 15 ne faisaient pas
    await setMinutes(page, 6);
    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.evaluate(() => ((window as any).__vibrations.length = 0));

    // Une impulsion longue et posée pour le premier palier
    await page.clock.runFor(3 * 60_000 + 3_000);
    expect(await vibrations(page), 'palier 1 (3 min restantes)').toEqual([320]);

    // Deux impulsions pour le deuxième
    await page.clock.runFor(60_000);
    expect((await vibrations(page)).slice(1), 'palier 2 (2 min restantes)').toEqual([200, 200]);

    // Trois brèves pour le dernier, là où la fin en donne trois longues : le rythme fait la différence
    await page.clock.runFor(60_000);
    expect((await vibrations(page)).slice(3), 'palier 3 (1 min restante)').toEqual([120, 120, 180]);

    await page.clock.runFor(61_000);
    expect((await vibrations(page)).slice(6), 'fin').toEqual([500, 500, 500]);
  });

  test("l'interrupteur coupe toute vibration, et son état est annoncé", async ({ page }) => {
    await captureVibration(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();

    const toggle = page.getByRole('switch', { name: /Vibration/ });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Éteint, plus rien ne part : ni motif, ni impulsion de réglage
    await page.evaluate(() => ((window as any).__vibrations.length = 0));
    await page.keyboard.press('Escape');
    await page.locator('.face').focus();
    await page.keyboard.press('ArrowRight');
    expect(await vibrations(page)).toEqual([]);
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

test.describe('verrouillage du cadran', () => {
  const time = (page: Page) => page.locator('.readout-time');
  const lock = (page: Page) => page.getByRole('button', { name: /verrouiller le cadran/i });
  const unlock = (page: Page) => page.getByRole('button', { name: /déverrouiller le cadran/i });

  async function ready_fr(page: Page) {
    await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await page.goto('/');
    await ready(page);
  }

  test('verrouillé, plus rien ne change la durée ni n’efface la session', async ({ page }) => {
    await ready_fr(page);
    await lock(page).click();
    await expect(unlock(page)).toBeVisible();

    // Le cadran : ni le clavier, ni le clic (une paume posée dessus ne démarre plus rien)
    await page.locator('.face').focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Home');
    await expect(time(page)).toHaveText('25:00');
    // `force` : Playwright refuse de cliquer un élément `aria-disabled`, ce qui est
    // déjà une garantie — mais on veut vérifier que le clic lui-même ne fait rien.
    await page.locator('.face').click({ force: true });
    await expect(page.locator('.readout-time')).toHaveText('25:00');
    await expect(page.getByRole('slider')).toHaveAttribute('aria-disabled', 'true');

    // Les boutons − / + et la remise à zéro
    await expect(page.locator('.step').first()).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('.step').last()).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: /remettre à zéro/i })).toHaveAttribute('aria-disabled', 'true');
  });

  test('Démarrer reste actif : une pause se rattrape, pas une remise à zéro', async ({ page }) => {
    await ready_fr(page);
    await lock(page).click();
    await page.getByRole('button', { name: /démarrer/i }).click();
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();

    // Et la remise à zéro n'emporte pas la session en cours
    await page.getByRole('button', { name: /remettre à zéro/i }).click({ force: true });
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
  });

  test('le verrou se retient d’une ouverture à l’autre', async ({ page }) => {
    await ready_fr(page);
    await lock(page).click();
    await page.reload();
    await ready(page);
    await expect(unlock(page)).toBeVisible();

    // Déverrouillé, le cadran répond de nouveau
    await unlock(page).click();
    await page.locator('.face').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(time(page)).toHaveText('24:00');
  });

  test('sa cible fait au moins 44 px (WCAG 2.5.8)', async ({ page }) => {
    await ready_fr(page);
    const box = await lock(page).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('routines', () => {
  /**
   * Une routine de trois étapes d'une minute, déjà chargée : les tests jouent la suite
   * à l'horloge simulée sans attendre trente minutes. La première étape est du travail
   * pour vérifier que la prolongation « +5 min » ne s'invite pas dans une routine.
   */
  const ROUTINE = {
    id: 'test-routine',
    name: 'Matin',
    icon: '🌅',
    steps: [
      { id: 's1', name: 'Habillage', icon: '👕', seconds: 60, color: '#8b6fd6', kind: 'focus' },
      { id: 's2', name: 'Repas', icon: '🥣', seconds: 60, color: '#56b27b', kind: 'break' },
      { id: 's3', name: 'Dents', icon: '🪥', seconds: 60, color: '#5aa9c4', kind: 'break' }
    ]
  };

  async function seed(page: Page, spoken = false, reminder?: { hour: number; minute: number; days: number[] }) {
    await page.addInitScript(
      ([routine, capture]) => {
        localStorage.setItem('pomodoro-tdah.lang', 'fr');
        localStorage.setItem('pomodoro-tdah.routines', routine as string);
        localStorage.setItem('pomodoro-tdah.routine', 'test-routine');
        if (capture) {
          (window as any).__spoken = [];
          localStorage.setItem('pomodoro-tdah.speech', 'milestones');
          SpeechSynthesis.prototype.speak = function (u: SpeechSynthesisUtterance) {
            (window as any).__spoken.push(u.text);
          };
        }
      },
      [JSON.stringify([{ ...ROUTINE, reminder }]), spoken] as const
    );
  }

  const chips = (page: Page) => page.locator('.step-chip');
  const said = (page: Page) => page.evaluate(() => (window as any).__spoken as string[]);

  test('la bande situe chaque étape, et axe-core n’y trouve rien', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);

    await expect(page.locator('.routine-title')).toContainText('Matin');
    await expect(chips(page)).toHaveCount(3);
    // L'état est dit, pas seulement montré par la couleur et la coche (WCAG 1.4.1)
    await expect(chips(page).first()).toHaveAccessibleName('Étape 1 sur 3 : Habillage, 1 minute, en cours');
    await expect(chips(page).first()).toHaveAttribute('aria-current', 'step');
    await expect(chips(page).nth(1)).toHaveAccessibleName('Étape 2 sur 3 : Repas, 1 minute');
    expect(await violations(page)).toEqual([]);
  });

  test('une étape est un bouton : on y va directement, dans les deux sens', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);

    await chips(page).nth(2).click();
    await expect(page.locator('.readout-mode')).toHaveText('Dents');
    await expect(chips(page).nth(2)).toHaveAttribute('aria-current', 'step');
    // Les deux premières sont alors marquées faites, la coche doublant le gris
    await expect(page.locator('.step-chip.done')).toHaveCount(2);
    await expect(page.locator('.step-check')).toHaveCount(2);

    // Et l'on peut revenir en arrière pour refaire une étape
    await chips(page).first().click();
    await expect(page.locator('.readout-mode')).toHaveText('Habillage');
    await expect(page.locator('.step-chip.done')).toHaveCount(0);
  });

  test('une étape finie enchaîne sur la suivante, qui est annoncée', async ({ page }) => {
    await seed(page, true);
    await page.clock.install();
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: /démarrer/i }).click();

    // Étape de travail, prolongation active par défaut : dans une routine elle ne
    // s'applique pas, sinon toutes les étapes suivantes décaleraient de cinq minutes
    await page.clock.runFor(61_000);
    await expect(page.locator('.readout-mode')).toHaveText('Repas');
    await expect(chips(page).nth(1)).toHaveAttribute('aria-current', 'step');
    expect(await said(page)).toEqual(['Temps écoulé. Place à : Repas']);

    await page.clock.runFor(61_000);
    await expect(page.locator('.readout-mode')).toHaveText('Dents');
  });

  test('la dernière étape terminée coche toute la routine et le dit', async ({ page }) => {
    await seed(page, true);
    await page.clock.install();
    await page.goto('/');
    await ready(page);

    await chips(page).nth(2).click();
    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.clock.runFor(61_000);

    await expect(page.locator('.step-chip.done')).toHaveCount(3);
    await expect(page.locator('.step-chip[aria-current="step"]')).toHaveCount(0);
    expect(await said(page)).toEqual(['Temps écoulé. Routine terminée : Matin']);
    await expect(page.locator('#a11y-announcements')).toHaveText('Routine terminée : Matin');
  });

  test('verrouillé, la bande ne change plus d’étape et ne quitte plus la routine', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: /verrouiller le cadran/i }).click();

    await expect(chips(page).first()).toHaveAttribute('aria-disabled', 'true');
    await chips(page).nth(2).click({ force: true });
    await expect(page.locator('.readout-mode')).toHaveText('Habillage');

    await page.getByRole('button', { name: /quitter la routine/i }).click({ force: true });
    await expect(page.locator('.routine-title')).toBeVisible();

    // Choisir une routine dans le panneau reste possible : le geste y est délibéré
    await chips(page).nth(1).click({ force: true });
    await openSheet(page);
    await page.getByRole('button', { name: 'Lancer Matin' }).click();
    await expect(chips(page).first()).toHaveAttribute('aria-current', 'step');
  });

  test('quitter la routine rend le cadran au mode choisi', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);

    await page.getByRole('button', { name: /quitter la routine/i }).click();
    await expect(page.locator('.routine-title')).toHaveCount(0);
    await expect(page.locator('.readout-time')).toHaveText('25:00');
  });

  test('ses cibles font au moins 44 px (WCAG 2.5.8)', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);
    for (const target of [chips(page).first(), page.getByRole('button', { name: /quitter la routine/i })]) {
      const box = await target.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('le rappel se règle au clavier, et part avec la routine', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.getByRole('button', { name: 'Modifier la routine Matin' }).click();

    const reminder = page.getByRole('switch', { name: /Rappel/ });
    await expect(reminder).not.toBeChecked();
    await reminder.focus();
    await page.keyboard.press(' ');
    await expect(reminder).toBeChecked();

    // Allumer coche la semaine entière : un rappel sans jour ne partirait jamais
    const days = page.getByRole('group', { name: 'Jours' }).getByRole('button');
    await expect(days).toHaveCount(7);
    for (const day of await days.all()) await expect(day).toHaveAttribute('aria-pressed', 'true');

    // « L » et « M » ne se distinguent pas à l'oreille : chaque jour porte son nom (WCAG 1.3.1)
    await expect(days.first()).toHaveAccessibleName('lundi');
    await expect(days.last()).toHaveAccessibleName('dimanche');

    // Et les cibles restent atteignables (WCAG 2.5.8)
    for (const target of [days.first(), page.locator('input[type="time"]')]) {
      const box = await target.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    // Le week-end décoché, le rappel ne part que les jours d'école
    await days.nth(5).click();
    await days.nth(6).click();
    await expect(days.nth(5)).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pomodoro-tdah.routines') ?? '[]')
    );
    expect(saved[0].reminder).toEqual({ hour: 8, minute: 0, days: [1, 2, 3, 4, 5] });
  });

  test('un rappel éteint ne laisse rien derrière lui', async ({ page }) => {
    await seed(page, false, { hour: 7, minute: 30, days: [1, 2, 3, 4, 5] });
    await page.goto('/');
    await ready(page);
    await openSheet(page);

    await page.getByRole('button', { name: 'Modifier la routine Matin' }).click();
    await expect(page.getByRole('switch', { name: /Rappel/ })).toBeChecked();
    await page.getByRole('switch', { name: /Rappel/ }).click();
    await expect(page.getByRole('group', { name: 'Jours' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pomodoro-tdah.routines') ?? '[]')
    );
    expect(saved[0].reminder).toBeUndefined();
  });

  test('la carte dit son rappel, et pas seulement en pastille', async ({ page }) => {
    await seed(page, false, { hour: 7, minute: 30, days: [1, 2, 3, 4, 5] });
    await page.goto('/');
    await ready(page);
    await openSheet(page);

    // L'`aria-label` remplace tout le contenu du bouton : sans lui, ⏰ 07:30 ne serait vu
    // que des voyants (WCAG 1.1.1)
    await expect(page.getByRole('button', { name: /Lancer Matin/ })).toHaveAccessibleName(
      'Lancer Matin, rappel à 07:30'
    );
    await expect(page.locator('.routine-bell')).toHaveText('⏰ 07:30');
  });

  test('l’éditeur de routine se tient, étape dépliée comprise', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);

    await page.getByRole('button', { name: 'Modifier la routine Matin' }).click();
    await expect(page.getByRole('button', { name: 'Ajouter une étape' })).toBeVisible();
    // L'éditeur prend tout l'onglet : la liste des modes s'efface le temps de l'édition
    await expect(page.locator('.preset')).toHaveCount(0);
    expect(await violations(page), 'éditeur replié').toEqual([]);

    const step = page.getByRole('button', { name: 'Modifier Habillage' });
    await step.click();
    await expect(step).toHaveAttribute('aria-expanded', 'true');
    expect(await violations(page), 'étape dépliée').toEqual([]);

    await page.getByRole('switch', { name: /Rappel/ }).click();
    await expect(page.getByRole('group', { name: 'Jours' })).toBeVisible();
    expect(await violations(page), 'rappel allumé').toEqual([]);

    // Réordonner, puis enregistrer : la bande suit aussitôt
    await page.getByRole('button', { name: 'Descendre Habillage' }).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(chips(page).first()).toHaveAccessibleName(/Repas/);
  });
});

test.describe("tutoriel d'accueil", () => {
  const dialog = (page: Page) => page.getByRole('dialog', { name: 'Bienvenue' });
  const next = (page: Page) => page.getByRole('button', { name: 'Suivant' });
  const previous = (page: Page) => page.getByRole('button', { name: 'Précédent' });
  const dots = (page: Page) => page.getByRole('group', { name: 'Bienvenue' }).getByRole('button');

  /**
   * Attend que la bande ait fini de glisser. Sans cette attente, axe-core mesure la vue
   * pendant le glissement : elle dépasse alors de la fenêtre, qui la rogne, et plus rien
   * ne se trouve derrière son texte — le contraste est calculé contre le blanc du canevas
   * et le thème sombre paraît illisible.
   */
  async function settled(page: Page) {
    await page.waitForFunction(() => {
      const slide = document.querySelector('.tutorial .slide:not([inert])');
      const viewport = document.querySelector('.tutorial .viewport');
      if (!slide || !viewport) return false;
      return Math.abs(slide.getBoundingClientRect().left - viewport.getBoundingClientRect().left) < 1;
    });
  }

  async function open(page: Page, lang = 'fr') {
    await showTutorial(page, lang);
    await page.goto('/');
    await ready(page);
    await expect(page.locator('.tutorial')).toBeVisible();
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`axe-core n'y trouve rien, thème ${theme}`, async ({ page }) => {
      // Le thème est posé avant le premier rendu : un rechargement ferait du lancement
      // suivant un lancement ordinaire, sans tutoriel
      await page.addInitScript(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await open(page);
      await expect(dialog(page)).toBeVisible();
      expect(await violations(page), 'première vue').toEqual([]);

      await next(page).click();
      await next(page).click();
      await settled(page);
      expect(await violations(page), 'troisième vue').toEqual([]);
    });
  }

  test('en arabe, les vues défilent dans le bon sens', async ({ page }) => {
    await open(page, 'ar');
    await expect(page.getByRole('dialog', { name: 'أهلًا بك' })).toBeVisible();
    // La deuxième vue doit être lisible : un décalage pris à l'envers laisserait le vide
    await page.getByRole('button', { name: 'التالي' }).click();
    await expect(page.locator('.slide:not([inert]) .slide-title')).toHaveText('ضبط المدة');
    expect(await violations(page)).toEqual([]);
  });

  test('il se traverse au clavier, sans jamais quitter la modale', async ({ page }) => {
    await open(page);

    // Le focus part sur « Suivant » et y reste : on traverse en répétant la même touche
    await expect(next(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(next(page)).toBeFocused();
    await expect(page.locator('.slide:not([inert]) .slide-title')).toHaveText('Régler la durée');

    // Les flèches avancent et reculent
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.slide:not([inert]) .slide-title')).toHaveText('Démarrer, faire une pause');
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.slide:not([inert]) .slide-title')).toHaveText('Régler la durée');

    // Derrière, la page est inerte : la tabulation ne peut pas en sortir (WCAG 2.1.2)
    await expect(page.locator('.stage-content')).toHaveAttribute('inert', '');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('.tutorial'))).toBe(true);
  });

  test('la dernière vue termine, et le focus revient sur Démarrer', async ({ page }) => {
    await open(page);
    for (let i = 0; i < 4; i++) await next(page).click();

    // Sur la dernière, le bouton dit que c'est fini plutôt que « Suivant »
    const done = page.getByRole('button', { name: "C'est parti" });
    await expect(done).toBeVisible();
    await done.click();

    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /démarrer/i })).toBeFocused();
    await expect(page.locator('.stage-content')).not.toHaveAttribute('inert', '');
  });

  test('seules les vues à l’écran sont lues, et les points y mènent', async ({ page }) => {
    await open(page);

    // Quatre vues sur cinq sont hors du champ : ni la tabulation ni le lecteur d'écran
    await expect(page.locator('.slide[aria-hidden="true"]')).toHaveCount(4);
    await expect(page.locator('.slide:not([aria-hidden])')).toHaveCount(1);

    const points = dots(page);
    await expect(points).toHaveCount(5);
    await expect(points.first()).toHaveAccessibleName("Aller à l'étape 1");
    await expect(points.first()).toHaveAttribute('aria-pressed', 'true');

    // Les cibles se visent, même d'une main qui tremble (WCAG 2.5.8)
    for (const target of [points.first(), next(page), previous(page)]) {
      const box = await target.boundingBox();
      expect(box!.height, await target.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
    }

    // Et chaque point mène directement à sa vue
    await points.nth(4).click();
    await expect(points.nth(4)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.slide:not([inert]) .slide-title')).toHaveText('Être prévenu à ta façon');
  });

  test('« Passer » le referme, et il ne revient pas tout seul', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Passer' }).click();
    await expect(dialog(page)).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('pomodoro-tdah.tutorial-seen'))).toBe('on');

    // Au lancement suivant, le minuteur est là tout de suite
    await page.reload();
    await ready(page);
    await expect(dialog(page)).toHaveCount(0);
  });

  test('Échap le passe aussi, où que soit le focus', async ({ page }) => {
    await open(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
  });

  test('il se revoit depuis les réglages', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await page.goto('/');
    await ready(page);
    await expect(dialog(page)).toHaveCount(0);

    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();
    await page.getByRole('button', { name: 'Revoir le tutoriel' }).click();

    // Le panneau cède la place : deux modales à la fois ne s'entendraient pas
    await expect(page.locator('.sheet.open')).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
    await expect(next(page)).toBeFocused();
  });
});

test.describe('secondes et tours', () => {
  /**
   * Un Tabata : deux étapes de cinq secondes, jouées deux fois. Cinq secondes plutôt que
   * vingt pour que l'horloge simulée n'ait pas mille ticks à jouer — la règle testée est
   * l'enchaînement des tours, pas la durée.
   */
  const TABATA = {
    id: 'tabata',
    name: 'Tabata',
    icon: '💪',
    rounds: 2,
    steps: [
      { id: 'work', name: 'Effort', icon: '🏃', seconds: 5, color: '#d63f4f', kind: 'focus' },
      { id: 'rest', name: 'Repos', icon: '🧘', seconds: 5, color: '#56b27b', kind: 'break' }
    ]
  };

  async function seedTabata(page: Page) {
    await page.addInitScript(routine => {
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      localStorage.setItem('pomodoro-tdah.routines', routine as string);
      localStorage.setItem('pomodoro-tdah.routine', 'tabata');
    }, JSON.stringify([TABATA]));
  }

  const chips = (page: Page) => page.locator('.step-chip');

  test('une étape peut durer quelques secondes, et le dire', async ({ page }) => {
    await seedTabata(page);
    await page.goto('/');
    await ready(page);

    // Le cadran et la bande comptent en secondes, sans arrondir à la minute
    await expect(page.locator('.readout-time')).toHaveText('00:05');
    await expect(chips(page).first()).toHaveAccessibleName('Étape 1 sur 2 : Effort, 5 secondes, en cours');
    await expect(chips(page).first().locator('.step-time')).toHaveText('5 s');
  });

  test('la durée se règle au clavier, d’une seconde à une heure', async ({ page }) => {
    await seedTabata(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.getByRole('button', { name: 'Modifier la routine Tabata' }).click();
    await page.getByRole('button', { name: 'Modifier Effort' }).click();

    // Dans le panneau : le cadran porte lui aussi le nom « Durée »
    const duration = page.locator('.sheet').getByRole('slider', { name: /Durée/ });
    await duration.focus();
    // Le pas vaut 5 s en bas de l'échelle : c'est là que se règlent les exercices
    await page.keyboard.press('Home');
    await expect(duration).toHaveAttribute('aria-valuetext', '5 secondes');
    await page.keyboard.press('ArrowRight');
    await expect(duration).toHaveAttribute('aria-valuetext', '10 secondes');

    // Et une minute au-delà : une routine ne se règle pas à la seconde près
    await page.keyboard.press('End');
    await expect(duration).toHaveAttribute('aria-valuetext', '60 minutes');
    await page.keyboard.press('ArrowLeft');
    await expect(duration).toHaveAttribute('aria-valuetext', '59 minutes');

    for (let i = 0; i < 59; i++) await page.keyboard.press('ArrowLeft');
    await expect(duration).toHaveAttribute('aria-valuetext', '55 secondes');

    await page.getByRole('button', { name: 'Enregistrer' }).click();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pomodoro-tdah.routines') ?? '[]')
    );
    expect(saved[0].steps[0].seconds).toBe(55);
  });

  test('les tours se règlent, et le panneau reste valide pour axe-core', async ({ page }) => {
    await seedTabata(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.getByRole('button', { name: 'Modifier la routine Tabata' }).click();

    const rounds = page.locator('.sheet').getByRole('slider', { name: /Tours/ });
    await expect(rounds).toHaveAttribute('aria-valuetext', '2 fois');
    await rounds.focus();
    // « Une seule fois » plutôt que « 1 fois » : le nombre nu ne dirait pas de quoi il parle
    await page.keyboard.press('Home');
    await expect(rounds).toHaveAttribute('aria-valuetext', 'Une seule fois');
    for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowRight');
    await expect(rounds).toHaveAttribute('aria-valuetext', '8 fois');
    expect(await violations(page)).toEqual([]);

    await page.getByRole('button', { name: 'Enregistrer' }).click();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pomodoro-tdah.routines') ?? '[]')
    );
    expect(saved[0].rounds).toBe(8);
    // La carte annonce le temps total, tours compris, et le nombre de tours
    await expect(page.getByRole('button', { name: /Lancer Tabata/ })).toContainText('×8');
  });

  test('la routine rejoue ses étapes, et dit à quel tour elle en est', async ({ page }) => {
    await seedTabata(page);
    await page.clock.install();
    await page.goto('/');
    await ready(page);

    // Les pastilles comptent les tours de la routine, pas les cycles pomodoro
    await expect(page.locator('.cycle')).toHaveText(/Tour 1 sur 2/);
    await expect(page.locator('.cycle-dot')).toHaveCount(2);

    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.clock.runFor(5_100);
    await expect(page.locator('.readout-mode')).toHaveText('Repos');
    await expect(page.locator('.cycle')).toHaveText(/Tour 1 sur 2/);

    // Fin du premier tour : la bande repart à la première étape, et le tour est annoncé
    await page.clock.runFor(5_100);
    await expect(page.locator('.readout-mode')).toHaveText('Effort');
    await expect(page.locator('.cycle')).toHaveText(/Tour 2 sur 2/);
    await expect(chips(page).first()).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#a11y-announcements')).toContainText('Tour 2 sur 2');

    // Le dernier tour fini, la routine est terminée : elle ne repart pas à l'infini
    await page.clock.runFor(10_200);
    await expect(page.locator('.step-chip.done')).toHaveCount(2);
    await expect(page.locator('#a11y-announcements')).toHaveText('Routine terminée : Tabata');
  });
});

test.describe('mode sport', () => {
  /** L'entraînement livré avec l'app : 20 s d'effort, 10 s de repos, huit tours. */
  async function armTabata(page: Page) {
    await page.addInitScript(() => {
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      localStorage.setItem('pomodoro-tdah.routine', 'tabata');
    });
  }

  const dial = (page: Page) => page.locator('.face');

  test('le cadran passe en secondes sous la minute, et le dit', async ({ page }) => {
    await armTabata(page);
    await page.goto('/');
    await ready(page);

    // Vingt secondes sur une graduation d'une heure ne se verraient pas : ce sont
    // maintenant des secondes, et une pastille le dit pour qui lit 20 comme 20 minutes
    await expect(dial(page)).toHaveAttribute('aria-valuetext', '20 secondes');
    await expect(dial(page)).toHaveAttribute('aria-valuenow', '20');
    await expect(page.locator('.unit')).toHaveText('sec');
    expect(await violations(page), 'thème clair').toEqual([]);

    await page.evaluate(() => localStorage.setItem('pomodoro-tdah.theme', 'dark'));
    await page.reload();
    await ready(page);
    await expect(page.locator('.unit')).toHaveText('sec');
    expect(await violations(page), 'thème sombre').toEqual([]);

    // Et le disque couvre vraiment un tiers du cadran, là où 20 s n'en étaient qu'un filet
    const veil = await page.locator('.disk-veil').boundingBox();
    const face = await page.locator('.dial').boundingBox();
    expect(veil!.width / face!.width, 'largeur du disque').toBeGreaterThan(0.3);
  });

  test('en secondes, le cadran ne se règle plus mais démarre toujours', async ({ page }) => {
    await armTabata(page);
    await page.goto('/');
    await ready(page);

    // Le réglage travaille en minutes : il donnerait une durée sans rapport avec l'affichage
    await expect(dial(page)).toHaveAttribute('aria-readonly', 'true');
    await expect(page.locator('.step').first()).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('.step').last()).toHaveAttribute('aria-disabled', 'true');

    await dial(page).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('PageDown');
    await expect(page.locator('.readout-time')).toHaveText('00:20');

    // Mais l'appui sur le cadran démarre : c'est le verrou, lui, qui le retire
    await dial(page).click();
    await expect(page.getByRole('button', { name: /pause/i })).toBeVisible();
  });

  test('un mode ordinaire garde la graduation en minutes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('pomodoro-tdah.lang', 'fr'));
    await page.goto('/');
    await ready(page);

    await expect(dial(page)).toHaveAttribute('aria-valuetext', '25 minutes');
    await expect(dial(page)).not.toHaveAttribute('aria-readonly', 'true');
    await expect(page.locator('.unit')).toHaveCount(0);
  });

  test('les trois dernières secondes se comptent, et la suite est annoncée', async ({ page }) => {
    await armTabata(page);
    await page.addInitScript(() => {
      localStorage.setItem('pomodoro-tdah.speech', 'milestones');
      (window as any).__spoken = [];
      (window as any).__vibrations = [];
      SpeechSynthesis.prototype.speak = function (u: SpeechSynthesisUtterance) {
        (window as any).__spoken.push(u.text);
      };
      Object.defineProperty(navigator, 'vibrate', {
        value: (pattern: number | number[]) => {
          (window as any).__vibrations.push(Array.isArray(pattern) ? pattern[0] : pattern);
          return true;
        }
      });
    });
    await page.clock.install();
    await page.goto('/');
    await ready(page);
    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.evaluate(() => ((window as any).__vibrations.length = 0));

    // À cinq secondes de la fin, la suite est dite : on prépare le geste sans lire l'écran
    await page.clock.runFor(15_100);
    expect(await page.evaluate(() => (window as any).__spoken as string[])).toEqual(['Ensuite : Repos']);

    // Puis une impulsion sèche par seconde, et le chiffre
    await page.clock.runFor(2_000);
    expect(await page.evaluate(() => (window as any).__vibrations as number[])).toEqual([60]);
    await page.clock.runFor(2_000);
    expect(await page.evaluate(() => (window as any).__vibrations as number[])).toEqual([60, 60, 60]);
    expect(await page.evaluate(() => (window as any).__spoken as string[])).toEqual([
      'Ensuite : Repos', '3', '2', '1'
    ]);

    // La fin enchaîne sur le repos, avec son motif à elle
    await page.clock.runFor(3_000);
    await expect(page.locator('.readout-mode')).toHaveText('Repos');
    expect((await page.evaluate(() => (window as any).__vibrations as number[])).slice(3))
      .toEqual([500, 500, 500]);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`la carte de la routine chargée reste lisible, thème ${theme}`, async ({ page }) => {
      await armTabata(page);
      await page.addInitScript(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await page.goto('/');
      await ready(page);
      await openSheet(page);

      // La carte de la routine en cours n'était jusqu'ici jamais passée sous axe-core :
      // aucun test n'ouvrait le panneau avec une routine chargée
      await expect(page.locator('.routine.active')).toBeVisible();
      expect(await violations(page)).toEqual([]);
    });
  }

  test('une étape longue ne déclenche aucun décompte', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      (window as any).__vibrations = [];
      Object.defineProperty(navigator, 'vibrate', {
        value: (pattern: number | number[]) => {
          (window as any).__vibrations.push(Array.isArray(pattern) ? pattern[0] : pattern);
          return true;
        }
      });
    });
    await page.clock.install();
    await page.goto('/');
    await ready(page);
    await setMinutes(page, 1);
    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.evaluate(() => ((window as any).__vibrations.length = 0));

    // Une minute reste une minute : aucun tic, seulement le motif de fin
    await page.clock.runFor(63_000);
    expect(await page.evaluate(() => (window as any).__vibrations as number[])).toEqual([500, 500, 500]);
  });
});

test.describe('mode sport (design)', () => {
  /** Une routine marquée « entraînement » : c'est elle qui fait passer la page en sport. */
  async function armWorkout(page: Page, workout = true) {
    await page.addInitScript(on => {
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      localStorage.setItem('pomodoro-tdah.routine', 'tabata');
      if (!on) {
        const routines = JSON.parse(localStorage.getItem('pomodoro-tdah.routines') ?? 'null') ?? [];
        localStorage.setItem('pomodoro-tdah.routines', JSON.stringify(routines));
      }
    }, workout);
  }

  test('la page prend la couleur de l’étape, et la rend au changement de phase', async ({ page }) => {
    await armWorkout(page);
    await page.clock.install();
    await page.goto('/');
    await ready(page);

    const stage = page.locator('.stage');
    const tint = () => stage.evaluate(el => ({
      color: getComputedStyle(el).getPropertyValue('--sport-c').trim(),
      background: getComputedStyle(el).backgroundImage
    }));

    await expect(stage).toHaveClass(/sport/);
    const effort = await tint();
    expect(effort.color, 'la teinte de l’effort').toBe('#d63f4f');

    // Au repos, toute la page change de couleur : on sait où l'on en est sans lire
    await page.getByRole('button', { name: /démarrer/i }).click();
    await page.clock.runFor(21_000);
    await expect(page.locator('.readout-mode')).toHaveText('Repos');
    const repos = await tint();
    expect(repos.color).toBe('#56b27b');
    expect(repos.background, 'le fond a repeint').not.toEqual(effort.background);
  });

  test('une routine ordinaire laisse la page intacte', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pomodoro-tdah.lang', 'fr');
      localStorage.setItem('pomodoro-tdah.routine', 'morning');
    });
    await page.goto('/');
    await ready(page);

    await expect(page.locator('.routine-title')).toContainText('Routine du matin');
    await expect(page.locator('.stage')).not.toHaveClass(/sport/);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`le fond teinté ne casse aucun contraste, thème ${theme}`, async ({ page }) => {
      await armWorkout(page);
      await page.addInitScript(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await page.goto('/');
      await ready(page);

      // Le gris secondaire tombait à 2,82:1 sur le fond teinté : c'est ce que ce contrôle garde
      await expect(page.locator('.stage')).toHaveClass(/sport/);
      expect(await violations(page)).toEqual([]);
    });
  }

  test('l’interrupteur « Entraînement » se règle et s’enregistre', async ({ page }) => {
    await armWorkout(page);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.getByRole('button', { name: 'Modifier la routine Tabata' }).click();

    const workout = page.getByRole('switch', { name: /Entraînement/ });
    await expect(workout).toBeChecked();
    await workout.click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Décoché, la page revient à son fond ordinaire sans recharger
    await expect(page.locator('.stage')).not.toHaveClass(/sport/);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pomodoro-tdah.routines') ?? '[]')
    );
    expect(saved.find((r: { id: string }) => r.id === 'tabata').workout).toBe(false);
  });
});

/**
 * Mode table : le téléphone posé debout devient le minuteur visuel de la pièce. Ce qui
 * s'efface doit s'effacer vraiment (et non seulement à l'œil), ce qui reste doit rester
 * atteignable au clavier, et la porte de sortie doit se voir et s'ouvrir — un mode sans
 * sortie visible est un piège, surtout pour qui ne sait pas comment il y est entré.
 */
test.describe('mode table', () => {
  async function enterTable(page: Page, lang = 'fr') {
    await page.addInitScript(l => localStorage.setItem('pomodoro-tdah.lang', l), lang);
    await page.goto('/');
    await ready(page);
    await openSheet(page);
    await page.locator('.tabs button:nth-child(3)').click();
    await page.getByRole('button', { name: /^Mode table$/ }).last().click();
    await expect(page.locator('.stage.table')).toBeVisible();
  }

  test('le cadran prend la place, les commandes secondaires s’effacent', async ({ page }) => {
    await enterTable(page);

    // Le panneau s'est fermé de lui-même : rien ne doit rester entre le cadran et la pièce
    await expect(page.locator('.sheet.open')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /remettre à zéro/i })).toBeHidden();
    await expect(page.getByRole('button', { name: /^Réglages$/ })).toBeHidden();
    await expect(page.getByRole('button', { name: /moins|plus/i }).first()).toBeHidden();

    // Démarrer reste : un minuteur qu'on ne peut plus lancer ne sert à rien
    await expect(page.getByRole('button', { name: /démarrer/i })).toBeVisible();
    await expect(page.locator('.accessibility-link')).toBeHidden();
  });

  test('le chrono se lit de loin', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    const before = await page.locator('.readout-time').evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    );
    await enterTable(page);
    const after = await page.locator('.readout-time').evaluate(
      el => parseFloat(getComputedStyle(el).fontSize)
    );
    expect(after, 'le temps grossit en mode table').toBeGreaterThan(before * 1.4);
  });

  test('la sortie se voit, s’atteint au clavier et rend la page entière', async ({ page }) => {
    await enterTable(page);

    const exit = page.getByRole('button', { name: 'Quitter le mode table' });
    await expect(exit).toBeVisible();
    // Cible d'au moins 44 px (WCAG 2.5.8) : on en sort avec un doigt, pas avec une pointe
    const box = await exit.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await exit.focus();
    await expect(exit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.stage.table')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Réglages$/ })).toBeVisible();
  });

  test('Échap quitte le mode table', async ({ page }) => {
    await enterTable(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.stage.table')).toHaveCount(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`aucune violation en mode table, thème ${theme}`, async ({ page }) => {
      await page.addInitScript(t => localStorage.setItem('pomodoro-tdah.theme', t), theme);
      await enterTable(page);
      expect(await violations(page)).toEqual([]);
    });
  }
});

/**
 * Voile d'amorçage : il tient l'écran entre l'image de lancement du système et la première
 * image de l'app. Deux choses comptent — qu'il s'en aille, sinon il ne reste qu'un écran
 * noir dont personne ne sait rien ; et qu'il se fige pour qui demande moins de mouvement.
 */
test.describe('voile d’amorçage', () => {
  test('il s’efface une fois l’application prête', async ({ page }) => {
    await page.goto('/');
    await ready(page);
    await expect(page.locator('#boot')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/booting/);
  });

  test('le cadran se fige sous prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // Avant que l'app ne l'ait retiré, l'anneau ne doit porter aucune animation
    const animation = await page.evaluate(() => {
      const ring = document.querySelector('.boot-ring');
      return ring ? getComputedStyle(ring).animationName : 'absent';
    });
    expect(['none', 'absent']).toContain(animation);
    await ready(page);
  });
});
