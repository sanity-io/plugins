import {Box, TextInput} from '@sanity/ui'
import {type ChangeEventHandler, type FocusEventHandler, type Ref} from 'react'

import FormFieldInputLabel from '../FormFieldInputLabel'

type Props = {
  description?: string
  disabled?: boolean
  error?: string
  label: string
  name: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  onChange?: ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  value?: string
  ref?: Ref<HTMLInputElement>
}

const FormFieldInputText = (props: Props) => {
  const {
    description,
    disabled,
    error,
    label,
    name,
    onBlur,
    onChange,
    placeholder,
    value,
    ref,
    ...rest
  } = props

  return (
    <Box>
      {/* Label */}
      <FormFieldInputLabel description={description} error={error} label={label} name={name} />
      {/* Input */}
      <TextInput
        {...rest}
        autoComplete="off"
        autoFocus
        defaultValue={value}
        disabled={disabled}
        id={name}
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        ref={ref}
      />
    </Box>
  )
}

export default FormFieldInputText
