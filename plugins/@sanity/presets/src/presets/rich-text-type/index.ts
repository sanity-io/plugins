import {defineArrayMember, defineType} from 'sanity'

import {definePresetType} from '../../definePresetType'

export interface RichTextEmbedsConfig {
  link?: boolean
  image?: boolean
  cta?: boolean
}

export interface RichTextTypeConfig {
  /**
   * Toggle embeds. Defaults to all enabled. Pass `false` to disable every
   * embed, or an object to toggle individual ones (e.g. `{link: false}`).
   *
   * Each embed's options (link `internalTypes`, image `altText`, …) are
   * configured on `createPresetsRegistry` and cascade into every rich text
   * field. Use `map.of` for per-field structural changes.
   */
  embeds?: boolean | RichTextEmbedsConfig
}

function resolveEmbeds(embeds: RichTextTypeConfig['embeds']): Required<RichTextEmbedsConfig> {
  if (embeds === false) return {link: false, image: false, cta: false}
  if (embeds === true || embeds === undefined) return {link: true, image: true, cta: true}
  const {link = true, image = true, cta = true} = embeds
  return {link, image, cta}
}

export const richTextType = definePresetType<RichTextTypeConfig, 'array', 'of'>({
  name: 'richText',
  identifier: 'core.richText',
  schemaType: (config, registry) => {
    const {embeds, ...arrayConfig} = config
    const {link: embedLink, image: embedImage, cta: embedCta} = resolveEmbeds(embeds)

    // The annotation name must be 'link' — Portable Text Editor's built-in link UI keys off this name.
    const linkAnnotation = embedLink
      ? registry.getPreset('link', {name: 'link', title: 'Link'})
      : undefined
    const ctaInline = embedCta
      ? registry.getPreset('cta', {name: 'richTextCta', title: 'Button'})
      : undefined
    const imageMember = embedImage
      ? registry.getPreset('image', {name: 'richTextImage', title: 'Image'})
      : undefined

    const blockMember = defineArrayMember({
      type: 'block',
      marks: {annotations: linkAnnotation ? [linkAnnotation] : []},
      ...(ctaInline && {of: [ctaInline]}),
    })

    return defineType({
      title: 'Rich text',
      ...arrayConfig,
      type: 'array',
      of: imageMember ? [blockMember, imageMember] : [blockMember],
    })
  },
})
