import {type ObjectItem, type ObjectItemProps, set} from 'sanity'

export const ExperimentItem = (props: ObjectItemProps) => {
  // The experiment item value carries an `active` flag alongside the base ObjectItem fields
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const {active} = props.value as ObjectItem & {active: boolean}
  if (!active) {
    props.inputProps.onChange(set(true, ['active']))
  }

  return props.renderDefault(props)
}
