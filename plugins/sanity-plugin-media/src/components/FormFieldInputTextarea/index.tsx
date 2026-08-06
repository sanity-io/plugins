import {Box, TextArea} from '@sanity/ui'
import {type ChangeEventHandler, type FocusEventHandler, type Ref} from 'react'

import FormFieldInputLabel from '../FormFieldInputLabel'

type Props = {
  description?: string
  disabled?: boolean
  error?: string
  label: string
  name: string
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  onChange?: ChangeEventHandler<HTMLTextAreaElement>
  placeholder?: string
  rows?: number
  value?: string
  ref?: Ref<HTMLTextAreaElement>
}

const FormFieldInputTextarea = (props: Props) => {
  const {
    description,
    disabled,
    error,
    label,
    name,
    onBlur,
    onChange,
    placeholder,
    rows,
    value,
    ref,
    ...rest
  } = props

  return (
    <Box>
      {/* Label */}
      <FormFieldInputLabel description={description} error={error} label={label} name={name} />

      {/* Input */}
      <TextArea
        {...rest}
        autoComplete="off"
        defaultValue={value}
        disabled={disabled}
        id={name}
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        ref={ref}
        rows={rows}
      />
    </Box>
  )
}

export default FormFieldInputTextarea
