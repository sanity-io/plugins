import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'

import {topControls} from './Player.css'

export function TopControls({className, ...props}: ComponentProps<'div'>) {
  return <div {...props} className={clsx(topControls, className)} />
}
