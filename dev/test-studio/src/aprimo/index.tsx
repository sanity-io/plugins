import {definePlugin, defineType} from 'sanity'
import {aprimoPlugin} from 'sanity-plugin-aprimo'

const aprimoTest = defineType({
  title: 'Aprimo',
  name: 'aprimoTest',
  type: 'document',
  fields: [
    {
      title: 'Title',
      name: 'Title',
      type: 'string',
    },
    {
      title: 'Aprimo CDN Image',
      name: 'aprimoCDNImage',
      type: 'aprimo.cdnasset',
      description: 'Test Aprimo CDN asset',
    },
    {
      title: 'Asset Array',
      name: 'assetArray',
      description: 'Test adding Aprimo assets to nested structures within Sanity',
      type: 'array',
      of: [{type: 'aprimo.cdnasset'}],
    },
  ],
})

export const aprimoExample = definePlugin(() => ({
  schema: {types: [aprimoTest]},
  plugins: [aprimoPlugin({tenantName: 'partner1'})],
}))
