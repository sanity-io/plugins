import {defineType} from 'sanity'

export const AprimoAdditionalFileSchema = defineType({
  name: 'aprimo.additionalFile',
  title: 'Aprimo Additional File',
  type: 'object',
  fields: [
    {
      name: 'additionalFileId',
      title: 'Additional File ID',
      type: 'string',
    },
    {
      name: 'fileName',
      title: 'File Name',
      type: 'string',
    },
    {
      name: 'label',
      title: 'Label',
      type: 'string',
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
    },
  ],
})
