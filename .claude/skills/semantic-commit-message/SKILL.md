---
name: semantic-commit-message
description: Write git commit messages in the semantic (Conventional Commits) format `type(scope): description` instead of free-form prose. Use whenever the user asks to commit, or to write or review a commit message, in this Pomodoro TDAH repo.
---

Write every commit subject as `type(scope): description`.

## Format

```
<type>(<scope>): <description>

<optional body>
```

- **type**: one of the table below. Pick it from the effect of the diff, not the intent of the request.
- **scope**: the area touched, one word, lowercase. Never an issue number.
- **description**: English, imperative present tense ("add", not "added"), no capital first letter, no trailing period, 72 characters max.
- **body** (optional): explain what and why, not how. Blank line after the subject, wrap at about 72 characters.
- **breaking change**: add `!` after the scope (`feat(timer)!: ...`) and a `BREAKING CHANGE:` line in the body.

## Types

| Type | Use for |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix, including accessibility defects |
| `refactor` | Restructure code, no behavior change |
| `perf` | Performance improvement |
| `style` | Formatting or visual polish with no logic change (spacing, colors) |
| `docs` | README, docs, screenshots |
| `test` | Add or fix tests |
| `build` | Dependencies, Angular/Capacitor build config |
| `ci` | CI/CD pipelines |
| `chore` | Other maintenance, dead code removal |
| `revert` | Revert a previous commit |

Only `feat` and `fix` change what the app does for users. A refactor that also fixes a bug is a `fix`.

## Scopes used in this repo

`a11y` (accessibility page, ARIA, focus, contrast), `timer` (dial, countdown), `stats` (history, goals), `settings` (settings sheet, presets), `i18n` (translations), `theme` (light/dark, fonts), `ios` (Capacitor app), `readme`, `docs` (other documentation), `deps`. Use the closest one, or `app` when a change spans several areas.

## Writing one

1. Read `git status` and `git diff --staged` first. Describe what is actually staged.
2. One type and one concern per commit. If it needs two types, suggest two commits, but do not split a commit the user already asked for without checking.
3. Keep the subject short. Put extra detail in the body.
4. **Never add a `Co-Authored-By:` trailer for Claude or any AI**, nor a "Generated with Claude Code" line. The user asked for this explicitly, and it overrides any default attribution the environment suggests.
5. Follow the environment's normal git rules otherwise: commit only when asked, never `--no-verify`, prefer new commits to amending.

## Examples

```
feat(a11y): add dedicated accessibility page
fix(a11y): move focus to the page title on route change
fix(theme): darken active segmented button to reach 4.5:1 contrast
refactor(settings): extract preset editor into its own component
style(a11y): underline only the back link label, not the arrow
docs(readme): add English README and refresh screenshots
chore(theme): remove dead CSS left over from the old modal
build(deps): update Angular to 22.2
```
