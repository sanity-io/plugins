import {type FC, FormEvent, useState} from 'react'

import {FormRenderer, type FormDataProps} from '@sanity/form-toolkit'

interface UseStateExampleProps {
  formData: FormDataProps
  onSubmit?: (data: Record<string, any>) => void
}

export const UseStateExample: FC<UseStateExampleProps> = ({formData, onSubmit = console.log}) => {
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getFieldState = (fieldName: string) => ({
    value: values[fieldName],
    onChange: (value: any) => {
      setValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }))
      // Clear error when value changes
      if (errors[fieldName]) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: undefined,
        }))
      }
    },
    onBlur: () => {
      // Example validation on blur
      const field = formData.fields?.find((field) => field?.name === fieldName)

      if (field?.required && !values[fieldName]) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: 'This field is required',
        }))
      }
    },
  })

  const getFieldError = (fieldName: string) => errors[fieldName]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <FormRenderer
      formData={formData}
      onSubmit={handleSubmit}
      getFieldState={getFieldState}
      getFieldError={getFieldError}
    />
  )
}
