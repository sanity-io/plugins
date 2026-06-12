import {type ComponentType} from 'react'
import {type ArrayOfObjectsInputProps, definePlugin} from 'sanity'

import {type HotspotItem, ImageHotspotArray} from './ImageHotspotArray'
import {type HotspotTooltipProps} from './Spot'

export interface ImageHotspotOptions<HotspotFields = {[key: string]: unknown}> {
  pathRoot?: 'document' | 'parent'
  imagePath: string
  descriptionPath?: string
  tooltip?: ComponentType<HotspotTooltipProps<HotspotFields>>
}

declare module 'sanity' {
  export interface ArrayOptions {
    imageHotspot?: ImageHotspotOptions
  }
}

export const imageHotspotArrayPlugin = definePlugin({
  name: 'image-hotspot-array',
  form: {
    components: {
      input: (props) => {
        if (props.schemaType.jsonType === 'array' && props.schemaType.options?.imageHotspot) {
          const imageHotspotOptions = props.schemaType.options?.imageHotspot
          if (imageHotspotOptions) {
            return (
              <ImageHotspotArray
                // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- narrowed by the jsonType/options checks above
                {...(props as unknown as ArrayOfObjectsInputProps<HotspotItem>)}
                imageHotspotOptions={imageHotspotOptions}
              />
            )
          }
        }
        return props.renderDefault(props)
      },
    },
  },
})
