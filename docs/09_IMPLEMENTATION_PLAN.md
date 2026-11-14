# Plan d'implémentation

L'application a été construite par étapes courtes entre le 24 septembre et le 13 novembre 2026 (voir `git log`). Ce document raconte l'ordre réel de construction, puis liste ce qui reste. La colonne « Étape » des [epics](08_EPICS.md) renvoie à ces étapes.

## Ordre de livraison

Un seul lot publié : l'application est livrée en continu depuis `main`, sans versions anciennes maintenues. Les étapes 1 à 7 ci-dessous sont terminées.

## Étape 1 : Application de base et accessibilité

- **Période** : 24 septembre 2026
- **Epics** : E1, E2, E5, E6, E7, E8, E10, E11
- Cadran, décompte, modes, prolongation et enchaînement, notifications locales, préférences et sept langues.
- Navigation au clavier, rôle de curseur, tableau lisible par les lecteurs d'écran, confirmations dans une région vivante, police OpenDyslexic.
- Page d'accessibilité (d'abord une fenêtre, puis une route dédiée) et lien RGAA 4.1.

**Point de contrôle** : le build de production passe et la page d'accessibilité se lit au clavier.

## Étape 2 : Structure du code et alertes

- **Période** : 25 septembre 2026
- **Epics** : E1-S5, E6-S3, E6-S4, E6-S5, E7-S2, E10-S5
- Code rangé en `core/` et `features/` ; page du minuteur découpée en composants.
- Boutons − / +, alerte visuelle, temps dit à voix haute, motif de vibration par palier.
- Déclaration d'accessibilité publiée sur la page, section neurodiversité, page traduite en sept langues.
- Verrou du cadran (retiré depuis, voir E12).

**Point de contrôle** : le build de production passe et les tests d'accessibilité ne signalent aucune violation.

## Étape 3 : Routines, tutoriel et secondes

- **Période** : 26 et 27 septembre 2026
- **Epics** : E3, E4, E10-S6
- Routines en pictogrammes dont les étapes s'enchaînent seules, paliers proportionnels à la durée, rappel à heure fixe.
- Tutoriel de cinq vues au premier lancement.
- Étapes de quelques secondes, tours répétés, compte des trois dernières secondes, mode sport.

**Point de contrôle** : une routine d'exemple se joue de bout en bout à l'horloge simulée (tests Playwright).

## Étape 4 : Intégration native

- **Période** : 29 septembre 2026
- **Epics** : E6-S6, E6-S7, E8-S3, E9-S1, E9-S2
- État du cadran transmis aux widgets et à l'écran verrouillé ; widget Android et décompte permanent.
- Test de notification et réparation des canaux muets ; déclaration publiée dans l'ordre du décret.
- Icônes et écrans de lancement générés pour les deux plateformes.
- Mode table, widget iOS et Live Activity (retirés depuis, voir E12).

**Point de contrôle** : la notification de test est programmée et le widget se met à jour (à vérifier sur un appareil Android).

## Étape 5 : Simplification et icônes

- **Période** : 2 au 4 octobre 2026
- **Epics** : E12
- Retrait de l'écran de démarrage animé et de l'onglet de statistiques.
- Remplacement des icônes dessinées à la main par un jeu d'icônes SVG intégré ; icônes du tutoriel.
- Boîte de confirmation pour la restauration des modes.

**Point de contrôle** : les icônes s'affichent hors ligne et les tests d'accessibilité passent.

## Étape 6 : Nouveau cadran

- **Période** : 20 au 23 octobre 2026
- **Epics** : aucune nouvelle story (refonte visuelle)
- Cadran apaisé : face plate hors blanc, boîtier rond, couleurs au nouveau thème.
- Minuteur, routines et traductions alignés sur le nouveau cadran.
- Focus rendu après le panneau et le tutoriel ; icônes nommées.

**Point de contrôle** : le cadran reste lisible en clair et en sombre (contrastes vérifiés par axe-core).

## Étape 7 : Finitions iOS et retraits

- **Période** : 12 et 13 novembre 2026
- **Epics** : E9-S3, E12
- Boîtier du cadran élargi sur téléphone, cadran rond sur WebKit, feuille de réglages qui défile jusqu'au bord, en-tête de la page d'accessibilité sous la barre d'état.
- Écran de démarrage beige avec logo et version, au lieu d'une page blanche.
- Retrait du verrou du cadran, du mode table, du widget iOS et de la Live Activity.
- Documentation refaite en onze documents numérotés.

**Point de contrôle** : l'app se lance sans page blanche sur iPhone, et la PR passe le build et les tests d'accessibilité.

## Étape suivante

Ce qui reste ouvert, par ordre de priorité approximatif. Rien ici n'est une promesse ni une date : c'est la liste des bouts connus, pour qu'ils ne soient pas oubliés. La liste vivante est dans [`ROADMAP.md`](../ROADMAP.md).

- **À vérifier à la main** : `cap open ios` et `cap open android` ; le cadran sur un vrai téléphone et une vraie tablette ; la pastille du nom de mode dans tous les thèmes.
- **Dépendances** : `@axe-core/playwright` 4.14 (noms accessibles à corriger avant de lever l'épinglage à 4.13) ; les avis `minimatch` venus d'`electron-builder` ; les mises à jour majeures (Electron, TypeScript, Gradle, Node), une à la fois.
- **Tests** : aucun test unitaire ; commencer par le service de session, où vivent les règles de temps.
- **Cadran et mise en page** : un cadran plus grand sur téléphone ; écrans courts (360 × 640 et moins) où le bouton d'accessibilité chevauche le boîtier ; paysage et bureau, où la hauteur de la fenêtre limite le cadran.
- **Documentation** : numéros manquants dans les exigences après le retrait du verrou (EF-ROU-11, EF-PRE-13, ENF-A11-14) : les renuméroter ou les garder exprès.
- **Entretien** : décider comment `main` est refondu dans `develop` après une livraison.

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Implementation plan

The application was built in short steps between 24 September and 13 November 2026 (see `git log`). This document tells the real order of construction, then lists what is left. The "Step" column of the [epics](08_EPICS.md) points to these steps.

## Delivery order

A single published stream: the application ships continuously from `main`, with no older versions maintained. Steps 1 to 7 below are done.

## Step 1 : Base application and accessibility

- **Period** : 24 September 2026
- **Epics** : E1, E2, E5, E6, E7, E8, E10, E11
- Base application, countdown, modes, extension and chaining, local notifications, preferences and seven languages.
- Keyboard navigation, slider role, a table readable by screen readers, confirmations in a live region, OpenDyslexic font.
- Accessibility page (first a dialog, then a dedicated route) and RGAA 4.1 link.

**Checkpoint** : the production build passes and the accessibility page can be read with the keyboard.

## Step 2 : Code structure and alerts

- **Period** : 25 September 2026
- **Epics** : E1-S5, E6-S3, E6-S4, E6-S5, E7-S2, E10-S5
- Code organised into `core/` and `features/`; timer page split into components.
- − / + buttons, visual alert, time spoken aloud, a vibration pattern per milestone.
- Accessibility statement published on the page, neurodiversity section, page translated into seven languages.
- Dial lock (since removed, see E12).

**Checkpoint** : the production build passes and the accessibility tests report no violation.

## Step 3 : Routines, tutorial and seconds

- **Period** : 26 and 27 September 2026
- **Epics** : E3, E4, E10-S6
- Picture routines whose steps chain on their own, milestones scaled to the length of the session, reminder at a set time.
- Five-view tutorial on first launch.
- Steps of a few seconds, repeated rounds, count of the last three seconds, sport mode.

**Checkpoint** : a sample routine plays from start to finish on the simulated clock (Playwright tests).

## Step 4 : Native integration

- **Period** : 29 September 2026
- **Epics** : E6-S6, E6-S7, E8-S3, E9-S1, E9-S2
- Dial state carried to widgets and the lock screen; Android widget and persistent countdown.
- Notification test and repair of muted channels; statement published in the decree's own order.
- Icons and launch screens generated for both platforms.
- Table mode, iOS widget and Live Activity (since removed, see E12).

**Checkpoint** : the test notification is scheduled and the widget updates (to be checked on an Android device).

## Step 5 : Simplification and icons

- **Period** : 2 to 4 October 2026
- **Epics** : E12
- Removal of the animated boot screen and of the statistics tab.
- Hand-drawn icons replaced by a bundled SVG icon set; tutorial icons.
- Confirmation dialog for restoring the modes.

**Checkpoint** : the icons display offline and the accessibility tests pass.

## Step 6 : New dial

- **Period** : 20 to 23 October 2026
- **Epics** : no new story (visual rework)
- Calmer dial: flat off-white face, round case, colours moved to the new theme.
- Timer, routines and translations aligned with the new dial.
- Focus restored after the panel and the tutorial; icons named.

**Checkpoint** : the dial stays readable in light and dark (contrast checked by axe-core).

## Step 7 : iOS polish and removals

- **Period** : 12 and 13 November 2026
- **Epics** : E9-S3, E12
- Dial case widened on phones, round dial on WebKit, settings sheet that scrolls to the edge, accessibility page header below the status bar.
- Beige boot screen with logo and version, instead of a white page.
- Removal of the dial lock, table mode, the iOS widget and the Live Activity.
- Documentation redone as eleven numbered documents.

**Checkpoint** : the app launches without a white page on iPhone, and the PR passes the build and the accessibility tests.

## Next step

What is still open, in rough priority order. Nothing here is a promise or a date: it is the list of known loose ends, so they are not forgotten. The live list is in [`ROADMAP.md`](../ROADMAP.md).

- **To verify by hand**: `cap open ios` and `cap open android`; the dial on a real phone and a real tablet; the mode name chip in every theme.
- **Dependencies**: `@axe-core/playwright` 4.14 (accessible names to fix before lifting the pin to 4.13); the `minimatch` advisories coming from `electron-builder`; major upgrades (Electron, TypeScript, Gradle, Node), one at a time.
- **Tests**: no unit tests; start with the session service, where the timing rules live.
- **Dial and layout**: a larger dial on phones; short screens (360 × 640 and below) where the accessibility button overlaps the case; landscape and desktop, where the window height limits the dial.
- **Documentation**: gaps in the requirement numbering after the lock was removed (EF-ROU-11, EF-PRE-13, ENF-A11-14): renumber them or keep them on purpose.
- **Housekeeping**: decide how `main` is merged back into `develop` after a release.
