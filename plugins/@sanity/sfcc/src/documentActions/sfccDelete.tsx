import {TrashIcon} from '@sanity/icons'
import {Stack, Text, useToast} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentActionComponent, useClient} from 'sanity'
import {useRouter} from 'sanity/router'

import {API_VERSION} from '../constants'

const CONFIG: Record<string, {message: string; backPath: string}> = {
  product: {
    message: 'Delete the current product and all associated variants in your dataset?',
    backPath: '/structure/products',
  },
  category: {
    message: 'Delete the current category from your dataset?',
    backPath: '/structure/categories',
  },
}

/**
 * Wraps the built-in delete action for SFCC-synced documents.
 *
 * - **Products**: deletes the product *and* all associated variants
 *   (resolved from `store.variants[]._ref`) in a single transaction,
 *   then navigates back to the products list.
 * - **Categories**: deletes the category with a confirmation warning,
 *   then navigates back to the categories list.
 */
export function createSfccDeleteAction(
  originalDeleteAction: DocumentActionComponent,
): DocumentActionComponent {
  return function SfccDeleteAction(props) {
    const originalResult = originalDeleteAction(props)

    const [dialogOpen, setDialogOpen] = useState(false)
    const router = useRouter()
    const toast = useToast()
    const client = useClient({apiVersion: API_VERSION})

    const {type, draft, published} = props
    const config = CONFIG[type]

    if (!config) return originalResult

    return {
      ...originalResult,
      tone: 'critical',
      icon: TrashIcon,
      label: 'Delete',
      onHandle: () => setDialogOpen(true),
      dialog: dialogOpen && {
        type: 'confirm',
        message: (
          <Stack space={4}>
            <Text size={1}>{config.message}</Text>
            <Text size={1} weight="medium">
              No data on SFCC will be deleted.
            </Text>
          </Stack>
        ),
        onCancel: () => setDialogOpen(false),
        onConfirm: async () => {
          const transaction = client.transaction()
          if (published?._id) transaction.delete(published._id)
          if (draft?._id) transaction.delete(draft._id)

          if (type === 'product' && published) {
            const store = published['store']
            const variants =
              store != null &&
              typeof store === 'object' &&
              'variants' in store &&
              Array.isArray(store.variants)
                ? store.variants
                : []
            for (const v of variants) {
              if (v != null && typeof v === 'object' && '_ref' in v && typeof v._ref === 'string') {
                transaction.delete(v._ref)
                transaction.delete(`drafts.${v._ref}`)
              }
            }
          }

          try {
            await transaction.commit()
            router.navigateUrl({path: config.backPath})
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown Error'
            toast.push({status: 'error', title: message})
          } finally {
            setDialogOpen(false)
          }
        },
      },
    }
  }
}
