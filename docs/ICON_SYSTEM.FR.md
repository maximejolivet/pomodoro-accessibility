# System d'Icônes SVG

🇫🇷 Français · [🇬🇧 English](ICON_SYSTEM.md)

## Vue d'ensemble

Un système d'icônes SVG complet remplace les emojis pour une meilleure accessibilité et contrôle du style.

## Services et Composants

### IconsService (`src/app/core/services/icons.service.ts`)

Service qui gère toutes les icônes SVG disponibles.

**Méthodes principales:**

```typescript
// Récupérer une icône SVG par nom
getSVG(name: IconName): SafeHtml

// Convertir un emoji en IconName
getIconFromEmoji(emoji: string): IconName

// Résout l'icône d'une routine ou d'une étape : accepte un emoji (anciennes données) ou un IconName (éditeur actuel)
resolveIcon(value: string): IconName
```

Les icônes des routines et des étapes sont stockées sous forme de noms d'icônes (par exemple `bed`) :
les modèles utilisent donc `resolveIcon`. `getIconFromEmoji` ne fait que la correspondance d'emojis, et
renvoie `info` pour tout le reste.

**Types disponibles:**

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

Composant standalone pour afficher une icône SVG.

**Utilisation:**

```html
<!-- Par nom d'icône -->
<app-icon name="sunrise" aria-hidden="true"></app-icon>

<!-- Convertir depuis emoji -->
<app-icon 
  [name]="iconsService.getIconFromEmoji('🌅')"
  aria-hidden="true">
</app-icon>
```

**Props:**

- `name: IconName` - Le nom de l'icône (required)
- `ariaHidden: boolean | 'true' | 'false'` - Masquer pour les lecteurs d'écran (default: 'true')

## Source des icônes (Lucide)

Les icônes du `IconsService` viennent de **[Lucide](https://lucide.dev)** (licence ISC). Elles sont
embarquées dans le bundle : aucun appel réseau n'est nécessaire, l'app fonctionne hors ligne et sous
Electron.

Le fichier `src/app/core/helpers/lucide-icons.ts` est **généré**. Pour changer une icône :

1. Modifier la correspondance `nom interne → icône Lucide` dans `scripts/generate-lucide-icons.mjs`.
2. Régénérer : `make ui-icons` (ou `node scripts/generate-lucide-icons.mjs`).

Le script échoue si un nom Lucide n'existe pas dans `lucide-static`. Le type `Record<IconName, string>`
impose en plus qu'une icône soit présente pour chaque nom du type `IconName`.

Les SVG écrits directement dans les templates HTML ne passent pas par ce service ; ils ne sont pas
concernés par cette génération.

## Mapping Emoji → Icon

**Routine Icons:**
- 🌅 → `sunrise`
- 👕 → `shirt`
- 🥣 → `breakfast`
- 🪥 → `toothbrush`
- 🏃 → `running`
- 🧘 → `meditation`
- 💪 → `gym`

**Accessibility Icons:**
- 🦯 → `blind`
- ⌨️ → `keyboard`
- 🔍 → `search`
- 🦻 → `hearing`
- 📳 → `vibration`
- 🧠 → `brain`
- 🔤 → `font`
- 🖼️ → `image`

## Utilisation dans les Composants

### Exemple: Affichage d'une icône de routine

**Avant (avec emoji):**

```html
<span class="step-emoji" aria-hidden="true">{{ step.icon }}</span>
```

**Après (avec SVG):**

```typescript
import { IconComponent } from '@app/shared/components/icon/icon.component';
import { IconsService } from '@app/core/services';

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

## Ajouter une Nouvelle Icône

1. Ajouter le type dans `IconName` (icons.service.ts)
2. Ajouter la définition SVG dans `registerIcons()`:

```typescript
this.icons.set('my-icon', {
  svg: '<path d="M..."/>' // SVG path/element
  viewBox: '0 0 24 24' // Optional, default is '0 0 24 24'
});
```

3. Optionnel: Ajouter au mapping emoji si applicable:

```typescript
export const EMOJI_TO_ICON_MAP: Record<string, IconName> = {
  '🎉': 'my-icon',
  // ...
};
```

## Styling

Les icônes héritent automatiquement de la couleur du texte:

```css
/* La couleur sera rouge */
.my-icon-red {
  color: red;
}
```

Ou avec CSS personnalisé:

```css
app-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
}
```

## Accessibilité

- Les icônes utilisent `aria-hidden="true"` par défaut (elles sont purement décoratives)
- Pour les icônes importantes, utiliser `aria-hidden="false"` et ajouter un label
- Les titres et labels doivent décrire l'icône, pas simplement "icône"

## Performance

- Les SVG sont intégrés inline et rendus dans le DOM
- Pas de requête HTTP pour chaque icône
- Les icônes sont scalables sans perte de qualité
- Les icônes héritent des propriétés CSS (couleur, taille, etc.)

## Compatibilité

- Fonctionne dans tous les navigateurs modernes
- Compatible avec le dark mode et les thèmes
- Accessible aux lecteurs d'écran
- Pas de dépendances externes (Material Icons, Font Awesome, etc.)
