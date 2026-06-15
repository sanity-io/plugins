import {Container} from '@sanity/ui'

export function DashboardLayout({children}: {children: React.ReactNode}) {
  return (
    <Container width={4} padding={4} sizing="border" style={{height: '100%', overflowY: 'auto'}}>
      {children}
    </Container>
  )
}
