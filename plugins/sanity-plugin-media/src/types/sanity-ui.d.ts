// oxlint-disable typescript/no-deprecated - legacy media plugin ported code
import {type Theme} from '@sanity/ui'

declare module 'styled-components' {
  interface DefaultTheme extends Theme {}
}
