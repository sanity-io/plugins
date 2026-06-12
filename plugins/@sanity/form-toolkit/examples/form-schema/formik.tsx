import type {FC} from 'react'

import {useFormik} from 'formik'
import {FormRenderer, type FormDataProps} from '@sanity/form-toolkit'

interface FormikExampleProps {
  formData: FormDataProps
  onSubmit?: (data: any) => void
}

export const FormikExample: FC<FormikExampleProps> = ({formData, onSubmit = console.log}) => {
  const initialValues = formData.fields?.reduce(
    (acc, field) => {
      acc[field.name] = field.options?.defaultValue ?? ''

      return acc
    },
    {} as Record<string, any>,
  )

  const formik = useFormik({
    initialValues: initialValues ?? {},
    onSubmit,
    validate: (values) => {
      const errors: Record<string, string> = {}

      formData.fields?.forEach((field) => {
        if (field.required && !values[field.name]) {
          errors[field.name] = 'This field is required'
        }
      })

      return errors
    },
  })

  const getFieldState = (fieldName: string) => ({
    value: formik.values[fieldName],
    onChange: (value: any) => formik.setFieldValue(fieldName, value),
    onBlur: () => formik.setFieldTouched(fieldName),
  })

  const getFieldError = (fieldName: string) =>
    formik.touched[fieldName] ? formik.errors[fieldName] : undefined

  return (
    <FormRenderer
      formData={formData}
      onSubmit={formik.handleSubmit}
      getFieldState={getFieldState}
      getFieldError={getFieldError}
    />
  )
}
