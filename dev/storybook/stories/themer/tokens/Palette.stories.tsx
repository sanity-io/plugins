import {presets} from '@sanity/themer'
import type {Meta, StoryObj} from '@storybook/react-vite'

import {ColorPalette} from './ColorPalette'

interface PaletteArgs {
  accent?: string
  text?: string
  background?: string
  contrast?: number
}

/**
 * The `@sanity/color`-shaped palette that `buildPalette` from `@sanity/themer` generates, in the
 * color scheme picked in the toolbar.
 */
const meta: Meta<PaletteArgs> = {
  parameters: {controls: {include: []}, padding: 0},
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<PaletteArgs>

/** The palette of the preset picked in the toolbar */
export const Default: Story = {
  render: (_args, {globals}) => {
    const preset = presets.find((candidate) => candidate.slug === globals['preset'])

    return <ColorPalette options={preset?.options ?? {}} />
  },
}

/** A palette generated from the colors in the controls, for both schemes */
export const Custom: Story = {
  args: {
    accent: '#1cb485',
    text: '#5c9199',
    contrast: 85,
  },
  argTypes: {
    accent: {control: 'color'},
    text: {control: 'color'},
    background: {control: 'color'},
    contrast: {control: {type: 'range', min: 15, max: 100, step: 1}},
  },
  parameters: {controls: {include: ['accent', 'text', 'background', 'contrast']}},
  render: (args) => <ColorPalette options={{dark: args, light: args}} />,
}
