import {type ObjectItem, type ObjectItemProps, set} from 'sanity'

export const ExperimentItem = (props: ObjectItemProps) => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion - active flag on experiment object item
  const {active} = props.value as ObjectItem & {active: boolean}
  if (!active) {
    props.inputProps.onChange(set(true, ['active']))
  }

  return props.renderDefault(props)
}
