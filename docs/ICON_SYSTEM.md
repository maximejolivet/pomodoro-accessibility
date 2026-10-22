# SVG Icon System

🇬🇧 English · [🇫🇷 Français](ICON_SYSTEM.FR.md)

## Overview

A complete SVG icon system replaces emojis for better accessibility and style control.

## Services and Components

### IconsService (`src/app/core/services/icons.service.ts`)

Service that manages all the available SVG icons.

**Main methods:**

```typescript
// Get an SVG icon by name
getSVG(name: IconName): SafeHtml

// Convert an emoji to an IconName
getIconFromEmoji(emoji: string): IconName

// Resolve a routine or step icon: accepts an emoji (older data) or an IconName (current editor)
resolveIcon(value: string): IconName
```

Routine and step icons are stored as icon names (for example `bed`), so the templates use
`resolveIcon`. `getIconFromEmoji` only maps emoji and falls back to `info` for anything else.

**Available types:**

```typescript
type IconName =
  // Routine icons
  | 'sunrise' | 'shirt' | 'breakfast' | 'toothbrush'
  | 'running' | 'meditation' | 'gym' | 'bed' | 'shower'
  | 'backpack' | 'jacket' | 'bus' | 'medicine' | 'cleaning'
  | 'laundry' | 'shopping' | 'dog' | 'book' | 'pencil'
  | 'calculator' | 'art' | 'music' | 'tools' | 'computer'
  | 'email' | 'phone' | 'files' | 'moon'
  // Accessibility icons
  | 'blind' | 'keyboard' | 'search' | 'hearing' | 'vibration'
  | 'brain' | 'font' | 'image'
  // UI icons
  | 'play' | 'pause' | 'reset' | 'lock' | 'unlock' | 'edit'
  | 'delete' | 'add' | 'close' | 'settings' | 'theme-light'
  | 'theme-dark' | 'language' | 'help'
  // General
  | 'check' | 'warning' | 'error' | 'info' | 'menu' | 'back';
```

### IconComponent (`src/app/shared/components/icon/icon.component.ts`)

Standalone component that displays an SVG icon.

**Usage:**

```html
<!-- By icon name -->
<app-icon name="sunrise" aria-hidden="true"></app-icon>

<!-- Convert from emoji -->
<app-icon
  [name]="iconsService.getIconFromEmoji('🌅')"
  aria-hidden="true">
</app-icon>
```

**Props:**

- `name: IconName` - The icon name (required)
- `ariaHidden: boolean | 'true' | 'false'` - Hide from screen readers (default: 'true')

## Icon source (Lucide)

The icons in `IconsService` come from **[Lucide](https://lucide.dev)** (ISC license). They are
bundled with the app: no network call is needed, and the app works offline and under
Electron.

The file `src/app/core/helpers/lucide-icons.ts` is **generated**. To change an icon:

1. Edit the `internal name → Lucide icon` mapping in `scripts/generate-lucide-icons.mjs`.
2. Regenerate: `make ui-icons` (or `node scripts/generate-lucide-icons.mjs`).

The script fails if a Lucide name does not exist in `lucide-static`. The `Record<IconName, string>`
type also requires an icon for every name in the `IconName` type.

SVGs written directly in HTML templates do not go through this service and are not affected by
this generation.

## Emoji → Icon mapping

**Routine icons:**
- 🌅 → `sunrise`
- 👕 → `shirt`
- 🥣 → `breakfast`
- 🪥 → `toothbrush`
- 🏃 → `running`
- 🧘 → `meditation`
- 💪 → `gym`

**Accessibility icons:**
- 🦯 → `blind`
- ⌨️ → `keyboard`
- 🔍 → `search`
- 🦻 → `hearing`
- 📳 → `vibration`
- 🧠 → `brain`
- 🔤 → `font`
- 🖼️ → `image`

## Usage in components

### Example: displaying a routine icon

**Before (with emoji):**

```html
<span class="step-emoji" aria-hidden="true">{{ step.icon }}</span>
```

**After (with SVG):**

```typescript
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { IconsService } from '@app/core/services';

@Component({
  // ...
  imports: [IconComponent]
})
export class MyComponent {
  constructor(public iconsService: IconsService) {}
}
```

```html
<app-icon
  [name]="iconsService.getIconFromEmoji(step.icon)"
  aria-hidden="true"
  class="step-icon">
</app-icon>
```

## Adding a new icon

1. Add the type to `IconName` (icons.service.ts).
2. Add the SVG definition in `registerIcons()`:

```typescript
this.icons.set('my-icon', {
  svg: '<path d="M..."/>' // SVG path/element
  viewBox: '0 0 24 24' // Optional, default is '0 0 24 24'
});
```

3. Optional: add it to the emoji mapping if applicable:

```typescript
export const EMOJI_TO_ICON_MAP: Record<string, IconName> = {
  '🎉': 'my-icon',
  // ...
};
```

## Styling

Icons automatically inherit the text colour:

```css
/* The colour will be red */
.my-icon-red {
  color: red;
}
```

Or with custom CSS:

```css
app-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}
```

## Accessibility

- Icons use `aria-hidden="true"` by default (they are purely decorative).
- For important icons, use `aria-hidden="false"` and add a label.
- Titles and labels must describe the icon, not just say "icon".

## Performance

- SVGs are inlined and rendered in the DOM.
- No HTTP request for each icon.
- Icons scale without loss of quality.
- Icons inherit CSS properties (colour, size, etc.).

## Compatibility

- Works in all modern browsers.
- Compatible with dark mode and themes.
- Accessible to screen readers.
- No external dependencies (Material Icons, Font Awesome, etc.).
