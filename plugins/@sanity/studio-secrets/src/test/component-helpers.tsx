import type {ReactNode} from 'react'

import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'

/**
 * Wrapper component that provides @sanity/ui ThemeProvider for component tests.
 * All components rendering @sanity/ui elements need this.
 */
export function ThemeWrapper({children}: {children: ReactNode}) {
  const theme = buildTheme()
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
