import {defineStructure} from './index'

export const categoryStructure = defineStructure((S) =>
  S.listItem().title('Categories').schemaType('category').child(S.documentTypeList('category')),
)
