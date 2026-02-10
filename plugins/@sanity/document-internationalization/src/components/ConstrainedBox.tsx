import {Box} from '@sanity/ui'

export default function ConstrainedBox({children}: {children: React.ReactNode}): React.JSX.Element {
  return <Box style={{maxWidth: 280}}>{children}</Box>
}
