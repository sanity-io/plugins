import type {PluginOptions, SchemaTypeDefinition} from 'sanity'
import {expect, test} from 'vitest'

import {asyncList, createAsyncListInput, type AsyncListPluginConfig} from './index'

function schemaTypeNames(plugin: PluginOptions): string[] {
  const types = plugin.schema?.types
  if (!Array.isArray(types)) {
    throw new Error('expected async-list to register a schema types array')
  }
  return types.map((type: SchemaTypeDefinition) => type.name)
}

type Character = {value: string; name: string; imageUrl: string}

test('registers a schema type and types autocomplete callbacks from the option argument', () => {
  const plugin = asyncList<Character>({
    schemaType: 'character',
    loader: async () => [{value: '1', name: 'Elsa', imageUrl: '/elsa.png'}],
    autocompleteProps: {
      renderOption: (option) => <span>{option.name}</span>,
      renderValue: (value, option) => option?.imageUrl ?? value,
      filterOption: (_query, option) => option.name.length > 0,
    },
  })

  expect(plugin.name).toBe('sanity-plugin-async-list')
  expect(schemaTypeNames(plugin)).toEqual(['character'])

  const input = createAsyncListInput<Character>({
    loader: async () => [{value: '1', name: 'Elsa', imageUrl: '/elsa.png'}],
    autocompleteProps: {
      renderValue: (value, option) => option?.name ?? value,
    },
  })
  expect(input).toBeTypeOf('function')
})

test('keeps the default option type and still allows extra loader fields', () => {
  const plugin = asyncList({
    schemaType: 'form',
    loader: async () => {
      const rows: {name: string; id: string}[] = []
      return rows.map(({name, id}) => ({title: name, value: id}))
    },
    autocompleteProps: {
      placeholder: 'Search',
      // @ts-expect-error title is not part of the default option type
      renderOption: (option) => <span>{option.title}</span>,
    },
  })

  expect(schemaTypeNames(plugin)).toEqual(['form'])
})

test('rejects a loader result that is missing fields of the configured option', () => {
  asyncList<Character>({
    schemaType: 'character',
    // @ts-expect-error imageUrl is required on Character
    loader: async () => [{value: '1', name: 'Elsa'}],
  })
})

test('accepts a config value that is already annotated with the option type', () => {
  const config: AsyncListPluginConfig<Character> = {
    schemaType: 'character',
    loader: async () => [{value: '1', name: 'Elsa', imageUrl: '/elsa.png'}],
    autocompleteProps: {
      renderValue: (_value, option) => option?.name ?? '',
    },
  }

  expect(asyncList(config).name).toBe('sanity-plugin-async-list')
})
