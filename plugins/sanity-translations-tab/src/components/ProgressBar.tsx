import {Card, Flex, Label} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {bar, labelOverlay, root, scaleXVar} from './ProgressBar.css'

export default function ProgressBar({progress}: {progress: number}) {
  if (typeof progress === 'undefined') {
    console.warn('No progress prop passed to ProgressBar')
    return null
  }

  return (
    <Card border radius={2} className={root}>
      <Flex className={labelOverlay} align="center" justify="center">
        <Label size={1}>{progress}%</Label>
      </Flex>
      <Card
        className={bar}
        style={assignInlineVars({
          [scaleXVar]: String(progress / 100),
        })}
        padding={2}
        tone="positive"
      />
    </Card>
  )
}
