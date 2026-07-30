import {defineType} from 'sanity'

import {cloudinaryAssetSchema} from './cloudinaryAsset'

export const cloudinaryAssetDocument = defineType({
  name: 'cloudinaryAssetDocument',
  title: 'Cloudinary Asset',
  type: 'document',
  fields: [
    {
      name: 'asset',
      type: cloudinaryAssetSchema.name,
      title: 'Cloudinary Asset',
    },
  ],
  preview: {
    select: {
      caption: 'asset.context.custom.caption',
      alt: 'asset.context.custom.alt',
      publicId: 'asset.public_id',
      resourceType: 'asset.resource_type',
      format: 'asset.format',
      media: 'asset',
    },
    prepare(selection) {
      const {caption, alt, publicId, resourceType, format, media} = selection as {
        caption?: string
        alt?: string
        publicId?: string
        resourceType?: string
        format?: string
        media?: any
      }

      // Prefer caption/alt from Cloudinary context; fall back to public_id
      const title = caption || alt || publicId || 'Untitled Asset'

      const type = resourceType || 'image'
      const formatInfo = format ? `(${format})` : ''
      const subtitle = `${type} ${formatInfo}`

      return {
        title,
        subtitle,
        media,
      }
    },
  },
})
