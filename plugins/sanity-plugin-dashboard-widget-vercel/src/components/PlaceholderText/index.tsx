import {Box, Stack, Text} from '@sanity/ui'

import {useCardColor} from '../../utils/useCardColor'

type Props = {
  rows: number
}

const PlaceholderText = (props: Props) => {
  const {rows} = props
  const {border} = useCardColor()
  return (
    <Box
      style={{
        backgroundColor: border,
        borderRadius: '3px',
        userSelect: 'none',
        width: '100%',
      }}
    >
      <Stack gap={2}>
        {Array.from({length: rows}, (_, index) => (
          <Text key={index} size={1}>
            &nbsp;
          </Text>
        ))}
      </Stack>
    </Box>
  )
}

export default PlaceholderText
