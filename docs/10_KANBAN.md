# Tableau Kanban

## Principe

Le travail circule en continu. Il n'y a pas de sprints fixes. Une nouvelle carte démarre quand une place se libère, et on limite le travail en cours pour finir ce qui est commencé avant de démarrer autre chose.

## Tableau

| Colonne | Signification | Règle d'entrée |
| --- | --- | --- |
| **Backlog** | Stories des [epics](08_EPICS.md) et points de [`ROADMAP.md`](../ROADMAP.md) pas encore préparés | Story listée dans un epic ou point listé dans [`ROADMAP.md`](../ROADMAP.md) |
| **Prêt** | La carte est assez claire pour démarrer | La définition de prêt (ci-dessous) est remplie |
| **En cours** | Quelqu'un y travaille, sur `develop` | Limite de travail en cours respectée (ci-dessous) |
| **Revue** | Code, tests et documentation attendent une vérification | Pull request `develop` → `main` ouverte |
| **Terminé** | Fusionné dans `main` et vérifié par rapport aux critères d'acceptation | La définition de terminé (ci-dessous) est remplie |

Chaque carte correspond à une story, nommée avec son identifiant d'epic : par exemple `E1-S5 Boutons − / +`. Les points de [`ROADMAP.md`](../ROADMAP.md) sans story gardent leur intitulé.

Le document des epics reste la source des stories. [`ROADMAP.md`](../ROADMAP.md) liste ce qui est ouvert, et les issues GitHub (dont le tableau de bord Renovate) portent les mises à jour de dépendances.

## Limites de travail en cours

- **En cours** : 2 cartes au maximum à la fois.
- **Revue** : 1 pull request ouverte à la fois, car `develop` et `main` sont les deux seules branches.
- Démarrer une carte est un choix. Terminer une carte passe avant.

## Classes de service

| Classe | Usage | Règle |
| --- | --- | --- |
| **Urgent** | Faille de sécurité, build cassé, une alerte qui ne part pas, un parcours inutilisable au clavier ou au lecteur d'écran | Pris immédiatement, avant toute autre carte |
| **Standard** | Stories P0 et P1, et points de [`ROADMAP.md`](../ROADMAP.md) | Pris dans l'ordre du backlog |
| **Plus tard** | Stories P2 et idées pas encore dans le PRD | Pris seulement quand aucune carte standard n'est prête |

## Définition de prêt

Une carte passe en **Prêt** quand :

- ses critères d'acceptation sont écrits, au format Étant donné / Quand / Alors quand elle décrit un comportement ;
- ses dépendances (cartes précédentes, décisions à prendre) sont terminées ou tranchées ;
- elle indique les exigences du PRD qu'elle couvre.

## Définition de terminé

Une carte passe en **Terminé** quand :

- les changements sont fusionnés dans `main` par une pull request issue de `develop`, avec l'identifiant de la story dans le message de commit (par exemple `feat(timer): E1-S5 boutons − / +`) ;
- le job « Build de production » et le job « Non-régression d'accessibilité » passent ;
- aucune couleur n'est écrite en dur et aucune clé de traduction ne manque ;
- les critères d'acceptation sont vérifiés, sur un appareil réel quand la carte touche le natif (iOS ou Android) ;
- le README et les documents concernés sont à jour (les [epics](08_EPICS.md), le [PRD](02_PRD.md) si une exigence change).

## Règles de circulation

- **Commits** au format sémantique : `type(scope): emoji description`, en anglais, sans point final.
- **Branches** : le travail se fait sur `develop` ; une pull request `develop` → `main` livre un lot de changements.
- **Cartes bloquées** : elles restent dans leur colonne avec la raison du blocage.
- **Décisions à prendre** : elles sont soumises au porteur du projet dès qu'une carte en dépend. Elles ne sont pas tranchées dans une carte.
- **Retraits** : une fonction retirée est notée dans l'epic E12 et dans « Décisions prises » du PRD, avec sa date.

## Indicateurs

Revus de temps en temps, sans objectif chiffré :

- **Débit** : cartes passées en Terminé par semaine.
- **Délai de traitement** : temps entre Prêt et Terminé.
- **Santé de la CI** : part des pull requests dont les deux jobs passent du premier coup.
- **Accessibilité** : nombre de violations axe-core (la cible reste 0).

## Cadence

- **Revue hebdomadaire (30 minutes)** : regarder le tableau et [`ROADMAP.md`](../ROADMAP.md) ; choisir les cartes de la semaine suivante.
- **Réapprovisionnement** : quand Prêt contient moins de 3 cartes, les suivantes du backlog sont préparées.
- **Rétrospective** : une fois par mois, une question : qu'est-ce qui a ralenti le flux ? La réponse est ajoutée à ce document.

<br>

<p align="center">
  <img height="32" src="https://img.shields.io/badge/-%F0%9F%87%AC%F0%9F%87%A7%20English-012169?style=for-the-badge" alt="🇬🇧 English">
</p>

<br>

# Kanban board

## Principle

Work flows continuously. There are no fixed sprints. A new card starts when a slot frees up, and work in progress is limited so that what has been started gets finished before anything else begins.

## Board

| Column | Meaning | Entry rule |
| --- | --- | --- |
| **Backlog** | Stories from the [epics](08_EPICS.md) and [`ROADMAP.md`](../ROADMAP.md) items not yet prepared | Story listed in an epic or item listed in [`ROADMAP.md`](../ROADMAP.md) |
| **Ready** | The card is clear enough to start | The definition of ready (below) is met |
| **In progress** | Someone is working on it, on `develop` | Work-in-progress limit respected (below) |
| **Review** | Code, tests and documentation await a check | A `develop` → `main` pull request is open |
| **Done** | Merged into `main` and checked against the acceptance criteria | The definition of done (below) is met |

Each card matches a story, named with its epic identifier: for example `E1-S5 − / + buttons`. [`ROADMAP.md`](../ROADMAP.md) items that have no story keep their own title.

The epics document stays the source of the stories. [`ROADMAP.md`](../ROADMAP.md) lists what is open, and GitHub issues (including the Renovate dashboard) carry the dependency updates.

## Work-in-progress limits

- **In progress**: 2 cards at most at a time.
- **Review**: 1 open pull request at a time, since `develop` and `main` are the only two branches.
- Starting a card is a choice. Finishing a card comes first.

## Classes of service

| Class | Use | Rule |
| --- | --- | --- |
| **Urgent** | Security flaw, broken build, an alert that does not fire, a flow that cannot be used with a keyboard or a screen reader | Taken immediately, before any other card |
| **Standard** | P0 and P1 stories, and [`ROADMAP.md`](../ROADMAP.md) items | Taken in backlog order |
| **Later** | P2 stories and ideas not yet in the PRD | Taken only when no standard card is ready |

## Definition of ready

A card moves to **Ready** when:

- its acceptance criteria are written, in the Given / When / Then format when it describes a behaviour;
- its dependencies (previous cards, decisions to make) are done or settled;
- it states the PRD requirements it covers.

## Definition of done

A card moves to **Done** when:

- the changes are merged into `main` through a pull request from `develop`, with the story identifier in the commit message (for example `feat(timer): E1-S5 − / + buttons`);
- the "Production build" job and the "Accessibility regression" job pass;
- no colour is hard-coded and no translation key is missing;
- the acceptance criteria are checked, on a real device when the card touches the native side (iOS or Android);
- the README and the relevant documents are up to date (the [epics](08_EPICS.md), the [PRD](02_PRD.md) if a requirement changes).

## Flow rules

- **Commits** in the semantic format: `type(scope): emoji description`, in English, with no final full stop.
- **Branches**: work happens on `develop`; a `develop` → `main` pull request ships a batch of changes.
- **Blocked cards**: they stay in their column with the reason for the block.
- **Decisions to make**: they go to the project owner as soon as a card depends on them. They are not settled inside a card.
- **Removals**: a removed feature is noted in epic E12 and in "Decisions made" of the PRD, with its date.

## Indicators

Reviewed from time to time, with no numeric target:

- **Throughput**: cards moved to Done per week.
- **Lead time**: time between Ready and Done.
- **CI health**: share of pull requests whose two jobs pass first time.
- **Accessibility**: number of axe-core violations (the target stays 0).

## Cadence

- **Weekly review (30 minutes)**: look at the board and [`ROADMAP.md`](../ROADMAP.md); choose the next week's cards.
- **Replenishment**: when Ready holds fewer than 3 cards, the next ones from the backlog are prepared.
- **Retrospective**: once a month, one question: what slowed the flow down? The answer is added to this document.
