import {TextInput} from '@sanity/ui'
import {styled} from 'styled-components'

export const SearchInput = styled(TextInput)`
  position: sticky;
  top: 0;
  z-index: 1;
`

export const Scroller = styled.div`
  overflow-y: auto;
  max-height: 80vh;
`
