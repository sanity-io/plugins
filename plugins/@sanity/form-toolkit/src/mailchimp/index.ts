import {asyncList} from '@sanity/sanity-plugin-async-list'
import {definePlugin} from 'sanity'

import {Option} from './components/option'
import {mailchimpHandler} from './create-handler'
import {fetchMailchimpData} from './create-handler'
interface MailchimpInputConfig {
  url: string | URL
}

/**
 * Usage in `sanity.config.ts` (or .js)
 *
 * ```ts
 * import {defineConfig} from 'sanity'
 * import {mailchimpInput} from '@sanity/form-toolkit/mailchimp'
 *
 * export default defineConfig({
 *   // ...
 *   plugins: [mailchimpInput()],
 * })
 * ```
 */
export {fetchMailchimpData, mailchimpHandler}
export const mailchimpInput = definePlugin<MailchimpInputConfig>((options) => {
  return {
    name: 'sanity-plugin-form-toolkit_mailchimp-input',
    plugins: [
      asyncList({
        schemaType: 'mailchimpForm',
        loader: async () => {
          const data = await fetch(options.url)
          const body = await data.json()
          return body
        },
        autocompleteProps: {
          //@ts-expect-error incorrect typing on props?
          renderOption: (option) => Option(option),
        },
      }),
    ],
  }
})
