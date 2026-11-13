# Epics et user stories

Les identifiants de stories ont la forme `E<epic>-S<story>`. Ils s'utilisent dans les commits et les pull requests, par exemple `feat(timer): E1-S5 boutons − / +`. La colonne « Exigences » renvoie aux identifiants `EF-…` et `ENF-…` du [PRD](02_PRD.md) ; la colonne « Étape » renvoie au [plan d'implémentation](09_IMPLEMENTATION_PLAN.md).

**Priorités** : P0 = indispensable (M dans le PRD), P1 = souhaitable (S), P2 = confort (C).

Toutes les stories ci-dessous sont **livrées**, sauf celles de l'epic E12, retiré.

## E1 : Cadran et décompte (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E1-S1 | En tant qu'utilisateur, je veux voir un disque coloré qui rétrécit jusqu'à zéro, afin de comprendre le temps restant sans lire de chiffres. | EF-TIM-1, 2, 6, 7 | 1 | P0 |
| E1-S2 | En tant qu'utilisateur, je veux régler la durée du doigt, y compris pendant le décompte, afin d'ajuster sans passer par un menu. | EF-TIM-3 | 1 | P0 |
| E1-S3 | En tant qu'utilisateur, je veux démarrer, mettre en pause, reprendre et remettre à zéro, afin de garder la main sur ma session. | EF-TIM-4, 5 | 1 | P0 |
| E1-S4 | En tant qu'utilisateur, je veux régler la durée au clavier, afin d'utiliser le minuteur sans souris ni écran tactile. | EF-TIM-8 | 1 | P0 |
| E1-S5 | En tant qu'utilisateur, je veux des boutons − / + d'une minute, afin de régler sans glisser (main qui tremble, un seul doigt, commande à contacteur). | EF-TIM-11 | 2 | P0 |
| E1-S6 | En tant qu'utilisateur, je veux que le décompte reste exact en arrière-plan ou écran verrouillé, afin de ne pas perdre le fil. | EF-TIM-9 | 1 | P0 |
| E1-S7 | En tant qu'utilisateur, je veux sentir une vibration quand je règle le cadran et à la fin, afin de percevoir le temps sans regarder. | EF-TIM-10 | 1 | P1 |

**Critères d'acceptation** (issus du PRD) :

- **E1-S3** : étant donné un décompte en cours, quand je touche le cadran ou ▶, alors il se met en pause ; quand je le touche de nouveau, alors il reprend.
- **E1-S6** : étant donné un décompte en cours, quand l'application passe en arrière-plan puis revient, alors le temps restant correspond à l'heure de fin, sans dérive.
- **E1-S1** : étant donné un décompte, quand le temps passe, alors le disque rétrécit jusqu'à 0 et le temps restant s'écrit aussi en clair (mm:ss).

## E2 : Modes (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E2-S1 | En tant qu'utilisateur, je veux quatre modes prêts à l'emploi (Pomodoro, Pause, Pause longue, Focus TDAH), et retrouver mon dernier choix, afin de démarrer sans réglage. | EF-MOD-1, 6 | 1 | P0 |
| E2-S2 | En tant qu'utilisateur, je veux créer, modifier et supprimer mes propres modes (nom, durée, couleur, nature), afin d'adapter le minuteur à mon usage. | EF-MOD-2, 3, 4 | 1 | P0 |
| E2-S3 | En tant qu'utilisateur, je veux restaurer les modes livrés depuis les réglages, afin de repartir d'un état connu. | EF-MOD-5 | 1 | P1 |
| E2-S4 | En tant qu'utilisateur, je veux que chaque couleur soit accompagnée de son nom, afin que l'information ne repose jamais sur la couleur seule. | EF-MOD-7 | 1 | P0 |

## E3 : Routines (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E3-S1 | En tant qu'utilisateur, je veux créer une routine, suite d'étapes avec un pictogramme, un nom, une durée et une couleur, afin de suivre une séquence d'actions. | EF-ROU-1, 2, 4, 16 | 3 | P0 |
| E3-S2 | En tant qu'utilisateur, je veux charger une routine sans rien démarrer, et la quitter d'un bouton, afin de me préparer avant de commencer. | EF-ROU-5, 10 | 3 | P0 |
| E3-S3 | En tant qu'utilisateur, je veux voir la bande des étapes et aller directement à l'une d'elles, afin de savoir où j'en suis. | EF-ROU-6, 7 | 3 | P0 |
| E3-S4 | En tant qu'utilisateur, je veux que les étapes s'enchaînent seules, la suivante étant annoncée, afin de n'avoir rien à lire ni à relancer. | EF-ROU-8, 9 | 3 | P0 |
| E3-S5 | En tant qu'utilisateur, je veux qu'une routine me le rappelle à une heure et à des jours choisis, afin de ne pas avoir à y penser. | EF-ROU-12, 13, 14, 15 | 3 | P1 |
| E3-S6 | En tant qu'utilisateur, je veux répéter une routine de 1 à 20 tours, le tour en cours étant annoncé, afin de suivre un entraînement. | EF-ROU-17, 18 | 3 | P1 |
| E3-S7 | En tant qu'utilisateur, je veux des étapes de quelques secondes, avec les trois dernières comptées et la suivante annoncée, afin d'enchaîner des exercices courts. | EF-ROU-20, 21, 22 | 3 | P1 |
| E3-S8 | En tant qu'utilisateur, je veux des routines d'exemple, dont un Tabata, afin de comprendre le principe sans rien créer. | EF-ROU-3, 19 | 3 | P1 |
| E3-S9 | En tant qu'utilisateur, je veux qu'une routine d'entraînement teinte toute la page de la couleur de l'étape, avec une horloge agrandie, afin de la lire de loin. | EF-ROU-23, 24, 25 | 3 | P1 |

**Critères d'acceptation** (issus du PRD) :

- **E3-S4** : étant donné une routine en cours, quand une étape se termine, alors la suivante démarre et son nom est annoncé ; à la dernière étape, la routine est terminée et toutes les étapes sont cochées.
- **E3-S2** : étant donné une routine choisie, alors sa première étape est armée mais rien ne démarre.

## E4 : Tutoriel d'accueil (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E4-S1 | En tant qu'utilisateur, je veux voir cinq écrans de présentation au premier lancement, afin de comprendre l'application. | EF-TUT-1, 2 | 3 | P1 |
| E4-S2 | En tant qu'utilisateur, je veux avancer à mon rythme (glisser, boutons, clavier), le passer ou le fermer, afin de garder la maîtrise. | EF-TUT-3, 4, 5 | 3 | P0 |

## E5 : Enchaînement et prolongation (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E5-S1 | En tant qu'utilisateur, je veux qu'une session de travail se prolonge de cinq minutes à zéro, une seule fois, afin d'éviter un arrêt brutal. | EF-CHA-1, 2 | 1 | P0 |
| E5-S2 | En tant qu'utilisateur, je veux enchaîner travail, pause et travail sans rien faire, avec une pause longue toutes les quatre sessions, afin de suivre la méthode Pomodoro. | EF-CHA-3, 4 | 1 | P1 |
| E5-S3 | En tant qu'utilisateur, je veux désactiver séparément la prolongation et l'enchaînement, afin de garder le contrôle. | EF-CHA-5 | 1 | P0 |

**Critères d'acceptation** (issus du PRD) :

- **E5-S1** : étant donné une session de travail et l'option « +5 min » active, quand elle atteint 0, alors elle se prolonge de cinq minutes, et une seule fois.

## E6 : Alertes (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E6-S1 | En tant qu'utilisateur, je veux trois paliers sonores de plus en plus insistants avant la fin, puis une sonnerie à zéro, tous au même niveau et coupables en un geste, afin d'être prévenu sans surprise. | EF-ALE-1, 2, 4, 20 | 1 | P0 |
| E6-S2 | En tant qu'utilisateur, je veux que les notifications locales prennent le relais sur mobile, avec les mêmes sons, afin d'être prévenu application fermée. | EF-ALE-5, 6, 7, 8 | 1 | P0 |
| E6-S3 | En tant qu'utilisateur, je veux un motif de vibration distinct pour chaque palier et pour la fin, afin de les reconnaître sans son. | EF-ALE-9, 10 | 2 | P1 |
| E6-S4 | En tant qu'utilisateur, je veux un signal visuel (aucun, doux ou fort) qui ne bat pas plus vite que 0,6 Hz, et un bandeau de fin qui reste, afin de voir l'alerte sans être agressé. | EF-ALE-11, 12, 13 | 2 | P1 |
| E6-S5 | En tant qu'utilisateur, je veux que le temps restant soit dit à voix haute, aux paliers ou chaque minute, afin de le suivre sans regarder l'écran. | EF-PRE-10, ENF-A11-12 | 2 | P1 |
| E6-S6 | En tant qu'utilisateur, je veux tester une notification et atteindre l'écran des alarmes exactes, afin de vérifier que les alertes arriveront. | EF-ALE-14, 15, 16 | 4 | P1 |
| E6-S7 | En tant qu'utilisateur, je veux un décompte permanent et silencieux hors de l'application (Android), afin de voir le temps restant sans déverrouiller. | EF-ALE-17, 18, 19 | 4 | P1 |

**Critères d'acceptation** (issus du PRD) :

- **E6-S2** : étant donné un palier franchi depuis plus de 90 secondes pendant que l'application était en arrière-plan, quand elle revient, alors ce palier n'est pas rejoué.
- **E6-S4** : étant donné l'alerte visuelle active, alors elle bat à 0,6 Hz au plus et se fige si l'appareil demande moins d'animation.

## E7 : Préférences (P0)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E7-S1 | En tant qu'utilisateur, je veux choisir le thème clair ou sombre et la police OpenDyslexic, afin d'adapter la lecture. | EF-PRE-1, 2 | 1 | P0 |
| E7-S2 | En tant qu'utilisateur, je veux régler les sons, la vibration, l'alerte visuelle, la voix, la prolongation, l'enchaînement et l'écran allumé, afin de n'avoir que les alertes que je supporte. | EF-PRE-3, 4, 5, 6, 10, 11, 12 | 2 | P0 |
| E7-S3 | En tant qu'utilisateur, je veux que mes préférences soient retenues d'une ouverture à l'autre, afin de ne rien régler deux fois. | EF-PRE-9 | 1 | P0 |

## E8 : Langues (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E8-S1 | En tant qu'utilisateur, je veux l'application en français, anglais, espagnol, allemand, italien, portugais et arabe (de droite à gauche), afin de l'utiliser dans ma langue. | EF-I18-1, 2 | 1 | P0 |
| E8-S2 | En tant qu'utilisateur, je veux que la langue soit détectée au premier lancement et qu'un changement agisse tout de suite, afin de ne pas recharger. | EF-I18-3, 4, EF-PRE-8 | 1 | P0 |
| E8-S3 | En tant qu'utilisateur, je veux que les notifications et le widget parlent la langue de l'application, afin de rester cohérent. | EF-I18-5 | 4 | P1 |

## E9 : Intégration native (P0, P1, P2)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E9-S1 | En tant qu'utilisateur, je veux que l'écran reste allumé pendant le décompte, si je l'ai choisi, afin de voir le cadran sans y toucher. | EF-NAT-1 | 4 | P1 |
| E9-S2 | En tant qu'utilisateur, je veux un widget Android qui montre le cadran sur l'écran d'accueil, décompte seul et suit le thème, afin de voir le temps sans ouvrir l'app. | EF-NAT-2, 3, 4, 5, 6 | 4 | P2 |
| E9-S3 | En tant qu'utilisateur, je veux que l'application s'ouvre sur un fond beige avec son logo et sa version, le logo cessant de pulser si l'appareil demande moins d'animation, afin d'éviter une page blanche au lancement. | EF-NAT-7, 8 | 7 | P0 |

## E10 : Accessibilité (P0)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E10-S1 | En tant qu'utilisateur, je veux une page d'accessibilité qui publie la déclaration dans l'ordre du décret, dans les sept langues, accessible depuis le minuteur, afin de savoir ce qui est conforme. | EF-A11-1 à 7 | 1 | P0 |
| E10-S2 | En tant qu'utilisateur, je veux tout faire au clavier, avec le focus piégé dans le panneau et un curseur lisible par les lecteurs d'écran, afin de me passer de la souris. | ENF-A11-2, 3, 9 | 1 | P0 |
| E10-S3 | En tant qu'utilisateur, je veux que le temps restant et les changements d'état soient annoncés dans une région vivante, afin de les suivre avec un lecteur d'écran. | ENF-A11-4 | 1 | P0 |
| E10-S4 | En tant qu'utilisateur, je veux des contrastes d'au moins 4,5:1 en clair comme en sombre, et jamais la couleur seule, afin de lire sans effort. | ENF-A11-5, 6 | 1 | P0 |
| E10-S5 | En tant qu'utilisateur, je veux que la préférence « réduire les animations » soit respectée et qu'aucun clignotement rapide ne se produise, afin de ne pas être incommodé. | ENF-A11-7, 8 | 2 | P0 |
| E10-S6 | En tant qu'utilisateur, je veux reconnaître chaque étape d'une routine sans savoir lire, grâce à son pictogramme, afin de suivre une séquence seul. | ENF-A11-15, EF-ROU-2 | 3 | P0 |
| E10-S7 | En tant que contributeur, je veux que les tests axe-core passent à chaque push, afin qu'une régression d'accessibilité ne soit jamais livrée. | ENF-A11-10, ENF-MNT-3 | 1 | P0 |

## E11 : Confidentialité, performance et maintenabilité (P0, P1)

| ID | Story | Exigences | Étape | Priorité |
| --- | --- | --- | --- | --- |
| E11-S1 | En tant qu'utilisateur, je veux que mes données restent sur l'appareil, sans compte, sans serveur ni statistiques, afin que personne d'autre ne les voie. | ENF-SEC-1, 2, 3 | 1 | P0 |
| E11-S2 | En tant que chercheur en sécurité, je veux signaler une vulnérabilité en privé, afin qu'elle soit corrigée avant d'être publique. | ENF-SEC-4 | 1 | P1 |
| E11-S3 | En tant qu'utilisateur, je veux que les pages se chargent à la demande, dans un budget de poids, et qu'un service indisponible ne bloque jamais l'application, afin qu'elle reste rapide et fiable. | ENF-PER-1 à 5 | 1 | P1 |
| E11-S4 | En tant que contributeur, je veux ajouter une langue avec un seul dictionnaire, garder les couleurs centralisées et suivre un format de commit, afin que le projet reste simple à faire évoluer. | ENF-MNT-1, 2, 4 | 1 | P1 |

## E12 : Retiré

Fonctions livrées puis supprimées. Elles restent listées pour qu'on ne les remette pas par accident.

| ID | Fonction | Livrée | Retirée |
| --- | --- | --- | --- |
| E12-S1 | Verrouiller le cadran contre les touchers accidentels | 25 sept. 2026 | 12 nov. 2026 |
| E12-S2 | Mode table : le cadran en grand pour un téléphone posé sur un bureau | 29 sept. 2026 | 13 nov. 2026 |
| E12-S3 | Widget iOS et Live Activity | 29 sept. 2026 | 13 nov. 2026 |
| E12-S4 | Écran de démarrage animé (le cadran qui tourne) | 29 sept. 2026 | 2 oct. 2026 |
| E12-S5 | Onglet de statistiques dans les réglages | - | oct. 2026 |

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Epics and user stories

Story identifiers have the form `E<epic>-S<story>`. They are used in commits and pull requests, for example `feat(timer): E1-S5 − / + buttons`. The "Requirements" column points to the `EF-…` and `ENF-…` identifiers of the [PRD](02_PRD.md); the "Step" column points to the [implementation plan](09_IMPLEMENTATION_PLAN.md).

**Priorities**: P0 = must (M in the PRD), P1 = should (S), P2 = could (C).

Every story below is **delivered**, except those of epic E12, which was removed.

## E1 : Dial and countdown (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E1-S1 | As a user, I want to see a coloured disc that shrinks to zero, so that I understand the remaining time without reading digits. | EF-TIM-1, 2, 6, 7 | 1 | P0 |
| E1-S2 | As a user, I want to set the duration by dragging, even during the countdown, so that I can adjust without going through a menu. | EF-TIM-3 | 1 | P0 |
| E1-S3 | As a user, I want to start, pause, resume and reset, so that I stay in control of my session. | EF-TIM-4, 5 | 1 | P0 |
| E1-S4 | As a user, I want to set the duration with the keyboard, so that I can use the timer without a mouse or a touch screen. | EF-TIM-8 | 1 | P0 |
| E1-S5 | As a user, I want − / + buttons worth one minute, so that I can set the time without dragging (shaky hands, a single finger, a switch device). | EF-TIM-11 | 2 | P0 |
| E1-S6 | As a user, I want the countdown to stay accurate in the background or on a locked screen, so that I do not lose track. | EF-TIM-9 | 1 | P0 |
| E1-S7 | As a user, I want to feel a vibration when I adjust the dial and at the end, so that I can sense the time without looking. | EF-TIM-10 | 1 | P1 |

**Acceptance criteria** (from the PRD):

- **E1-S3**: given a countdown in progress, when I tap the dial or ▶, then it pauses; when I tap it again, then it resumes.
- **E1-S6**: given a countdown in progress, when the application goes to the background and comes back, then the remaining time matches the end time, with no drift.
- **E1-S1**: given a countdown, when time passes, then the disc shrinks to 0 and the remaining time is also written in plain text (mm:ss).

## E2 : Modes (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E2-S1 | As a user, I want four ready-made modes (Pomodoro, Break, Long break, ADHD Focus), and to find my last choice again, so that I can start without setting anything. | EF-MOD-1, 6 | 1 | P0 |
| E2-S2 | As a user, I want to create, edit and delete my own modes (name, duration, colour, nature), so that the timer fits my use. | EF-MOD-2, 3, 4 | 1 | P0 |
| E2-S3 | As a user, I want to restore the shipped modes from the settings, so that I can start again from a known state. | EF-MOD-5 | 1 | P1 |
| E2-S4 | As a user, I want every colour to come with its name, so that information never rests on colour alone. | EF-MOD-7 | 1 | P0 |

## E3 : Routines (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E3-S1 | As a user, I want to create a routine, a sequence of steps each with a pictogram, a name, a duration and a colour, so that I can follow a sequence of actions. | EF-ROU-1, 2, 4, 16 | 3 | P0 |
| E3-S2 | As a user, I want to load a routine without starting anything, and to leave it with one button, so that I can get ready before beginning. | EF-ROU-5, 10 | 3 | P0 |
| E3-S3 | As a user, I want to see the strip of steps and jump straight to one of them, so that I know where I am. | EF-ROU-6, 7 | 3 | P0 |
| E3-S4 | As a user, I want the steps to chain on their own, with the next one announced, so that I have nothing to read or restart. | EF-ROU-8, 9 | 3 | P0 |
| E3-S5 | As a user, I want a routine to remind me at a chosen time and on chosen days, so that I do not have to remember it. | EF-ROU-12, 13, 14, 15 | 3 | P1 |
| E3-S6 | As a user, I want to repeat a routine from 1 to 20 rounds, with the current round announced, so that I can follow a workout. | EF-ROU-17, 18 | 3 | P1 |
| E3-S7 | As a user, I want steps of a few seconds, with the last three counted and the next one announced, so that I can chain short exercises. | EF-ROU-20, 21, 22 | 3 | P1 |
| E3-S8 | As a user, I want example routines, including a Tabata, so that I understand the idea without creating anything. | EF-ROU-3, 19 | 3 | P1 |
| E3-S9 | As a user, I want a training routine to tint the whole page with the colour of the step, with an enlarged clock, so that I can read it from afar. | EF-ROU-23, 24, 25 | 3 | P1 |

**Acceptance criteria** (from the PRD):

- **E3-S4**: given a routine in progress, when a step ends, then the next one starts and its name is announced; at the last step, the routine is finished and every step is ticked.
- **E3-S2**: given a chosen routine, then its first step is armed but nothing starts.

## E4 : Welcome tutorial (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E4-S1 | As a user, I want to see five introduction screens on first launch, so that I understand the application. | EF-TUT-1, 2 | 3 | P1 |
| E4-S2 | As a user, I want to move on at my own pace (swipe, buttons, keyboard), skip it or close it, so that I stay in control. | EF-TUT-3, 4, 5 | 3 | P0 |

## E5 : Chaining and extension (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E5-S1 | As a user, I want a work session to extend by five minutes at zero, only once, so that it does not stop abruptly. | EF-CHA-1, 2 | 1 | P0 |
| E5-S2 | As a user, I want to chain work, break and work without doing anything, with a long break every four sessions, so that I follow the Pomodoro method. | EF-CHA-3, 4 | 1 | P1 |
| E5-S3 | As a user, I want to switch the extension and the chaining off separately, so that I stay in control. | EF-CHA-5 | 1 | P0 |

**Acceptance criteria** (from the PRD):

- **E5-S1**: given a work session and the "+5 min" option on, when it reaches 0, then it extends by five minutes, and only once.

## E6 : Alerts (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E6-S1 | As a user, I want three increasingly insistent sound milestones before the end, then a chime at zero, all at the same level and switchable off in one gesture, so that I am warned without surprise. | EF-ALE-1, 2, 4, 20 | 1 | P0 |
| E6-S2 | As a user, I want local notifications to take over on mobile, with the same sounds, so that I am warned when the app is closed. | EF-ALE-5, 6, 7, 8 | 1 | P0 |
| E6-S3 | As a user, I want a distinct vibration pattern for each milestone and for the end, so that I can recognise them without sound. | EF-ALE-9, 10 | 2 | P1 |
| E6-S4 | As a user, I want a visual signal (none, soft or strong) that beats no faster than 0.6 Hz, and an end banner that stays, so that I can see the alert without being startled. | EF-ALE-11, 12, 13 | 2 | P1 |
| E6-S5 | As a user, I want the remaining time to be spoken aloud, at the milestones or every minute, so that I can follow it without looking at the screen. | EF-PRE-10, ENF-A11-12 | 2 | P1 |
| E6-S6 | As a user, I want to test a notification and reach the exact alarms screen, so that I can check the alerts will arrive. | EF-ALE-14, 15, 16 | 4 | P1 |
| E6-S7 | As a user, I want a persistent, silent countdown outside the application (Android), so that I can see the remaining time without unlocking. | EF-ALE-17, 18, 19 | 4 | P1 |

**Acceptance criteria** (from the PRD):

- **E6-S2**: given a milestone passed more than 90 seconds ago while the application was in the background, when it comes back, then that milestone is not replayed.
- **E6-S4**: given the visual alert on, then it beats at 0.6 Hz at most and freezes if the device asks for less animation.

## E7 : Preferences (P0)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E7-S1 | As a user, I want to choose the light or dark theme and the OpenDyslexic font, so that I can adapt the reading. | EF-PRE-1, 2 | 1 | P0 |
| E7-S2 | As a user, I want to set sounds, vibration, the visual alert, voice, the extension, chaining and screen-on, so that I only get the alerts I can bear. | EF-PRE-3, 4, 5, 6, 10, 11, 12 | 2 | P0 |
| E7-S3 | As a user, I want my preferences to be kept from one opening to the next, so that I never set anything twice. | EF-PRE-9 | 1 | P0 |

## E8 : Languages (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E8-S1 | As a user, I want the application in French, English, Spanish, German, Italian, Portuguese and Arabic (right to left), so that I can use it in my language. | EF-I18-1, 2 | 1 | P0 |
| E8-S2 | As a user, I want the language to be detected on first launch and a change to apply at once, so that I do not have to reload. | EF-I18-3, 4, EF-PRE-8 | 1 | P0 |
| E8-S3 | As a user, I want notifications and the widget to speak the application's language, so that everything stays consistent. | EF-I18-5 | 4 | P1 |

## E9 : Native integration (P0, P1, P2)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E9-S1 | As a user, I want the screen to stay on during the countdown, if I chose so, so that I can see the dial without touching it. | EF-NAT-1 | 4 | P1 |
| E9-S2 | As a user, I want an Android widget that shows the dial on the home screen, counts down on its own and follows the theme, so that I can see the time without opening the app. | EF-NAT-2, 3, 4, 5, 6 | 4 | P2 |
| E9-S3 | As a user, I want the application to open on a beige background with its logo and version, the logo ceasing to pulse if the device asks for less animation, so that no white page shows at launch. | EF-NAT-7, 8 | 7 | P0 |

## E10 : Accessibility (P0)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E10-S1 | As a user, I want an accessibility page that publishes the statement in the decree's order, in the seven languages, reachable from the timer, so that I know what is compliant. | EF-A11-1 à 7 | 1 | P0 |
| E10-S2 | As a user, I want to do everything with the keyboard, with focus trapped in the panel and a slider readable by screen readers, so that I can do without a mouse. | ENF-A11-2, 3, 9 | 1 | P0 |
| E10-S3 | As a user, I want the remaining time and state changes to be announced in a live region, so that I can follow them with a screen reader. | ENF-A11-4 | 1 | P0 |
| E10-S4 | As a user, I want contrast of at least 4.5:1 in light and dark, and never colour alone, so that I can read without effort. | ENF-A11-5, 6 | 1 | P0 |
| E10-S5 | As a user, I want the "reduce motion" preference to be respected and no rapid flashing to occur, so that I am not bothered. | ENF-A11-7, 8 | 2 | P0 |
| E10-S6 | As a user, I want to recognise each step of a routine without being able to read, thanks to its pictogram, so that I can follow a sequence on my own. | ENF-A11-15, EF-ROU-2 | 3 | P0 |
| E10-S7 | As a contributor, I want the axe-core tests to run on every push, so that an accessibility regression is never shipped. | ENF-A11-10, ENF-MNT-3 | 1 | P0 |

## E11 : Privacy, performance and maintainability (P0, P1)

| ID | Story | Requirements | Step | Priority |
| --- | --- | --- | --- | --- |
| E11-S1 | As a user, I want my data to stay on the device, with no account, no server and no analytics, so that nobody else sees it. | ENF-SEC-1, 2, 3 | 1 | P0 |
| E11-S2 | As a security researcher, I want to report a vulnerability privately, so that it is fixed before it is public. | ENF-SEC-4 | 1 | P1 |
| E11-S3 | As a user, I want pages to load on demand, within a size budget, and an unavailable service never to block the application, so that it stays fast and reliable. | ENF-PER-1 à 5 | 1 | P1 |
| E11-S4 | As a contributor, I want to add a language with a single dictionary, keep colours centralised and follow a commit format, so that the project stays easy to evolve. | ENF-MNT-1, 2, 4 | 1 | P1 |

## E12 : Removed

Features shipped and then removed. They stay listed so they are not brought back by accident.

| ID | Feature | Shipped | Removed |
| --- | --- | --- | --- |
| E12-S1 | Lock the dial against accidental touches | 25 Sep 2026 | 12 Nov 2026 |
| E12-S2 | Table mode: the dial writ large for a phone stood on a desk | 29 Sep 2026 | 13 Nov 2026 |
| E12-S3 | iOS widget and Live Activity | 29 Sep 2026 | 13 Nov 2026 |
| E12-S4 | Animated boot screen (the turning dial) | 29 Sep 2026 | 2 Oct 2026 |
| E12-S5 | Statistics tab in the settings | - | Oct 2026 |
