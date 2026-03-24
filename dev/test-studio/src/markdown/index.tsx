import {defineType, definePlugin} from 'sanity'
import {markdownSchema} from 'sanity-plugin-markdown'

const markdownTest = defineType({
  type: 'document',
  name: 'markdownTest',
  title: 'Markdown',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    },
    {type: 'markdown', name: 'markdown', title: 'Markdown'},
  ],
})

export const markdownExample = definePlugin(() => ({
  schema: {types: [markdownTest]},
  plugins: [markdownSchema()],
}))
