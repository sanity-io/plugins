import React, {type FC} from 'react'
import {FormRenderer, type FormDataProps} from '@sanity/form-toolkit'

interface NativeFormExampleProps {
  formData: FormDataProps
  action?: string
  method?: 'get' | 'post'
}
/**
 * Example of using the `FormRenderer` as a native HTML form element.
 */
export const NativeFormExample: FC<NativeFormExampleProps> = ({
  formData,
  action = '/api/submit',
  method = 'post',
}) => {
  return (
    <FormRenderer
      formData={formData}
      action={action}
      method={method}
      encType="multipart/form-data"
    />
  )
}
