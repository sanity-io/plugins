import {Flex, Heading} from '@sanity/ui'
import {styled} from 'styled-components'

const Layout = styled(Flex).attrs({
  align: 'center',
  direction: 'column',
  height: 'fill',
  justify: 'center',
})`
  width: 100%;
`

export default function Tool() {
  return (
    <Layout>
      <Heading>Hello World!</Heading>
    </Layout>
  )
}
