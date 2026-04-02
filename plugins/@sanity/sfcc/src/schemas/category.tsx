import {defineField} from 'sanity'

import {SfccDocumentStatus} from '../components/SfccDocumentStatus'

/**
 * SFCC category store field — contains all read-only data synced from
 * Salesforce Commerce Cloud.  Add this to a `category` document type's
 * `fields` array alongside your own custom fields.
 *
 * The field is placed in the `sfcc` group; make sure the document type
 * declares that group.
 */
export const sfccCategoryStoreField = defineField({
  readOnly: true,
  name: 'store',
  title: 'SFCC Data',
  type: 'object',
  group: 'sfcc',
  fields: [
    defineField({name: 'categoryId', title: 'Category ID', type: 'string', readOnly: true}),
    defineField({
      name: 'thumbnailImage',
      title: 'Thumbnail Image',
      type: 'string',
      readOnly: true,
    }),
    defineField({name: 'online', title: 'Online', type: 'boolean', readOnly: true}),
    defineField({name: 'onlineFrom', title: 'Online From', type: 'date', readOnly: true}),
    defineField({name: 'onlineTo', title: 'Online To', type: 'date', readOnly: true}),
    defineField({name: 'creationDate', title: 'Creation Date', type: 'date', readOnly: true}),
    defineField({name: 'isDeleted', title: 'Is Deleted', type: 'boolean', readOnly: true}),
    defineField({
      name: 'parentCategory',
      type: 'reference',
      to: [{type: 'category'}],
      readOnly: true,
    }),
    defineField({
      name: 'displayName',
      title: 'Display Name',
      type: 'internationalizedArrayString',
      readOnly: true,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'internationalizedArrayText',
      readOnly: true,
    }),
  ],
})

/**
 * Default preview configuration for the `category` document type.
 * Shows Category Name with parent category as subtitle.
 */
export const sfccCategoryPreview = {
  select: {
    imageUrl: 'store.thumbnailImage',
    isActive: 'store.online',
    displayName: 'store.displayName',
    title: 'title',
    name: 'name',
    categoryId: 'store.categoryId',
    parentDisplayName: 'store.parentCategory.store.displayName',
    parentName: 'store.parentCategory.name',
    parentId: 'store.parentCategory.store.categoryId',
  },
  prepare({
    imageUrl,
    displayName,
    title,
    name,
    categoryId,
    parentDisplayName,
    parentName,
    parentId,
    isActive,
  }: {
    imageUrl?: string
    displayName?: {value: string}[]
    title?: string
    name?: string
    categoryId?: string
    parentDisplayName?: {value: string}[]
    parentName?: string
    parentId?: string
    isActive?: boolean
  }) {
    const displayTitle =
      title || name || displayName?.[0]?.value || categoryId || 'Untitled Category'

    const isRoot = parentId === 'root'
    const parentLabel = !isRoot && (parentName || parentDisplayName?.[0]?.value || parentId)

    return {
      title: displayTitle,
      subtitle: parentLabel ? `Parent: ${parentLabel}` : '',
      media: (
        <SfccDocumentStatus isDeleted={!isActive} imageUrl={imageUrl ?? ''} title={displayTitle} />
      ),
    }
  },
}
