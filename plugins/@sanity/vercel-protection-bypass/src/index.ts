import {lazy} from 'react'
import {definePlugin, defineType} from 'sanity'

import {CheckmarkCircleIcon, CloseCircleIcon, LockIcon} from '@sanity/icons'
import {
  vercelProtectionBypassSchemaId as _id,
  vercelProtectionBypassSchemaType as type,
} from '@sanity/preview-url-secret/constants'

const id = 'vercel-protection-bypass'

export interface VercelProtectionBypassConfig {
  name?: string
  title?: string
  icon?: React.ComponentType
}

const defaultTitle = 'Vercel Protection Bypass'
const schema = defineType({
  type: 'document',
  icon: LockIcon,
  name: type,
  title: defaultTitle,
  readOnly: true,
  fields: [
    {
      type: 'string',
      name: 'secret',
      title: 'Secret',
    },
  ],
  preview: {
    select: {
      secret: 'secret',
    },
    prepare(data) {
      const enabled = data.secret !== null
      return {
        title: enabled ? 'Enabled' : 'Disabled',
        subtitle: defaultTitle,
        media: enabled ? CheckmarkCircleIcon : CloseCircleIcon,
      }
    },
  },
})

export const vercelProtectionBypassTool = definePlugin<VercelProtectionBypassConfig | void>(
  (options) => {
    const {
      name = 'vercel-protection-bypass',
      title = 'Vercel Protection Bypass',
      icon = LockIcon,
      ...config
    } = options || {}
    return {
      name: `@sanity/preview-url-secret/${id}`,
      tools: [
        {
          name,
          title,
          icon: icon,
          component: lazy(() => import('./VercelProtectionBypassTool')),
          options: config,
          __internalApplicationType: `sanity/${id}`,
        },
      ],
      document: {
        actions: (prev, context) => {
          if (context.schemaType !== type) {
            return prev
          }
          return []
        },
      },
      schema: {types: [schema]},
    }
  },
)
