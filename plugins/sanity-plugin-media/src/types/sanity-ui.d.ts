// oxlint-disable typescript/no-deprecated - legacy code will be lint-cleaned in a follow-up PR
import {type Theme} from '@sanity/ui'

declare module 'styled-components' {
  interface DefaultTheme extends Theme {}
}
