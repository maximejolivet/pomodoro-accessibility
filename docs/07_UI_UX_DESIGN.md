# Design UI/UX

## Public et ton

Le public est neurodivergent (TDAH, autisme, troubles DYS) et ses proches. Le ton est calme : aucune pression, aucun score, aucune alerte qui clignote, une fin douce. L'accessibilité est la règle par défaut, jamais une option ajoutée après coup (voir les principes directeurs du [PRD](02_PRD.md)).

## Rendu du cadran

- **Un seul SVG**, `viewBox="0 0 420 420"`, dont les chemins sont calculés en TypeScript par des
  fonctions pures (`features/timer/dial-geometry.ts`) - testables sans DOM.
- **Deux couches** : un voile en `mix-blend-mode: multiply` posé sur l'anneau arc-en-ciel de
  12 segments de 5 minutes, et un plateau plein au centre.
- **Gestes** : événements *pointer* (`pointerdown` / `pointermove` / `pointerup` /
  `pointercancel`), un seul jeu de gestionnaires pour la souris, le tactile et le stylet.
- **Clavier** : ← / → (±1 min), Page↑ / Page↓ (±5 min), Début / Fin (0 / 60 min).
- Le SVG est `aria-hidden` ; c'est son conteneur qui porte la sémantique (voir « Accessibilité technique », plus bas).

### Graduation en secondes

Le cadran projette une valeur de 0 à 60 sur un cercle. Rien n'y oblige à ce que cette valeur
soit des minutes : quand la durée réglée descend sous `SECONDS_DIAL_BELOW`, `SessionService`
alimente la même géométrie en **secondes**. Les douze segments valent alors 5 s, et les chiffres
de la face - 0, 5, 10… - restent justes sans changer, puisqu'ils valent pour les deux unités.

Sans cela, un effort de 20 s couvre deux degrés de disque : l'application perd exactement ce
qu'elle promet, voir le temps. Avec, le disque part au tiers du cadran et se vide sous les yeux.

Deux garde-fous :

- l'unité suit la **durée réglée** et non le temps restant, sinon un Pomodoro basculerait en
  secondes dans sa dernière minute (RG-27) ;
- le **réglage** est neutralisé tant que la graduation est en secondes : glissement, flèches et
  boutons − / + travaillent en minutes et donneraient une durée sans rapport avec l'affichage
  (RG-26). Démarrer et mettre en pause restent possibles,
  et l'attribut porté est `aria-readonly`, non `aria-disabled`.

Une pastille « sec » sous le bouton central dit l'unité : sans elle, un cadran réglé sur 20
secondes se lit 20 minutes.

### Mode sport

Une routine marquée `workout` pose la classe `sport` sur la scène, et y publie la couleur de
l'étape en cours (`--sport-c`). Porté par la routine plutôt que par un réglage global : une
séance s'arme et se quitte, un réglage se rallume et s'oublie.

Le fond de la scène est alors **teinté** de cette couleur (18 % en haut, 30 % en bas) au lieu
d'être remplacé : le clair reste clair et le sombre reste sombre, si bien que tout ce qui s'y
écrit garde le contraste qu'il avait. Une couleur pleine aurait obligé à revérifier chaque
texte de l'application dans dix teintes.

Une exception mesurée : le gris secondaire tombait à **2,82:1** sur le fond teinté (pire cas
sur les dix couleurs de la palette, thème clair, bas du dégradé). `.stage.sport` redéfinit donc
`--muted` sur `--muted-strong`, ce qui remonte le pire cas à 5,0:1 et couvre d'un coup tout ce
qui s'écrit sur la scène - l'état sous les boutons, le compteur de tours, le titre de la routine.

Le chrono et le nom de l'étape s'agrandissent par `:host-context(.sport)` : la classe vit sur
la page, hors du composant, et un sélecteur descendant ordinaire ne correspondrait pas sous
l'encapsulation Angular.

## Thème et styles

| Fichier                  | Contenu                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| `src/styles.css`         | Imports du thème, Tailwind, utilitaires globaux                                   |
| `src/theme/tokens.css`   | Jetons de couleur du thème clair, posés sur `<app-root>`                          |
| `src/theme/dark.css`     | Redéfinition des jetons sous `app-root.dark`                                      |
| `src/theme/controls.css` | Primitives partagées : bouton en relief, curseur, contrôle segmenté, interrupteur |

Les couleurs ne sont **jamais** écrites en dur dans un composant : toutes passent par des
variables CSS héritées depuis `<app-root>`, ce qui rend le basculement de thème instantané et
garantit l'homogénéité des contrastes (ENF-MNT-2).

## Paliers

`core/helpers/milestones.ts` calcule, à partir de la durée d'une session, la liste des paliers
- minutes restantes et timbre emprunté.

Des paliers fixes à 45 / 30 / 15 ne préviennent que les longues sessions : un Pomodoro de 25 min
ne reçoit que celui des 15 minutes, et une étape de routine de 10 min aucun. Au-delà de
`LONG_SESSION_MINUTES`, les trois paliers connus sont donc conservés tels quels ; en dessous, ils
se déduisent de la durée : **la moitié, le dernier quart, puis une minute avant la fin**.

| Durée  | Paliers (minutes restantes) |
| ------ | --------------------------- |
| 60 min | 45, 30, 15                  |
| 25 min | 13, 6, 1                    |
| 10 min | 5, 3, 1                     |
| 2 min  | 1                           |
| 1 min  | aucun                       |
| 20 s   | aucun                       |

Une étape d'entraînement de quelques secondes ne reçoit donc aucun palier : le premier tomberait
après le carillon. C'est voulu - un décompte « 3, 2, 1 » à la seconde est un autre signal, qui
reste à écrire.

Le timbre (son, motif de vibration, canal de notification) vient du **rang** et jamais du nombre
de minutes : le dernier palier porte toujours le plus insistant. Un palier arrondi au même nombre
de minutes qu'un autre est fusionné, et aucun ne tombe sur la durée totale elle-même.

`SessionService` expose la liste sous forme de `computed`, calculée sur la durée annoncée de la
session - un réglage au doigt en cours de route ne déplace donc pas les paliers déjà franchis -,
et vide pendant la prolongation « +5 min », qui est un rabiot et non une session à jalonner.

## Sons

`core/helpers/sound-patterns.ts` définit les quatre motifs (`milestone45`, `milestone30`,
`milestone15`, `end`) sous forme de notes - fréquence, décalage, durée, gain, forme d'onde - avec
un partiel aigu optionnel pour l'effet de cloche.

Ce fichier unique sert **deux consommateurs** :

1. l'application, qui synthétise les motifs à la volée via Web Audio ;
2. `scripts/generate-sounds.ts`, exécuté par Node (`make sounds`), qui rend les mêmes motifs en
   fichiers WAV 22 050 Hz pour les notifications natives.

C'est la raison pour laquelle il n'importe rien : il doit rester exécutable hors bundle. Les sons
de l'application et ceux des notifications sont ainsi identiques par construction.

### Mise à niveau

Les gains écrits dans les motifs sont relatifs : ils règlent l'équilibre entre les notes d'un même
motif, pas son volume. Celui-ci vient de `level(pattern)`, qui **mesure la crête du signal rendu**
et la porte à `PEAK_TARGET` (0,89, soit −1 dBFS). Mesurer plutôt que calculer est nécessaire :
les notes se chevauchent et s'additionnent, si bien qu'un gain posé à la main laisse le motif soit
écrêté, soit très en dessous. Le facteur sert des deux côtés - gain maître en Web Audio, échelle
des échantillons dans le WAV - et il est mémoïsé, le calcul valant un rendu complet.

Deux conséquences voulues :

- **tous les motifs sortent à la même crête**, alors qu'ils s'étalaient auparavant sur 17 dB
  (le carillon de fin couvrait les paliers, et le palier des 15 min était le plus discret des
  quatre - le contraire de son rôle) ;
- **un son d'alerte doit sortir fort**, parce que l'appareil ne fait que réduire ce qu'on lui
  donne. Un fichier rendu à mi-échelle arrive irrémédiablement discret, notamment sur Android
  où le volume des notifications est un réglage à part.

L'enveloppe décroît vers un niveau **relatif** à la crête de la note (−48 dB au bout de `dur`).
Un plancher absolu plongeait d'autant plus vite que la note partait bas : une note douce n'était
qu'un claquement, et ce qui ne résonne pas ne s'entend pas.

Aucun limiteur ne ferme la chaîne Web Audio. La mise à niveau est mesurée sur un rendu où les
oscillateurs partent en phase, ce que Web Audio ne garantit pas : la crête réelle y monte jusqu'à
−0,5 dB au lieu de −1, ce que la marge de `PEAK_TARGET` absorbe. Un `DynamicsCompressorNode`,
mesuré à l'occasion, coûtait 3,9 dB au tic - trop bref pour échapper à son attaque - pour ne rien
protéger.

## Internationalisation

- Un dictionnaire par langue dans `core/i18n/locales/` : `fr`, `en`, `es`, `de`, `it`, `pt`, `ar`.
- Les clés sont **typées d'après le français** (`type I18nKey = keyof typeof fr`) : une clé
  manquante dans une autre langue est une erreur de compilation (ENF-MNT-1).
- Les textes de la page d'accessibilité vivent à part, dans `features/accessibility/accessibility.i18n.ts`.
- `I18nService` détecte la langue depuis `navigator.languages`, retombe sur le français, et met à
  jour `document.documentElement.lang` ainsi que le sens d'écriture (`dir`).
- **Ajouter une langue** = un fichier dans `locales/`, puis une entrée dans `Lang`,
  `DICTIONARIES`, `LANGUAGES` - et dans `RTL_LANGS` si elle s'écrit de droite à gauche.
- Le CSS emploie des propriétés logiques (`inset-inline-*`, `start` / `end`) : le passage en RTL
  ne demande aucune règle miroir.

## Accessibilité technique

| Exigence                                | Mise en œuvre                                                        |
| --------------------------------------- | -------------------------------------------------------------------- |
| Cadran utilisable au clavier et annoncé | Conteneur focalisable portant `role="slider"`                        |
| Annonces temps réel                     | Région live alimentée par `SessionService.announcement`              |
| Temps restant sans la vue               | Annonce vocale optionnelle (`SpeechService`)                         |
| Alerte sans la vue ni l'ouïe            | Motif de vibration propre à chaque palier (`HapticsService`)         |
| Alerte sans le son                      | Pulsation colorée à 0,6 Hz et bandeau de fin persistant              |
| Panneau de réglages                     | Focus piégé, fermeture par Échap, focus rendu au déclencheur         |
| Onglets                                 | Rôles `tablist` / `tab` / `tabpanel`, navigation par flèches         |
| Contraste                               | Jetons de thème vérifiés à 4,5:1 minimum, en clair et en sombre      |
| Couleur seule                           | Chaque couleur de mode est accompagnée de son nom                    |
| Animations                              | `prefers-reduced-motion` respecté                                    |
| Dyslexie                                | Police OpenDyslexic activable, interlettrage et interlignage élargis |
| Suite d'actions sans savoir lire        | Un pictogramme avant le nom de chaque étape                          |
| Structure                               | HTML sémantique, `main`, titres hiérarchisés, métadonnées de page    |

### Précisions

**Cadran** - `aria-valuemin=1`, `aria-valuemax=60`, `aria-valuenow`, `aria-valuetext`
(« *n* minutes, *action* ») et `aria-label`. Le SVG lui-même est `aria-hidden` : il ne dit rien
qu'un lecteur d'écran puisse utiliser.

**Annonce vocale** - aux paliers ou à chaque minute, dans la langue de l'interface.

**Vibration** - les motifs se distinguent par le nombre d'impulsions et leur rythme, pas par leur
durée (voir `ENF-A11-13`).

**Alerte sans le son** - `aria-hidden` et `pointer-events: none`, figée sous
`prefers-reduced-motion` : elle double une information déjà dite ailleurs.

**Onglets** - les flèches sont nommées pour les lecteurs d'écran.

**Étapes de routine** - la bande est une `<ol>` de boutons, l'étape en cours marquée
`aria-current="step"`. L'état (faite, en cours) est redit dans le nom accessible et doublé d'une
coche, jamais porté par la couleur seule.

Les écarts connus sont publiés dans la déclaration d'accessibilité de l'application (voir « Accessibilité » dans les exigences non fonctionnelles du [PRD](02_PRD.md)).

## Système d'icônes SVG

### Vue d'ensemble

Un système d'icônes SVG complet remplace les emojis pour une meilleure accessibilité et contrôle du style.

### Services et Composants

#### IconsService (`src/app/core/services/icons.service.ts`)

Service qui gère toutes les icônes SVG disponibles.

**Méthodes principales:**

```typescript
// Récupérer une icône SVG par nom
getSVG(name: IconName): SafeHtml

// Convertir un emoji en IconName
getIconFromEmoji(emoji: string): IconName

// Résout l'icône d'une routine ou d'une étape : accepte un emoji (anciennes données) ou un IconName (éditeur actuel)
resolveIcon(value: string): IconName
```

Les icônes des routines et des étapes sont stockées sous forme de noms d'icônes (par exemple `bed`) :
les modèles utilisent donc `resolveIcon`. `getIconFromEmoji` ne fait que la correspondance d'emojis, et
renvoie `info` pour tout le reste.

**Types disponibles:**

```typescript
type IconName =
  // Routine icons
  | 'sunrise' | 'shirt' | 'breakfast' | 'toothbrush'
  | 'running' | 'meditation' | 'gym' | 'bed' | 'shower'
  | 'backpack' | 'jacket' | 'bus' | 'medicine' | 'cleaning'
  | 'laundry' | 'shopping' | 'dog' | 'book' | 'pencil'
  | 'calculator' | 'art' | 'music' | 'tools' | 'computer'
  | 'email' | 'phone' | 'files' | 'moon'
  // Accessibility icons
  | 'blind' | 'keyboard' | 'search' | 'hearing' | 'vibration'
  | 'brain' | 'font' | 'image'
  // UI icons
  | 'play' | 'pause' | 'reset' | 'lock' | 'unlock' | 'edit'
  | 'delete' | 'add' | 'close' | 'settings' | 'theme-light'
  | 'theme-dark' | 'language' | 'help'
  // General
  | 'check' | 'warning' | 'error' | 'info' | 'menu' | 'back';
```

#### IconComponent (`src/app/shared/components/icon/icon.component.ts`)

Composant standalone pour afficher une icône SVG.

**Utilisation:**

```html
<!-- Par nom d'icône -->
<app-icon name="sunrise" aria-hidden="true"></app-icon>

<!-- Convertir depuis emoji -->
<app-icon 
  [name]="iconsService.getIconFromEmoji('🌅')"
  aria-hidden="true">
</app-icon>
```

**Props:**

- `name: IconName` - Le nom de l'icône (required)
- `ariaHidden: boolean | 'true' | 'false'` - Masquer pour les lecteurs d'écran (default: 'true')

### Source des icônes (Lucide)

Les icônes du `IconsService` viennent de **[Lucide](https://lucide.dev)** (licence ISC). Elles sont
embarquées dans le bundle : aucun appel réseau n'est nécessaire, l'app fonctionne hors ligne et sous
Electron.

Le fichier `src/app/core/helpers/lucide-icons.ts` est **généré**. Pour changer une icône :

1. Modifier la correspondance `nom interne → icône Lucide` dans `scripts/generate-lucide-icons.mjs`.
2. Régénérer : `make ui-icons` (ou `node scripts/generate-lucide-icons.mjs`).

Le script échoue si un nom Lucide n'existe pas dans `lucide-static`. Le type `Record<IconName, string>`
impose en plus qu'une icône soit présente pour chaque nom du type `IconName`.

Les SVG écrits directement dans les templates HTML ne passent pas par ce service ; ils ne sont pas
concernés par cette génération.

### Mapping Emoji → Icon

**Routine Icons:**
- 🌅 → `sunrise`
- 👕 → `shirt`
- 🥣 → `breakfast`
- 🪥 → `toothbrush`
- 🏃 → `running`
- 🧘 → `meditation`
- 💪 → `gym`

**Accessibility Icons:**
- 🦯 → `blind`
- ⌨️ → `keyboard`
- 🔍 → `search`
- 🦻 → `hearing`
- 📳 → `vibration`
- 🧠 → `brain`
- 🔤 → `font`
- 🖼️ → `image`

### Utilisation dans les Composants

#### Exemple: Affichage d'une icône de routine

**Avant (avec emoji):**

```html
<span class="step-emoji" aria-hidden="true">{{ step.icon }}</span>
```

**Après (avec SVG):**

```typescript
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { IconsService } from '@app/core/services';

export class MyComponent {
  constructor(public iconsService: IconsService) {}
}
```

```html
<app-icon 
  [name]="iconsService.getIconFromEmoji(step.icon)"
  aria-hidden="true"
  class="step-icon">
</app-icon>
```

### Ajouter une Nouvelle Icône

1. Ajouter le type dans `IconName` (icons.service.ts)
2. Ajouter la définition SVG dans `registerIcons()`:

```typescript
this.icons.set('my-icon', {
  svg: '<path d="M..."/>' // SVG path/element
  viewBox: '0 0 24 24' // Optional, default is '0 0 24 24'
});
```

3. Optionnel: Ajouter au mapping emoji si applicable:

```typescript
export const EMOJI_TO_ICON_MAP: Record<string, IconName> = {
  '🎉': 'my-icon',
  // ...
};
```

### Styling

Les icônes héritent automatiquement de la couleur du texte:

```css
/* La couleur sera rouge */
.my-icon-red {
  color: red;
}
```

Ou avec CSS personnalisé:

```css
app-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}
```

### Accessibilité

- Les icônes utilisent `aria-hidden="true"` par défaut (elles sont purement décoratives)
- Pour les icônes importantes, utiliser `aria-hidden="false"` et ajouter un label
- Les titres et labels doivent décrire l'icône, pas simplement "icône"

### Performance

- Les SVG sont intégrés inline et rendus dans le DOM
- Pas de requête HTTP pour chaque icône
- Les icônes sont scalables sans perte de qualité
- Les icônes héritent des propriétés CSS (couleur, taille, etc.)

### Compatibilité

- Fonctionne dans tous les navigateurs modernes
- Compatible avec le dark mode et les thèmes
- Accessible aux lecteurs d'écran
- Pas de dépendances externes (Material Icons, Font Awesome, etc.)

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# UI/UX design

## Audience and tone

The audience is neurodivergent (ADHD, autism, DYS disorders) and the people around them. The tone is calm: no pressure, no score, no flashing alert, a gentle ending. Accessibility is the default, never an option added after the fact (see the guiding principles in the [PRD](02_PRD.md)).

## Dial rendering

- **A single SVG**, `viewBox="0 0 420 420"`, whose paths are computed in TypeScript by pure functions
  (`features/timer/dial-geometry.ts`) - testable without the DOM.
- **Two layers**: a veil with `mix-blend-mode: multiply` over the rainbow ring of 12 segments of 5 minutes,
  and a solid plate at the centre.
- **Gestures**: *pointer* events (`pointerdown` / `pointermove` / `pointerup` / `pointercancel`), a single set of
  handlers for mouse, touch and stylus.
- **Keyboard**: ← / → (±1 min), Page Up / Page Down (±5 min), Home / End (0 / 60 min).
- The SVG is `aria-hidden`; its container carries the semantics (see "Technical accessibility", below).

### Graduation in seconds

The dial projects a value from 0 to 60 onto a circle. Nothing requires that value to be minutes: when the set
duration falls below `SECONDS_DIAL_BELOW`, `SessionService` feeds the same geometry in **seconds**. The twelve
segments then stand for 5 s each, and the numbers on the face - 0, 5, 10… - stay correct without change, since
they are valid for both units.

Without this, an effort of 20 s would cover two degrees of the disc: the application would lose exactly what it
promises, which is to make time visible. With it, the disc starts at a third of the dial and empties before the
eyes.

Two safeguards:

- the unit follows the **set duration**, not the remaining time, otherwise a Pomodoro would switch to seconds in
  its last minute (RG-27);
- **setting** is blocked while the graduation is in seconds: dragging, arrows and the − / + buttons work in
  minutes and would produce a duration unrelated to the display (RG-26). Starting and pausing remain possible,
  and the attribute used is `aria-readonly`, not `aria-disabled`.

A "dry" marker under the central button states the unit: without it, a dial set to 20 seconds reads as 20 minutes.

### Sport mode

A routine marked `workout` adds the class `sport` to the stage, and publishes there the colour of the current step
(`--sport-c`). It is carried by the routine rather than by a global setting: a session is armed and left, whereas
a setting is switched on and forgotten.

The background of the stage is then **tinted** with that colour (18 % at the top, 30 % at the bottom) instead of
being replaced: light stays light and dark stays dark, so everything written on it keeps the contrast it had. A
solid colour would have forced re-checking every text of the application in ten hues.

One measured exception: the secondary grey fell to **2.82:1** on the tinted background (worst case across the ten
palette colours, light theme, bottom of the gradient). `.stage.sport` therefore redefines `--muted` as
`--muted-strong`, which raises the worst case to 5.0:1 and covers in one go everything written on the stage - the
state under the buttons, the round counter, the routine title.

The clock and the step name are enlarged through `:host-context(.sport)`: the class lives on the page, outside the
component, and an ordinary descendant selector would not match under Angular's encapsulation.

## Theme and styles

| File                     | Content                                                             |
| ------------------------ | ------------------------------------------------------------------- |
| `src/styles.css`         | Theme imports, Tailwind, global utilities                           |
| `src/theme/tokens.css`   | Light theme colour tokens, set on `<app-root>`                      |
| `src/theme/dark.css`     | Token overrides under `app-root.dark`                               |
| `src/theme/controls.css` | Shared primitives: relief button, slider, segmented control, switch |

Colours are **never** hard-coded in a component: all go through CSS variables inherited from `<app-root>`, which makes
the theme switch instant and guarantees consistent contrast (ENF-MNT-2).

## Milestones

`core/helpers/milestones.ts` calculates, from the duration of a session, the list of milestones - minutes remaining and
the chime borrowed.

Fixed milestones at 45 / 30 / 15 only warn long sessions: a 25-minute Pomodoro would receive only the 15-minute one,
and a 10-minute routine step none. Above `LONG_SESSION_MINUTES`, the three known milestones are therefore kept as they
are; below it, they are derived from the duration: **the half, the last quarter, then one minute before the end**.

| Duration | Milestones (minutes remaining) |
| -------- | ------------------------------ |
| 60 min   | 45, 30, 15                     |
| 25 min   | 13, 6, 1                       |
| 10 min   | 5, 3, 1                        |
| 2 min    | 1                              |
| 1 min    | none                           |
| 20 s     | none                           |

A training step lasting a few seconds therefore receives no milestone: the first would fall after the chime. This is
intended - a "3, 2, 1" countdown every second is a different signal, which remains to be written.

The timbre (sound, vibration pattern, notification channel) comes from the **rank** and never from the number of
minutes: the last milestone always carries the most insistence. A milestone rounded to the same number of minutes as
another is merged, and none falls on the total duration itself.

`SessionService` exposes the list as a `computed`, calculated on the announced duration of the session - a finger
adjustment made along the way therefore does not move the milestones already passed - and empty during the "+5 min"
extension, which is a grace period and not a session to mark out.

## Sounds

`core/helpers/sound-patterns.ts` defines the four patterns (`milestone45`, `milestone30`, `milestone15`, `end`) as notes -
frequency, offset, duration, gain, waveform - with an optional high partial for the bell effect.

This single file serves **two consumers**:

1. the application, which synthesises the patterns on the fly with Web Audio;
2. `scripts/generate-sounds.ts`, run by Node (`make sounds`), which renders the same patterns as 22,050 Hz WAV files
   for the native notifications.

This is why it imports nothing: it must remain runnable outside the bundle. The application's sounds and the
notification sounds are thus identical by construction.

### Level-up

The gains written into the patterns are relative: they set the balance between the notes of one pattern, not its
volume. The volume comes from `level(pattern)`, which **measures the peak of the rendered signal** and brings it to
`PEAK_TARGET` (0.89, i.e. −1 dBFS). Measuring rather than calculating is necessary: the notes overlap and add up, so a
hand-set gain leaves the pattern either clipped or far too quiet. The factor is applied on both sides - master gain in
Web Audio, sample scale in the WAV - and it is memoised, since the calculation costs a full render.

Two intended consequences:

- **all patterns come out at the same peak**, whereas they used to spread over 17 dB (the end chime drowned out the
  milestones, and the 15-minute milestone was the most discreet of the four - the opposite of its role);
- **an alert sound must come out loud**, because the device only ever reduces what it is given. A file rendered at half
  scale arrives irremediably quiet, notably on Android where the notification volume is a separate setting.

The envelope decays towards a level **relative** to the peak of the note (−48 dB after `dur`). An absolute floor would
drop all the faster the lower the note started: a soft note was only a click, and what does not ring cannot be heard.

No limiter closes the Web Audio chain. The level-up is measured on a render where the oscillators start in phase, which
Web Audio does not guarantee: the real peak there rises to −0.5 dB instead of −1, which the margin in `PEAK_TARGET`
absorbs. A `DynamicsCompressorNode`, measured in passing, cost 3.9 dB on the transient - too brief to escape its attack -
for no protection at all.

## Internationalisation

- One dictionary per language in `core/i18n/locales/`: `fr`, `en`, `es`, `de`, `it`, `pt`, `ar`.
- The keys are **typed from French** (`type I18nKey = keyof typeof fr`): a key missing in another language is a compile-time
  error (ENF-MNT-1).
- The texts of the accessibility page live separately, in `features/accessibility/accessibility.i18n.ts`.
- `I18nService` detects the language from `navigator.languages`, falls back to French, and updates
  `document.documentElement.lang` as well as the writing direction (`dir`).
- **Adding a language** = a file in `locales/`, then an entry in `Lang`, `DICTIONARIES`, `LANGUAGES` - and in `RTL_LANGS` if it is
  written right to left.
- The CSS uses logical properties (`inset-inline-*`, `start` / `end`): switching to RTL needs no mirrored rule.

## Technical accessibility

| Requirement                           | Implementation                                                       |
| ------------------------------------- | -------------------------------------------------------------------- |
| Dial usable by keyboard and announced | Focusable container carrying `role="slider"`                         |
| Real-time announcements               | Live region fed by `SessionService.announcement`                     |
| Remaining time without sight          | Optional voice announcement (`SpeechService`)                        |
| Alert without sight or hearing        | A vibration pattern specific to each milestone (`HapticsService`)    |
| Alert without sound                   | Coloured pulse at 0.6 Hz and a persistent end banner                 |
| Settings panel                        | Trapped focus, closed with Escape, focus returned to the trigger     |
| Tabs                                  | `tablist` / `tab` / `tabpanel` roles, arrow-key navigation           |
| Contrast                              | Theme tokens checked to 4.5:1 minimum, in light and dark             |
| Colour alone                          | Each mode colour is accompanied by its name                          |
| Animations                            | `prefers-reduced-motion` respected                                   |
| Dyslexia                              | OpenDyslexic font can be enabled, with wider letter and line spacing |
| Sequence of actions without reading   | A pictogram before each step's name                                  |
| Structure                             | Semantic HTML, `main`, hierarchical headings, page metadata          |

### Details

**Dial** - `aria-valuemin=1`, `aria-valuemax=60`, `aria-valuenow`, `aria-valuetext` ("*n* minutes, *action*") and `aria-label`.
The SVG itself is `aria-hidden`: it says nothing a screen reader could use.

**Voice announcement** - at the milestones or every minute, in the language of the interface.

**Vibration** - the patterns are distinguished by the number of pulses and their rhythm, not by their duration (see `ENF-A11-13`).

**Alert without sound** - `aria-hidden` and `pointer-events: none`, frozen under `prefers-reduced-motion`: it duplicates information
already given elsewhere.

**Tabs** - the arrow keys are named for screen readers.

**Routine steps** - the strip is an `<ol>` of buttons, the current step marked `aria-current="step"`. The state (done, current) is
restated in the accessible name and doubled by a tick, never carried by colour alone.

The known gaps are published in the application's accessibility statement (see "Accessibility" in the non-functional requirements of the [PRD](02_PRD.md)).

## SVG icon system

### Overview

A complete SVG icon system replaces emojis for better accessibility and style control.

### Services and Components

#### IconsService (`src/app/core/services/icons.service.ts`)

Service that manages all the available SVG icons.

**Main methods:**

```typescript
// Get an SVG icon by name
getSVG(name: IconName): SafeHtml

// Convert an emoji to an IconName
getIconFromEmoji(emoji: string): IconName

// Resolve a routine or step icon: accepts an emoji (older data) or an IconName (current editor)
resolveIcon(value: string): IconName
```

Routine and step icons are stored as icon names (for example `bed`), so the templates use
`resolveIcon`. `getIconFromEmoji` only maps emoji and falls back to `info` for anything else.

**Available types:**

```typescript
type IconName =
  // Routine icons
  | 'sunrise' | 'shirt' | 'breakfast' | 'toothbrush'
  | 'running' | 'meditation' | 'gym' | 'bed' | 'shower'
  | 'backpack' | 'jacket' | 'bus' | 'medicine' | 'cleaning'
  | 'laundry' | 'shopping' | 'dog' | 'book' | 'pencil'
  | 'calculator' | 'art' | 'music' | 'tools' | 'computer'
  | 'email' | 'phone' | 'files' | 'moon'
  // Accessibility icons
  | 'blind' | 'keyboard' | 'search' | 'hearing' | 'vibration'
  | 'brain' | 'font' | 'image'
  // UI icons
  | 'play' | 'pause' | 'reset' | 'lock' | 'unlock' | 'edit'
  | 'delete' | 'add' | 'close' | 'settings' | 'theme-light'
  | 'theme-dark' | 'language' | 'help'
  // General
  | 'check' | 'warning' | 'error' | 'info' | 'menu' | 'back';
```

#### IconComponent (`src/app/shared/components/icon/icon.component.ts`)

Standalone component that displays an SVG icon.

**Usage:**

```html
<!-- By icon name -->
<app-icon name="sunrise" aria-hidden="true"></app-icon>

<!-- Convert from emoji -->
<app-icon
  [name]="iconsService.getIconFromEmoji('🌅')"
  aria-hidden="true">
</app-icon>
```

**Props:**

- `name: IconName` - The icon name (required)
- `ariaHidden: boolean | 'true' | 'false'` - Hide from screen readers (default: 'true')

### Icon source (Lucide)

The icons in `IconsService` come from **[Lucide](https://lucide.dev)** (ISC license). They are
bundled with the app: no network call is needed, and the app works offline and under
Electron.

The file `src/app/core/helpers/lucide-icons.ts` is **generated**. To change an icon:

1. Edit the `internal name → Lucide icon` mapping in `scripts/generate-lucide-icons.mjs`.
2. Regenerate: `make ui-icons` (or `node scripts/generate-lucide-icons.mjs`).

The script fails if a Lucide name does not exist in `lucide-static`. The `Record<IconName, string>`
type also requires an icon for every name in the `IconName` type.

SVGs written directly in HTML templates do not go through this service and are not affected by
this generation.

### Emoji → Icon mapping

**Routine icons:**
- 🌅 → `sunrise`
- 👕 → `shirt`
- 🥣 → `breakfast`
- 🪥 → `toothbrush`
- 🏃 → `running`
- 🧘 → `meditation`
- 💪 → `gym`

**Accessibility icons:**
- 🦯 → `blind`
- ⌨️ → `keyboard`
- 🔍 → `search`
- 🦻 → `hearing`
- 📳 → `vibration`
- 🧠 → `brain`
- 🔤 → `font`
- 🖼️ → `image`

### Usage in components

#### Example: displaying a routine icon

**Before (with emoji):**

```html
<span class="step-emoji" aria-hidden="true">{{ step.icon }}</span>
```

**After (with SVG):**

```typescript
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { IconsService } from '@app/core/services';

@Component({
  // ...
  imports: [IconComponent]
})
export class MyComponent {
  constructor(public iconsService: IconsService) {}
}
```

```html
<app-icon
  [name]="iconsService.getIconFromEmoji(step.icon)"
  aria-hidden="true"
  class="step-icon">
</app-icon>
```

### Adding a new icon

1. Add the type to `IconName` (icons.service.ts).
2. Add the SVG definition in `registerIcons()`:

```typescript
this.icons.set('my-icon', {
  svg: '<path d="M..."/>' // SVG path/element
  viewBox: '0 0 24 24' // Optional, default is '0 0 24 24'
});
```

3. Optional: add it to the emoji mapping if applicable:

```typescript
export const EMOJI_TO_ICON_MAP: Record<string, IconName> = {
  '🎉': 'my-icon',
  // ...
};
```

### Styling

Icons automatically inherit the text colour:

```css
/* The colour will be red */
.my-icon-red {
  color: red;
}
```

Or with custom CSS:

```css
app-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}
```

### Accessibility

- Icons use `aria-hidden="true"` by default (they are purely decorative).
- For important icons, use `aria-hidden="false"` and add a label.
- Titles and labels must describe the icon, not just say "icon".

### Performance

- SVGs are inlined and rendered in the DOM.
- No HTTP request for each icon.
- Icons scale without loss of quality.
- Icons inherit CSS properties (colour, size, etc.).

### Compatibility

- Works in all modern browsers.
- Compatible with dark mode and themes.
- Accessible to screen readers.
- No external dependencies (Material Icons, Font Awesome, etc.).
