import {definePlugin} from 'sanity'
import {googleTranslate} from 'sanity-plugin-google-translate'

export const googleTranslateExample = definePlugin(() => ({
  plugins: [googleTranslate()],
}))
