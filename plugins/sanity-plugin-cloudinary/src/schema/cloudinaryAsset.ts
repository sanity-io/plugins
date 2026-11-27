import {lazy} from 'react'
import {defineType} from 'sanity'

import AssetPreview from '../components/AssetPreview'

// Both import `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must
// stay out of what the studio shell loads.
const AssetDiff = lazy(() => import('../components/AssetDiff'))
const CloudinaryInput = lazy(() => import('../components/CloudinaryInput'))

export const cloudinaryAssetSchema = defineType({
  type: 'object',
  name: 'cloudinary.asset',
  fields: [
    {
      type: 'string',
      name: 'id',
      // Cloudinary asset id (used by cloudinaryAssetDocument lookups)
    },
    {
      type: 'string',
      name: 'public_id',
    },
    {
      type: 'string',
      name: 'resource_type',
      // "image", "?"
    },
    {
      type: 'string',
      name: 'type',
      // "upload", "?"
    },
    {
      type: 'string',
      name: 'format',
      // "jpg"
    },
    {
      type: 'number',
      name: 'version',
    },
    {
      type: 'url',
      name: 'url',
    },
    {
      type: 'url',
      name: 'secure_url',
    },
    {
      type: 'number',
      name: 'width',
    },
    {
      type: 'number',
      name: 'height',
    },
    {
      type: 'number',
      name: 'bytes',
    },
    {
      type: 'number',
      name: 'duration',
      // can be null
    },
    {
      type: 'array',
      name: 'tags',
      of: [{type: 'string'}],
    },
    {
      type: 'datetime',
      name: 'created_at',
    },
    {
      type: 'array',
      name: 'derived',
      of: [{type: 'cloudinary.assetDerived', name: 'derived'}],
    },
    {
      type: 'string',
      name: 'access_mode',
    },
    {
      type: 'cloudinary.assetContext',
      name: 'context',
    },
    // metadata array of unknown content
  ],
  // The custom preview component receives legacy props that don't match the
  // PreviewProps type, so the components block is widened to keep type checking happy.
  ...({
    components: {
      input: CloudinaryInput,
      diff: AssetDiff,
      preview: AssetPreview,
    },
  } as {}),
  preview: {
    select: {
      url: 'url',
      resource_type: 'resource_type',
      type: 'type',
      derived: 'derived.0.url',
    },
    prepare({url, derived, resource_type, type}) {
      return {
        title: url,
        value: {
          title: url,
          resource_type,
          type,
          url: derived || url,
          // Keep the derived marker with its URL so the video preview knows `url` is the
          // editor's chosen transformation and must not be transformed again.
          derived: derived ? [{url: derived}] : undefined,
        },
      }
    },
  },
})
