# Document d'exigences produit (PRD)

## Produit

**Pomodoro Accessibilité** est un minuteur visuel : un disque coloré recouvre la durée choisie et rétrécit à mesure que le temps passe, de sorte qu'une image remplace le calcul. Il reprend les mécanismes de la méthode Pomodoro (sessions, pauses, enchaînement, statistiques) sans jamais introduire de pression ni de jugement.

## Utilisateurs cibles

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

### Contexte technique d'usage

- Écran mobile en premier (le rendu est conçu sur une largeur de type téléphone).
- Usage possible clavier seul, lecteur d'écran, ou tactile.
- Session pouvant durer 60 min avec l'application en arrière-plan ou l'appareil verrouillé.

## Problème et solution

Une horloge donne l'heure, un minuteur numérique affiche des chiffres : ni l'un ni l'autre ne
**montre** la durée restante. Pour beaucoup de personnes neurodivergentes (TDAH, autisme,
troubles DYS), le temps ne se « sent » pas - dix minutes et une heure peuvent paraître
identiques, et lire l'heure n'aide pas à savoir combien il reste.

Fournir un **minuteur visuel** dans lequel un disque coloré couvre la durée choisie et rétrécit
à mesure que le temps passe, afin de remplacer un calcul par une image, et d'y adjoindre les
mécanismes de la méthode Pomodoro (sessions, pauses, enchaînement, statistiques) sans jamais
introduire de pression ni de jugement.

## Objectifs et indicateurs de réussite

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

## Versions

- **Version publiée** : 1.0 (`MARKETING_VERSION` côté iOS, `1.0.0` dans `package.json`).

- **Maintenance** : seule la dernière version de `main` reçoit des correctifs ; il n'y a pas de versions anciennes publiées.

- **Livraison** : le travail se fait sur `develop` ; une pull request `develop` → `main` livre un lot de changements.

## Plateformes et écrans

### Plateformes

| Plateforme               | Support          | Spécificités                                              |
| ------------------------ | ---------------- | --------------------------------------------------------- |
| Web (navigateur moderne) | Cible principale | Sons Web Audio, Wake Lock si disponible                   |
| iOS                      | Via Capacitor    | Notifications locales, haptique                           |
| Android                  | Via Capacitor    | Notifications locales avec canaux sonores, haptique       |
| macOS, Windows           | Via Electron     | Application de bureau, notifications du système, installeurs non signés |

### Écrans

| Écran         | Route            | Contenu                                                                             |
| ------------- | ---------------- | ----------------------------------------------------------------------------------- |
| Minuteur      | `/`              | Cadran, affichage du temps, bande de routine, commandes, panneau (Modes / Réglages) |
| Accessibilité | `/accessibility` | Déclaration d'accessibilité RGAA, repères sur la neurodiversité, standards visés    |

## Fonctionnalités principales

Les exigences ont un identifiant `EF-<domaine>-<n>`. La priorité suit MoSCoW : **M** (indispensable), **S** (souhaitable), **C** (confort). Les numéros manquants sont des exigences retirées.

### Cadran et décompte (`EF-TIM`)

| Réf.      | Exigence                                                                                           | Prio |
| --------- | -------------------------------------------------------------------------------------------------- | ---- |
| EF-TIM-1  | Le cadran affiche un disque coloré couvrant la durée restante, qui rétrécit jusqu'à 0.             | M    |
| EF-TIM-2  | La graduation couvre 60 min, avec un anneau de 12 segments colorés de 5 min.                       | M    |
| EF-TIM-3  | Un glissement du doigt sur le cadran règle la durée, de 0 à 60 min, y compris pendant le décompte. | M    |
| EF-TIM-4  | Un appui sur le cadran ou sur ▶ démarre, met en pause ou reprend le décompte.                      | M    |
| EF-TIM-5  | Le bouton ↺ remet le minuteur à zéro sans enregistrer de session.                                  | M    |
| EF-TIM-6  | Le temps restant est également affiché en clair (mm:ss) à côté du cadran.                          | M    |
| EF-TIM-7  | L'état courant (mode, en cours / en pause / terminé, cycle) est affiché sous le temps.             | M    |
| EF-TIM-8  | Au clavier : ← / → règlent d'une minute, Page↑ / Page↓ de cinq, Début / Fin vont à 0 / 60 min.     | M    |
| EF-TIM-9  | Le décompte reste juste si l'application passe en arrière-plan ou si l'appareil se verrouille.     | M    |
| EF-TIM-10 | Un retour haptique accompagne le réglage au doigt et la fin du décompte.                           | S    |
| EF-TIM-11 | Deux boutons − / + encadrent l'affichage : une minute par appui.                                   | M    |

**EF-TIM-11** - l'appui maintenu enchaîne les minutes.

### Modes (`EF-MOD`)

| Réf.     | Exigence                                                                                               | Prio |
| -------- | ------------------------------------------------------------------------------------------------------ | ---- |
| EF-MOD-1 | Quatre modes sont livrés : Pomodoro, Pause, Pause longue, Focus TDAH.                                  | M    |
| EF-MOD-2 | L'utilisateur peut créer, modifier et supprimer ses propres modes.                                     | M    |
| EF-MOD-3 | Un mode porte un nom, une durée de 1 à 60 min, une couleur et une nature.                              | M    |
| EF-MOD-4 | La couleur du mode teinte le cadran et l'historique.                                                   | M    |
| EF-MOD-5 | Les modes par défaut peuvent être restaurés depuis les réglages.                                       | S    |
| EF-MOD-6 | Le mode sélectionné est mémorisé d'une ouverture à l'autre.                                            | M    |
| EF-MOD-7 | Chaque couleur est toujours accompagnée de son nom (jamais d'information portée par la couleur seule). | M    |

**EF-MOD-3** - la couleur est choisie dans une palette de 10 ; la nature est *travail*, *pause*
ou *pause longue*.

**EF-MOD-1** - respectivement 25, 5, 15 et 15 min.

### Routines (`EF-ROU`)

| Réf.      | Exigence                                                                 | Prio |
| --------- | ------------------------------------------------------------------------ | ---- |
| EF-ROU-1  | Une routine est une suite ordonnée d'étapes qui s'enchaînent seules.     | M    |
| EF-ROU-2  | Une étape porte un pictogramme, un nom, une durée, une couleur.          | M    |
| EF-ROU-3  | Deux routines d'exemple sont livrées, restaurables depuis le panneau.    | S    |
| EF-ROU-4  | L'utilisateur crée, renomme, réordonne et supprime routines et étapes.   | M    |
| EF-ROU-5  | Choisir une routine arme sa première étape, sans rien démarrer.          | M    |
| EF-ROU-6  | Une bande affiche les étapes dans l'ordre, chacune avec son pictogramme. | M    |
| EF-ROU-7  | Chaque étape de la bande est un bouton : elle y mène directement.        | S    |
| EF-ROU-8  | À la fin d'une étape, la suivante démarre et son nom est annoncé.        | M    |
| EF-ROU-9  | À la dernière étape, la routine est terminée et tout est coché.          | M    |
| EF-ROU-10 | La routine chargée est mémorisée, et se quitte d'un bouton.              | S    |
| EF-ROU-12 | Une routine peut porter un rappel : une heure, et des jours.             | S    |
| EF-ROU-13 | À l'heure dite, la notification nomme la routine et son pictogramme.     | S    |
| EF-ROU-14 | Le rappel survit à la fermeture de l'application et au redémarrage.      | M    |
| EF-ROU-15 | Le rappel réglé est visible sur la carte de la routine.                  | S    |
| EF-ROU-16 | La durée d'une étape se règle d'un seul curseur.                         | M    |
| EF-ROU-17 | Une routine peut être répétée de 1 à 20 fois.                            | S    |
| EF-ROU-18 | Le tour en cours est affiché (« Tour 2 sur 8 ») et annoncé.              | M    |
| EF-ROU-19 | Une routine d'entraînement est livrée : Tabata, huit tours.              | S    |
| EF-ROU-20 | Sous la minute, le cadran gradue des **secondes** et l'affiche.          | M    |
| EF-ROU-21 | Sur une étape courte, les trois dernières secondes sont égrenées.        | S    |
| EF-ROU-22 | Sur une telle étape, la suivante est annoncée 5 s avant la fin.          | S    |
| EF-ROU-23 | Une routine peut être marquée **entraînement**.                          | S    |
| EF-ROU-24 | En mode sport, la couleur de l'étape en cours teinte toute la page.      | S    |
| EF-ROU-25 | En mode sport, le chrono et le nom de l'étape sont agrandis.             | S    |

#### Précisions

**EF-ROU-1** - sans aucune action de l'utilisateur entre deux étapes.

**EF-ROU-2** - durée de 5 s à 60 min, et le fait d'être comptée ou non dans le focus du jour.

**EF-ROU-3** - « Routine du matin » et « Devoirs ».

**EF-ROU-4** - de 1 à 10 étapes par routine.

**EF-ROU-5** - le décompte part ensuite du même geste qu'un mode.

**EF-ROU-6** - ce qui est fait, ce qui se joue, ce qui vient après.

**EF-ROU-7** - en avant comme en arrière.

**EF-ROU-8** - par le son, la voix, la notification et la région live.

**EF-ROU-13** - l'appui ouvre l'application et **arme** la routine sans la démarrer.

**EF-ROU-14** - il est reprogrammé quand la routine ou la langue change.

**EF-ROU-15** - et dit dans son nom accessible.

**EF-ROU-16** - par pas de 5 s en dessous d'une minute, par pas d'une minute au-dessus.

**EF-ROU-17** - la suite d'étapes reprend à la première à chaque tour.

**EF-ROU-18** - les pastilles comptent les tours, pas les cycles pomodoro.

**EF-ROU-19** - 20 s d'effort et 10 s de repos.

**EF-ROU-20** - une pastille « sec » le signale.

**EF-ROU-21** - un son, une vibration, un éclat, et le chiffre dit.

**EF-ROU-22** - à voix haute : « Ensuite : Repos ».

**EF-ROU-23** - le mode sport s'installe tant qu'elle est chargée, et la quitte avec elle.

**EF-ROU-24** - elle change à chaque phase, sans rien à lire.

**EF-ROU-25** - le nom passe sous le chrono.

### Tutoriel d'accueil (`EF-TUT`)

| Réf.     | Exigence                                                                                            | Prio |
| -------- | --------------------------------------------------------------------------------------------------- | ---- |
| EF-TUT-1 | Au premier lancement, cinq vues plein écran présentent l'application.                               | S    |
| EF-TUT-2 | Chaque vue porte un pictogramme avant son titre, et une phrase au plus.                             | M    |
| EF-TUT-3 | On avance au doigt (glissement), aux boutons (Précédent / Suivant, points) ou au clavier (flèches). | M    |
| EF-TUT-4 | Aucune avance automatique : le rythme appartient à qui lit (WCAG 2.2.2).                            | M    |
| EF-TUT-5 | Le tutoriel se passe d'un appui sur *Passer* ou sur Échap, et ne se remontre plus de lui-même.      | M    |

**EF-TUT-1** - voir le temps, le régler, le démarrer, les modes et routines, les alertes.

### Enchaînement et prolongation (`EF-CHA`)

| Réf.     | Exigence                                                                                     | Prio |
| -------- | -------------------------------------------------------------------------------------------- | ---- |
| EF-CHA-1 | Option « +5 min » : à 0, une session de travail se prolonge automatiquement de 5 minutes.    | M    |
| EF-CHA-2 | La prolongation n'a lieu qu'une fois par session.                                            | M    |
| EF-CHA-3 | Option d'enchaînement automatique : travail → pause → travail, sans action de l'utilisateur. | S    |
| EF-CHA-4 | Une pause longue est proposée toutes les 4 sessions de travail terminées.                    | S    |
| EF-CHA-5 | Les deux options sont désactivables indépendamment.                                          | M    |

### Alertes sonores, tactiles et notifications (`EF-ALE`)

| Réf.      | Exigence                                                                      | Prio |
| --------- | ----------------------------------------------------------------------------- | ---- |
| EF-ALE-1  | Trois paliers avant la fin, chacun un son différent, puis un carillon à 0.    | M    |
| EF-ALE-2  | Les sons vont du plus discret au plus insistant à mesure que la fin approche. | M    |
| EF-ALE-4  | Les sons peuvent être coupés globalement ; le choix est mémorisé.             | M    |
| EF-ALE-5  | Sur mobile, des notifications locales reprennent ces alertes, mêmes sons.     | M    |
| EF-ALE-6  | Les notifications sont annulées au retour au premier plan.                    | M    |
| EF-ALE-7  | Un palier dépassé de plus de 90 s en arrière-plan n'est pas rejoué.           | S    |
| EF-ALE-8  | L'autorisation est demandée au premier démarrage, pas à l'ouverture.          | M    |
| EF-ALE-9  | Chaque palier et la fin ont un motif de vibration distinct.                   | S    |
| EF-ALE-10 | Le motif se reconnaît au nombre d'impulsions et à leur rythme.                | S    |
| EF-ALE-11 | Chaque palier et la fin déclenchent un signal visuel : aucun, doux ou fort.   | S    |
| EF-ALE-12 | Le signal visuel bat à 0,6 Hz au plus et se fige si l'appareil le demande.    | M    |
| EF-ALE-13 | À la fin, un bandeau « Temps écoulé » reste jusqu'à la prochaine action.      | S    |
| EF-ALE-14 | Une notification de test se programme à cinq secondes, depuis les réglages.   | S    |
| EF-ALE-15 | Le test dit au même endroit ce qu'il est advenu, dans une région live.        | M    |
| EF-ALE-16 | Un lien mène à l'écran système « Alarmes et rappels » (Android 12+).          | S    |
| EF-ALE-17 | Pendant une session, un décompte permanent se pose hors de l'application.     | S    |
| EF-ALE-18 | Ce décompte n'alerte jamais : ni son, ni vibration, ni pastille.              | M    |
| EF-ALE-19 | Il disparaît dès l'arrêt du décompte, et l'appui dessus ne démarre rien.      | M    |
| EF-ALE-20 | Tous les sons sortent au même niveau, près du maximum de l'échelle.           | M    |

#### Précisions

**EF-ALE-1** - les trois paliers se calculent sur la durée de la session (voir « Paliers » du [Design UI/UX](07_UI_UX_DESIGN.md)), et non à heure fixe.

**EF-ALE-2** - cette progression est portée par le motif et le timbre : une note ronde, deux notes
montantes, trois bips rapides. Elle n'est **pas** portée par le volume. Un palier ne doit pas être
manqué parce qu'il est le premier.

**EF-ALE-5** - quand l'application est en arrière-plan ou l'appareil verrouillé, là où le
JavaScript est suspendu.

**EF-ALE-6** - les sons de l'application prennent alors le relais.

**EF-ALE-7** - la notification a déjà prévenu ; le rejouer ferait sonner deux fois le même palier.

**EF-ALE-9** - le motif est calqué sur le rythme du son correspondant : une impulsion longue, deux
impulsions, trois brèves, trois longues.

**EF-ALE-10** - la durée demandée est respectée sur Android et sur un iPhone à Taptic Engine ; un
appareil iOS plus ancien retombe sur une vibration système de longueur fixe. D'où la
reconnaissance par le nombre et le rythme plutôt que par la durée.

**EF-ALE-11** - un battement au palier, trois à la fin.

**EF-ALE-12** - il se fige sous `prefers-reduced-motion`, n'intercepte aucun clic et n'est pas
exposé aux lecteurs d'écran : il double une information déjà dite ailleurs.

**EF-ALE-13** - une alerte qui passe se rate.

**EF-ALE-14** - le délai est le sujet même du test : il laisse le temps de verrouiller l'écran, et
c'est écran verrouillé qu'on veut savoir si l'appareil prévient.

**EF-ALE-15** - cinq issues distinguées : programmée, programmée sans alarme exacte, notifications
refusées, indisponible hors de l'application installée, ou échouée.

**EF-ALE-16** - ailleurs, le lien annonce que cet écran n'existe pas, plutôt que de faire croire à
un refus.

**EF-ALE-17** - notification muette sur Android. Il donne le temps restant sans déverrouiller.

**EF-ALE-18** - il informe, et laisse les paliers se faire entendre.

**EF-ALE-20** - un appareil ne fait que *réduire* ce qu'on lui donne. Un son rendu à mi-échelle
arrive irrémédiablement discret, et une alerte qui ne s'entend pas ne remplit pas son rôle.

### Préférences (`EF-PRE`)

| Réf.      | Exigence                                                                                 | Prio |
| --------- | ---------------------------------------------------------------------------------------- | ---- |
| EF-PRE-1  | Mode sombre : suit l'appareil au premier lancement, puis modifiable et mémorisé.         | M    |
| EF-PRE-2  | Police OpenDyslexic activable.                                                           | M    |
| EF-PRE-3  | Sons on/off.                                                                             | M    |
| EF-PRE-4  | Prolongation « +5 min » on/off.                                                          | M    |
| EF-PRE-5  | Enchaînement automatique on/off.                                                         | S    |
| EF-PRE-6  | Écran toujours allumé pendant le décompte, on/off.                                       | S    |
| EF-PRE-8  | Langue : automatique (langue de l'appareil) ou choisie.                                  | M    |
| EF-PRE-9  | Toute préférence est conservée d'une ouverture à l'autre.                                | M    |
| EF-PRE-10 | Annonce vocale : aucune, aux paliers, ou à chaque minute (défaut : aucune).              | S    |
| EF-PRE-11 | Vibration on/off (défaut : on) ; l'activation fait sentir le motif de fin.               | S    |
| EF-PRE-12 | Alerte visuelle : aucune, douce ou forte (défaut : douce) ; le choix se montre aussitôt. | S    |

**EF-PRE-10** - le choix se fait entendre aussitôt.

### Internationalisation (`EF-I18`)

| Réf.     | Exigence                                                                                   | Prio |
| -------- | ------------------------------------------------------------------------------------------ | ---- |
| EF-I18-1 | Sept langues : français, anglais, espagnol, allemand, italien, portugais, arabe.           | M    |
| EF-I18-2 | L'arabe s'affiche de droite à gauche, mise en page comprise.                               | M    |
| EF-I18-3 | La langue est détectée depuis l'appareil au premier lancement, avec repli sur le français. | M    |
| EF-I18-4 | Le changement de langue est immédiat, sans rechargement.                                   | M    |
| EF-I18-5 | Les libellés transmis au widget et aux notifications suivent la langue de l'application.   | S    |

### Écran allumé et widget (`EF-NAT`)

| Réf.     | Exigence                                                                      | Prio |
| -------- | ----------------------------------------------------------------------------- | ---- |
| EF-NAT-1 | L'écran ne s'éteint pas pendant le décompte, si l'option est active.          | S    |
| EF-NAT-2 | Un widget d'écran d'accueil sur Android reprend le cadran.                    | C    |
| EF-NAT-3 | Le widget décompte seul entre deux mises à jour de l'application.             | C    |
| EF-NAT-4 | Le widget est mis à jour à chaque changement.                                 | C    |
| EF-NAT-5 | Le widget suit le thème de l'application, clair ou sombre.                    | C    |
| EF-NAT-6 | Toucher le widget ouvre l'application, sans rien démarrer.                    | C    |
| EF-NAT-7 | L'application ouvre sur un fond beige avec son logo (et sa version sur iOS), jusqu'à ce qu'elle soit prête. | S    |
| EF-NAT-8 | Le logo de l'ouverture cesse de pulser si l'appareil demande moins d'animation. | M    |

#### Précisions

**EF-NAT-2** - anneau de couleurs, disque du mode, bouton central, avec le temps restant et
l'objectif du jour.

**EF-NAT-3** - son disque se vide graduation par graduation.

**EF-NAT-4** - démarrage, pause, fin, passage en arrière-plan, objectif, langue.

**EF-NAT-5** - et non celui du système : c'est l'application qui décide.

**EF-NAT-6** - il montre, il ne commande pas.

**EF-NAT-7** - le fond et le logo sont posés dès la première ligne de `index.html`, en ligne, avant tout téléchargement ; sur iOS, une vue native affiche le même logo et la version par-dessus la WebView. Ils s'effacent quand l'application démarre.

**EF-NAT-8** - le logo pulse doucement ; sous `prefers-reduced-motion`, il reste immobile.

### Page d'accessibilité (`EF-A11`)

| Réf.     | Exigence                                                                  | Prio |
| -------- | ------------------------------------------------------------------------- | ---- |
| EF-A11-1 | Un lien « ♿ Accessibilité » est accessible depuis le minuteur.            | M    |
| EF-A11-2 | La page publie la déclaration dans le plan du décret n° 2019-768.         | M    |
| EF-A11-3 | La page est traduite dans les sept langues.                               | M    |
| EF-A11-4 | Une session continue, se termine et s'enregistre pendant la consultation. | M    |
| EF-A11-5 | La page dit que la déclaration est volontaire.                            | M    |
| EF-A11-6 | Aucun taux de conformité n'est annoncé sans audit mené par un tiers.      | M    |
| EF-A11-7 | L'établissement de la déclaration nomme ce sur quoi elle s'appuie.        | M    |

#### Précisions

**EF-A11-2** - les sept rubriques, dans l'ordre du décret : engagement, état de conformité,
résultats des tests, contenus non accessibles (non-conformités, dérogations pour charge
disproportionnée, contenus non soumis), établissement de la déclaration, contact, voies de
recours.

**EF-A11-5** - l'application n'entre pas dans le champ de l'article 47 : laisser croire à une
obligation serait faux.

**EF-A11-6** - un pourcentage auto-attribué tromperait sur ce qui a été vérifié.

**EF-A11-7** - la date, les technologies, l'environnement de test, les outils et les pages
évaluées ; et le fait qu'aucune technologie d'assistance n'a été utilisée.

## Règles métier

| Réf.   | Règle                                                                              |
| ------ | ---------------------------------------------------------------------------------- |
| RG-1   | Durée réglable : 0 à 60 min ; durée d'un mode : 1 à 60 min.                        |
| RG-2   | La prolongation vaut 5 min, sur les sessions de **travail**, une fois par session. |
| RG-3   | Une pause longue est proposée toutes les **4** sessions de travail terminées.      |
| RG-4   | Au-delà de **40 min**, les paliers tombent à **45, 30 et 15** min restantes.       |
| RG-4b  | Le son, la vibration et le canal d'un palier viennent de son **rang**.             |
| RG-5   | Aucun son de palier n'est joué pendant un réglage au doigt.                        |
| RG-6   | Une session interrompue avant **60 s** décomptées n'est pas enregistrée.           |
| RG-7   | L'historique conserve au maximum les **500** dernières sessions.                   |
| RG-8   | Le temps enregistré exclut les pauses et inclut la prolongation.                   |
| RG-9   | Le nom et la couleur d'une session sont figés à l'enregistrement.                  |
| RG-13  | Au moins un mode existe en permanence : supprimer le dernier est refusé.           |
| RG-14  | Sans stockage local, l'application reste utilisable.                               |
| RG-15  | Un palier dépassé de plus de **90 s** au retour au premier plan n'est pas rejoué.  |
| RG-16  | Une routine compte de 1 à 10 étapes ; la dernière ne peut pas être supprimée.      |
| RG-16b | Une étape dure de **5 s à 60 min** ; une routine se joue de **1 à 20 tours**.      |
| RG-17  | Pendant une routine, la prolongation « +5 min » ne s'applique pas.                 |
| RG-18  | Pendant une routine, l'enchaînement suit les étapes de la routine.                 |
| RG-19  | Une étape hors du focus du jour est enregistrée comme une pause.                   |
| RG-20  | Un rappel sans jour coché n'est pas enregistré.                                    |
| RG-21  | Un rappel touché **arme** la routine, il ne la démarre pas.                        |
| RG-22  | Les rappels sont reprogrammés en bloc à chaque modification.                       |
| RG-23  | Le tutoriel se montre tant qu'il n'a pas été vu, et plus jamais ensuite.           |
| RG-24  | Le tutoriel n'avance jamais seul, et le panneau de réglages se ferme d'abord.      |
| RG-25  | Le compteur de tours repart à 1 au lancement de la routine, ou en la quittant.     |
| RG-26  | Cadran gradué en secondes : le **réglage** de la durée est neutralisé.             |
| RG-27  | L'unité du cadran suit la **durée réglée**, jamais le temps restant.               |
| RG-28  | Le mode sport **teinte** le fond du thème (18 à 30 %) au lieu de le remplacer.     |
| RG-29  | Sur ce fond teinté, le gris secondaire passe au gris fort.                         |
| RG-30  | La notification de test vit au-dessus des deux autres bornes d'identifiant.        |

### Précisions

**RG-4** - en dessous de 40 min, les paliers se calculent sur la durée choisie : la **moitié**, le
**dernier quart**, puis **1 min** avant la fin. Sinon un Pomodoro de 25 min ne serait prévenu
qu'une fois, et une étape de routine de 10 min jamais.

**RG-4b** - le dernier palier est donc toujours le plus insistant, quelle que soit la durée.

**RG-6** - c'est un faux départ, pas une session.

**RG-7** - les plus anciennes sont supprimées.

**RG-8** - `activeSeconds` : le temps réellement décompté.

**RG-9** - renommer un mode ne réécrit pas l'historique.

**RG-11** - jusqu'à aujourd'hui, ou jusqu'à hier si rien n'a encore été fait aujourd'hui.

**RG-14** - en navigation privée ou stockage bloqué, les réglages ne valent que pour la session.

**RG-16b** - une durée ou un nombre de tours hors bornes est ramené dans les bornes à la lecture.

**RG-17** - ce qui a été annoncé arrive à l'heure dite.

**RG-18** - que l'option « enchaîner travail → pause » soit active ou non.

**RG-19** - se laver les dents n'est pas du temps de travail (RG-10).

**RG-20** - mieux vaut pas de rappel qu'un rappel qui ne partira jamais. Allumer un rappel coche
la semaine entière.

**RG-21** - un décompte qui part sans geste de l'utilisateur est une source d'anxiété.

**RG-22** - ils échappent ainsi à l'annulation des alertes de session, qui a lieu à chaque retour
au premier plan.

**RG-23** - passé, terminé ou revu, il ne se remontre plus de lui-même.

**RG-24** - deux modales à la fois ne s'entendraient pas.

**RG-25** - jamais quand on saute d'une étape à l'autre : refaire une étape ne recommence pas
l'entraînement.

**RG-26** - glissement, flèches et boutons − / + travaillent en minutes. Démarrer et mettre en
pause restent possibles.

**RG-27** - un Pomodoro ne bascule pas en secondes dans sa dernière minute.

**RG-28** - clair reste clair, sombre reste sombre, et les textes gardent leur contraste.

**RG-29** - mesuré sur les dix couleurs de la palette, il tombait à 2,82:1 (WCAG 1.4.3).

**RG-30** - ni le retour au premier plan, qui annule les alertes de session, ni la réécriture en
bloc des rappels ne l'effacent : elle doit arriver, c'est tout son objet.

## Exigences non fonctionnelles

### Accessibilité (`ENF-A11`)

| Réf.       | Exigence                                                                   |
| ---------- | -------------------------------------------------------------------------- |
| ENF-A11-1  | Référentiels visés : **RGAA 4.1** et **WCAG 2.1 niveau AA**.               |
| ENF-A11-2  | Toutes les fonctions sont atteignables au clavier seul.                    |
| ENF-A11-3  | Le focus est piégé dans le panneau de réglages, et Échap le ferme.         |
| ENF-A11-4  | Le temps restant et les changements d'état passent par une région live.    |
| ENF-A11-5  | Contraste des textes d'au moins 4,5:1, en thème clair comme sombre.        |
| ENF-A11-6  | Aucune information n'est portée par la couleur seule.                      |
| ENF-A11-7  | La préférence système « animations réduites » est respectée.               |
| ENF-A11-8  | Aucun clignotement rapide : la seule alerte lumineuse bat à 0,6 Hz.        |
| ENF-A11-9  | Le cadran expose un rôle de curseur, avec valeur, bornes et texte lisible. |
| ENF-A11-10 | Les tests axe-core ne relèvent aucune violation sur les parcours couverts. |
| ENF-A11-11 | Ce qui se règle par glissement se règle aussi par un pointeur simple.      |
| ENF-A11-12 | Le temps restant peut être dit à voix haute par la synthèse de l'appareil. |
| ENF-A11-13 | Chaque palier et la fin ont un motif de vibration distinct.                |
| ENF-A11-15 | Une étape de routine est identifiable sans savoir lire.                    |

#### Précisions

**ENF-A11-1** - statut annoncé : conforme aux normes WCAG 2.1 niveau AA et RGAA 4.1.

**ENF-A11-2** - avec un indicateur de focus toujours visible.

**ENF-A11-8** - un battement de 1,6 s, cinq fois sous le seuil des trois éclats par seconde
(WCAG 2.3.1). Elle se règle, se coupe, et se fige sous `prefers-reduced-motion`.

**ENF-A11-10** - axe-core sur WCAG 2.0 / 2.1 niveaux A et AA, plus les bonnes pratiques, en thème
clair et sombre.

**ENF-A11-11** - WCAG 2.5.7, avec des cibles d'au moins 44 × 44 px (WCAG 2.5.8).

**ENF-A11-12** - réglage à trois choix, hors ligne, éteint par défaut : sans regarder le cadran.

**ENF-A11-13** - reconnaissable sans la vue ni l'ouïe : c'est le seul canal d'alerte pour une
personne sourde-aveugle.

**ENF-A11-15** - un pictogramme précède son nom, et son état (faite, en cours, à venir) est porté
par une coche et par le nom accessible, jamais par la couleur seule.

#### Écarts connus et assumés

Publiés dans la déclaration d'accessibilité :

- le cadran est un curseur dont l'activation démarre aussi le minuteur (RGAA 7.1 et 7.3) ;
- le contraste des éléments non textuels n'a pas été mesuré sur le rendu (3.2) ;
- l'agrandissement à 200 % et le parcours au lecteur d'écran n'ont pas été vérifiés
  manuellement (10.4, 7.1).

### Confidentialité et sécurité

| Réf.      | Exigence                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------ |
| ENF-SEC-1 | Aucune donnée ne quitte l'appareil : pas de compte, pas de serveur, pas d'analytique.                  |
| ENF-SEC-2 | Préférences, modes et historique résident dans le stockage local de l'appareil.                        |
| ENF-SEC-3 | Aucune donnée personnelle sensible n'est collectée ; le RGPD ne s'applique à aucun traitement distant. |
| ENF-SEC-4 | Les vulnérabilités se signalent en privé via l'avis de sécurité GitHub du dépôt (voir `SECURITY.md`).  |

### Performance et robustesse

| Réf.      | Exigence                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------- |
| ENF-PER-1 | Budget du bundle initial : alerte à 500 ko, erreur à 1 Mo.                                        |
| ENF-PER-2 | Les deux pages sont chargées à la demande : la page d'accessibilité ne pèse pas sur le démarrage. |
| ENF-PER-3 | La précision du décompte ne dépend pas de la régularité des ticks du navigateur.                  |
| ENF-PER-4 | Une session en cours survit à la navigation entre les deux pages.                                 |
| ENF-PER-5 | Un service indisponible ne bloque jamais l'application.                                           |

**ENF-PER-5** - stockage, notifications, haptique ou maintien d'écran.

### Compatibilité

| Cible       | Exigence                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Navigateurs | Navigateurs modernes supportant Web Audio et les propriétés logiques CSS                           |
| iOS         | iOS 15 ou plus                                                                                     |
| Android     | Notifications à canaux ; la permission d'alarme exacte peut être nécessaire à partir d'Android 12  |
| macOS, Windows | Application Electron : DMG macOS (Apple Silicon) et installeur Windows x64 |
| Écrans      | Conception mobile d'abord ; thème clair et sombre ; sens d'écriture gauche→droite et droite→gauche |

### Maintenabilité

| Réf.      | Exigence                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------ |
| ENF-MNT-1 | Ajouter une langue ne demande qu'un dictionnaire et quatre déclarations.                               |
| ENF-MNT-2 | Les couleurs sont des variables CSS centralisées, jamais écrites en dur dans les composants.           |
| ENF-MNT-3 | Les tests de non-régression d'accessibilité sont rejoués à chaque poussée et chaque demande de fusion. |
| ENF-MNT-4 | Les messages de commit suivent le format sémantique.                                                   |

**ENF-MNT-1** - une clé manquante est une erreur de compilation.

## Hors périmètre

- Compte, synchronisation, serveur, statistiques d'usage, télémétrie : l'application reste locale.

- Score punitif, pénalité, classement : aucun objectif de performance (principe « Pas de pression »).

- Retirés après essai : verrou du cadran, mode table, onglet de statistiques, écran de démarrage animé, widget iOS et Live Activity.

## Décisions prises

- **Tout est local** : pas de back end, la seule persistance est `localStorage`.

- **Accessibilité par défaut** : RGAA 4.1 et WCAG 2.1 AA, vérifiés en intégration continue.

- **Verrou du cadran retiré** (12 novembre 2026).

- **Mode table retiré** (13 novembre 2026).

- **Widget iOS et Live Activity retirés** (13 novembre 2026) ; le widget et le décompte permanent restent sur Android.

- **Onglet de statistiques et écran de démarrage animé retirés** (octobre 2026).

## Critères d'acceptation

Une contribution est acceptée quand :

- le build de production passe ;
- la suite d'accessibilité ne signale aucune violation ;
- aucune couleur n'est écrite en dur ;
- aucune clé de traduction ne manque (le compilateur le vérifie) ;
- le message de commit suit le format sémantique.

## Risques

| Limite                                            | Raison                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Historique plafonné à 500 sessions                | Taille de `localStorage` ; au-delà, l'intérêt statistique est marginal                 |
| Pas d'export de données par l'utilisateur         | Non spécifié à ce jour                                                                 |
| Ni widget ni décompte permanent sur iOS           | Retirés ; seul Android les a                                                           |
| Contrat `WidgetState` dupliqué TypeScript / Java  | Pas de génération de code ; toute évolution se fait des deux côtés                     |
| Pas de tests avec lecteur d'écran réel            | Vérification automatique et revue de code seulement ; écart publié dans la déclaration |
| Tests d'accessibilité sur Chromium seul           | Un seul moteur en CI                                                                   |

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Product Requirements Document (PRD)

## Product

**Pomodoro Accessibilité** is a visual timer: a coloured disc covers the chosen duration and shrinks as time passes, so that an image replaces a calculation. It takes the mechanisms of the Pomodoro method (sessions, breaks, chaining, statistics) without ever introducing pressure or judgement.

## Target users

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

### Technical usage context

- Mobile screen first (the layout is designed for a phone-sized width).
- May be used keyboard only, with a screen reader, or by touch.
- A session may last 60 min with the application in the background or the device locked.

## Problem and solution

A clock gives the time, a digital timer shows digits: neither one **shows** the remaining time. For
many neurodivergent people (ADHD, autism, dys- disorders), time is not "felt": ten minutes and an
hour can seem identical, and reading the time does not help work out how much is left.

Provide a **visual timer** in which a coloured disc covers the chosen duration and shrinks as time
passes, so that a calculation is replaced by an image. Add to it the mechanisms of the Pomodoro method
(sessions, breaks, chaining, statistics) without ever introducing pressure or judgement.

## Goals and success indicators

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

## Versions

- **Published version**: 1.0 (`MARKETING_VERSION` on iOS, `1.0.0` in `package.json`).

- **Maintenance**: only the latest version of `main` receives fixes; no older versions are published.

- **Delivery**: work happens on `develop`; a `develop` → `main` pull request ships a batch of changes.

## Platforms and screens

### Platforms

| Platform             | Support       | Specifics                                        |
| -------------------- | ------------- | ------------------------------------------------ |
| Web (modern browser) | Main target   | Web Audio sounds, Wake Lock where available      |
| iOS                  | Via Capacitor | Local notifications, haptics                     |
| Android              | Via Capacitor | Local notifications with sound channels, haptics |
| macOS, Windows       | Via Electron  | Desktop app, system notifications, unsigned installers |

### Screens

| Screen        | Route            | Content                                                                   |
| ------------- | ---------------- | ------------------------------------------------------------------------- |
| Timer         | `/`              | Dial, time display, routine strip, controls, panel (Modes / Settings)     |
| Accessibility | `/accessibility` | RGAA accessibility statement, notes on neurodiversity, targeted standards |

## Main features

Requirements carry an `EF-<domain>-<n>` identifier. Priority follows MoSCoW: **M** (must), **S** (should), **C** (could). Missing numbers are requirements that were removed.

### Dial and countdown (`EF-TIM`)

| Ref.      | Requirement                                                                                        | Prio |
| --------- | -------------------------------------------------------------------------------------------------- | ---- |
| EF-TIM-1  | The dial shows a coloured disc covering the remaining time, which shrinks to 0.                    | M    |
| EF-TIM-2  | The graduation covers 60 min, with a ring of 12 coloured segments of 5 min.                        | M    |
| EF-TIM-3  | Dragging a finger on the dial sets the duration, from 0 to 60 min, including during the countdown. | M    |
| EF-TIM-4  | Tapping the dial or ▶ starts, pauses or resumes the countdown.                                     | M    |
| EF-TIM-5  | The ↺ button resets the timer to zero without recording a session.                                 | M    |
| EF-TIM-6  | The remaining time is also shown in plain text (mm:ss) next to the dial.                           | M    |
| EF-TIM-7  | The current state (mode, running / paused / finished, cycle) is shown under the time.              | M    |
| EF-TIM-8  | Keyboard: ← / → adjust by one minute, Page Up / Page Down by five, Home / End go to 0 / 60 min.    | M    |
| EF-TIM-9  | The countdown stays accurate if the application goes to the background or the device locks.        | M    |
| EF-TIM-10 | A haptic response accompanies finger adjustment and the end of the countdown.                      | S    |
| EF-TIM-11 | Two buttons − / + frame the display: one minute per tap.                                           | M    |

**EF-TIM-11** - holding the button repeats the minutes.

### Modes (`EF-MOD`)

| Ref.     | Requirement                                                                                 | Prio |
| -------- | ------------------------------------------------------------------------------------------- | ---- |
| EF-MOD-1 | Four modes are shipped: Pomodoro, Break, Long break, ADHD Focus.                            | M    |
| EF-MOD-2 | The user can create, edit and delete their own modes.                                       | M    |
| EF-MOD-3 | A mode has a name, a duration from 1 to 60 min, a colour and a nature.                      | M    |
| EF-MOD-4 | The mode's colour tints the dial and the history.                                           | M    |
| EF-MOD-5 | The default modes can be restored from the settings.                                        | S    |
| EF-MOD-6 | The selected mode is remembered from one opening to the next.                               | M    |
| EF-MOD-7 | Every colour is always accompanied by its name (never information carried by colour alone). | M    |

**EF-MOD-3** - the colour is chosen from a palette of 10; the nature is *work*, *break* or *long break*.

**EF-MOD-1** - 25, 5, 15 and 15 min respectively.

### Routines (`EF-ROU`)

| Ref.      | Requirement                                                              | Prio |
| --------- | ------------------------------------------------------------------------ | ---- |
| EF-ROU-1  | A routine is an ordered sequence of steps that chain on their own.       | M    |
| EF-ROU-2  | A step carries a pictogram, a name, a duration and a colour.             | M    |
| EF-ROU-3  | Two example routines are shipped, restorable from the panel.             | S    |
| EF-ROU-4  | The user creates, renames, reorders and deletes routines and steps.      | M    |
| EF-ROU-5  | Choosing a routine arms its first step, without starting anything.       | M    |
| EF-ROU-6  | A strip shows the steps in order, each with its pictogram.               | M    |
| EF-ROU-7  | Each step of the strip is a button: it takes you straight to that step.  | S    |
| EF-ROU-8  | At the end of a step, the next one starts and its name is announced.     | M    |
| EF-ROU-9  | At the last step, the routine is finished and everything is ticked.      | M    |
| EF-ROU-10 | The loaded routine is remembered and can be left with one button.        | S    |
| EF-ROU-12 | A routine can carry a reminder: a time and days.                         | S    |
| EF-ROU-13 | At the set time, the notification names the routine and its pictogram.   | S    |
| EF-ROU-14 | The reminder survives closing the application and restarting the device. | M    |
| EF-ROU-15 | A set reminder is visible on the routine's card.                         | S    |
| EF-ROU-16 | The duration of a step is set with a single slider.                      | M    |
| EF-ROU-17 | A routine can be repeated from 1 to 20 times.                            | S    |
| EF-ROU-18 | The current round is shown ("Round 2 of 8") and announced.               | M    |
| EF-ROU-19 | A training routine is shipped: Tabata, eight rounds.                     | S    |
| EF-ROU-20 | Below one minute, the dial graduates in **seconds** and shows them.      | M    |
| EF-ROU-21 | On a short step, the last three seconds are counted down.                | S    |
| EF-ROU-22 | On such a step, the next one is announced 5 s before the end.            | S    |
| EF-ROU-23 | A routine can be marked **training**.                                    | S    |
| EF-ROU-24 | In sport mode, the colour of the current step tints the whole page.      | S    |
| EF-ROU-25 | In sport mode, the clock and the step name are enlarged.                 | S    |

#### Details

**EF-ROU-1** - with no action from the user between two steps.

**EF-ROU-2** - duration from 5 s to 60 min, and whether it counts towards the day's focus or not.

**EF-ROU-3** - "Morning routine" and "Homework".

**EF-ROU-4** - from 1 to 10 steps per routine.

**EF-ROU-5** - the countdown then starts with the same gesture as a mode.

**EF-ROU-6** - what is done, what is playing, what comes next.

**EF-ROU-7** - forwards as well as backwards.

**EF-ROU-8** - through the sound, the voice, the notification and the live region.

**EF-ROU-13** - tapping opens the application and **arms** the routine without starting it.

**EF-ROU-14** - it is rescheduled when the routine or the language changes.

**EF-ROU-15** - and is stated in its accessible name.

**EF-ROU-16** - in steps of 5 s below one minute, in steps of one minute above it.

**EF-ROU-17** - the sequence of steps starts again from the first one on each round.

**EF-ROU-18** - the dots count rounds, not Pomodoro cycles.

**EF-ROU-19** - 20 s of effort and 10 s of rest.

**EF-ROU-20** - a "dry" marker signals it.

**EF-ROU-21** - a sound, a vibration, a flash, and the digits are spoken.

**EF-ROU-22** - spoken aloud: "Next: Rest".

**EF-ROU-23** - sport mode is set up while it is loaded, and is left with it.

**EF-ROU-24** - it changes with each phase, without anything to read.

**EF-ROU-25** - the name moves under the clock.

### Welcome tutorial (`EF-TUT`)

| Ref.     | Requirement                                                                                     | Prio |
| -------- | ----------------------------------------------------------------------------------------------- | ---- |
| EF-TUT-1 | On first launch, five full-screen views introduce the application.                              | S    |
| EF-TUT-2 | Each view carries a pictogram before its title, and at most one sentence.                       | M    |
| EF-TUT-3 | You move on by swiping, with the buttons (Previous / Next, dots) or with the keyboard (arrows). | M    |
| EF-TUT-4 | No automatic advance: the pace belongs to the reader (WCAG 2.2.2).                              | M    |
| EF-TUT-5 | The tutorial is dismissed with *Skip* or Escape, and does not reappear on its own.              | M    |

**EF-TUT-1** - seeing the time, setting it, starting it, the modes and routines, the alerts.

### Chaining and extension (`EF-CHA`)

| Ref.     | Requirement                                                               | Prio |
| -------- | ------------------------------------------------------------------------- | ---- |
| EF-CHA-1 | "+5 min" option: at 0, a work session extends automatically by 5 minutes. | M    |
| EF-CHA-2 | The extension happens only once per session.                              | M    |
| EF-CHA-3 | Automatic chaining option: work → break → work, without user action.      | S    |
| EF-CHA-4 | A long break is offered after every 4 completed work sessions.            | S    |
| EF-CHA-5 | The two options can be switched off independently.                        | M    |

### Sound, haptic and notification alerts (`EF-ALE`)

| Ref.      | Requirement                                                                       | Prio |
| --------- | --------------------------------------------------------------------------------- | ---- |
| EF-ALE-1  | Three milestones before the end, each with a different sound, then a chime at 0.  | M    |
| EF-ALE-2  | The sounds go from the most discreet to the most insistent as the end approaches. | M    |
| EF-ALE-4  | The sounds can be turned off globally; the choice is remembered.                  | M    |
| EF-ALE-5  | On mobile, local notifications take over these alerts, with the same sounds.      | M    |
| EF-ALE-6  | Notifications are cancelled when the app returns to the foreground.               | M    |
| EF-ALE-7  | A milestone passed more than 90 s ago in the background is not replayed.          | S    |
| EF-ALE-8  | Permission is requested on first launch, not on opening.                          | M    |
| EF-ALE-9  | Each milestone and the end have a distinct vibration pattern.                     | S    |
| EF-ALE-10 | A pattern is recognised by its number of pulses and their rhythm.                 | S    |
| EF-ALE-11 | Each milestone and the end trigger a visual signal: none, soft or strong.         | S    |
| EF-ALE-12 | The visual signal beats at 0.6 Hz at most and freezes if the device asks for it.  | M    |
| EF-ALE-13 | At the end, a "Time's up" banner stays until the next action.                     | S    |
| EF-ALE-14 | A test notification is scheduled for five seconds, from the settings.             | S    |
| EF-ALE-15 | The test says in the same place what happened, in a live region.                  | M    |
| EF-ALE-16 | A link leads to the system screen "Alarms & reminders" (Android 12+).             | S    |
| EF-ALE-17 | During a session, a persistent countdown appears outside the application.         | S    |
| EF-ALE-18 | This countdown never alerts: no sound, no vibration, no badge.                    | M    |
| EF-ALE-19 | It disappears as soon as the countdown stops, and tapping it starts nothing.      | M    |
| EF-ALE-20 | All sounds come out at the same level, close to the maximum of the scale.         | M    |

#### Details

**EF-ALE-1** - the three milestones are calculated from the session's duration (see "Milestones" in the [UI/UX design](07_UI_UX_DESIGN.md)), not at fixed times.

**EF-ALE-2** - this progression is carried by the pattern and the timbre: one round note, two rising
notes, three quick beeps. It is **not** carried by the volume. A milestone must not be missed because
it comes first.

**EF-ALE-5** - when the application is in the background or the device is locked, where JavaScript is
suspended.

**EF-ALE-6** - the application's sounds then take over.

**EF-ALE-7** - the notification has already warned; replaying it would make the same milestone ring twice.

**EF-ALE-9** - the pattern follows the rhythm of the matching sound: one long pulse, two pulses, three
short, three long.

**EF-ALE-10** - the requested duration is honoured on Android and on an iPhone with a Taptic Engine; an
older iOS device falls back to a system vibration of fixed length. Hence recognition by number and
rhythm rather than by duration.

**EF-ALE-11** - one beat at a milestone, three at the end.

**EF-ALE-12** - it freezes under `prefers-reduced-motion`, intercepts no click and is not exposed to
screen readers: it duplicates information already given elsewhere.

**EF-ALE-13** - an alert that passes by is easily missed.

**EF-ALE-14** - the delay is the point of the test: it leaves time to lock the screen, and it is with the
screen locked that you want to know whether the device warns you.

**EF-ALE-15** - five distinct outcomes: scheduled, scheduled without exact alarm, notifications refused,
unavailable outside the installed application, or failed.

**EF-ALE-16** - elsewhere, the link states that this screen does not exist, rather than implying a refusal.

**EF-ALE-17** - a silent notification on Android. It gives the remaining time without unlocking the
device.

**EF-ALE-18** - it informs, and lets the milestones be heard.

**EF-ALE-20** - a device only ever *reduces* what it is given. A sound rendered at half scale arrives
irremediably quiet, and an alert that cannot be heard does not fulfil its role.

### Preferences (`EF-PRE`)

| Ref.      | Requirement                                                                      | Prio |
| --------- | -------------------------------------------------------------------------------- | ---- |
| EF-PRE-1  | Dark mode: follows the device on first launch, then editable and remembered.     | M    |
| EF-PRE-2  | OpenDyslexic font can be turned on.                                              | M    |
| EF-PRE-3  | Sounds on/off.                                                                   | M    |
| EF-PRE-4  | "+5 min" extension on/off.                                                       | M    |
| EF-PRE-5  | Automatic chaining on/off.                                                       | S    |
| EF-PRE-6  | Screen kept on during the countdown, on/off.                                     | S    |
| EF-PRE-8  | Language: automatic (device language) or chosen.                                 | M    |
| EF-PRE-9  | Every preference is kept from one opening to the next.                           | M    |
| EF-PRE-10 | Voice announcement: none, at milestones, or every minute (default: none).        | S    |
| EF-PRE-11 | Vibration on/off (default: on); turning it on lets you feel the end pattern.     | S    |
| EF-PRE-12 | Visual alert: none, soft or strong (default: soft); the choice is shown at once. | S    |

**EF-PRE-10** - the choice is heard at once.

### Internationalisation (`EF-I18`)

| Ref.     | Requirement                                                                         | Prio |
| -------- | ----------------------------------------------------------------------------------- | ---- |
| EF-I18-1 | Seven languages: French, English, Spanish, German, Italian, Portuguese, Arabic.     | M    |
| EF-I18-2 | Arabic is displayed right to left, layout included.                                 | M    |
| EF-I18-3 | The language is detected from the device on first launch, falling back to French.   | M    |
| EF-I18-4 | Changing language takes effect at once, without reloading.                          | M    |
| EF-I18-5 | Labels passed to the widget and to notifications follow the application's language. | S    |

### Screen on and widget (`EF-NAT`)

| Ref.     | Requirement                                                                          | Prio |
| -------- | ------------------------------------------------------------------------------------ | ---- |
| EF-NAT-1 | The screen does not switch off during the countdown, if the option is active.        | S    |
| EF-NAT-2 | A home screen widget on Android shows the dial.                                      | C    |
| EF-NAT-3 | The widget counts down on its own between two application updates.                   | C    |
| EF-NAT-4 | The widget is updated at every change.                                               | C    |
| EF-NAT-5 | The widget follows the application's theme, light or dark.                           | C    |
| EF-NAT-6 | Tapping the widget opens the application, without starting anything.                 | C    |
| EF-NAT-7 | The application opens on a beige background with its logo (and its version on iOS), until ready. | S    |
| EF-NAT-8 | The opening logo stops pulsing if the device asks for less animation.                | M    |

#### Details

**EF-NAT-2** - colour ring, mode disc, central button, with the remaining time and the day's goal.

**EF-NAT-3** - its disc empties graduation by graduation.

**EF-NAT-4** - start, pause, end, going to the background, goal, language.

**EF-NAT-5** - not the system's theme: the application decides.

**EF-NAT-6** - it shows, it does not command.

**EF-NAT-7** - the background and the logo are laid down from the very first line of `index.html`, inline, before any download; on iOS, a native view shows the same logo and the version over the web view. They go away when the application starts.

**EF-NAT-8** - the logo pulses gently; under `prefers-reduced-motion`, it stays still.

### Accessibility page (`EF-A11`)

| Ref.     | Requirement                                                                    | Prio |
| -------- | ------------------------------------------------------------------------------ | ---- |
| EF-A11-1 | An "♿ Accessibility" link is reachable from the timer.                         | M    |
| EF-A11-2 | The page publishes the statement following the plan of decree no. 2019-768.    | M    |
| EF-A11-3 | The page is translated into the seven languages.                               | M    |
| EF-A11-4 | A session continues, ends and is recorded while the page is being read.        | M    |
| EF-A11-5 | The page states that the statement is voluntary.                               | M    |
| EF-A11-6 | No compliance rate is announced without an audit carried out by a third party. | M    |
| EF-A11-7 | The statement names what it is based on.                                       | M    |

#### Details

**EF-A11-2** - the seven sections, in the order of the decree: commitment, state of compliance, test
results, content not accessible (non-compliances, exemptions for disproportionate burden, content not
subject to the rules), preparation of the statement, contact, redress procedures.

**EF-A11-5** - the application does not fall within the scope of article 47: implying an obligation would
be false.

**EF-A11-6** - a self-assigned percentage would mislead about what has actually been verified.

**EF-A11-7** - the date, the technologies, the test environment, the tools and the pages evaluated; and the
fact that no assistive technology was used.

## Business rules

| Ref.   | Rule                                                                                       |
| ------ | ------------------------------------------------------------------------------------------ |
| RG-1   | Adjustable duration: 0 to 60 min; mode duration: 1 to 60 min.                              |
| RG-2   | The extension is 5 min, on **work** sessions, once per session.                            |
| RG-3   | A long break is offered after every **4** completed work sessions.                         |
| RG-4   | Above **40 min**, milestones fall at **45, 30 and 15** min remaining.                      |
| RG-4b  | A milestone's sound, vibration and channel come from its **rank**.                         |
| RG-5   | No milestone sound is played during finger adjustment.                                     |
| RG-6   | A session interrupted before **60 s** have been counted down is not recorded.              |
| RG-7   | The history keeps at most the **500** most recent sessions.                                |
| RG-8   | The recorded time excludes breaks and includes the extension.                              |
| RG-9   | The name and colour of a session are frozen when it is recorded.                           |
| RG-13  | At least one mode always exists: deleting the last one is refused.                         |
| RG-14  | Without local storage, the application remains usable.                                     |
| RG-15  | A milestone passed by more than **90 s** when returning to the foreground is not replayed. |
| RG-16  | A routine has 1 to 10 steps; the last one cannot be deleted.                               |
| RG-16b | A step lasts **5 s to 60 min**; a routine runs for **1 to 20 rounds**.                     |
| RG-17  | During a routine, the "+5 min" extension does not apply.                                   |
| RG-18  | During a routine, chaining follows the steps of the routine.                               |
| RG-19  | A step outside the day's focus is recorded as a break.                                     |
| RG-20  | A reminder with no day ticked is not saved.                                                |
| RG-21  | Tapping a reminder **arms** the routine; it does not start it.                             |
| RG-22  | Reminders are rescheduled in bulk on every change.                                         |
| RG-23  | The tutorial is shown until it has been seen, and never again afterwards.                  |
| RG-24  | The tutorial never advances on its own, and the settings panel closes first.               |
| RG-25  | The round counter restarts at 1 when the routine starts, or when it is left.               |
| RG-26  | Dial graduated in seconds: **setting** the duration is blocked.                            |
| RG-27  | The dial's unit follows the **set duration**, never the remaining time.                    |
| RG-28  | Sport mode **tints** the theme's background (18 to 30 %) instead of replacing it.          |
| RG-29  | On this tinted background, the secondary grey moves to the strong grey.                    |
| RG-30  | The test notification lives above the two other identifier bounds.                         |

### Details

**RG-4** - below 40 min, milestones are calculated from the chosen duration: the **half**, the **last
quarter**, then **1 min** before the end. Otherwise a 25-minute Pomodoro would be warned only once, and a
10-minute routine step never.

**RG-4b** - the last milestone is therefore always the most insistent, whatever the duration.

**RG-6** - it is a false start, not a session.

**RG-7** - the oldest ones are deleted.

**RG-8** - `activeSeconds`: the time actually counted down.

**RG-9** - renaming a mode does not rewrite the history.

**RG-11** - up to today, or up to yesterday if nothing has been done yet today.

**RG-14** - in private browsing or with blocked storage, settings only last for the session.

**RG-16b** - a duration or round count out of bounds is brought back within the bounds when read.

**RG-17** - what was announced happens at the announced time.

**RG-18** - whether or not the "chain work → break" option is active.

**RG-19** - brushing one's teeth is not work time (RG-10).

**RG-20** - better no reminder than a reminder that will never go off. Switching a reminder on ticks the whole
week.

**RG-21** - a countdown that starts without any gesture from the user is a source of anxiety.

**RG-22** - this way they escape the cancellation of session alerts, which happens on every return to the
foreground.

**RG-23** - once passed, finished or seen, it does not reappear on its own.

**RG-24** - two modals at once would not be heard properly.

**RG-25** - never when jumping from one step to another: redoing a step does not restart the training.

**RG-26** - swiping, arrows and the − / + buttons work in minutes. Starting and pausing remain possible.

**RG-27** - a Pomodoro does not switch to seconds in its last minute.

**RG-28** - light stays light, dark stays dark, and the texts keep their contrast.

**RG-29** - measured on the ten colours of the palette, it was 2.82:1 (WCAG 1.4.3).

**RG-30** - neither the return to the foreground, which cancels session alerts, nor the bulk rewrite of
reminders erases it: it has to arrive, that is its whole purpose.

## Non-functional requirements

### Accessibility (`ENF-A11`)

| Ref.       | Requirement                                                              |
| ---------- | ------------------------------------------------------------------------ |
| ENF-A11-1  | Targeted frameworks: **RGAA 4.1** and **WCAG 2.1 level AA**.             |
| ENF-A11-2  | All functions are reachable by keyboard alone.                           |
| ENF-A11-3  | Focus is trapped in the settings panel, and Escape closes it.            |
| ENF-A11-4  | The remaining time and state changes go through a live region.           |
| ENF-A11-5  | Text contrast of at least 4.5:1, in light as well as dark theme.         |
| ENF-A11-6  | No information is carried by colour alone.                               |
| ENF-A11-7  | The system "reduce motion" preference is respected.                      |
| ENF-A11-8  | No rapid flashing: the only visual alert beats at 0.6 Hz.                |
| ENF-A11-9  | The dial exposes a slider role, with value, bounds and readable text.    |
| ENF-A11-10 | axe-core tests report no violation on the covered journeys.              |
| ENF-A11-11 | What is set by dragging can also be set with a simple pointer.           |
| ENF-A11-12 | The remaining time can be spoken aloud by the device's speech synthesis. |
| ENF-A11-13 | Each milestone and the end have a distinct vibration pattern.            |
| ENF-A11-15 | A routine step is identifiable without being able to read.               |

#### Details

**ENF-A11-1** - declared status: compliant with WCAG 2.1 level AA and RGAA 4.1.

**ENF-A11-2** - with an always-visible focus indicator.

**ENF-A11-8** - a beat of 1.6 s, five times below the threshold of three flashes per second (WCAG 2.3.1). It can
be set, switched off, and freezes under `prefers-reduced-motion`.

**ENF-A11-10** - axe-core on WCAG 2.0 / 2.1 levels A and AA, plus best practices, in light and dark themes.

**ENF-A11-11** - WCAG 2.5.7, with targets of at least 44 × 44 px (WCAG 2.5.8).

**ENF-A11-12** - a three-choice setting, offline, off by default: without looking at the dial.

**ENF-A11-13** - recognisable without sight or hearing: it is the only alert channel for a deafblind person.

**ENF-A11-15** - a pictogram precedes its name, and its state (done, current, upcoming) is carried by a tick and by
the accessible name, never by colour alone.

#### Known and accepted gaps

Published in the accessibility statement:

- the dial is a slider whose activation also starts the timer (RGAA 7.1 and 7.3);
- the contrast of non-text elements has not been measured on the rendering (3.2);
- 200% magnification and the screen reader journey have not been checked manually (10.4, 7.1).

### Privacy and security

| Ref.      | Requirement                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| ENF-SEC-1 | No data leaves the device: no account, no server, no analytics.                                               |
| ENF-SEC-2 | Preferences, modes and history reside in the device's local storage.                                          |
| ENF-SEC-3 | No sensitive personal data is collected; GDPR does not apply to any remote processing.                        |
| ENF-SEC-4 | Vulnerabilities are reported privately through the repository's GitHub security advisory (see `SECURITY.md`). |

### Performance and robustness

| Ref.      | Requirement                                                                             |
| --------- | --------------------------------------------------------------------------------------- |
| ENF-PER-1 | Initial bundle budget: warning at 500 kB, error at 1 MB.                                |
| ENF-PER-2 | Both pages are loaded on demand: the accessibility page does not weigh on startup.      |
| ENF-PER-3 | The accuracy of the countdown does not depend on the regularity of the browser's ticks. |
| ENF-PER-4 | A session in progress survives navigation between the two pages.                        |
| ENF-PER-5 | An unavailable service never blocks the application.                                    |

**ENF-PER-5** - storage, notifications, haptics or keeping the screen on.

### Compatibility

| Target   | Requirement                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| Browsers | Modern browsers supporting Web Audio and CSS logical properties                               |
| iOS      | iOS 15 or later                                                                               |
| Android  | Channel-based notifications; the exact alarm permission may be required from Android 12       |
| macOS, Windows | Electron app: macOS DMG (Apple Silicon) and Windows x64 installer |
| Screens  | Mobile-first design; light and dark themes; left-to-right and right-to-left writing direction |

### Maintainability

| Ref.      | Requirement                                                                   |
| --------- | ----------------------------------------------------------------------------- |
| ENF-MNT-1 | Adding a language requires only a dictionary and four declarations.           |
| ENF-MNT-2 | Colours are centralised CSS variables, never hard-coded in components.        |
| ENF-MNT-3 | Accessibility regression tests are run on every push and every merge request. |
| ENF-MNT-4 | Commit messages follow the semantic format.                                   |

**ENF-MNT-1** - a missing key is a compile-time error.

## Out of scope

- Account, synchronisation, server, usage statistics, telemetry: the application stays local.

- Punitive score, penalty, ranking: no performance goal (the "No pressure" principle).

- Removed after trying them: dial lock, table mode, statistics tab, animated boot screen, iOS widget and Live Activity.

## Decisions made

- **Everything is local**: no back end, the only persistence is `localStorage`.

- **Accessibility by default**: RGAA 4.1 and WCAG 2.1 AA, checked in continuous integration.

- **Dial lock removed** (12 November 2026).

- **Table mode removed** (13 November 2026).

- **iOS widget and Live Activity removed** (13 November 2026); the widget and the persistent countdown stay on Android.

- **Statistics tab and animated boot screen removed** (October 2026).

## Acceptance criteria

A contribution is accepted when:

- the production build passes;
- the accessibility suite reports no violation;
- no colour is hard-coded;
- no translation key is missing (the compiler checks it);
- the commit message follows the semantic format.

## Risks

| Limit                                                   | Reason                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| History capped at 500 sessions                          | Size of `localStorage`; beyond that, the statistical value is marginal       |
| No data export by the user                              | Not specified to date                                                        |
| No widget or persistent countdown on iOS                | Removed; only Android has them                                               |
| `WidgetState` contract duplicated in TypeScript / Java  | No code generation; any change is made on both sides                         |
| No tests with a real screen reader                      | Automatic checks and code review only; the gap is published in the statement |
| Accessibility tests on Chromium only                    | A single engine in CI                                                        |
