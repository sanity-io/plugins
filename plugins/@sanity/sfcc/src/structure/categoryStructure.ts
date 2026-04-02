import type {ListItemBuilder} from 'sanity/structure'

import {defineStructure} from './index'

export const categoryStructure = defineStructure<ListItemBuilder>((S) =>
  S.listItem().title('Categories').schemaType('category').child(S.documentTypeList('category')),
)
