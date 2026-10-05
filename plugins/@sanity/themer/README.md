# @sanity/themer

Generate [Sanity Studio](https://www.sanity.io/studio) themes from a handful of colors.

**Pick your starting point:**

- **I want to pick colors visually** → [Use the Studio tool](#studio-tool).
- **I want to configure a theme in code** → [Build a theme](#usage).
- **I want a ready-made theme** → [Use a preset](#use-a-preset).
- **I use the hosted Themer service** → [Migrate an existing theme](#migrating-from-themersanitybuild).

## Install

```sh
npm install @sanity/themer
```

**Using the Studio tool?** It requires React and React DOM **19.3 or newer** within the supported React 19 range.

## Usage

### Build a theme

Call `buildTheme` with your colors, then pass the result to your Studio config's `theme` property.

Light and dark mode have separate settings. You can customize either or both.

```ts
import {buildTheme} from '@sanity/themer'
import {defineConfig} from 'sanity'

export const theme = buildTheme({
  light: {
    accent: '#f00',
    text: '#727892',
    background: '#ffffff',
    contrast: 85, // 15–100
  },
  dark: {
    accent: '#f66',
    background: '#0d0e12',
  },
})

export default defineConfig({
  theme,
  // ...rest of the config
})
```

**You don't need to set everything.** Both schemes and every option are optional.

- Leave out a scheme to keep its default Studio colors.
- Leave out `accent` or `background` to use the Studio default.
- Leave out `text` to derive a subtle tint from the accent.
- Use `buildTheme({})` to get the default Studio theme.

### What each option does

Colors are hex values, such as `#f00` or `#ff0000`.

| Option       | What it changes                            | Default                                     |
| ------------ | ------------------------------------------ | ------------------------------------------- |
| `accent`     | Primary buttons, focus rings, and links     | Studio blue                                 |
| `text`       | Text, icons, borders, and neutral surfaces  | A mostly desaturated accent                 |
| `background` | The background other colors blend onto     | White in light mode; near-black in dark mode |
| `contrast`   | How much accent tint text and borders have  | `85`                                        |

**The contrast slider runs from `15` to `100`:**

- **`85`** — keeps the text color's tint as-is.
- **`100`** — removes the tint for neutral text and borders.
- **Below `85`** — blends more accent color into text and borders.

Themer may adjust your colors to keep the palette usable:

- Very dark or very light accent and text colors are brought into a usable range.
- Dark backgrounds are darkened until they have enough contrast with text and accent colors.
- Light backgrounds are kept lighter than text and accent colors.

### Use a preset

`presets` includes the hosted Themer service's presets, ready to use with `buildTheme`.

```ts
import {buildTheme, presets} from '@sanity/themer'

const verdant = presets.find((preset) => preset.slug === 'verdant')
const theme = buildTheme(verdant?.options)
```

### Get palettes without building a theme

Use `buildPalette` if you only need the generated colors. It returns `{light, dark}` palettes in the `@sanity/color` shape.

```ts
import {buildPalette} from '@sanity/themer'

const {light, dark} = buildPalette({
  light: {accent: '#f00'},
  dark: {accent: '#f66'},
})
```

<details>
<summary>How this relates to Sanity UI themes</summary>

`buildTheme` returns the same theme type as `buildTheme` from `@sanity/ui/theme`. Instead of design tokens, you provide a few colors per scheme.

Under the hood, Themer replaces parts of the default [`@sanity/color`](https://www.sanity.io/docs/color) palette:

- `accent` replaces the `blue` scale.
- `text` replaces the `gray` scale.
- `background` replaces `black` for dark mode and `white` for light mode.

The other color scales keep their defaults. With no options, the result matches `buildTheme()` from `@sanity/ui/theme` exactly.

</details>

## Studio tool

**Pick, edit, and preview themes without writing color values by hand.**

The tool adds a sidebar to your Studio. Selecting a theme previews it live across the Studio while you browse.

### 1. Add the tool

Add `themerTool()` to your Studio's plugins:

```ts
import {themerTool} from '@sanity/themer/tool'
import {defineConfig} from 'sanity'

export default defineConfig({
  plugins: [themerTool()],
  // ...rest of the config
})
```

The navbar toggle is called **Themer**. To rename it, pass a title: `themerTool({title: 'Appearance'})`.

**No CSS setup needed.** The tool imports `@sanity/themer/bundle.css` automatically.

### 2. Try a theme

Open **Themer** in the navbar. The sidebar shows:

- Your configured Studio theme.
- Built-in presets.
- Your own themes.

Each card previews a tiny Studio in both light and dark mode. Select a card to apply its theme live.

**Want to compare modes?** Use the split-screen toggle in the sidebar header. Your Studio keeps its current appearance, and a second view shows the opposite mode beside it.

### 3. Make it yours

Start from scratch, duplicate a preset, or [use colors from an image](#use-colors-from-an-image).

Your custom theme has separate **light** and **dark** mode cards. Each has:

- Accent, text, and background color pickers.
- A contrast slider.
- An active marker when the Studio is showing that mode.

### 4. Make it permanent

**Previewing a theme is not the same as configuring it.**

Use the tool's code dialog to get the `buildTheme` snippet, then add it to your Studio config's `theme` property.

### Use colors from an image

Choose an image to generate a starting palette.

**Your image stays on your device. Nothing is uploaded.** The tool reads its colors locally using a canvas.

- A vibrant color becomes the accent, adjusted so button labels remain readable.
- A muted color becomes the text color.
- Light and dark muted colors tint the backgrounds.

Try the swatch variants to preview different starting colors, or select **I'm feeling lucky** to let the tool pick one.

### Organize and share themes

- **Reorder:** drag cards, or move them from their menus. The order is saved between sessions.
- **Share:** copy a theme's short code from its menu.
- **Import:** paste a code into the list, or use the paste button—even in another Studio.
- **Remove or restore:** themes can be removed and brought back.

<details>
<summary>Loading, animation, and reduced motion</summary>

The sidebar code loads only when needed. Loading starts when your pointer moves onto the navbar toggle. If you open it before loading finishes, the color wheel spins while you wait.

The sidebar slides in from the edge, with its header aligned to the Studio navbar. Closing it also closes the split preview.

The split preview uses React's `ViewTransition`, which is why the tool requires React 19.3.

With `prefers-reduced-motion`, both the sidebar and split preview change layouts without animation.

</details>

## Migrating from themer.sanity.build

**Want to keep your existing hosted theme?** Use [`@sanity/themer-legacy`](https://www.npmjs.com/package/@sanity/themer-legacy). It runs the same generator as [themer.sanity.build](https://themer.sanity.build), but locally.

1. Install the legacy package:

   ```sh
   npm install @sanity/themer-legacy
   ```

2. Replace your hosted URL import:

   ```diff
   -import {theme} from 'https://themer.sanity.build/api/hues?preset=verdant&primary=22fca8'
   +import {buildThemeFromUrl} from '@sanity/themer-legacy'
   +const theme = buildThemeFromUrl('https://themer.sanity.build/api/hues?preset=verdant&primary=22fca8')
   ```

**Already importing from `@sanity/themer/legacy`?** Switch to `@sanity/themer-legacy`. The old import is deprecated and will be removed in `@sanity/themer@1.0`.

## License

MIT © Sanity.io — see [LICENSE](https://github.com/sanity-io/plugins/blob/main/LICENSE)
