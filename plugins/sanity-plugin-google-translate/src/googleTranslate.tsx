import {definePlugin} from 'sanity'
import {GoogleTranslateInput} from './GoogleTranslateInput'

export const googleTranslate = definePlugin<void>(() => {
  return {
    name: 'sanity-plugin-google-translate',
    form: {
      components: {
        input: (props) => {
          if (props?.schemaType?.options?.translate) {
            if (props.schemaType.jsonType !== 'object') {
              throw new Error(
                `The translate option is only supported on object type fields, but got ${props.schemaType.jsonType}`
              )
            }

            // @ts-expect-error
            return <GoogleTranslateInput {...props} />
          }

          return props.renderDefault(props)
        },
      },
    },
  }
})
