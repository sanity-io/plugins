import {PackageIcon} from '@sanity/icons/Package'
import {TagIcon} from '@sanity/icons/Tag'
import {
  sfccPlugin,
  sfccProductStoreField,
  sfccProductPreview,
  sfccCategoryStoreField,
  sfccCategoryPreview,
  sfccRenderMembers,
  productStructure,
  categoryStructure,
} from '@sanity/sfcc'
import {defineField, definePlugin, defineType} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {type StructureResolver, structureTool} from 'sanity/structure'

// ---------------------------------------------------------------------------
// Document types
// ---------------------------------------------------------------------------

const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: TagIcon,
  groups: [
    {name: 'editorial', title: 'Editorial', default: true},
    {name: 'sfcc', title: 'Salesforce'},
  ],
  renderMembers: sfccRenderMembers,
  fields: [
    defineField({
      name: 'promotionalContent',
      title: 'Promotional Content',
      description: 'Rich text used for promotions, callouts, or seasonal messaging.',
      type: 'array',
      of: [{type: 'block'}],
      group: 'editorial',
    }),
    sfccProductStoreField,
  ],
  preview: sfccProductPreview,
})

const categoryType = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: PackageIcon,
  groups: [
    {name: 'editorial', title: 'Editorial', default: true},
    {name: 'sfcc', title: 'Salesforce'},
  ],
  renderMembers: sfccRenderMembers,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      description: 'Display name for this category, shown in navigation and headings.',
      type: 'string',
      group: 'editorial',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'A brief summary of the category for editorial use.',
      type: 'text',
      group: 'editorial',
    }),
    sfccCategoryStoreField,
  ],
  preview: sfccCategoryPreview,
})

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      categoryStructure(S, context),
      productStructure(S, context),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId()
        return id ? !['category', 'product'].includes(id) : false
      }),
    ])

// ---------------------------------------------------------------------------
// Exported example plugin (used as a standalone workspace)
// ---------------------------------------------------------------------------

export const sfccExample = definePlugin(() => ({
  schema: {
    types: [productType, categoryType],
  },
  plugins: [
    structureTool({structure}),
    sfccPlugin(),
    internationalizedArray({
      languages: [
        {id: 'en_US', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en_US'],
      fieldTypes: ['string', 'text'],
    }),
  ],
}))
