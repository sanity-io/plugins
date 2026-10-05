import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import type {ReactNode} from 'react'

export function ThemeWrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={buildTheme()}>{children}</ThemeProvider>
}
