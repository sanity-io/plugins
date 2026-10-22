import {CloseIcon} from '@sanity/icons/Close'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Flex, TextInput} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ChangeEvent} from 'react'

import {useMediaActors} from '../../contexts/MediaActorsContext'

const TextInputSearch = () => {
  const {assets} = useMediaActors()
  const searchQuery = useSelector(assets, (snapshot) => snapshot.context.searchQuery)

  // Callbacks
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    assets.send({type: 'search.query.set', query: e.currentTarget.value})
  }

  const handleClear = () => {
    assets.send({type: 'search.query.set', query: ''})
  }

  return (
    <Box style={{position: 'relative'}}>
      <TextInput
        fontSize={1}
        icon={SearchIcon}
        onChange={handleChange}
        placeholder="Search"
        radius={2}
        value={searchQuery}
      />

      {/* Clear form button */}
      {searchQuery.length > 0 && (
        <Flex
          align="center"
          justify="center"
          onClick={handleClear}
          style={{
            cursor: 'pointer',
            height: '100%',
            opacity: 0.75,
            position: 'absolute',
            right: 0,
            top: 0,
            width: '2em',
            zIndex: 1, // force stacking context
          }}
        >
          <CloseIcon />
        </Flex>
      )}
    </Box>
  )
}

export default TextInputSearch
