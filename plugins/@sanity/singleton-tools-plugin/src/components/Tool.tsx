import {Flex, Heading} from '@sanity/ui'

function Layout({children}: {children: React.ReactNode}) {
  return (
    <Flex align="center" direction="column" height="fill" justify="center" style={{width: '100%'}}>
      {children}
    </Flex>
  )
}

export default function Tool() {
  return (
    <Layout>
      <Heading>Hello World!</Heading>
    </Layout>
  )
}
