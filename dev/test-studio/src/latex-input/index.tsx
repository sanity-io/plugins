import {definePlugin} from 'sanity'
import {latexInput} from 'sanity-plugin-latex-input'

export const latexInputExample = definePlugin(() => ({
  plugins: [latexInput()],
}))
