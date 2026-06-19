import {Card, Text} from '@sanity/ui'
import type {ReactElement} from 'react'

export const Option = (option: {value: string; name: string}): ReactElement => {
  return (
    <Card data-as="button" padding={3} radius={2} tone="inherit">
      <Text size={2} textOverflow="ellipsis">
        {option.name}
      </Text>
      <Card paddingTop={2} tone="inherit" style={{background: 'inherit'}}>
        <Text size={1} textOverflow="ellipsis">
          {`ID: ${option.value}`}
        </Text>
      </Card>
    </Card>
  )
}
