import {type JSX, useEffect, useRef} from 'react'
import {type ObjectInputProps, unset} from 'sanity'

export function LinkFieldInput(props: ObjectInputProps): JSX.Element {
  const {onChange, value} = props
  const linkType = value?.['linkType']
  const previousLinkType = useRef(linkType)

  useEffect(() => {
    if (previousLinkType.current === linkType) return
    previousLinkType.current = linkType

    if (linkType === 'internal') {
      onChange([unset(['url']), unset(['openInNewTab'])])
    } else if (linkType === 'external') {
      onChange([unset(['reference'])])
    }
  }, [linkType, onChange])

  return props.renderDefault(props)
}
