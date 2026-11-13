# Brief projet

## Projet

**Pomodoro Accessibilité** : un minuteur visuel pour l'autisme, le TDAH, les troubles DYS et les autres profils neurodivergents. On voit le temps qui reste au lieu de le lire.

Application web (Angular) empaquetée pour iOS et Android avec Capacitor. Dépôt : `maximejolivet/pomodoro-accessibility`.

## Problème

Une horloge donne l'heure, un minuteur numérique affiche des chiffres : ni l'un ni l'autre ne
**montre** la durée restante. Pour beaucoup de personnes neurodivergentes (TDAH, autisme,
troubles DYS), le temps ne se « sent » pas - dix minutes et une heure peuvent paraître
identiques, et lire l'heure n'aide pas à savoir combien il reste.

## Utilisateurs

**TDAH** - estimer une durée, démarrer, s'arrêter à temps.
→ Repère visuel continu, sessions courtes, mode *Focus TDAH*.

**Autisme** - transitions, imprévu, bruit.
→ Paliers annoncés à l'avance, routines en pictogrammes, sons désactivables.

**Troubles DYS** - lire des chiffres ou une heure, fatigue à la lecture.
→ Temps lisible sans chiffres, police OpenDyslexic, texte espacé.

**Autres profils** - besoin de consignes claires, de moins de pression.
→ Durées libres 1–60 min, modes personnalisés, aucune note.

**Personnes qui ne lisent pas** (jeunes enfants, déficience intellectuelle) - suivre une suite
d'actions sans texte.
→ Routines en pictogrammes, une étape après l'autre, sans rien à lire.

**Accompagnants** (parents, enseignants, managers) - rappeler le temps sans intervenir.
→ Durée visible par tous, autonomie de la personne.

### Contextes d'usage

Devoirs et routines à la maison · classe · séances de travail en Pomodoro · réunions et
entretiens (durée visible pour tous) · open space et télétravail (vibration et notifications
discrètes) · aménagement de poste non stigmatisant, puisque l'outil sert à tout le monde.

## Objectif et critères de succès

Fournir un **minuteur visuel** dans lequel un disque coloré couvre la durée choisie et rétrécit
à mesure que le temps passe, afin de remplacer un calcul par une image, et d'y adjoindre les
mécanismes de la méthode Pomodoro (sessions, pauses, enchaînement, statistiques) sans jamais
introduire de pression ni de jugement.

| Réf.  | Objectif                                          | Indicateur                                                                   |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| OBJ-1 | Comprendre le temps restant sans lire de chiffres | Le cadran seul suffit à situer la durée                                      |
| OBJ-2 | Être utilisable par tout le monde                 | RGAA 4.1 / WCAG 2.1 AA, 0 violation axe-core sur les parcours testés         |
| OBJ-3 | Fonctionner sans compte ni réseau                 | Aucune requête sortante, aucune donnée quittant l'appareil                   |
| OBJ-4 | Rester juste en arrière-plan                      | Écart de décompte nul après retour au premier plan                           |
| OBJ-5 | Servir hors du domaine scolaire                   | Usage en contexte professionnel documenté et supporté (open space, réunions) |
| OBJ-6 | Suivre une suite d'actions sans savoir lire       | Chaque étape d'une routine est portée par un pictogramme avant son nom       |

### Principes directeurs

1. **Sans pression** : pas de score punitif, pas de sanction ; pas d'autre objectif.
2. **Contrôle à l'utilisateur** : sons, vibration, écran allumé, enchaînement - tout se coupe.
3. **Affichage calme** : pas de clignotement, animations réduites si l'appareil le demande.
4. **Fin en douceur** : à 0, une prolongation de 5 min évite l'arrêt brutal.
5. **Accessibilité par défaut**, jamais en option ajoutée après coup.

## Périmètre

### Plateformes

| Plateforme               | Support          | Spécificités                                              |
| ------------------------ | ---------------- | --------------------------------------------------------- |
| Web (navigateur moderne) | Cible principale | Sons Web Audio, Wake Lock si disponible                   |
| iOS                      | Via Capacitor    | Notifications locales, haptique                           |
| Android                  | Via Capacitor    | Notifications locales avec canaux sonores, haptique       |

### Écrans

| Écran         | Route            | Contenu                                                                             |
| ------------- | ---------------- | ----------------------------------------------------------------------------------- |
| Minuteur      | `/`              | Cadran, affichage du temps, bande de routine, commandes, panneau (Modes / Réglages) |
| Accessibilité | `/accessibility` | Déclaration d'accessibilité RGAA, repères sur la neurodiversité, standards visés    |

**Retirés après essai** : le verrou du cadran, le mode table, l'onglet de statistiques, l'écran de démarrage animé, le widget iOS et la Live Activity. Chacun a été supprimé volontairement (voir « Décisions prises » dans le PRD).

## Contraintes

- **Aucun serveur** : pas de compte, pas d'API, pas de synchronisation. Tout est local.
- **Aucune collecte** : ni analytique, ni télémétrie, ni identifiant.
- **Hors ligne total** : l'application fonctionne sans réseau après chargement.

- Écran mobile en premier (le rendu est conçu sur une largeur de type téléphone).
- Usage possible clavier seul, lecteur d'écran, ou tactile.
- Session pouvant durer 60 min avec l'application en arrière-plan ou l'appareil verrouillé.

## Risques

| Limite                                            | Raison                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Historique plafonné à 500 sessions                | Taille de `localStorage` ; au-delà, l'intérêt statistique est marginal                 |
| Pas d'export de données par l'utilisateur         | Non spécifié à ce jour                                                                 |
| Ni widget ni décompte permanent sur iOS           | Retirés ; seul Android les a                                                           |
| Contrat `WidgetState` dupliqué TypeScript / Java  | Pas de génération de code ; toute évolution se fait des deux côtés                     |
| Pas de tests avec lecteur d'écran réel            | Vérification automatique et revue de code seulement ; écart publié dans la déclaration |
| Tests d'accessibilité sur Chromium seul           | Un seul moteur en CI                                                                   |

## Questions ouvertes

1. Le cadran sur un vrai téléphone et une vraie tablette : le boîtier a été élargi et sa hauteur est plafonnée par l'écran.
2. Écrans courts (360 × 640 et moins) : le bouton d'accessibilité chevauche encore le bas du boîtier.
3. Aucun test unitaire : `ng test` n'a rien à exécuter, la logique du temps n'est couverte que par la suite Playwright.
4. `@axe-core/playwright` 4.14 : des noms accessibles sont à corriger avant de lever l'épinglage à 4.13.

Décidé : pas de compte, pas de serveur, pas de collecte ; le widget iOS, la Live Activity, le mode table et le verrou du cadran sont abandonnés.

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Project brief

## Project

**Pomodoro Accessibilité**: a visual timer for autism, ADHD, DYS disorders and other neurodivergent minds. You see the time that's left instead of reading it.

A web application (Angular) packaged for iOS and Android with Capacitor. Repository: `maximejolivet/pomodoro-accessibility`.

## Problem

A clock gives the time, a digital timer shows digits: neither one **shows** the remaining time. For
many neurodivergent people (ADHD, autism, dys- disorders), time is not "felt": ten minutes and an
hour can seem identical, and reading the time does not help work out how much is left.

## Users

**ADHD** - estimating a duration, starting, stopping on time.
→ Continuous visual cue, short sessions, *ADHD Focus* mode.

**Autism** - transitions, the unexpected, noise.
→ Milestones announced in advance, routines in pictograms, sounds that can be switched off.

**Dys- disorders** - reading digits or a time, fatigue when reading.
→ Time readable without digits, OpenDyslexic font, spaced text.

**Other profiles** - need clear instructions and less pressure.
→ Free durations of 1–60 min, custom modes, no scores.

**People who do not read** (young children, intellectual disability) - following a sequence of
actions without text.
→ Routines in pictograms, one step after another, nothing to read.

**Carers** (parents, teachers, managers) - remind someone of the time without intervening.
→ Duration visible to everyone, the person's autonomy preserved.

### Usage contexts

Homework and home routines · classroom · Pomodoro work sessions · meetings and interviews (duration
visible to everyone) · open-plan office and remote work (discreet vibration and notifications) ·
workplace adjustments that do not stigmatise, since the tool serves everyone.

## Goal and success criteria

Provide a **visual timer** in which a coloured disc covers the chosen duration and shrinks as time
passes, so that a calculation is replaced by an image. Add to it the mechanisms of the Pomodoro method
(sessions, breaks, chaining, statistics) without ever introducing pressure or judgement.

| Ref.  | Goal                                                    | Indicator                                                                            |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| OBJ-1 | Understand the remaining time without reading numbers   | The dial alone is enough to place the duration                                       |
| OBJ-2 | Be usable by everyone                                   | RGAA 4.1 / WCAG 2.1 AA, 0 axe-core violations on the tested journeys                 |
| OBJ-3 | Work without an account or network                      | No outgoing request, no data leaving the device                                      |
| OBJ-4 | Stay accurate in the background                         | Zero drift in the countdown after returning to the foreground                        |
| OBJ-5 | Serve beyond the school setting                         | Use in a professional context documented and supported (open-plan offices, meetings) |
| OBJ-6 | Follow a sequence of actions without being able to read | Each step of a routine is carried by a pictogram before its name                     |

### Guiding principles

1. **No pressure**: no punitive score, no penalty; no other goal.
2. **User control**: sounds, vibration, screen on, chaining - everything can be switched off.
3. **Calm display**: no flashing; animations are reduced when the device asks for it.
4. **Gentle ending**: at 0, a 5-minute extension avoids an abrupt stop.
5. **Accessibility by default**, never an option added after the fact.

## Scope

### Platforms

| Platform             | Support       | Specifics                                        |
| -------------------- | ------------- | ------------------------------------------------ |
| Web (modern browser) | Main target   | Web Audio sounds, Wake Lock where available      |
| iOS                  | Via Capacitor | Local notifications, haptics                     |
| Android              | Via Capacitor | Local notifications with sound channels, haptics |

### Screens

| Screen        | Route            | Content                                                                   |
| ------------- | ---------------- | ------------------------------------------------------------------------- |
| Timer         | `/`              | Dial, time display, routine strip, controls, panel (Modes / Settings)     |
| Accessibility | `/accessibility` | RGAA accessibility statement, notes on neurodiversity, targeted standards |

**Removed after trying them**: the dial lock, table mode, the statistics tab, the animated boot screen, the iOS widget and the Live Activity. Each one was removed on purpose (see "Decisions made" in the PRD).

## Constraints

- **No server**: no account, no API, no synchronisation. Everything is local.
- **No collection**: no analytics, no telemetry, no identifier.
- **Fully offline**: the application works without network once loaded.

- Mobile screen first (the layout is designed for a phone-sized width).
- May be used keyboard only, with a screen reader, or by touch.
- A session may last 60 min with the application in the background or the device locked.

## Risks

| Limit                                                   | Reason                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| History capped at 500 sessions                          | Size of `localStorage`; beyond that, the statistical value is marginal       |
| No data export by the user                              | Not specified to date                                                        |
| No widget or persistent countdown on iOS                | Removed; only Android has them                                               |
| `WidgetState` contract duplicated in TypeScript / Java  | No code generation; any change is made on both sides                         |
| No tests with a real screen reader                      | Automatic checks and code review only; the gap is published in the statement |
| Accessibility tests on Chromium only                    | A single engine in CI                                                        |

## Open questions

1. The dial on a real phone and a real tablet: the case was widened and its height is capped by the screen.
2. Short screens (360 × 640 and below): the accessibility button still overlaps the bottom of the case.
3. No unit tests: `ng test` has nothing to run, the timing logic is covered only by the Playwright suite.
4. `@axe-core/playwright` 4.14: accessible names need fixing before the pin to 4.13 can be lifted.

Decided: no account, no server, no collection; the iOS widget, the Live Activity, table mode and the dial lock are dropped.
