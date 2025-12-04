import {definePlugin, isObjectInputProps, type SchemaType} from 'sanity'

import {BynderInput, type BynderConfig} from './components/BynderInput'
import {bynderAssetSchema, type BynderAssetValue} from './schema/bynder.asset'

export const bynderInputPlugin = definePlugin((config: Partial<BynderConfig>) => {
  const reqConfig: BynderConfig = {
    portalConfig: {
      url: '',
      ...config?.portalConfig,
    },
    compactViewOptions: {
      language: 'en_US',
      ...config?.compactViewOptions,
    },
  }

  return {
    name: 'bynder-assets',
    schema: {
      types: [bynderAssetSchema],
    },
    form: {
      components: {
        input: (props) => {
          if (isObjectInputProps(props) && isType(props.schemaType, bynderAssetSchema.name)) {
            return (
              // @ts-expect-error - TODO: fix this
              <BynderInput
                {...props}
                value={props.value as BynderAssetValue}
                pluginConfig={reqConfig}
              />
            )
          }
          return props.renderDefault(props)
        },
      },
    },
  }
})

function isType(schemaType: SchemaType, name: string): boolean {
  if (schemaType.name === name) {
    return true
  }
  if (schemaType.type) {
    return isType(schemaType.type, name)
  }
  return false
}
