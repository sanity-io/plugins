import {Button, Flex, Text} from '@sanity/ui'
import type {Meta, StoryObj} from '@storybook/react-vite'
import {animate, useMotionValue} from 'motion/react'
import {useEffect} from 'react'

import AnimatedColorWheelIcon from '../../../../../plugins/@sanity/themer/src/tool/AnimatedColorWheelIcon'
import {ANIMATION_DURATION} from '../../../../../plugins/@sanity/themer/src/tool/colorWheel'

interface WheelArgs {
  progress: number
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

function NavbarButton() {
  const progress = useMotionValue(0)

  const play = () => {
    // A run in progress plays out, like on the Studio navbar
    if (progress.isAnimating()) return

    animate(progress, [0, 1], {duration: ANIMATION_DURATION, ease: 'linear'})
  }

  return (
    <Flex align="center" gap={3}>
      <Button
        aria-label="Themer"
        icon={<AnimatedColorWheelIcon progress={progress} />}
        mode="bleed"
        onMouseEnter={play}
      />
      <Text muted size={1}>
        Hover the button to play the animation
      </Text>
    </Flex>
  )
}

/** The navbar toggle, which plays the animation on hover */
export const Default: Story = {
  render: () => <NavbarButton />,
}

function WheelAtProgress(props: {progress: number}) {
  const progress = useMotionValue(props.progress)

  useEffect(() => {
    progress.set(props.progress)
  }, [progress, props.progress])

  return (
    <Text size={4}>
      <AnimatedColorWheelIcon progress={progress} />
    </Text>
  )
}

/** The wheel at any point of the animation, from 0 to 1 */
export const Progress: Story = {
  args: {progress: 0.5},
  argTypes: {progress: {control: {type: 'range', min: 0, max: 1, step: 0.01}}},
  parameters: {controls: {include: ['progress']}},
  render: (args) => <WheelAtProgress progress={args.progress} />,
}
