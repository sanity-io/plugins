import type {AssetSource, SchemaTypeDefinition, Tool} from 'sanity'
import {describe, expect, test} from 'vitest'

import {FOLDER_DOCUMENT_NAME, TAG_DOCUMENT_NAME} from './constants'
import {media, mediaAssetSource} from './plugin'

type PluginInstance = ReturnType<typeof media>

function getSchemaTypes(plugin: PluginInstance): SchemaTypeDefinition[] {
  return plugin.schema!.types as unknown as SchemaTypeDefinition[]
}

describe('media plugin', () => {
  test('registers media.tag and media.folder schema types', () => {
    const names = getSchemaTypes(media()).map((t) => t.name)
    expect(names).toContain(TAG_DOCUMENT_NAME)
    expect(names).toContain(FOLDER_DOCUMENT_NAME)
  })

  test('registers the Media studio tool', () => {
    const toolsFn = media().tools as unknown as (prev: Tool[]) => Tool[]
    const tools = toolsFn([])
    expect(tools.some((tool) => tool.name === 'media')).toBe(true)
  })

  test('appends media and edit-media asset sources for image and file', () => {
    const plugin = media()
    const imageSourcesFn = plugin.form!.image!.assetSources as unknown as (
      prev: AssetSource[],
    ) => AssetSource[]
    const fileSourcesFn = plugin.form!.file!.assetSources as unknown as (
      prev: AssetSource[],
    ) => AssetSource[]
    const imageSources = imageSourcesFn([])
    const fileSources = fileSourcesFn([])

    expect(imageSources.map((s) => s.name)).toEqual(expect.arrayContaining(['media', 'edit-media']))
    expect(fileSources.map((s) => s.name)).toEqual(expect.arrayContaining(['media', 'edit-media']))
  })

  test('exports mediaAssetSource with the Media picker component', () => {
    expect(mediaAssetSource.name).toBe('media')
    expect(mediaAssetSource.component).toBeTypeOf('function')
  })

  test('wraps studio layout with ToolOptionsProvider', () => {
    const layout = media({directUploads: false}).studio?.components?.layout
    expect(layout).toBeTypeOf('function')
  })
})
