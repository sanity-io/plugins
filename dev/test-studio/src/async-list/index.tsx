import {asyncList, createAsyncListInput} from '@sanity/sanity-plugin-async-list'
import {definePlugin, defineType} from 'sanity'

const asyncListTest = defineType({
  type: 'document',
  name: 'asyncListTest',
  title: 'Async List',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'pokemon', name: 'pokemon', title: 'Pokemon (seed loader)'},
    {type: 'disneyCharacter', name: 'disneyCharacter', title: 'Disney Character (search loader)'},
    {
      // Plain string field wired directly via `createAsyncListInput` (no plugin
      // schemaType) to exercise the component API and the stable per-field id.
      type: 'string',
      name: 'componentBerry',
      title: 'Berry (component usage, seed loader)',
      components: {
        input: createAsyncListInput({
          loader: async () => {
            const response = await fetch('https://pokeapi.co/api/v2/berry?limit=50&offset=0')
            const result: {results: {name: string}[]} = await response.json()

            return result.results.map((item) => ({value: item.name}))
          },
        }),
      },
    },
  ],
})

export const asyncListExample = definePlugin(() => ({
  name: 'async-list-example',
  schema: {types: [asyncListTest]},
  plugins: [
    // Seed loader: fetches the options once when the field is rendered
    asyncList({
      schemaType: 'pokemon',
      loader: async () => {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151&offset=0')
        const result: {results: {name: string}[]} = await response.json()

        return result.results.map((item) => ({value: item.name}))
      },
      autocompleteProps: {
        placeholder: 'Search Pokemon',
      },
    }),
    // Search loader: re-runs the loader with the user's query as they type
    asyncList({
      schemaType: 'disneyCharacter',
      loaderType: 'search',
      loader: async ({query}) => {
        const url = query
          ? `https://api.disneyapi.dev/character?name=${encodeURIComponent(query)}`
          : 'https://api.disneyapi.dev/character'

        const response = await fetch(url)
        const result: {data: {name: string}[] | {name: string} | null} = await response.json()
        const characters = Array.isArray(result.data)
          ? result.data
          : result.data
            ? [result.data]
            : []

        // The API can return multiple characters with the same name, but
        // option values must be unique
        const names = new Set<string>()
        return characters.flatMap((item) => {
          if (names.has(item.name)) return []
          names.add(item.name)
          return [{value: item.name}]
        })
      },
    }),
  ],
}))
