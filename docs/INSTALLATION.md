# Installation et commandes

[← Retour au README](../README.md)

**Prérequis :** Node.js 22+ · npm 10+ · Xcode (iOS) · Android Studio (Android)

```bash
git clone <url-du-repo> pomodoro-tdah
cd pomodoro-tdah
make install   # npm install
make dev       # http://localhost:4200
```

## Commandes `make`

Lancer `make` seul affiche l'aide.

| Commande                              | Rôle                                                            |
| ------------------------------------- | --------------------------------------------------------------- |
| `make install`                        | Installe les dépendances                                        |
| `make dev`                            | Serveur de dev avec rechargement à chaud                        |
| `make build`                          | Build de production                                             |
| `make watch`                          | Build de dev en continu                                         |
| `make test`                           | Tests unitaires (Karma / Jasmine)                               |
| `make test-a11y`                      | Tests d'accessibilité (axe-core + clavier, via Playwright)      |
| `make sync`                           | Build, copie dans `www/`, `npx cap sync`, puis `make sounds`    |
| `make sounds`                         | Génère les sons de notification (WAV) et les copie dans Android |
| `make icon`                           | Génère l'icône iOS depuis `resources/app-icon.svg`              |
| `make ios` / `make android`           | Ajoute la plateforme native (une seule fois)                    |
| `make open-ios` / `make open-android` | Sync puis ouvre Xcode / Android Studio                          |
| `make clean`                          | Supprime `dist/`, `www/` et le cache Angular                    |

La première exécution de `make test-a11y` demande le navigateur de test :
`npx playwright install chromium`. Les mêmes tests tournent en CI à chaque push
(`.github/workflows/a11y.yml`).

## Technologies

Angular 22 · Capacitor 8 · TypeScript 6 · RxJS 7.8 · Tailwind CSS 4 · Web Audio API.
