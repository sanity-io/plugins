export function extractLanguageFromCode(code = ``): string {
  return code.length > 2 ? code.split(/[-_]/)[0].toLowerCase() : code.toLowerCase()
}
