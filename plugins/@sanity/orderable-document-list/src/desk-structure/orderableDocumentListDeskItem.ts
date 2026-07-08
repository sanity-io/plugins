import {GenerateIcon} from '@sanity/icons/Generate'
import {SortIcon} from '@sanity/icons/Sort'
import {type ComponentType} from 'react'
import type {ConfigContext} from 'sanity'
import {type ListItem, type MenuItem, type StructureBuilder} from 'sanity/structure'

import {API_VERSION} from '../helpers/constants'
import {OrderableDocumentList} from '../OrderableDocumentList'

export interface OrderableListConfig {
  type: string
  id?: string
  title?: string
  icon?: ComponentType
  params?: Record<string, unknown>
  filter?: string
  menuItems?: MenuItem[]
  createIntent?: boolean
  context: ConfigContext
  S: StructureBuilder
}

export function orderableDocumentListDeskItem(config: OrderableListConfig): ListItem {
  if (!config?.type || !config.context || !config.S) {
    throw new Error(`
    type, context and S (StructureBuilder) must be provided.
    context and S are available when configuring structure.
    Example: orderableDocumentListDeskItem({type: 'category'})
    `)
  }

  const {type, filter, menuItems = [], createIntent, params, title, icon, id, context, S} = config
  const {schema, getClient} = context
  const maybePerspectiveStack: unknown = Reflect.get(context, 'perspectiveStack')
  const perspectiveStack =
    Array.isArray(maybePerspectiveStack) &&
    maybePerspectiveStack.every((item): item is string => typeof item === 'string')
      ? maybePerspectiveStack
      : []
  const client = getClient({apiVersion: API_VERSION})
  // the first position in the perspective stack is the current version
  const currentVersion = perspectiveStack[0]

  const listTitle = title ?? `Orderable ${type}`
  const listId = id ?? `orderable-${type}`
  const listIcon = icon ?? SortIcon
  const typeTitle = schema.get(type)?.title ?? type
  const defaultMenuItems = [...menuItems]

  if (createIntent !== false) {
    defaultMenuItems.push(
      S.menuItem()
        .title(`Create new ${typeTitle}`)
        .intent({type: 'create', params: {type}})
        .serialize(),
    )
  }

  return S.listItem()
    .title(listTitle)
    .id(listId)
    .icon(listIcon)
    .schemaType(type)
    .child(
      Object.assign(
        S.documentTypeList(type)
          .canHandleIntent(
            (_intentName, params) => createIntent !== false && params?.['type'] === type,
          )
          .serialize(),
        {
          // Prevents the component from re-rendering when switching documents
          __preserveInstance: true,
          // Prevents the component from NOT re-rendering when switching listItems
          key: listId,

          type: 'component',
          component: OrderableDocumentList,
          options: {type, filter, params, client, currentVersion},
          menuItems: [
            ...defaultMenuItems,
            S.menuItem().title(`Reset Order`).icon(GenerateIcon).action(`resetOrder`).serialize(),
            S.menuItem()
              .title(`Toggle Increments`)
              .icon(SortIcon)
              .action(`showIncrements`)
              .serialize(),
          ],
        },
      ),
    )
    .serialize()
}
