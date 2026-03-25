import {defineField, defineType, type SchemaTypeDefinition} from 'sanity'

import {LINK_FIELD_TYPE} from './constants'
import {LinkFieldInput} from './LinkFieldInput'

function getParentLinkType(parent: unknown): string | undefined {
  if (typeof parent === 'object' && parent !== null && 'linkType' in parent) {
    const linkType = parent.linkType
    return typeof linkType === 'string' ? linkType : undefined
  }
  return undefined
}

function isExternalLink({parent}: {parent?: Record<string, unknown>}): boolean {
  return parent?.['linkType'] === 'external'
}

function isInternalLink({parent}: {parent?: Record<string, unknown>}): boolean {
  return parent?.['linkType'] === 'internal'
}

function requireReferenceForInternal(value: unknown, context: {parent?: unknown}): string | true {
  if (getParentLinkType(context.parent) === 'internal' && !value) {
    return 'A reference is required for internal links'
  }
  return true
}

function requireUrlForExternal(value: unknown, context: {parent?: unknown}): string | true {
  if (getParentLinkType(context.parent) === 'external' && !value) {
    return 'A URL is required for external links'
  }
  return true
}

function prepareLinkPreview({
  linkType,
  url,
  referenceTitle,
}: {
  linkType?: string
  url?: string
  referenceTitle?: string
}) {
  const title = linkType === 'external' ? url || 'No URL' : referenceTitle || 'No reference'

  return {
    title,
    subtitle: linkType === 'external' ? 'External link' : 'Internal link',
  }
}

export function createLinkFieldType(internalTypes: string[]): SchemaTypeDefinition {
  const referenceTargets = internalTypes.map((typeName) => ({type: typeName}))

  return defineType({
    name: LINK_FIELD_TYPE,
    type: 'object',
    title: 'Link',
    components: {input: LinkFieldInput},
    fields: [
      defineField({
        name: 'linkType',
        type: 'string',
        title: 'Link Type',
        initialValue: 'internal',
        options: {
          layout: 'radio',
          list: [
            {title: 'Internal', value: 'internal'},
            {title: 'External', value: 'external'},
          ],
        },
      }),
      defineField({
        name: 'reference',
        type: 'reference',
        title: 'Internal Link',
        to: referenceTargets,
        hidden: isExternalLink,
        validation: (rule) => rule.custom(requireReferenceForInternal),
      }),
      defineField({
        name: 'url',
        type: 'url',
        title: 'URL',
        hidden: isInternalLink,
        validation: (rule) =>
          rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}).custom(requireUrlForExternal),
      }),
      defineField({
        name: 'openInNewTab',
        type: 'boolean',
        title: 'Open in New Tab',
        initialValue: false,
        hidden: isInternalLink,
      }),
    ],
    preview: {
      select: {
        linkType: 'linkType',
        url: 'url',
        referenceTitle: 'reference.title',
      },
      prepare: prepareLinkPreview,
    },
  })
}
