import {definePlugin} from 'sanity'

import {latexSchema} from './schema'

export const latexInput = definePlugin({
  name: 'latex-block-plugin',
  schema: {
    types: [latexSchema],
  },
})
