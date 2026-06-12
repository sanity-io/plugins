import type {FC} from 'react'
import {useForm} from 'react-hook-form'
import {FormRenderer, type FormDataProps} from '@sanity/form-toolkit'

interface ReactHookFormExampleProps {
  formData: FormDataProps
  onSubmit?: (data: any) => void
}

export const ReactHookFormExample: FC<ReactHookFormExampleProps> = ({
  formData,
  onSubmit = console.log,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: {errors},
  } = useForm()

  const getFieldState = (fieldName: string) => {
    const {ref, ...rest} = register(fieldName, {
      required: formData.fields?.find((field) => field?.name === fieldName)?.required
        ? 'This field is required'
        : false,
    })

    return {
      value: watch(fieldName),
      ref,
      ...rest,
    }
  }

  const getFieldError = (fieldName: string) => errors[fieldName]?.message as string | undefined

  return (
    <FormRenderer
      formData={formData}
      onSubmit={handleSubmit(onSubmit)}
      getFieldError={getFieldError}
      getFieldState={getFieldState}
    />
  )
}
