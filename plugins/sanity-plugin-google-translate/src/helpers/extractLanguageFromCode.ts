export function extractLanguageFromCode(code = ``): string {
  if (code.length <= 2) {
    return code.toLowerCase()
  }

  const [languageCode] = code.split(/[-_]/)
  return (languageCode ?? code).toLowerCase()
}
