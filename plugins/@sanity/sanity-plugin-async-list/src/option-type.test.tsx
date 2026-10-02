import {expect, test} from 'vitest'

import {asyncList, createAsyncListInput} from './index'

type Character = {value: string; name: string; imageUrl: string}

// `option` is hard-coded to BaseAutocompleteOption (`{value: string}`).
// Annotating it as Character is rejected:
//   Type '(option: Character) => JSX.Element' is not assignable to type
//   '(option: BaseAutocompleteOption) => Element'.
// Reading option.name with no annotation fails too:
//   Property 'name' does not exist on type 'BaseAutocompleteOption'.
test('option callbacks accept Character fields without a cast', () => {
  const plugin = asyncList({
    schemaType: 'character',
    loader: async () => [{value: '1', name: 'Elsa', imageUrl: '/elsa.png'}],
    autocompleteProps: {
      renderOption: (option: Character) => <span>{option.name}</span>,
      renderValue: (value, option: Character | undefined) => option?.imageUrl ?? value,
      filterOption: (_query, option: Character) => option.name.length > 0,
    },
  })

  expect(plugin.name).toBe('sanity-plugin-async-list')

  const input = createAsyncListInput({
    loader: async () => [{value: '1', name: 'Elsa', imageUrl: '/elsa.png'}],
    autocompleteProps: {
      renderOption: (option: Character) => <span>{option.name}</span>,
    },
  })
  expect(input).toBeTypeOf('function')
})
