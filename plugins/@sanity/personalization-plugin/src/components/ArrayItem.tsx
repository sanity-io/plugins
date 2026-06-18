import {type ObjectItem, type ObjectItemProps, set} from 'sanity'

export const ArrayItem = (props: ObjectItemProps) => {
  const {active} = props.value as ObjectItem & {active: boolean}
  if (!active) {
    props.inputProps.onChange(set(true, ['active']))
  }
  return props.renderDefault(props)
}
