import {googleMapsInput} from '@sanity/google-maps-input'
import {PinIcon} from '@sanity/icons'
import {definePlugin, defineType} from 'sanity'

const googleMapsTest = defineType({
  name: 'googleMapsTest',
  type: 'document',
  title: 'Google Maps',
  icon: PinIcon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'location',
      title: 'Location',
      description: 'A basic geopoint field rendered with the Google Maps input',
      type: 'geopoint',
    },
    {
      name: 'serviceArea',
      title: 'Service area',
      description: 'A geopointRadius field with an editable radius circle',
      type: 'geopointRadius',
    },
    {
      name: 'locations',
      title: 'Locations',
      description: 'An array of geopoints',
      type: 'array',
      of: [{type: 'geopoint'}],
    },
  ],
})

export const googleMapsInputExample = definePlugin(() => ({
  schema: {types: [googleMapsTest]},
  plugins: [
    googleMapsInput({
      apiKey: process.env.SANITY_STUDIO_GOOGLE_MAPS_API_KEY || '',
      defaultZoom: 11,
      saveZoom: true,
      defaultLocation: {lat: 59.91273, lng: 10.74609},
      defaultRadius: 1000,
    }),
  ],
}))
