import type {ComponentType, FC, HTMLProps} from 'react'

import {DefaultField} from './default-field'
import type {FieldComponentProps, FieldState, FormDataProps, FormField} from './types'

interface FormRendererProps extends HTMLProps<HTMLFormElement> {
  formData?: FormDataProps
  // Function to get field state for a given field name
  getFieldState?: (fieldName: string) => FieldState
  // Function to get field error for a given field name
  getFieldError?: (fieldName: string) => string | undefined
  // Override default field components
  fieldComponents?: Record<string, ComponentType<FieldComponentProps>>
}

export const FormRenderer: FC<FormRendererProps> = (props) => {
  const {
    formData,
    getFieldState = (name) => ({
      value: undefined,
      onChange: () => {},
      name, // Pass name to field for native form handling
    }),
    getFieldError,
    fieldComponents = {},
    children,
  } = props
  const renderField = (field: FormField) => {
    const CustomComponent = fieldComponents[field.type]
    const fieldState = getFieldState(field.name)
    const error = getFieldError?.(field.name)

    if (CustomComponent) {
      return <CustomComponent field={field} fieldState={fieldState} error={error} />
    }

    return <DefaultField field={field} fieldState={fieldState} error={error} />
  }
  const elProps = Object.assign({}, props)
  delete elProps.formData
  delete elProps.getFieldState
  delete elProps.getFieldError
  delete elProps.fieldComponents

  return (
    <form {...elProps} id={elProps.id ?? formData?.id?.current}>
      {formData?.fields?.map((field) => (
        <div key={field._key} className="form-field">
          {renderField(field)}
        </div>
      ))}

      {children}

      {renderField({
        type: 'submit',
        name: 'submit',
        label: formData?.submitButton?.text || 'Submit',
      })}
    </form>
  )
}
