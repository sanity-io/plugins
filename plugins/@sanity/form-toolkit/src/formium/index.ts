import {createClient, type Form} from '@formium/client'
import {asyncList} from '@sanity/sanity-plugin-async-list'
import {definePlugin} from 'sanity'

interface FormiumInputConfig {
  /* nothing here yet */
}

/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {formiumInput} from 'sanity-plugin-form-toolkit'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [formiumInput()],
 * })
 * ```
 */
// Is Formium dead? All attempts to use the API come back with an expired cert https://github.com/formium/formium/issues/77
export const formiumInput = definePlugin<FormiumInputConfig | void>(() => {
  return {
    name: 'sanity-plugin-form-toolkit_formium-input',
    plugins: [
      asyncList({
        schemaType: 'formiumInput',
        secrets: {
          keys: [
            {key: 'projectId', title: 'Project ID'},
            {key: 'token', title: 'Token'},
          ],
        },
        loader: async ({secrets}) => {
          const formium = createClient(secrets?.projectId || '', {
            apiToken: secrets?.token,
          })
          const {data}: {data: Form[]} = await formium.findForms()
          return data && data.length
            ? data.map(({name, id}) => {
                return {
                  title: name,
                  value: id,
                }
              })
            : []
        },
      }),
    ],
  }
})
