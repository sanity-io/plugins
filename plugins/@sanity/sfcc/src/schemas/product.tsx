import {defineField} from 'sanity'

import {SfccDocumentStatus} from '../components/SfccDocumentStatus'

/**
 * SFCC product store field — contains all read-only data synced from
 * Salesforce Commerce Cloud.  Add this to a `product` document type's
 * `fields` array alongside your own custom fields.
 *
 * The field is placed in the `sfcc` group; make sure the document type
 * declares that group.
 */
export const sfccProductStoreField = defineField({
  readOnly: true,
  name: 'store',
  title: 'SFCC Data',
  type: 'object',
  group: 'sfcc',
  fields: [
    defineField({name: 'productId', title: 'Product ID', type: 'string', readOnly: true}),
    defineField({name: 'brand', title: 'Brand', type: 'string', readOnly: true}),
    defineField({name: 'color', title: 'Color', type: 'string', readOnly: true}),
    defineField({name: 'size', title: 'Size', type: 'string', readOnly: true}),
    defineField({name: 'width', title: 'Width', type: 'string', readOnly: true}),
    defineField({name: 'productType', title: 'Product Type', type: 'string', readOnly: true}),
    defineField({name: 'styleNumber', title: 'Style Number', type: 'string', readOnly: true}),
    defineField({name: 'searchable', title: 'Searchable', type: 'boolean', readOnly: true}),
    defineField({name: 'isSale', title: 'On Sale?', type: 'boolean', readOnly: true}),
    defineField({name: 'isNew', title: 'New Arrival?', type: 'boolean', readOnly: true}),
    defineField({
      name: 'manufacturerName',
      title: 'Manufacturer',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'manufacturerSKU',
      title: 'Manufacturer Product ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'creationDate',
      title: 'Creation Date',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'lastModified',
      title: 'Last Modified',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({name: 'onlineFlag', title: 'Online', type: 'boolean', readOnly: true}),
    defineField({name: 'onlineFrom', title: 'Online From', type: 'datetime', readOnly: true}),
    defineField({name: 'onlineTo', title: 'Online To', type: 'datetime', readOnly: true}),
    defineField({name: 'length', title: 'Length', type: 'string', readOnly: true}),
    defineField({name: 'memorySize', title: 'Memory Size', type: 'string', readOnly: true}),
    defineField({name: 'tvSize', title: 'TV Size', type: 'string', readOnly: true}),
    defineField({
      name: 'tvType',
      title: 'TV Type',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
    }),
    defineField({
      name: 'productImage',
      title: 'Product Image',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'refinementColor',
      title: 'Refinement Color',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}], weak: true}],
      readOnly: true,
    }),
    defineField({
      name: 'variationAttributes',
      title: 'Variation Attributes',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
    }),
    defineField({name: 'isDeleted', title: 'Is Deleted', type: 'boolean'}),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      readOnly: true,
    }),
    defineField({
      name: 'longDescription',
      title: 'Long Description',
      type: 'internationalizedArrayText',
      readOnly: true,
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'internationalizedArrayText',
      readOnly: true,
    }),
    defineField({
      name: 'pageTitle',
      title: 'Page Title',
      type: 'internationalizedArrayString',
      readOnly: true,
    }),
    defineField({
      name: 'pageDescription',
      title: 'Page Description',
      type: 'internationalizedArrayString',
      readOnly: true,
    }),
    defineField({
      name: 'pageKeywords',
      title: 'Page Keywords',
      type: 'internationalizedArrayString',
      readOnly: true,
    }),
    defineField({
      name: 'pageURL',
      title: 'Page URL',
      type: 'internationalizedArrayString',
      readOnly: true,
    }),
  ],
})

type VariationAttrKey = 'color' | 'size' | 'memorySize' | 'tvSize'

/**
 * Maps SFCC variation attribute IDs to their store field keys and display labels.
 */
const VARIATION_ATTRIBUTE_MAP: Record<string, {label: string; storeKey: VariationAttrKey}> = {
  color: {label: 'Color', storeKey: 'color'},
  size: {label: 'Size', storeKey: 'size'},
  memorySize: {label: 'Memory Size', storeKey: 'memorySize'},
  tvSize: {label: 'TV Size', storeKey: 'tvSize'},
}

/**
 * Default preview configuration for the `product` document type.
 * Shows product type for Master/Simple, and the relevant variation
 * attributes (driven by `store.variationAttributes`) for all products.
 */
export const sfccProductPreview = {
  select: {
    name: 'store.name',
    id: 'store.productId',
    productType: 'store.productType',
    variationAttributes: 'store.variationAttributes',
    color: 'store.color',
    size: 'store.size',
    memorySize: 'store.memorySize',
    tvSize: 'store.tvSize',
    productImage: 'store.productImage',
    isActive: 'store.onlineFlag',
  },
  prepare(selection: {
    name?: {value: string}[]
    id?: string
    productType?: string
    variationAttributes?: string[]
    color?: string
    size?: string
    memorySize?: string
    tvSize?: string
    productImage?: string
    isActive?: boolean
  }) {
    const {name, id, productType, variationAttributes, productImage, isActive, ...attrValues} =
      selection

    const title = name?.[0]?.value || id || 'Untitled Product'
    const meta: string[] = []
    if (productType && productType !== 'Variant') meta.push(productType)

    if (variationAttributes?.length) {
      for (const attr of variationAttributes) {
        const mapped = VARIATION_ATTRIBUTE_MAP[attr]
        const value = mapped && attrValues[mapped.storeKey]
        if (mapped && value) meta.push(`${mapped.label}: ${value}`)
      }
    } else {
      for (const [, {label, storeKey}] of Object.entries(VARIATION_ATTRIBUTE_MAP)) {
        const value = attrValues[storeKey]
        if (value) meta.push(`${label}: ${value}`)
      }
    }

    return {
      title,
      subtitle: meta.join(' | '),
      media: (
        <SfccDocumentStatus isDeleted={!isActive} imageUrl={productImage ?? ''} title={title} />
      ),
    }
  },
}
