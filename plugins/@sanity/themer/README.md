# @sanity/themer

Generate [Sanity Studio](https://www.sanity.io/studio) themes from a handful of colors.

```sh
npm install @sanity/themer
```

## Usage

`buildTheme` builds the same kind of theme as `buildTheme` from `@sanity/ui/theme`, for the `theme` option of a Studio config. Instead of design tokens, it takes a few colors per color scheme and generates the palette that `@sanity/ui/theme` otherwise takes from [`@sanity/color`](https://www.sanity.io/docs/color):

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

Both schemes and all their colors are optional. Anything you leave out keeps the stock Studio color, so `buildTheme({})` matches `buildTheme()` from `@sanity/ui/theme`.

- `accent` replaces the `blue` scale, used for primary buttons, focus rings and links.
- `text` replaces the `gray` scale, used for text, icons, borders and neutral surfaces. Without it, `buildTheme` uses a mostly desaturated `accent`.
- `background` replaces `white` in the light scheme and `black` in the dark scheme.
- `contrast` sets how strongly text and borders separate from the accent. The default, `85`, uses the text color as is. `100` removes its tint, and lower values blend more of the accent into text and borders.

To keep the palettes usable, `buildTheme` limits how dark or light the accent and text colors can be. It darkens the dark background until it contrasts enough with both, and never lets the light background be darker than either.

`buildPalette` returns the generated palettes as `{light, dark}`, shaped like `@sanity/color`, without building a theme. `presets` has the themer.sanity.build presets as `buildTheme` options:

```ts
import {buildTheme, presets} from '@sanity/themer'

const verdant = presets.find((preset) => preset.slug === 'verdant')
const theme = buildTheme(verdant.options)
```

## Studio tool

`@sanity/themer/tool` adds a themer sidebar to the Studio. It requires React 19.3.

```ts
import {themerTool} from '@sanity/themer/tool'
import {defineConfig} from 'sanity'

export default defineConfig({
  plugins: [themerTool()],
  // ...rest of the config
})
```

If the Studio already uses a `buildTheme` theme, pass the same options so the tool starts from them: `themerTool({config: {light: {accent: '#1cb485'}}})`.

The sidebar lists the configured theme, the presets and your own themes, each with a small preview in light and dark. Picking one applies it to the whole Studio. In the sidebar you can also:

- Show the Studio in light and dark side by side.
- Drag the themes into any order.
- Add, duplicate, edit, remove and restore themes. The editor has color pickers and a contrast slider for each scheme.
- Take a theme's colors from an image. The image stays on your device.
- Copy a theme as a short code to paste into another Studio's themer.
- Import a theme from a themer.sanity.build URL. See [Migrating from themer.sanity.build](#migrating-from-themersanitybuild).
- Copy the `buildTheme` snippet for the applied theme from the code button.

The tool imports its own stylesheet, `@sanity/themer/bundle.css`, so the config needs nothing else. The sidebar's code loads on first use, not with the Studio.

## Migrating from themer.sanity.build

A Studio that imports its theme from [themer.sanity.build](https://themer.sanity.build) can use `buildThemeFromUrl` from [`@sanity/themer-legacy`](https://www.npmjs.com/package/@sanity/themer-legacy) instead. It runs the same generator locally, so the colors don't change:

```diff
-import {theme} from 'https://themer.sanity.build/api/hues?preset=verdant'
+import {buildThemeFromUrl} from '@sanity/themer-legacy'
+
+const theme = buildThemeFromUrl('https://themer.sanity.build/api/hues?preset=verdant')
```

To convert the theme to a modern `buildTheme` theme, open the themer sidebar and paste the URL, or the whole import line, anywhere except a text field. You can also paste it into **Import from URL** below the themes. The tool adds the converted theme and opens it in the editor. Copy its snippet from the code button to replace the import. The colors come close to the hosted theme's, but they don't match exactly.

`@sanity/themer/legacy` still re-exports `@sanity/themer-legacy`, but it's deprecated and `@sanity/themer@1.0` removes it.

## License

[MIT](https://github.com/sanity-io/plugins/blob/main/LICENSE) © Sanity.io
