import {codeInput} from '@sanity/code-input'
import {definePlugin} from 'sanity'

export const codeInputExample = definePlugin(() => ({
  plugins: [codeInput()],
}))
