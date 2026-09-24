<div align="center">

<img src="public/apple-touch-icon.png" alt="Icône Pomodoro TDAH" width="96" height="96">

# Pomodoro TDAH

**Un minuteur visuel pour l'autisme, le TDAH et les profils neurodivergents.**
On voit le temps qui reste au lieu de le lire.

![TDAH](https://img.shields.io/badge/TDAH-friendly-8b6fd6)
![Autisme](https://img.shields.io/badge/autisme-friendly-5d9fb6)
![Neurodivergent](https://img.shields.io/badge/neurodivergent-friendly-56b27b)
![Minuteur visuel](https://img.shields.io/badge/minuteur-visuel-f3a52b)
![Pomodoro](https://img.shields.io/badge/pomodoro-🍅-d63f4f)

![iOS](https://img.shields.io/badge/iOS-000000?logo=apple&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white)
![Web](https://img.shields.io/badge/Web-4285F4?logo=googlechrome&logoColor=white)
![Mode sombre](https://img.shields.io/badge/mode_sombre-✓-1d282d)
![Langues](https://img.shields.io/badge/langues-FR_·_EN_·_ES_·_DE_·_IT_·_PT_·_AR-0055A4)

<img src="docs/screenshot.png" alt="Pomodoro TDAH en mode clair" width="300">
&nbsp;&nbsp;
<img src="docs/screenshot-dark.png" alt="Pomodoro TDAH en mode sombre" width="300">

</div>

---

## Sommaire

- [Pourquoi un minuteur visuel ?](#pourquoi-un-minuteur-visuel-)
- [Ce que fait l'application](#ce-que-fait-lapplication)
- [Comment s'en servir](#comment-sen-servir)
- [Les sons](#les-sons)
- [Accessibilité](#accessibilité)
- [Pour les développeurs](#pour-les-développeurs)

## Pourquoi un minuteur visuel ?

Une horloge donne l'heure, un minuteur numérique affiche des chiffres, mais aucun des deux
ne **montre** vraiment le temps. Pomodoro TDAH reprend le principe du minuteur visuel : un
disque coloré couvre la durée choisie et **rétrécit à mesure que le temps passe**. D'un
coup d'œil, on sait s'il reste beaucoup ou peu de temps, sans lire ni calculer.

Ce repère concret aide particulièrement les personnes **TDAH, autistes ou neurodivergentes** :

- 🧭 **Rendre le temps concret** : une durée abstraite devient une surface qui diminue.
- 🔄 **Faciliter les transitions** : les sons à 45, 30 et 15 min puis le carillon de fin
  préviennent en douceur qu'un changement d'activité approche.
- 🌱 **Favoriser l'autonomie** : on gère soi-même son temps de travail ou de pause, sans
  qu'un adulte ou un collègue ait à le rappeler.
- 🏠 **Au quotidien** : devoirs, routines du matin, temps d'écran, séances de travail en
  Pomodoro, à la maison comme en classe ou au bureau.

> [!NOTE]
> Projet indépendant, inspiré du principe des minuteurs visuels. Il n'est ni affilié ni
> approuvé par Time Timer®, marque déposée de son propriétaire.

## Ce que fait l'application

|                                 |                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 🕒 **Un cadran qui se vide**     | Un disque coloré recule vers 0, avec un anneau arc-en-ciel en 12 segments de 5 min, jusqu'à 60 min                     |
| 👆 **Réglage au doigt**          | Il suffit de glisser sur le cadran pour choisir les minutes, même pendant le décompte                                  |
| 🎯 **Modes personnalisables**    | Pomodoro, Pause, Pause longue, Focus TDAH… ou tes propres modes : nom, durée (1-60 min), couleur, travail ou pause     |
| 🔁 **Enchaînement automatique**  | Travail → pause → travail, avec une pause longue tous les 4 cycles (désactivable)                                      |
| 📊 **Historique & statistiques** | Temps de focus du jour, sessions terminées, série de jours, graphique des 7 derniers jours                             |
| 🏁 **Objectif quotidien**        | Un nombre de minutes de focus à viser chaque jour (10-300 min), avec une barre de progression                          |
| 🔔 **Sons de palier**            | Un son différent à 45, 30 et 15 min restantes, puis un carillon à la fin                                               |
| ⏱️ **+5 min automatique**        | À 0, cinq minutes de plus pour terminer ce qui est en cours (désactivable)                                             |
| 📳 **Vibration**                 | Petit retour tactile à la fin et pendant le réglage                                                                    |
| 📲 **Notifications**             | Alertes même téléphone verrouillé ou app en arrière-plan, avec les mêmes sons que l'app                                |
| 🔆 **Écran toujours allumé**     | L'écran ne s'éteint pas pendant le décompte (désactivable)                                                             |
| 🧩 **Widget iPhone**             | Le décompte en cours ou l'objectif du jour, directement sur l'écran d'accueil                                          |
| 🌍 **7 langues**                 | Français, anglais, espagnol, allemand, italien, portugais, arabe (lu de droite à gauche)                               |
| 🌗 **Mode sombre**               | Suit le réglage de l'appareil, puis modifiable dans ⚙︎                                                                  |
| 🔇 **Son on/off**                | Coupure complète des sons, choix mémorisé                                                                              |

Le décompte reste juste même si l'application passe en arrière-plan ou si le téléphone se
verrouille : au retour, tout est à jour.

## Comment s'en servir

| Geste                      | Action                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| **Toucher** le cadran ou ▶ | Démarrer, mettre en pause ou reprendre                                       |
| **Glisser** sur le cadran  | Régler les minutes (0 → 60)                                                  |
| ↺                          | Remettre à zéro                                                              |
| ⚙︎ → **Modes**              | Choisir, créer, modifier ou supprimer un mode                                |
| ⚙︎ → **Stats**              | Voir son objectif du jour, ses statistiques et l'historique des sessions     |
| ⚙︎ → **Réglages**           | Mode sombre, sons, +5 min, enchaînement, écran allumé, objectif, langue      |

<p align="center">
  <img src="docs/screenshot-modes.png" alt="Éditeur de mode" width="260">
  &nbsp;&nbsp;
  <img src="docs/screenshot-stats.png" alt="Statistiques" width="260">
</p>

## Les sons

Ils vont du plus discret au plus insistant à mesure que la fin approche, et on peut les
écouter dans ⚙︎ → *Écouter les sons*.

| Moment               | Son                                                 |
| -------------------- | --------------------------------------------------- |
| **45 min** restantes | 1 note douce et ronde                               |
| **30 min**           | 2 notes montantes, un peu plus claires              |
| **15 min**           | 3 notes rapides, façon « bip »                      |
| **0**                | Un carillon joué 3 fois, avec vibration             |

## Accessibilité

L'application est pensée pour être utilisable par tout le monde :

- 💻 **Au clavier seul** : tout se fait sans souris, avec un repère visible sur l'élément actif.
- 🔊 **Avec un lecteur d'écran** : le temps qui reste et les changements sont annoncés à voix haute.
- 👁️ **Lisible pour tous** : contrastes soignés, mode sombre, couleurs toujours accompagnées d'un nom.
- 🔤 **Police pour la dyslexie** : la police OpenDyslexic peut être activée dans les réglages.
- 🌀 **Animations réduites** : si ton appareil demande moins de mouvement, l'application le respecte.

Une page dédiée détaille tout cela (référentiel RGAA 4.1) : lien **♿ Accessibilité** en bas
à droite de l'application.

## Pour les développeurs

- [Installation et commandes](docs/installation.md)
- [Build mobile (iOS / Android), notifications et widget](docs/mobile.md)
- [Architecture du code](docs/architecture.md)
