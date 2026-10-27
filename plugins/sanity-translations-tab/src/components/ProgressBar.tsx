import {Card, Flex, Label} from '@sanity/ui'
import type {CSSProperties} from 'react'

import * as styles from './ProgressBar.module.css'

/**
 * `CSSProperties` does not know custom properties, so the inline `style` is
 * typed through this extension of it.
 */
interface ProgressBarStyle extends CSSProperties {
  '--translations-tab-progress-scale': string
}

export default function ProgressBar({progress}: {progress: number}) {
  if (typeof progress === 'undefined') {
    console.warn('No progress prop passed to ProgressBar')
    return null
  }

  const barStyle: ProgressBarStyle = {
    '--translations-tab-progress-scale': String(progress / 100),
  }

  return (
    <Card border radius={2} className={styles.root}>
      <Flex className={styles.labelOverlay} align="center" justify="center">
        <Label size={1}>{progress}%</Label>
      </Flex>
      <Card className={styles.bar} style={barStyle} padding={2} tone="positive" />
    </Card>
  )
}
