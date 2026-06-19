import {Card, Text} from '@sanity/ui'
import type {ReactElement} from 'react'

export const Option = (option: {
  value: string
  form: {
    header: {
      text?: string
    }
  }
  list: {
    name: string
    stats: {
      member_count: number
    }
  }
}): ReactElement => {
  return (
    <Card data-as="button" padding={3} radius={2} tone="inherit">
      <Text size={2} textOverflow="ellipsis">
        {`${option.form.header.text ? `${option.form.header.text} - ` : ``}${option.value}`}
      </Text>
      <Card paddingTop={2} tone="inherit" style={{background: 'inherit'}}>
        <Text size={1} textOverflow="ellipsis">
          {`${option.list.name} - ${option.list.stats.member_count} member${option.list.stats.member_count == 1 ? '' : 's'}`}
        </Text>
      </Card>
    </Card>
  )
}
