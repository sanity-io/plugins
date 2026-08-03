import {Box, TextInput} from '@sanity/ui'
import {type ChangeEventHandler, type FocusEventHandler, type Ref} from 'react'
import {type FieldError} from 'react-hook-form'

import FormFieldInputLabel from '../FormFieldInputLabel'

type Props = {
  description?: string
  disabled?: boolean
  error?: FieldError
  label: string
  name: string
  placeholder?: string
  value?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  ref?: Ref<HTMLInputElement>
}

const FormFieldInputText = (props: Props) => {
  const {description, disabled, error, label, name, placeholder, value, onChange, onBlur, ref} =
    props

  return (
    <Box>
      {/* Label */}
      <FormFieldInputLabel description={description} error={error} label={label} name={name} />
      {/* Input */}
      <TextInput
        autoComplete="off"
        autoFocus
        defaultValue={value}
        disabled={disabled}
        id={name}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        ref={ref}
      />
    </Box>
  )
}

export default FormFieldInputText
