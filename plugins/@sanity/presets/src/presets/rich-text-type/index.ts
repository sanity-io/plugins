import {defineArrayMember, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface RichTextObjectsConfig {
  link?: boolean
  image?: boolean
  cta?: boolean
}

export interface RichTextTypeConfig {
  /**
   * Toggle the embedded objects (link annotations, image blocks, inline CTAs).
   * Defaults to all enabled. Pass `false` to disable every object, or an
   * object to toggle individual ones (e.g. `{link: false}`).
   *
   * Each object's options (link `internalTypes`, image `altText`, …) are
   * configured on `createPresetsRegistry` and cascade into every rich text
   * field. Use `map.of` for per-field structural changes.
   */
  objects?: boolean | RichTextObjectsConfig
}

function resolveObjects(objects: RichTextTypeConfig['objects']): Required<RichTextObjectsConfig> {
  if (objects === false) return {link: false, image: false, cta: false}
  if (objects === true || objects === undefined) return {link: true, image: true, cta: true}
  const {link = true, image = true, cta = true} = objects
  return {link, image, cta}
}

export const richTextType = definePresetType<RichTextTypeConfig, 'array', 'of'>({
  name: 'richText',
  identifier: 'core.richText',
  schemaType: (config, registry) => {
    const {objects, ...arrayConfig} = config
    const {link, image, cta} = resolveObjects(objects)

    // The annotation name must be 'link' — Portable Text Editor's built-in link UI keys off this name.
    const linkAnnotation = link
      ? registry.getPreset('link', {name: 'link', title: 'Link'})
      : undefined
    const ctaInline = cta ? registry.getPreset('cta', {name: 'cta', title: 'CTA'}) : undefined
    const imageMember = image
      ? registry.getPreset('image', {name: 'richTextImage', title: 'Image'})
      : undefined

    const blockMember = defineArrayMember({
      type: 'block',
      marks: {annotations: linkAnnotation ? [linkAnnotation] : []},
      ...(ctaInline && {of: [ctaInline]}),
    })

    return defineType({
      ...arrayConfig,
      type: 'array',
      of: imageMember ? [blockMember, imageMember] : [blockMember],
    })
  },
})
