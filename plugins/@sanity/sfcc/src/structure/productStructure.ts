import {API_VERSION} from '../constants'
import {defineStructure} from './index'

export const productStructure = defineStructure((S, context) => {
  const client = context.getClient({apiVersion: API_VERSION})

  return S.listItem()
    .title('Products')
    .schemaType('product')
    .child(
      S.documentList()
        .title('Products')
        .schemaType('product')
        .filter('_type == "product" && store.productType in ["Master", "Simple"]')
        .apiVersion(API_VERSION)
        .child(async (productId) => {
          const product = await client.fetch('*[_id == $id][0]{store}', {id: productId})

          if (product?.store?.productType === 'Master') {
            const variantRefs: string[] =
              product.store.variants?.map((v: {_ref: string}) => v._ref) ?? []

            return S.list()
              .title('Product')
              .items([
                S.documentListItem().id(productId).schemaType('product'),
                S.divider().title('Variants'),
                ...variantRefs.map((ref) => S.documentListItem().id(ref).schemaType('product')),
              ])
          }

          return S.document().documentId(productId).schemaType('product')
        }),
    )
})
