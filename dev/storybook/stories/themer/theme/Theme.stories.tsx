import {Box, Card, Tree, TreeItem, useRootTheme} from '@sanity/ui'
import type {Meta, StoryObj} from '@storybook/react-vite'

import {BuildStory} from './build/BuildStory'
import {CanvasStory} from './CanvasStory'
import {DebugStory} from './DebugStory'

/**
 * The theme that `buildTheme` from `@sanity/themer` generates from the preset picked in the
 * toolbar, in both color schemes.
 */
const meta: Meta = {
  parameters: {controls: {include: []}},
}

export default meta
type Story = StoryObj

export const Debug: Story = {
  parameters: {padding: 0},
  render: () => <DebugStory />,
}

export const Build: Story = {
  parameters: {padding: 0},
  render: () => <BuildStory />,
  // The theme-builder preview renders an enormous DOM which crashes headless
  // Chromium when it runs as a browser test
  tags: ['!test'],
}

export const Canvas: Story = {
  parameters: {padding: 0},
  render: () => <CanvasStory />,
  // The color canvas preview is too heavy to render within the browser test
  // timeout
  tags: ['!test'],
}

function ColorStory() {
  const {theme} = useRootTheme()

  // oxlint-disable-next-line no-deprecated
  if (!theme.color) {
    return null
  }

  return (
    <Box padding={[4, 5, 6]}>
      <Tree gap={1}>
        {/* oxlint-disable-next-line no-deprecated */}
        {Object.entries(theme.color).map(([key, value]) => (
          <ColorGroup key={key} name={key} value={value} />
        ))}
      </Tree>
    </Box>
  )
}

function ColorGroup({name, value}: {name: string; value: Record<string, unknown>}) {
  const entries = Object.entries(value)

  return (
    <TreeItem fontSize={1} padding={2} text={name}>
      {entries.map(([key, value]) => {
        if (value && typeof value === 'object') {
          // oxlint-disable-next-line no-unsafe-type-assertion
          return <ColorGroup key={key} name={key} value={value as Record<string, unknown>} />
        }

        if (typeof value !== 'string') {
          return null
        }

        return <ColorPreview key={key} name={key} value={value} />
      })}
    </TreeItem>
  )
}

function ColorPreview({name, value}: {name: string; value: string}) {
  const text = (
    <>
      <Card
        radius={2}
        style={{
          backgroundColor: value,
          boxShadow: 'inset 0 0 0 1px var(--card-shadow-outline-color)',
          display: 'inline-block',
          height: 17,
          width: 25,
          margin: '0 8px -6px 0',
          verticalAlign: 'top',
        }}
        tone="inherit"
      />
      {name} <code>{value}</code>
    </>
  )

  return <TreeItem fontSize={1} padding={2} text={text} />
}

export const Color: Story = {
  render: () => <ColorStory />,
  // The color tree preview is too heavy to render as a browser test
  tags: ['!test'],
}
