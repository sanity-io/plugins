import {type ComponentProps} from 'react'

import * as styles from './Player.module.css'

export function TopControls({className, ...props}: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={className ? `${styles.topControls} ${className}` : styles.topControls}
    />
  )
}
