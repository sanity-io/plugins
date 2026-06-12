import {Container} from '@sanity/ui'
import {type PropsWithChildren} from 'react'

export function DashboardLayout(props: PropsWithChildren<{}>) {
  return (
    <Container width={4} padding={4} sizing="border" style={{height: '100%', overflowY: 'auto'}}>
      {props.children}
    </Container>
  )
}
