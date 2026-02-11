import type {LanguageDisplay} from '../types'

/**
 * Formats a language label for display in buttons and field headers
 * based on the configured `languageDisplay` mode:
 *
 * - `'codeOnly'`      -> uppercase code, e.g. `"EN"`
 * - `'titleOnly'`     -> title as-is, e.g. `"English"`
 * - `'titleAndCode'`  -> title with uppercase code, e.g. `"English (EN)"`
 *
 * Falls back to `title` for any unrecognized display mode.
 */
export function getLanguageDisplay(
  languageDisplay: LanguageDisplay,
  title: string,
  code: string,
): string {
  if (languageDisplay === 'codeOnly') return code.toUpperCase()
  if (languageDisplay === 'titleOnly') return title
  if (languageDisplay === 'titleAndCode') return `${title} (${code.toUpperCase()})`
  return title
}
