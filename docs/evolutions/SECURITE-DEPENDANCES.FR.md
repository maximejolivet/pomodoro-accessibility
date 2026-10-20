# Évolution : sécurité des dépendances (Snyk)

🇫🇷 Français · [🇬🇧 English](SECURITE-DEPENDANCES.md)

[← Retour au README](../../README.FR.md) · [Spécification technique](DESKTOP-TECHNIQUE.FR.md)

## 1. Objet

Mise en place de l'analyse de vulnérabilités des dépendances npm avec **Snyk**, et correction des
deux vulnérabilités qui n'avaient pas de correctif direct par mise à jour du paquet parent.

## 2. Outil

- Snyk CLI **1.1308.1**, installé globalement : `npm install -g snyk`.
- Authentification : `snyk auth` (interactive, à faire une fois par machine).
- Analyse : `snyk test` à la racine du projet (lecture seule).
- `snyk fix` n'est pas disponible sans activation de la fonctionnalité bêta dans le compte Snyk
  (erreur `SNYK-CLI-0000`). Les corrections ont donc été faites à la main.

## 3. Résultats

| État | Vulnérabilités | Chemin |
|------|----------------|--------|
| Avant | 2 (1 HIGH, 1 MEDIUM) | — |
| Après zod | 1 (MEDIUM, uuid) | — |
| Après uuid | **0** sur 116 dépendances | — |

### 3.1 zod 4.6.5 — HIGH (SNYK-JS-ZOD-20510278)

- Problème : allocation de ressources sans limite ou sans throttling.
- Chemin : `@angular/forms@22.2.0` → `zod@4.6.5`.
- Correctif : `4.6.6`.
- Action : `overrides.zod = "^4.6.6"` dans `package.json`. Résolu en **4.6.7**, sur toutes les copies
  (`@angular/cli`, `@angular/forms`, `@modelcontextprotocol`).
- Vérifications : `npm run build` OK ; `snyk test` sans zod.

### 3.2 uuid 7.0.3 — MEDIUM (SNYK-JS-UUID-16133035)

- Problème : validation incorrecte d'index, de position ou de décalage.
- Chemin : `@capacitor/cli@8.5.2` → `xcode@3.0.1` → `uuid@7.0.3`.
- Correctif : `11.1.1` ou `14.0.0`.
- Action : `overrides.uuid = "^11.1.1"`. Choix de **11.x** : `xcode` n'utilise que `uuid.v4()`, présent
  dans les deux versions. Le passage à la 14 aurait été un saut de version majeure de plus sans
  bénéfice pour cet usage.
- Vérifications :
  - `snyk test` : 0 problème ;
  - `npm run build` OK ;
  - `xcode` a parsé le vrai fichier `ios/App/App.xcodeproj/project.pbxproj` (16 objets) et généré un
    UUID avec `generateUuid()`.
- **Non vérifié** : un build Xcode complet, qui n'a pas été lancé sur cette machine.

## 4. Points d'attention

- Les `overrides` forcent une version pour toutes les copies d'un paquet. À chaque mise à jour
  d'Angular ou de Capacitor, vérifier qu'ils restent nécessaires : un override devenu inutile peut
  bloquer une mise à jour future.
- `npm install` a signalé `allow-scripts` pour `snyk`, `fsevents`, `lmdb` et `msgpackr-extract` : leurs
  scripts d'installation ne tournent pas sans autorisation explicite. Pour Electron, le binaire n'était
  pas présent après l'installation : il a été téléchargé à la main
  (`node node_modules/electron/install.js`).
- `npm audit` a également affiché des avertissements. Ils n'ont pas été traités dans cette évolution :
  Snyk fait référence ici.

## 5. Procédure de vérification

```bash
snyk auth                 # une fois par machine
snyk test                 # dans la racine du projet
npm run build             # après tout changement de dépendances
```

Pour une correction future :
1. Lire le chemin de dépendance dans la sortie de `snyk test` (`introduced by …`).
2. Si le parent peut être mis à jour sans rupture, le faire d'abord.
3. Sinon, ajouter un `overrides` ciblé, puis vérifier le build et les tests.
4. Relancer `snyk test`.
