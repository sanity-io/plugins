import {Button, Inline, Stack} from '@sanity/ui'
import {ObjectInputProps, set, useFormValue} from 'sanity'

export const VariantInput = (props: ObjectInputProps) => {
  const experimentPath = props.path.slice(0, -2)
  const defaultValue = useFormValue([...experimentPath, 'default'])
  const handleClick = () => {
    props.onChange(set(defaultValue, ['value']))
  }
  return (
    <Stack space={3}>
      {props.renderDefault(props)}

      <Inline space={1}>
        <Button text="Copy default" mode="ghost" onClick={() => handleClick()} />
      </Inline>
    </Stack>
  )
}
