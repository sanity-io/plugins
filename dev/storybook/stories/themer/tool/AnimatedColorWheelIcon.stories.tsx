import {Button, Flex, Text} from '@sanity/ui'
import type {Meta, StoryObj} from '@storybook/react-vite'
import {useRef} from 'react'

import AnimatedColorWheelIcon from '../../../../../plugins/@sanity/themer/src/tool/AnimatedColorWheelIcon'

interface WheelArgs {
  busy: boolean
}

/**
 * The color wheel of the themer tool's navbar toggle, which introduces the tool: the slices pop
 * in with color one at a time, the wheel spins once, and the colors pop out again.
 */
const meta: Meta<WheelArgs> = {
  parameters: {controls: {include: []}},
}

export default meta
type Story = StoryObj<WheelArgs>

function NavbarButton(props: {busy: boolean}) {
  const {busy} = props
  const ref = useRef<{spin: () => void}>(null)

  return (
    <Flex align="center" gap={3}>
      <Button
        aria-busy={busy}
        aria-label="Themer"
        icon={<AnimatedColorWheelIcon busy={busy} ref={ref} />}
        mode="bleed"
        onMouseEnter={() => ref.current?.spin()}
        selected={busy}
      />
      <Text muted size={1}>
        {busy
          ? 'The wheel laps while the toggle is busy'
          : 'Hover the button to play the animation'}
      </Text>
    </Flex>
  )
}

/** The navbar toggle, which plays the animation once on hover */
export const Default: Story = {
  render: () => <NavbarButton busy={false} />,
}

/**
 * The navbar toggle while the sidebar loads: the wheel laps from wherever a hover's run has got
 * to, and the lap in progress plays out once the toggle is no longer busy
 */
export const Busy: Story = {
  args: {busy: true},
  argTypes: {busy: {control: {type: 'boolean'}}},
  parameters: {controls: {include: ['busy']}},
  render: (args) => <NavbarButton busy={args.busy} />,
}
