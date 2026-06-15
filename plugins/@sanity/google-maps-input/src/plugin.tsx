import {definePlugin, type SchemaType} from 'sanity'
import {GeopointInput, type GeopointInputProps} from './input/GeopointInput'
import {GeopointRadiusInput, type GeopointRadiusInputProps} from './input/GeopointRadiusInput'
import {setGeoConfig} from './global-workaround'
import type {GeopointSchemaType, GeopointRadiusSchemaType, GoogleMapsInputConfig} from './types'

export const googleMapsInput = definePlugin<GoogleMapsInputConfig>((config) => {
  setGeoConfig(config)
  return {
    name: 'google-maps-input',
    schema: {
      types: [
        {
          name: 'geopointRadius',
          title: 'Geopoint with Radius',
          type: 'object',
          fields: [
            {
              name: 'lat',
              title: 'Latitude',
              type: 'number',
              validation: (Rule: any) => Rule.required().min(-90).max(90),
            },
            {
              name: 'lng',
              title: 'Longitude',
              type: 'number',
              validation: (Rule: any) => Rule.required().min(-180).max(180),
            },
            {
              name: 'alt',
              title: 'Altitude',
              type: 'number',
            },
            {
              name: 'radius',
              title: 'Radius (meters)',
              type: 'number',
              validation: (Rule: any) => Rule.required().min(1).max(50000),
            },
          ],
          preview: {
            select: {
              lat: 'lat',
              lng: 'lng',
              radius: 'radius',
            },
            prepare({lat, lng, radius}: {lat: number; lng: number; radius: number}) {
              return {
                title: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                subtitle: radius ? `Radius: ${radius}m` : 'No radius set',
              }
            },
          },
        },
      ],
    },
    form: {
      components: {
        input(props) {
          if (isGeopoint(props.schemaType)) {
            const castedProps = props as unknown as Omit<GeopointInputProps, 'geoConfig'>
            return <GeopointInput {...castedProps} geoConfig={config} />
          }
          if (isGeopointRadius(props.schemaType)) {
            const castedProps = props as unknown as Omit<GeopointRadiusInputProps, 'geoConfig'>
            return <GeopointRadiusInput {...castedProps} geoConfig={config} />
          }
          return props.renderDefault(props)
        },
      },
    },
  }
})

function isGeopoint(schemaType: SchemaType): schemaType is GeopointSchemaType {
  return isType('geopoint', schemaType)
}

function isGeopointRadius(schemaType: SchemaType): schemaType is GeopointRadiusSchemaType {
  return isType('geopointRadius', schemaType)
}

function isType(name: string, schema?: SchemaType): boolean {
  if (schema?.name === name) {
    return true
    // eslint-disable-next-line no-negated-condition
  } else if (!schema?.name) {
    return false
  }
  return isType(name, schema?.type)
}
