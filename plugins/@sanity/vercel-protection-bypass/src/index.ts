import { lazy } from 'react'
import { definePlugin, defineType } from 'sanity'
import { CheckmarkCircleIcon, CloseCircleIcon, LockIcon } from '@sanity/icons'
import {
  vercelProtectionBypassSchemaId as _id,
  vercelProtectionBypassSchemaType as type,
  tag,
} from '@sanity/preview-url-secret/constants'

const id = 'vercel-protection-bypass'

export interface VercelProtectionBypassConfig {
  name?: string
  title?: string
  icon?: React.ComponentType
}

export const vercelProtectionBypassTool = definePlugin<VercelProtectionBypassConfig | void>(
  (options) => {
    const { name = 'vercel-protection-bypass', title = 'Vercel Protection Bypass', icon, ...config } = options || {}
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
        inspectors: (prev, context) => {
          if (context.documentType !== type) {
            return prev
          }
          return []
        },
        unstable_fieldActions: (prev, context) => {
          if (context.schemaType.name !== type) {
            return prev
          }
          return []
        },
      },
      schema: {
        types: [defineType({
          type: 'document',
          icon: LockIcon,
          name: type,
          title,
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
              const enabled = data['secret'] !== null
              return {
                title,
                subtitle: enabled ? 'Enabled' : 'Disabled',
                media: enabled ? CheckmarkCircleIcon : CloseCircleIcon,
              }
            },
          },
        })]
      },
    }
  },
)
