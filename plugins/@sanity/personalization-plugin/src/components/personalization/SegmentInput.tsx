import {Button, Inline, Stack} from '@sanity/ui'
import {type ObjectInputProps, set, useFormValue} from 'sanity'

export const SegmentInput = (props: ObjectInputProps) => {
  const personalizationPath = props.path.slice(0, -2)
  const defaultValue = useFormValue([...personalizationPath, 'default'])
  const handleClick = () => {
    props.onChange(set(defaultValue, ['value']))
  }
  return (
    <Stack gap={3}>
      {props.renderDefault(props)}

      <Inline gap={1}>
        <Button text="Copy default" mode="ghost" onClick={() => handleClick()} />
      </Inline>
    </Stack>
  )
}
