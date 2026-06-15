import {Box} from '@sanity/ui'
import {defineArrayMember, defineField, definePlugin, defineType} from 'sanity'
import {type HotspotTooltipProps, imageHotspotArrayPlugin} from 'sanity-plugin-hotspot-array'

function HotspotPreview({value, schemaType, renderPreview}: HotspotTooltipProps) {
  return (
    <Box padding={2} style={{minWidth: 200}}>
      {renderPreview({value, schemaType, layout: 'default'})}
    </Box>
  )
}

const hotspotArrayDemo = defineType({
  name: 'hotspotArrayDemo',
  title: 'Hotspot Array Demo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'featureImage',
      title: 'Feature Image',
      type: 'image',
    }),
    defineField({
      name: 'hotspots',
      title: 'Hotspots',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'spot',
          type: 'object',
          fieldsets: [{name: 'position', options: {columns: 2}}],
          fields: [
            defineField({name: 'details', type: 'text', rows: 2}),
            defineField({
              name: 'x',
              type: 'number',
              readOnly: true,
              fieldset: 'position',
              initialValue: 50,
              validation: (rule) => rule.required().min(0).max(100),
            }),
            defineField({
              name: 'y',
              type: 'number',
              readOnly: true,
              fieldset: 'position',
              initialValue: 50,
              validation: (rule) => rule.required().min(0).max(100),
            }),
          ],
          preview: {
            select: {
              title: 'details',
              x: 'x',
              y: 'y',
            },
            prepare({title, x, y}) {
              return {
                title,
                subtitle: x && y ? `${x}% x ${y}%` : 'No position set',
              }
            },
          },
        }),
      ],
      options: {
        imageHotspot: {
          imagePath: 'featureImage',
          descriptionPath: 'details',
          tooltip: HotspotPreview,
        },
      },
    }),
  ],
})

export const hotspotArrayExample = definePlugin(() => ({
  name: 'hotspot-array-example',
  schema: {types: [hotspotArrayDemo]},
  plugins: [imageHotspotArrayPlugin()],
}))
