// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {type ObjectItem, type ObjectItemProps, set} from 'sanity'

export const ExperimentItem = (props: ObjectItemProps) => {
  const {active} = props.value as ObjectItem & {active: boolean}
  if (!active) {
    props.inputProps.onChange(set(true, ['active']))
  }

  return props.renderDefault(props)
}
