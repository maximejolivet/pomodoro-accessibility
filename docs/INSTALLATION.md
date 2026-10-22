# Installation and commands

🇬🇧 English · [🇫🇷 Français](INSTALLATION.FR.md)

[← Back to the README](../README.md)

**Prerequisites:** Node.js 24.15+ (see `.nvmrc`) · npm 10+ · Xcode (iOS) · Android Studio (Android)

```bash
git clone <repo-url> pomodoro-tdah
cd pomodoro-tdah
make install   # npm install
make dev       # http://localhost:4200
```

## `make` commands

Running `make` on its own shows the help.

| Command                               | Role                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `make install`                        | Installs the dependencies                                                               |
| `make dev`                            | Dev server with hot reload                                                              |
| `make build`                          | Production build                                                                        |
| `make watch`                          | Continuous dev build                                                                    |
| `make test`                           | Unit tests (Karma / Jasmine) - no specs to date                                         |
| `make test-a11y`                      | Accessibility tests (axe-core + keyboard, via Playwright)                               |
| `make sync`                           | Build, copy into `www/`, `npx cap sync`, then `make sounds`                             |
| `make sounds`                         | Generates the notification sounds (WAV, peak at −1 dBFS) and copies them into `res/raw` |
| `make icons`                          | Generates icons and launch screens (iOS, Android, web) from `resources/*.svg`           |
| `make ios` / `make android`           | Adds the native platform (once only)                                                    |
| `make open-ios` / `make open-android` | Syncs, then opens Xcode / Android Studio                                                |
| `make clean`                          | Removes `dist/`, `www/` and the Angular cache                                           |

The first run of `make test-a11y` requires the test browser:
`npx playwright install chromium`. The same tests run in CI on every push
(`.github/workflows/a11y.yml`).

## Technologies

Angular 22 · Capacitor 8 · TypeScript 6 · RxJS 7.8 · Tailwind CSS 4 · Web Audio API · Web Speech API.
