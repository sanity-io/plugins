/**
 * Normalize a string into a Sanity-safe dataset id (letters, digits, `_`, `-`).
 * Mirrors `sanityIdify` from sanity-io/sanity (`@repo/utils`).
 */
export function sanityIdify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^-/, '')
}
