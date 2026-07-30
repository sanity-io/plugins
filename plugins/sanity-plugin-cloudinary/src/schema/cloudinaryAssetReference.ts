import {defineType} from 'sanity'

import CloudinaryReferenceInput from '../components/CloudinaryReferenceInput'

export const cloudinaryAssetReference = defineType({
  name: 'cloudinaryAssetReference',
  title: 'Cloudinary Asset Reference',
  type: 'object',
  fields: [
    {
      name: 'asset',
      type: 'reference',
      to: [{type: 'cloudinaryAssetDocument'}],
      weak: true,
    },
  ],
  components: {
    input: CloudinaryReferenceInput,
  },
  preview: {
    select: {
      caption: 'asset.asset.context.custom.caption',
      alt: 'asset.asset.context.custom.alt',
      publicId: 'asset.asset.public_id',
      resourceType: 'asset.asset.resource_type',
      format: 'asset.asset.format',
      secureUrl: 'asset.asset.secure_url',
      url: 'asset.asset.url',
      derivedUrl: 'asset.asset.derived.0.secure_url',
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

      const title = caption || alt || publicId || 'Untitled Asset'
      const type = resourceType || 'image'
      const formatInfo = format ? `(${format})` : ''
      const subtitle = `${type} ${formatInfo}`

      let media = derivedUrl || secureUrl || url
      if (media && format === 'pdf') {
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
