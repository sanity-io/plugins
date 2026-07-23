/**
 * Tagged-template helper that strips the common leading indentation from
 * multi-line strings (same semantics as the `outdent` package for the
 * patterns used in this package).
 */
export function outdent(strings: TemplateStringsArray, ...values: unknown[]): string {
  const match = strings[0].match(/(\r\n|\r|\n)([ \t]*)(?:[^ \t\r\n]|$)/)
  const indentationLevel = match ? match[2].length : 0
  const reMatchIndent = new RegExp(`(\\r\\n|\\r|\\n).{0,${indentationLevel}}`, 'g')

  const outdented = strings.map((v, i) => {
    let s = v.replace(reMatchIndent, '$1')
    if (i === 0) {
      s = s.replace(/^[ \t]*(?:\r\n|\r|\n)/, '')
    }
    if (i === strings.length - 1) {
      s = s.replace(/(?:\r\n|\r|\n)[ \t]*$/, '')
    }
    return s
  })

  let result = ''
  for (let i = 0; i < outdented.length; i++) {
    result += outdented[i]
    if (i < values.length) {
      result += values[i]
    }
  }
  return result
}
