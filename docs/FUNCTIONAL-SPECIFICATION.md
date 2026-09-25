# Cahier des charges fonctionnel

[← Retour au README](../README.md) · [Cahier des charges technique](TECHNICAL-SPECIFICATION.md)

Version 1.0 — 25 septembre 2026 · Application **Pomodoro Accessibilité** (web, iOS, Android)

## Sommaire

- [1. Contexte et objectifs](#1-contexte-et-objectifs)
- [2. Périmètre](#2-périmètre)
- [3. Utilisateurs cibles](#3-utilisateurs-cibles)
- [4. Exigences fonctionnelles](#4-exigences-fonctionnelles)
- [5. Règles de gestion](#5-règles-de-gestion)
- [6. Parcours utilisateur](#6-parcours-utilisateur)
- [7. Exigences non fonctionnelles](#7-exigences-non-fonctionnelles)
- [8. Hors périmètre](#8-hors-périmètre)

---

## 1. Contexte et objectifs

### 1.1 Constat

Une horloge donne l'heure, un minuteur numérique affiche des chiffres : ni l'un ni l'autre ne
**montre** la durée restante. Pour beaucoup de personnes neurodivergentes (TDAH, autisme,
troubles DYS), le temps ne se « sent » pas — dix minutes et une heure peuvent paraître
identiques, et lire l'heure n'aide pas à savoir combien il reste.

### 1.2 Objectif produit

Fournir un **minuteur visuel** dans lequel un disque coloré couvre la durée choisie et rétrécit
à mesure que le temps passe, afin de remplacer un calcul par une image, et d'y adjoindre les
mécanismes de la méthode Pomodoro (sessions, pauses, enchaînement, statistiques) sans jamais
introduire de pression ni de jugement.

### 1.3 Objectifs mesurables

| Réf.  | Objectif                                          | Indicateur                                                                   |
| ----- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| OBJ-1 | Comprendre le temps restant sans lire de chiffres | Le cadran seul suffit à situer la durée (graduation 12 segments de 5 min)    |
| OBJ-2 | Être utilisable par tout le monde                 | RGAA 4.1 / WCAG 2.1 AA, 0 violation axe-core sur les parcours testés         |
| OBJ-3 | Fonctionner sans compte ni réseau                 | Aucune requête sortante, aucune donnée quittant l'appareil                   |
| OBJ-4 | Rester juste en arrière-plan                      | Écart de décompte nul après retour au premier plan                           |
| OBJ-5 | Servir hors du domaine scolaire                   | Usage en contexte professionnel documenté et supporté (open space, réunions) |

### 1.4 Principes directeurs

1. **Sans pression** : pas de score punitif, pas de sanction ; l'objectif quotidien est une cible.
2. **Contrôle à l'utilisateur** : sons, vibration, écran allumé, enchaînement — tout se coupe.
3. **Affichage calme** : pas de clignotement, animations réduites si l'appareil le demande.
4. **Fin en douceur** : à 0, une prolongation de 5 min évite l'arrêt brutal.
5. **Accessibilité par défaut**, jamais en option ajoutée après coup.

---

## 2. Périmètre

### 2.1 Plateformes

| Plateforme               | Support          | Spécificités                                              |
| ------------------------ | ---------------- | --------------------------------------------------------- |
| Web (navigateur moderne) | Cible principale | Sons Web Audio, Wake Lock si disponible                   |
| iOS                      | Via Capacitor    | Notifications locales, haptique, widget d'écran d'accueil |
| Android                  | Via Capacitor    | Notifications locales avec canaux sonores, haptique       |

### 2.2 Écrans

| Écran         | Route            | Contenu                                                                              |
| ------------- | ---------------- | ------------------------------------------------------------------------------------ |
| Minuteur      | `/`              | Cadran, affichage du temps, commandes, panneau coulissant (Modes / Stats / Réglages) |
| Accessibilité | `/accessibility` | Déclaration d'accessibilité RGAA, repères sur la neurodiversité, standards visés     |

### 2.3 Contraintes structurantes

- **Aucun serveur** : pas de compte, pas d'API, pas de synchronisation. Tout est local.
- **Aucune collecte** : ni analytique, ni télémétrie, ni identifiant.
- **Hors ligne total** : l'application fonctionne sans réseau après chargement.

---

## 3. Utilisateurs cibles

### 3.1 Profils

| Profil                                             | Difficulté fréquente                                 | Réponse de l'application                                                  |
| -------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| **TDAH**                                           | Estimer une durée, démarrer, s'arrêter à temps       | Repère visuel continu, sessions courtes, mode *Focus TDAH*                |
| **Autisme**                                        | Transitions, imprévu, bruit                          | Paliers annoncés à l'avance, sons doux et désactivables, interface stable |
| **Troubles DYS**                                   | Lire des chiffres ou une heure, fatigue à la lecture | Temps lisible sans chiffres, police OpenDyslexic, texte espacé            |
| **Autres profils**                                 | Besoin de consignes claires, de moins de pression    | Durées libres 1–60 min, modes personnalisés, aucune note                  |
| **Accompagnants** (parents, enseignants, managers) | Rappeler le temps sans intervenir                    | Durée visible par tous, autonomie de la personne                          |

### 3.2 Contextes d'usage

Devoirs et routines à la maison · classe · séances de travail en Pomodoro · réunions et
entretiens (durée visible pour tous) · open space et télétravail (vibration et notifications
discrètes) · aménagement de poste non stigmatisant, puisque l'outil sert à tout le monde.

### 3.3 Contexte technique d'usage

- Écran mobile en premier (le rendu est conçu sur une largeur de type téléphone).
- Usage possible clavier seul, lecteur d'écran, ou tactile.
- Session pouvant durer 60 min avec l'application en arrière-plan ou l'appareil verrouillé.

---

## 4. Exigences fonctionnelles

Codification : `EF-<domaine>-<n>`. Priorité : **M** (must), **S** (should), **C** (could).

### 4.1 Cadran et décompte (`EF-TIM`)

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
| EF-TIM-11 | Deux boutons − / + encadrent l'affichage : un appui retire ou ajoute une minute, un appui maintenu enchaîne les minutes. | M    |

### 4.2 Modes (`EF-MOD`)

| Réf.     | Exigence                                                                                                                                  | Prio |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| EF-MOD-1 | L'application est livrée avec quatre modes : Pomodoro (25 min), Pause (5 min), Pause longue (15 min), Focus TDAH (15 min).                | M    |
| EF-MOD-2 | L'utilisateur peut créer, modifier et supprimer ses propres modes.                                                                        | M    |
| EF-MOD-3 | Un mode porte : un nom, une durée de 1 à 60 min, une couleur choisie dans une palette de 10, une nature (travail / pause / pause longue). | M    |
| EF-MOD-4 | La couleur du mode teinte le cadran et l'historique.                                                                                      | M    |
| EF-MOD-5 | Les modes par défaut peuvent être restaurés depuis les réglages.                                                                          | S    |
| EF-MOD-6 | Le mode sélectionné est mémorisé d'une ouverture à l'autre.                                                                               | M    |
| EF-MOD-7 | Chaque couleur est toujours accompagnée de son nom (jamais d'information portée par la couleur seule).                                    | M    |

### 4.3 Enchaînement et prolongation (`EF-CHA`)

| Réf.     | Exigence                                                                                     | Prio |
| -------- | -------------------------------------------------------------------------------------------- | ---- |
| EF-CHA-1 | Option « +5 min » : à 0, une session de travail se prolonge automatiquement de 5 minutes.    | M    |
| EF-CHA-2 | La prolongation n'a lieu qu'une fois par session.                                            | M    |
| EF-CHA-3 | Option d'enchaînement automatique : travail → pause → travail, sans action de l'utilisateur. | S    |
| EF-CHA-4 | Une pause longue est proposée toutes les 4 sessions de travail terminées.                    | S    |
| EF-CHA-5 | Les deux options sont désactivables indépendamment.                                          | M    |

### 4.4 Alertes sonores et notifications (`EF-ALE`)

| Réf.     | Exigence                                                                                                                                            | Prio |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| EF-ALE-1 | Un son différent est joué à 45, 30 et 15 minutes restantes, puis un carillon à 0.                                                                   | M    |
| EF-ALE-2 | Les sons vont du plus discret au plus insistant à mesure que la fin approche.                                                                       | M    |
| EF-ALE-3 | Les sons peuvent être écoutés à la demande depuis les réglages.                                                                                     | S    |
| EF-ALE-4 | Les sons peuvent être coupés globalement ; le choix est mémorisé.                                                                                   | M    |
| EF-ALE-5 | Sur mobile, des notifications locales reprennent ces alertes quand l'application est en arrière-plan ou l'appareil verrouillé, avec les mêmes sons. | M    |
| EF-ALE-6 | Les notifications sont annulées au retour au premier plan, où les sons de l'application prennent le relais.                                         | M    |
| EF-ALE-7 | Un palier dépassé de plus de 90 s pendant un passage en arrière-plan n'est pas rejoué : la notification a déjà prévenu.                             | S    |
| EF-ALE-8 | L'autorisation de notification est demandée au premier démarrage du minuteur, pas à l'ouverture.                                                    | M    |
| EF-ALE-11 | Chaque palier et la fin déclenchent un signal visuel (aucun / doux / fort) : un battement au palier, trois à la fin.                               | S    |
| EF-ALE-12 | Le signal visuel bat à 0,6 Hz au plus, se fige sous `prefers-reduced-motion`, n'intercepte aucun clic et n'est pas exposé aux lecteurs d'écran.    | M    |
| EF-ALE-13 | À la fin, un bandeau « Temps écoulé » reste affiché jusqu'à la prochaine action : une alerte qui passe se rate.                                    | S    |

### 4.5 Historique, statistiques et objectif (`EF-HIS`)

| Réf.     | Exigence                                                                                                                         | Prio |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | ---- |
| EF-HIS-1 | Chaque session terminée est enregistrée : nom, couleur, nature, durée prévue, temps réellement décompté, début, fin, achèvement. | M    |
| EF-HIS-2 | L'onglet Stats affiche le temps de focus du jour, les sessions terminées et la série de jours consécutifs.                       | M    |
| EF-HIS-3 | Un graphique montre les minutes de focus des 7 derniers jours.                                                                   | S    |
| EF-HIS-4 | Les 10 dernières sessions sont listées.                                                                                          | S    |
| EF-HIS-5 | Un objectif quotidien de focus est réglable de 10 à 300 min par pas de 5, avec une barre de progression.                         | S    |
| EF-HIS-6 | Les statistiques du jour se recalculent au passage de minuit sans redémarrage.                                                   | S    |
| EF-HIS-7 | Les statistiques sont indicatives : aucun score négatif, aucune notion d'échec.                                                  | M    |

### 4.6 Préférences (`EF-PRE`)

| Réf.     | Exigence                                                                         | Prio |
| -------- | -------------------------------------------------------------------------------- | ---- |
| EF-PRE-1 | Mode sombre : suit l'appareil au premier lancement, puis modifiable et mémorisé. | M    |
| EF-PRE-2 | Police OpenDyslexic activable.                                                   | M    |
| EF-PRE-3 | Sons on/off.                                                                     | M    |
| EF-PRE-4 | Prolongation « +5 min » on/off.                                                  | M    |
| EF-PRE-5 | Enchaînement automatique on/off.                                                 | S    |
| EF-PRE-6 | Écran toujours allumé pendant le décompte, on/off.                               | S    |
| EF-PRE-7 | Objectif quotidien réglable.                                                     | S    |
| EF-PRE-8 | Langue : automatique (langue de l'appareil) ou choisie.                          | M    |
| EF-PRE-9 | Toute préférence est conservée d'une ouverture à l'autre.                        | M    |
| EF-PRE-10 | Annonce vocale du temps restant : aucune, aux paliers, ou à chaque minute (défaut : aucune) ; le choix se fait entendre aussitôt. | S    |
| EF-PRE-12 | Alerte visuelle : aucune, douce ou forte (défaut : douce) ; le choix se montre aussitôt. | S    |

### 4.7 Internationalisation (`EF-I18`)

| Réf.     | Exigence                                                                                   | Prio |
| -------- | ------------------------------------------------------------------------------------------ | ---- |
| EF-I18-1 | Sept langues : français, anglais, espagnol, allemand, italien, portugais, arabe.           | M    |
| EF-I18-2 | L'arabe s'affiche de droite à gauche, mise en page comprise.                               | M    |
| EF-I18-3 | La langue est détectée depuis l'appareil au premier lancement, avec repli sur le français. | M    |
| EF-I18-4 | Le changement de langue est immédiat, sans rechargement.                                   | M    |
| EF-I18-5 | Les libellés transmis au widget et aux notifications suivent la langue de l'application.   | S    |

### 4.8 Écran allumé et widget (`EF-NAT`)

| Réf.     | Exigence                                                                                                     | Prio |
| -------- | ------------------------------------------------------------------------------------------------------------ | ---- |
| EF-NAT-1 | L'écran ne s'éteint pas pendant le décompte lorsque l'option est active.                                     | S    |
| EF-NAT-2 | Un widget d'écran d'accueil iOS affiche le décompte en cours ou l'objectif du jour.                          | C    |
| EF-NAT-3 | Le widget continue de décompter seul entre deux mises à jour de l'application.                               | C    |
| EF-NAT-4 | Le widget est mis à jour aux changements : démarrage, pause, fin, passage en arrière-plan, objectif, langue. | C    |

### 4.9 Page d'accessibilité (`EF-A11`)

| Réf.     | Exigence                                                                                                                                               | Prio |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| EF-A11-1 | Un lien « ♿ Accessibilité » est accessible depuis le minuteur.                                                                                         | M    |
| EF-A11-2 | La page publie la déclaration d'accessibilité : standards visés, environnement et outils de test, contenus non accessibles, contact, voies de recours. | M    |
| EF-A11-3 | La page est traduite dans les sept langues.                                                                                                            | M    |
| EF-A11-4 | Une session en cours continue, se termine et s'enregistre pendant la consultation de cette page.                                                       | M    |

---

## 5. Règles de gestion

| Réf.  | Règle                                                                                                                                                                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RG-1  | Durée réglable : 0 à 60 minutes ; durée d'un mode : 1 à 60 minutes.                                                                                                     |
| RG-2  | La prolongation automatique vaut 5 minutes, ne s'applique qu'aux sessions de **travail** et une seule fois par session.                                                 |
| RG-3  | Une pause longue est proposée toutes les **4** sessions de travail terminées.                                                                                           |
| RG-4  | Les paliers sonores se déclenchent à **45, 30 et 15** minutes restantes.                                                                                                |
| RG-5  | Aucun son de palier n'est joué pendant un réglage au doigt.                                                                                                             |
| RG-6  | Une session interrompue avant **60 secondes** décomptées n'est pas enregistrée (faux départ).                                                                           |
| RG-7  | L'historique conserve au maximum les **500** dernières sessions ; les plus anciennes sont supprimées.                                                                   |
| RG-8  | Le temps enregistré (`activeSeconds`) exclut les pauses et inclut la prolongation.                                                                                      |
| RG-9  | Le nom et la couleur d'une session sont figés à l'enregistrement : renommer un mode ne réécrit pas l'historique.                                                        |
| RG-10 | Le temps de focus du jour et l'objectif ne comptent que les sessions de nature **travail**.                                                                             |
| RG-11 | La série de jours compte les jours consécutifs avec au moins une session de travail **terminée**, jusqu'à aujourd'hui, ou hier si rien n'a encore été fait aujourd'hui. |
| RG-12 | L'objectif quotidien est borné à 10–300 minutes et arrondi au pas de 5.                                                                                                 |
| RG-13 | Au moins un mode existe en permanence : la suppression du dernier mode est refusée.                                                                                     |
| RG-14 | Si le stockage local est indisponible (navigation privée, stockage bloqué), l'application reste utilisable, les réglages ne valant que pour la session.                 |
| RG-15 | Un palier dépassé de plus de 90 secondes lors d'un retour au premier plan n'est pas rejoué.                                                                             |

---

## 6. Parcours utilisateur

### 6.1 Session simple

1. Ouverture : le mode mémorisé est sélectionné, sa durée s'affiche sur le cadran.
2. Réglage facultatif au doigt, aux boutons − / + ou au clavier.
3. Appui sur le cadran ou sur ▶ : le décompte démarre, l'écran reste allumé si l'option est active.
4. Paliers à 45 / 30 / 15 min restantes : un son, et une notification si l'application est en arrière-plan.
5. À 0 : carillon, vibration ; prolongation de 5 min si l'option est active, sinon fin.
6. La session est enregistrée si elle a duré au moins 60 s ; les statistiques du jour se mettent à jour.

### 6.2 Enchaînement automatique

À la fin d'une session de travail, la pause correspondante démarre ; à la fin de la pause, une
session de travail reprend. Toutes les 4 sessions de travail terminées, la pause longue remplace
la pause courte. L'utilisateur peut interrompre la chaîne à tout moment.

### 6.3 Création d'un mode

⚙︎ → Modes → « nouveau » : saisir un nom, régler la durée, choisir une couleur (nom affiché),
choisir la nature. Enregistrer. Le mode rejoint la liste et devient sélectionnable.

### 6.4 Consultation des statistiques

⚙︎ → Stats : objectif du jour et barre de progression, temps de focus, sessions terminées,
série de jours, histogramme des 7 derniers jours, 10 dernières sessions.

---

## 7. Exigences non fonctionnelles

### 7.1 Accessibilité (`ENF-A11`)

| Réf.       | Exigence                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ENF-A11-1  | Référentiels visés : **RGAA 4.1** et **WCAG 2.1 niveau AA**. Statut annoncé : partiellement conforme.                                                      |
| ENF-A11-2  | Toutes les fonctions sont atteignables au clavier seul, avec un indicateur de focus toujours visible.                                                      |
| ENF-A11-3  | Le focus est piégé dans le panneau de réglages tant qu'il est ouvert, et Échap le ferme.                                                                   |
| ENF-A11-4  | Le temps restant et les changements d'état sont annoncés aux lecteurs d'écran par une région live.                                                         |
| ENF-A11-5  | Contraste des textes d'au moins 4,5:1 en thème clair comme en thème sombre.                                                                                |
| ENF-A11-6  | Aucune information n'est portée par la couleur seule.                                                                                                      |
| ENF-A11-7  | La préférence système « animations réduites » est respectée.                                                                                               |
| ENF-A11-8  | Aucun clignotement rapide : la seule alerte lumineuse bat à 0,6 Hz (un battement de 1,6 s), cinq fois sous le seuil des trois éclats par seconde (WCAG 2.3.1) ; elle se règle, se coupe et se fige sous `prefers-reduced-motion`. |
| ENF-A11-9  | Le cadran expose un rôle de curseur avec valeur, minimum, maximum et texte de valeur lisible.                                                              |
| ENF-A11-10 | Les tests automatiques axe-core (WCAG 2.0/2.1 A et AA, bonnes pratiques) ne relèvent aucune violation sur les parcours couverts, en thème clair et sombre. |
| ENF-A11-11 | Tout réglage accessible par glissement l'est aussi par un pointeur simple (WCAG 2.5.7), avec des cibles d'au moins 44 × 44 px (WCAG 2.5.8).            |
| ENF-A11-12 | Le temps restant peut être dit à voix haute par la synthèse de l'appareil, sans regarder le cadran : réglage à trois choix, hors ligne, éteint par défaut. |

**Écarts connus et assumés**, publiés dans la déclaration : le cadran est un curseur dont
l'activation démarre aussi le minuteur (critères RGAA 7.1 et 7.3) ; le contraste des éléments
non textuels n'a pas été mesuré sur le rendu (3.2) ; l'agrandissement à 200 % et le parcours au
lecteur d'écran n'ont pas été vérifiés manuellement (10.4, 7.1).

### 7.2 Confidentialité et sécurité

| Réf.      | Exigence                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------ |
| ENF-SEC-1 | Aucune donnée ne quitte l'appareil : pas de compte, pas de serveur, pas d'analytique.                  |
| ENF-SEC-2 | Préférences, modes et historique résident dans le stockage local de l'appareil.                        |
| ENF-SEC-3 | Aucune donnée personnelle sensible n'est collectée ; le RGPD ne s'applique à aucun traitement distant. |
| ENF-SEC-4 | Les vulnérabilités se signalent en privé via l'avis de sécurité GitHub du dépôt (voir `SECURITY.md`).  |

### 7.3 Performance et robustesse

| Réf.      | Exigence                                                                                                               |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| ENF-PER-1 | Budget du bundle initial : alerte à 500 ko, erreur à 1 Mo.                                                             |
| ENF-PER-2 | Les deux pages sont chargées à la demande : la page d'accessibilité ne pèse pas sur le démarrage.                      |
| ENF-PER-3 | La précision du décompte ne dépend pas de la régularité des ticks du navigateur.                                       |
| ENF-PER-4 | Une session en cours survit à la navigation entre les deux pages.                                                      |
| ENF-PER-5 | L'indisponibilité du stockage, des notifications, de l'haptique ou du maintien d'écran ne bloque jamais l'application. |

### 7.4 Compatibilité

| Cible       | Exigence                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------- |
| Navigateurs | Navigateurs modernes supportant Web Audio et les propriétés logiques CSS                           |
| iOS         | Widget WidgetKit à partir d'iOS 17                                                                 |
| Android     | Notifications à canaux ; la permission d'alarme exacte peut être nécessaire à partir d'Android 12  |
| Écrans      | Conception mobile d'abord ; thème clair et sombre ; sens d'écriture gauche→droite et droite→gauche |

### 7.5 Maintenabilité

| Réf.      | Exigence                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ENF-MNT-1 | Ajouter une langue ne demande qu'un fichier de dictionnaire et quatre déclarations ; une clé manquante est une erreur de compilation. |
| ENF-MNT-2 | Les couleurs sont des variables CSS centralisées, jamais écrites en dur dans les composants.                                          |
| ENF-MNT-3 | Les tests de non-régression d'accessibilité sont rejoués à chaque poussée et chaque demande de fusion.                                |
| ENF-MNT-4 | Les messages de commit suivent le format sémantique.                                                                                  |

---

## 8. Hors périmètre

> Projet indépendant, inspiré du principe des minuteurs visuels. Il n'est ni affilié ni approuvé
> par Time Timer®, marque déposée de son propriétaire.
