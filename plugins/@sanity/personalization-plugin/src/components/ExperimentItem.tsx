import {useEffect} from 'react'
import {type ObjectItem, type ObjectItemProps, set} from 'sanity'

export const ExperimentItem = (props: ObjectItemProps) => {
  const {active} = props.value as ObjectItem & {active: boolean}
  const {onChange} = props.inputProps

  useEffect(() => {
    if (!active) {
      onChange(set(true, ['active']))
    }
  }, [active, onChange])

  return props.renderDefault(props)
}
