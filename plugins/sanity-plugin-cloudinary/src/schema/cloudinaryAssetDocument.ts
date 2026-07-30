import {defineType} from 'sanity'

import {cloudinaryAssetSchema} from './cloudinaryAsset'

export const cloudinaryAssetDocument = defineType({
  name: 'cloudinaryAssetDocument',
  title: 'Cloudinary Asset',
  type: 'document',
  // Shared assets are patched in place by the reference input; liveEdit avoids
  // desk drafts that could later publish over those updates.
  liveEdit: true,
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
      // Desk list `media` needs a URL (or React element), not the raw asset object
      secureUrl: 'asset.secure_url',
      url: 'asset.url',
      derivedUrl: 'asset.derived.0.secure_url',
    },
    prepare(selection) {
      const {caption, alt, publicId, resourceType, format, secureUrl, url, derivedUrl} =
        selection as {
          caption?: string
          alt?: string
          publicId?: string
          resourceType?: string
          format?: string
          secureUrl?: string
          url?: string
          derivedUrl?: string
        }

      // Prefer caption/alt from Cloudinary context; fall back to public_id
      const title = caption || alt || publicId || 'Untitled Asset'

      const type = resourceType || 'image'
      const formatInfo = format ? `(${format})` : ''
      const subtitle = `${type} ${formatInfo}`

      let media = derivedUrl || secureUrl || url
      // Desk/list media is rendered as an <img>; only pass image (and PDF) URLs
      if (type !== 'image' || !media) {
        media = undefined
      } else if (format === 'pdf') {
        media = media.replace(
          'image/upload',
          'image/upload/f_jpg,pg_1,l_text:Verdana_75_letter_spacing_14:PDF',
        )
      }

      return {
        title,
        subtitle,
        media,
      }
    },
  },
})
