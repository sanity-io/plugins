import {presets} from '@sanity/themer'
import {Grid, Stack, Text} from '@sanity/ui'
import type {Meta, StoryObj} from '@storybook/react-vite'

import {ThemeThumbnail} from '../../../../../plugins/@sanity/themer/src/tool/ThemeThumbnail'

interface ThumbnailArgs {
  accent?: string
  text?: string
  contrast?: number
  lightBackground?: string
  darkBackground?: string
}

/**
 * The theme cards of the themer tool: a tiny Studio in the theme, the light scheme on the left
 * and the dark scheme on the right.
 */
const meta: Meta<ThumbnailArgs> = {
  parameters: {controls: {include: []}},
}

export default meta
type Story = StoryObj<ThumbnailArgs>

/** Every preset, like the theme list in the tool's sidebar */
export const Default: Story = {
  render: () => (
    <Grid gridTemplateColumns={[1, 2, 3, 4]} gap={4}>
      {presets.map((preset) => (
        <Stack gap={3} key={preset.slug}>
          <ThemeThumbnail options={preset.options} />
          <Text size={1} weight="medium">
            {preset.title}
          </Text>
        </Stack>
      ))}
    </Grid>
  ),
}

/** A theme built from the colors in the controls */
export const Custom: Story = {
  args: {
    accent: '#f13009',
    text: '#678e9a',
    contrast: 85,
    lightBackground: '#fcfdfd',
    darkBackground: '#0e1315',
  },
  argTypes: {
    accent: {control: 'color'},
    text: {control: 'color'},
    contrast: {control: {type: 'range', min: 15, max: 100, step: 1}},
    lightBackground: {control: 'color'},
    darkBackground: {control: 'color'},
  },
  parameters: {
    controls: {include: ['accent', 'text', 'contrast', 'lightBackground', 'darkBackground']},
  },
  render: ({accent, text, contrast, lightBackground, darkBackground}) => (
    <div style={{maxWidth: 480}}>
      <ThemeThumbnail
        options={{
          light: {accent, text, contrast, background: lightBackground},
          dark: {accent, text, contrast, background: darkBackground},
        }}
      />
    </div>
  ),
}
