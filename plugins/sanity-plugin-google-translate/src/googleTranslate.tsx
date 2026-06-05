import {definePlugin} from 'sanity'

import {GoogleTranslateInput} from './GoogleTranslateInput'
import type {GoogleTranslateSchemaOptions} from './types'

export const googleTranslate = definePlugin(() => {
  return {
    name: 'sanity-plugin-google-translate',
    form: {
      components: {
        input: (props) => {
          // oxlint-disable-next-line no-unsafe-type-assertion - plugin-specific object options
          const options = props.schemaType.options as GoogleTranslateSchemaOptions | undefined

          if (options?.translate) {
            if (props.schemaType.jsonType !== 'object') {
              throw new Error(
                `The translate option is only supported on object type fields, but got ${props.schemaType.jsonType}`,
              )
            }

            // @ts-expect-error - form input props are wider than ObjectInputProps
            return <GoogleTranslateInput {...props} />
          }

          return props.renderDefault(props)
        },
      },
    },
  }
})
