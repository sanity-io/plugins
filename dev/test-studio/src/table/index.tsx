import {ThListIcon} from '@sanity/icons'
import {table} from '@sanity/table'
import {definePlugin, defineType} from 'sanity'

const tableTest = defineType({
  name: 'tableTest',
  type: 'document',
  title: 'Table',
  icon: ThListIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'sizeChart',
      title: 'Size Chart',
      description: 'A table input',
      type: 'table',
    },
  ],
})

export const tableExample = definePlugin(() => ({
  schema: {types: [tableTest]},
  plugins: [table()],
}))
