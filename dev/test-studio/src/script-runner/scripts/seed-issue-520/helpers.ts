export const DEFAULT_PUBLISHED_ID = 'issue-520-repro'

function randomKey(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)

  return Array.from(values, (value) => chars[value % chars.length]).join('')
}

export function createLocalizedValues() {
  return [
    {
      _key: randomKey(),
      language: 'es',
      _type: 'internationalizedArrayStringValue',
      value: 'Hola desde el seed',
    },
    {
      _key: randomKey(),
      language: 'en',
      _type: 'internationalizedArrayStringValue',
      value: 'Hello from the seed',
    },
    {
      _key: randomKey(),
      language: 'de',
      _type: 'internationalizedArrayStringValue',
      value: 'Hallo aus dem Seed',
    },
    {
      _key: randomKey(),
      language: 'fr',
      _type: 'internationalizedArrayStringValue',
      value: 'Bonjour du seed',
    },
  ]
}
