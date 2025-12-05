import {defineType} from 'sanity'

export const markdownTest = defineType({
  type: 'document',
  name: 'markdownTest',
  title: 'Markdown',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'markdown', name: 'markdown', title: 'Markdown'},
  ],
})
