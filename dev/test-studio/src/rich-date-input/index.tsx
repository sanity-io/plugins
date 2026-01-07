import {CalendarIcon} from '@sanity/icons'
import {richDate} from '@sanity/rich-date-input'
import {definePlugin, defineType} from 'sanity'

const richDateTest = defineType({
  name: 'richDateTest',
  type: 'document',
  title: 'Rich Date',
  icon: CalendarIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'scheduledAt',
      title: 'Scheduled At',
      description: 'A timezone-aware date and time',
      type: 'richDate',
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      description: 'Another timezone-aware date with time steps',
      type: 'richDate',
      options: {
        timeStep: 30,
      },
    },
    {
      name: 'dateList',
      title: 'List of Dates',
      description: 'An array of rich dates',
      type: 'array',
      of: [{type: 'richDate'}],
    },
  ],
})

export const richDateInputExample = definePlugin(() => ({
  schema: {types: [richDateTest]},
  plugins: [richDate()],
}))
