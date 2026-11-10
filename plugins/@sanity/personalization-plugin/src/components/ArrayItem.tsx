// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {useEffect} from 'react'
import {type ObjectItem, type ObjectItemProps, set} from 'sanity'

export const ArrayItem = (props: ObjectItemProps) => {
  const {active} = props.value as ObjectItem & {active: boolean}
  const {onChange} = props.inputProps

  useEffect(() => {
    if (!active) {
      onChange(set(true, ['active']))
    }
  }, [active, onChange])

  return props.renderDefault(props)
}
