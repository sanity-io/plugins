import {CheckmarkCircleIcon, CloseCircleIcon, LockIcon} from '@sanity/icons'
import {schemaType, SECRET_TTL} from '@sanity/preview-url-secret/constants'
import {definePlugin, defineType} from 'sanity'

const schema = defineType({
  type: 'document',
  icon: LockIcon,
  name: schemaType,
  title: '@sanity/preview-url-secret',
  readOnly: true,
  fields: [
    {
      type: 'string',
      name: 'secret',
      title: 'Secret',
    },
    {
      type: 'string',
      name: 'source',
      title: 'Source Tool',
    },
    {
      type: 'string',
      name: 'studioUrl',
      title: 'Studio URL',
    },
    {
      type: 'string',
      name: 'userId',
      title: 'Sanity User ID',
    },
  ],
  preview: {
    select: {
      source: 'source',
      studioUrl: 'studioUrl',
      updatedAt: '_updatedAt',
    },
    prepare(data) {
      const url = data.studioUrl ? new URL(data.studioUrl, location.origin) : undefined
      const updatedAt = new Date(data.updatedAt).getTime()
      const expiresAt = new Date(updatedAt + 1000 * SECRET_TTL)
      const expired = expiresAt < new Date()
      const icon = expired ? CloseCircleIcon : CheckmarkCircleIcon
      return {
        title: url ? `${url.host}${url.pathname}` : data.source,
        subtitle: expired
          ? 'Expired'
          : `Expires in ${Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60))} minutes`,
        media: icon,
      }
    },
  },
})

export const debugSecrets = definePlugin(() => {
  return {
    name: 'sanity-plugin-debug-secrets',
    schema: {types: [schema]},
    document: {
      actions: (prev, context) => {
        if (context.schemaType !== schemaType) {
          return prev
        }
        return prev.filter(({action}) => action === 'delete')
      },
      inspectors: (prev, context) => {
        if (context.documentType !== schemaType) {
          return prev
        }
        return []
      },
      unstable_fieldActions: (prev, context) => {
        if (context.schemaType.name !== schemaType) {
          return prev
        }
        return []
      },
    },
  }
})
