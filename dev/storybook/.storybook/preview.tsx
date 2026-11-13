import '@sanity/ui/styles.css'
import {presets} from '@sanity/themer'
import type {Preview} from '@storybook/react-vite'
import {themes} from 'storybook/theming'

import {withSanityTheme} from './decorators/withSanityTheme.decorator'

const preview: Preview = {
  decorators: [
    withSanityTheme({
      themes: {light: 'light', dark: 'dark'},
      defaultTheme: 'dark',
    }),
  ],
  globalTypes: {
    preset: {
      description: 'The @sanity/themer preset that the theme is built from',
      toolbar: {
        title: 'Preset',
        icon: 'paintbrush',
        items: presets.map((preset) => ({value: preset.slug, title: preset.title})),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    preset: 'studio',
  },
  parameters: {
    actions: {argTypesRegex: '^on[A-Z].*'},
    backgrounds: {disabled: true},
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      theme: {
        ...themes.dark,
        fontBase: 'Inter, sans-serif',
      },
    },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: ['themer', '*'],
      },
    },
  },
}

export default preview
