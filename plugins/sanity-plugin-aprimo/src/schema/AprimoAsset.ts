import {AprimoWidget} from '../components/AprimoWidget'

export const AprimoAssetSchema = {
  type: 'object',
  name: 'aprimo.asset',
  title: 'Aprimo Asset',
  fields: [
    {
      type: 'string',
      name: 'id',
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'aprimo.additionalFile',
      name: 'additionalFile',
    },
  ],
  components: {
    input: AprimoWidget,
  },
}
