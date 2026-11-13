import {buildTheme, presets} from '@sanity/themer'
import {Card, ThemeProvider} from '@sanity/ui'
import type {RootTheme, ThemeColorSchemeKey} from '@sanity/ui/theme'
import {DecoratorHelpers} from '@storybook/addon-themes'
import type {Decorator} from '@storybook/react-vite'
import {createGlobalStyle} from 'styled-components'

const {initializeThemeState, pluckThemeFromContext} = DecoratorHelpers

const GlobalStyle = createGlobalStyle`
  body,
  .docs-story {
    background-color: ${
      // oxlint-disable-next-line no-deprecated
      ({theme}) => theme.sanity.color.base.bg
    };
  }
`

const presetThemes = new Map<string, RootTheme>()

/** The theme `@sanity/themer` builds from the preset with the given slug, built once */
function getPresetTheme(slug: string): RootTheme {
  const cached = presetThemes.get(slug)
  if (cached) return cached

  const preset = presets.find((candidate) => candidate.slug === slug)
  const theme = buildTheme(preset?.options)
  presetThemes.set(slug, theme)

  return theme
}

/**
 * Story decorator which wraps all stories in a Sanity <ThemeProvider> with the theme that
 * `buildTheme` from `@sanity/themer` generates from the preset picked in the toolbar, in the
 * color scheme picked next to it.
 *
 * Stories are also wrapped in a <Card> for layout. Set the `padding` parameter to change (or
 * remove, with `padding: 0`) the default padding – e.g. for stories that depend on exact
 * viewport dimensions.
 */
export const withSanityTheme = ({
  themes,
  defaultTheme,
}: {
  themes: Record<string, string>
  defaultTheme: string
}): Decorator => {
  initializeThemeState(Object.keys(themes), defaultTheme)

  return (Story, context) => {
    const selectedTheme = pluckThemeFromContext(context)
    const {themeOverride} = context.parameters['themes'] ?? {}
    const {padding = 4} = context.parameters
    const preset = String(context.globals['preset'] ?? 'studio')

    // oxlint-disable-next-line no-unsafe-type-assertion
    const selected = (themeOverride || selectedTheme || defaultTheme) as ThemeColorSchemeKey

    return (
      <ThemeProvider scheme={selected} theme={getPresetTheme(preset)}>
        <GlobalStyle />
        <Card padding={padding}>
          <Story />
        </Card>
      </ThemeProvider>
    )
  }
}
