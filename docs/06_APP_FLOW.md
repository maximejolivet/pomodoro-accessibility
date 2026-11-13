# Parcours de l'appli

## Points d'entrée

- **Web** : `/` (le minuteur) et `/accessibility` (la page d'accessibilité), chargées à la demande.
- **Application iOS et Android** : l'icône de l'app ouvre le minuteur ; une notification de rappel de routine ouvre l'app ; le widget Android ouvre l'app sans rien démarrer.
- **Première ouverture** : le tutoriel de bienvenue s'affiche avant le minuteur.

## Liste des écrans

| Écran         | Route            | Contenu                                                                             |
| ------------- | ---------------- | ----------------------------------------------------------------------------------- |
| Minuteur      | `/`              | Cadran, affichage du temps, bande de routine, commandes, panneau (Modes / Réglages) |
| Accessibilité | `/accessibility` | Déclaration d'accessibilité RGAA, repères sur la neurodiversité, standards visés    |

## Parcours principaux

### Premier lancement

Le tutoriel s'ouvre en plein écran sur la première de ses cinq vues, le reste de la page
devenant inerte. Le
focus est sur *Suivant* et y reste d'une vue à l'autre : on traverse le tutoriel en répétant la
même touche, pendant qu'une annonce dit « Étape 2 sur 5 : Régler la durée ». *Passer* ou Échap
l'abrègent. La dernière vue dit *C'est parti* ; le focus revient alors sur ▶, qui est le geste
suivant. Au lancement d'après, le minuteur est là tout de suite.

### Session simple

1. Ouverture : le mode mémorisé est sélectionné, sa durée s'affiche sur le cadran.
2. Réglage facultatif au doigt, aux boutons − / + ou au clavier.
3. Appui sur le cadran ou sur ▶ : le décompte démarre, l'écran reste allumé si l'option est active.
4. Paliers - 45 / 30 / 15 min restantes au-delà de 40 min, sinon la moitié, le dernier quart et
   1 min : un son, et une notification si l'application est en arrière-plan.
5. À 0 : carillon, motif de vibration de fin ; prolongation de 5 min si l'option est active, sinon fin.
6. La session est enregistrée si elle a duré au moins 60 s .

### Enchaînement automatique

À la fin d'une session de travail, la pause correspondante démarre ; à la fin de la pause, une
session de travail reprend. Toutes les 4 sessions de travail terminées, la pause longue remplace
la pause courte. L'utilisateur peut interrompre la chaîne à tout moment.

### Déroulé d'une routine

Une routine répétée sert aussi d'entraînement : deux étapes - « Effort 20 s », « Repos 10 s » -
et huit tours font un Tabata, livré avec l'application. Sur une étape aussi courte, le cadran
gradue des secondes, les trois dernières sont égrenées et la suivante est annoncée avant la fin.
L'échauffement, lui, se fait en routine à part : les tours rejouent la routine entière.
Marquée *entraînement*, la routine fait en plus passer la page en mode sport : la couleur de
l'étape teinte tout l'écran - rouge à l'effort, vert au repos - et le chrono s'agrandit.

⚙︎ → Modes → *Routines* → « Routine du matin » : le panneau se ferme, la première étape
(« S'habiller », 10 min) est armée sur le cadran, et la bande montre les quatre étapes. Appui
sur ▶ : le décompte part. À 0, le carillon sonne, « Place à : Petit-déjeuner » est annoncé et
l'étape suivante démarre seule. Une étape déjà faite se retrouve d'un appui sur sa vignette.
À la fin de la dernière, toutes les vignettes sont cochées et « Routine terminée » est dit.

### Rappel d'une routine

⚙︎ → Modes → *Routines* → crayon → *Rappel* : l'interrupteur allumé propose 8 h 00 et la
semaine entière ; l'heure se règle, les jours se décochent. Enregistrer. À 7 h 30 le lundi,
une notification « C'est l'heure : 🌅 Routine du matin - 4 étapes · 33 min » arrive, même
application fermée. L'appui ouvre l'application avec la routine armée sur le cadran : il reste
à appuyer sur ▶.

### Création d'un mode

⚙︎ → Modes → « nouveau » : saisir un nom, régler la durée, choisir une couleur (nom affiché),
choisir la nature. Enregistrer. Le mode rejoint la liste et devient sélectionnable.

## Tutoriel d'accueil

`features/timer/tutorial/` : cinq vues plein écran montrées une fois, à la première ouverture,
pilotées par la préférence `tutorial-seen`. La page du minuteur les affiche tant qu'elle est fausse ; une
fois vues, elles ne se montrent plus.

Les contraintes qui ont dessiné le composant :

- **Aucune avance automatique** (WCAG 2.2.2) : rien ne bouge sans un geste. Un carrousel qui
  défile seul dépossède de son rythme qui lit lentement.
- **Trois entrées équivalentes** : glissement horizontal, boutons (Précédent / Suivant, points),
  flèches du clavier. Le glissement n'est jamais le seul moyen (WCAG 2.5.1).
- **Le focus part sur *Suivant* et y reste** d'une vue à l'autre : on traverse le tutoriel en
  répétant la même touche. Une région `aria-live` dit « Étape 2 sur 5 : Régler la durée » -
  le rang et le titre seulement, le texte se lisant sur place.
- **Les quatre vues hors écran sont `inert` et `aria-hidden`** : elles restent dans le document
  pour le glissement, mais ni la tabulation ni le lecteur d'écran n'y entrent.
- **Le reste de la page est `inert`** tant que le tutoriel est là, comme pour le panneau de
  réglages : sans cela la tabulation sortirait d'une modale qui se déclare `aria-modal`.
- **Les points font 44 px de cible** pour un point de 10 px visible (WCAG 2.5.8).
- **Plein écran plutôt qu'une carte** : au premier lancement, rien derrière ne mérite d'être
  regardé, et la surface entière laisse la place à un pictogramme assez grand pour porter
  l'idée sans le texte. La colonne de lecture reste à 420 px, centrée, sur un grand écran.
  Les tailles suivent la hauteur (`clamp(…vh…)`) et la vue défile au lieu d'être rognée quand
  le téléphone est couché (`align-items: safe center`).
- `prefers-reduced-motion` supprime le glissement : les vues se remplacent.
- En arabe, `flex` inverse déjà l'ordre des vues ; le décalage est inversé par
  `:host-context([dir='rtl'])` - et non `[dir='rtl'] .track`, que l'encapsulation Angular
  empêcherait de correspondre, l'attribut vivant sur `<html>`.

## Page d'accessibilité

| Réf.     | Exigence                                                                  | Prio |
| -------- | ------------------------------------------------------------------------- | ---- |
| EF-A11-1 | Un lien « ♿ Accessibilité » est accessible depuis le minuteur.            | M    |
| EF-A11-2 | La page publie la déclaration dans le plan du décret n° 2019-768.         | M    |
| EF-A11-3 | La page est traduite dans les sept langues.                               | M    |
| EF-A11-4 | Une session continue, se termine et s'enregistre pendant la consultation. | M    |
| EF-A11-5 | La page dit que la déclaration est volontaire.                            | M    |
| EF-A11-6 | Aucun taux de conformité n'est annoncé sans audit mené par un tiers.      | M    |
| EF-A11-7 | L'établissement de la déclaration nomme ce sur quoi elle s'appuie.        | M    |

### Précisions

**EF-A11-2** - les sept rubriques, dans l'ordre du décret : engagement, état de conformité,
résultats des tests, contenus non accessibles (non-conformités, dérogations pour charge
disproportionnée, contenus non soumis), établissement de la déclaration, contact, voies de
recours.

**EF-A11-5** - l'application n'entre pas dans le champ de l'article 47 : laisser croire à une
obligation serait faux.

**EF-A11-6** - un pourcentage auto-attribué tromperait sur ce qui a été vérifié.

**EF-A11-7** - la date, les technologies, l'environnement de test, les outils et les pages
évaluées ; et le fait qu'aucune technologie d'assistance n'a été utilisée.

## Règles de navigation

- **Tab** passe d'un élément à l'autre ; le focus est toujours visible.
- **← / →** changent d'onglet dans le panneau (Modes, Réglages) ; **Page Haut / Page Bas** ajustent le cadran de cinq minutes.
- **Échap** ferme le panneau et le tutoriel ; le focus revient sur le bouton Réglages après le panneau, et sur le bouton principal après le tutoriel.
- Une session continue, se termine et s'enregistre pendant que la page d'accessibilité est lue.

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# App flow

## Entry points

- **Web**: `/` (the timer) and `/accessibility` (the accessibility page), loaded on demand.
- **iOS and Android app**: the app icon opens the timer; a routine reminder notification opens the app; the Android widget opens the app without starting anything.
- **First launch**: the welcome tutorial shows before the timer.

## Screen list

| Screen        | Route            | Content                                                                   |
| ------------- | ---------------- | ------------------------------------------------------------------------- |
| Timer         | `/`              | Dial, time display, routine strip, controls, panel (Modes / Settings)     |
| Accessibility | `/accessibility` | RGAA accessibility statement, notes on neurodiversity, targeted standards |

## Main flows

### First launch

The tutorial opens full screen on its first of five views, the rest of the page becoming inert. Focus
is on *Next* and stays there from one view to the next: you go through the tutorial by repeating the same
key, while an announcement says "Step 2 of 5: Set the duration". *Skip* or Escape shortens it. The last
view says *Let's go*; focus then returns to ▶, which is the next gesture. At the next launch, the timer is
there straight away.

### Simple session

1. Opening: the remembered mode is selected, its duration is shown on the dial.
2. Optional adjustment with a finger, the − / + buttons or the keyboard.
3. Tap the dial or ▶: the countdown starts, the screen stays on if the option is active.
4. Milestones - 45 / 30 / 15 min remaining above 40 min, otherwise the half, the last quarter and 1 min:
   a sound, and a notification if the application is in the background.
5. At 0: chime, end vibration pattern; 5-min extension if the option is active, otherwise the end.
6. The session is recorded if it lasted at least 60 s.

### Automatic chaining

At the end of a work session, the matching break starts; at the end of the break, a work session resumes.
After every 4 completed work sessions, the long break replaces the short one. The user can interrupt the
chain at any time.

### Running a routine

A repeated routine also serves as training: two steps - "Effort 20 s", "Rest 10 s" - and eight rounds make a
Tabata, shipped with the application. On a step this short, the dial graduates in seconds, the last three are
counted down and the next step is announced before the end. The warm-up, for its part, is done as a separate
routine: the rounds replay the whole routine. Marked *training*, the routine also switches the page to sport
mode: the colour of the step tints the whole screen - red during effort, green during rest - and the clock is
enlarged.

⚙︎ → Modes → *Routines* → "Morning routine": the panel closes, the first step ("Get dressed", 10 min) is armed
on the dial, and the strip shows the four steps. Tap ▶: the countdown starts. At 0, the chime sounds, "Next up:
Breakfast" is announced and the next step starts on its own. A step already done is revisited with one tap on its
tile. At the end of the last one, all tiles are ticked and "Routine finished" is announced.

### Routine reminder

⚙︎ → Modes → *Routines* → pencil → *Reminder*: the switch on offers 8:00 am and the whole week; the time is set,
the days are unticked. Save. At 7:30 on Monday, a notification "Time for: 🌅 Morning routine - 4 steps · 33 min"
arrives, even with the application closed. Tapping opens the application with the routine armed on the dial: you
still need to press ▶.

### Creating a mode

⚙︎ → Modes → "new": enter a name, set the duration, choose a colour (name displayed), choose the nature. Save.
The mode joins the list and can be selected.

## Welcome tutorial

`features/timer/tutorial/`: five full-screen views shown once, on first opening, driven by the `tutorial-seen`
preference. The timer page displays them while it is false; once seen, they are not shown again.

The constraints that shaped the component:

- **No automatic advance** (WCAG 2.2.2): nothing moves without a gesture. A carousel that scrolls by itself takes
  away the pace of someone reading slowly.
- **Three equivalent inputs**: horizontal swipe, buttons (Previous / Next, dots), keyboard arrows. Swiping is never
  the only means (WCAG 2.5.1).
- **Focus starts on *Next* and stays there** from one view to the next: you go through the tutorial by repeating the
  same key. A `aria-live` region says "Step 2 of 5: Set the duration" - the rank and title only, the text being read
  in place.
- **The four off-screen views are `inert` and `aria-hidden`**: they stay in the document for the swipe, but neither
  the tab key nor the screen reader enters them.
- **The rest of the page is `inert`** while the tutorial is shown, as for the settings panel: otherwise tabbing would
  leave a modal that declares itself `aria-modal`.
- **The dots are 44 px targets** for a visible dot of 10 px (WCAG 2.5.8).
- **Full screen rather than a card**: on first launch, nothing behind is worth looking at, and the whole surface leaves
  room for a pictogram large enough to carry the idea without the text. The reading column stays at 420 px, centred, on
  a large screen. Sizes follow the height (`clamp(…vh…)`), and the view scrolls instead of being cropped when the phone
  is lying down (`align-items: safe center`).
- `prefers-reduced-motion` removes the swipe: the views simply replace one another.
- In Arabic, `flex` already reverses the order of the views; the offset is reversed by `:host-context([dir='rtl'])` -
  not `[dir='rtl'] .track`, which Angular's encapsulation would prevent from matching, since the attribute lives on
  `<html>`.

## Accessibility page

| Ref.     | Requirement                                                                    | Prio |
| -------- | ------------------------------------------------------------------------------ | ---- |
| EF-A11-1 | An "♿ Accessibility" link is reachable from the timer.                         | M    |
| EF-A11-2 | The page publishes the statement following the plan of decree no. 2019-768.    | M    |
| EF-A11-3 | The page is translated into the seven languages.                               | M    |
| EF-A11-4 | A session continues, ends and is recorded while the page is being read.        | M    |
| EF-A11-5 | The page states that the statement is voluntary.                               | M    |
| EF-A11-6 | No compliance rate is announced without an audit carried out by a third party. | M    |
| EF-A11-7 | The statement names what it is based on.                                       | M    |

### Details

**EF-A11-2** - the seven sections, in the order of the decree: commitment, state of compliance, test
results, content not accessible (non-compliances, exemptions for disproportionate burden, content not
subject to the rules), preparation of the statement, contact, redress procedures.

**EF-A11-5** - the application does not fall within the scope of article 47: implying an obligation would
be false.

**EF-A11-6** - a self-assigned percentage would mislead about what has actually been verified.

**EF-A11-7** - the date, the technologies, the test environment, the tools and the pages evaluated; and the
fact that no assistive technology was used.

## Navigation rules

- **Tab** moves between elements; focus is always visible.
- **← / →** switch tabs in the panel (Modes, Settings); **Page Up / Page Down** adjust the dial by five minutes.
- **Esc** closes the panel and the tutorial; focus returns to the Settings button after the panel, and to the main button after the tutorial.
- A session continues, ends and is recorded while the accessibility page is being read.
