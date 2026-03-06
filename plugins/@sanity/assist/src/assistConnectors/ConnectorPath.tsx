import {useTheme_v2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {useMemo} from 'react'

import {type ConnectorOptions, mapConnectorToLine, type Rect} from '../_lib/connector'
import {arrowPath} from './draw/arrowPath'
import {drawConnectorPath} from './draw/connectorPath'

export function ConnectorPath(props: {
  from: {bounds: Rect; element: Rect}
  to: {bounds: Rect; element: Rect}
  options: ConnectorOptions
}) {
  const {from, options, to} = props
  const {strokeWidth} = options.path
  const theme = useTheme_v2()

  const line = useMemo(() => mapConnectorToLine(options, {from, to}), [from, options, to])

  return (
    <>
      <path
        d={drawConnectorPath(options, line)}
        stroke={theme.color.bg}
        strokeWidth={strokeWidth + 4}
      />

      <path
        d={drawConnectorPath(options, line)}
        stroke={rgba(theme.color.border, 0.5)}
        strokeWidth={strokeWidth}
      />

      {line.from.isAbove && (
        <path
          d={arrowPath(
            options,
            line.from.x + options.arrow.marginX,
            line.from.bounds.y - options.arrow.threshold + options.arrow.marginY,
            -1,
          )}
          stroke={theme.color.border}
          strokeWidth={strokeWidth}
        />
      )}

      {line.from.isBelow && (
        <path
          d={arrowPath(
            options,
            line.from.x + options.arrow.marginX,
            line.from.bounds.y +
              line.from.bounds.h +
              options.arrow.threshold -
              options.arrow.marginY,
            1,
          )}
          stroke={theme.color.border}
          strokeWidth={strokeWidth}
        />
      )}
    </>
  )
}
