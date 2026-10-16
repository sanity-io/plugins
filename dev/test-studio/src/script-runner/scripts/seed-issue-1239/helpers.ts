export const DEFAULT_TREE_DOCUMENT_ID = 'issue-1239-hierarchy'
export const DEFAULT_DOCUMENT_COUNT = 40
export const BOOK_ID_PREFIX = 'issue-1239-book-'

export function parseDocumentCount(raw: string | undefined): number {
  const parsed = Number.parseInt((raw || '').trim(), 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error('Document count must be a positive integer.')
  }
  if (parsed > 200) {
    throw new Error('Document count must be 200 or fewer.')
  }
  return parsed
}

export function bookId(index: number): string {
  return `${BOOK_ID_PREFIX}${String(index).padStart(2, '0')}`
}

export function treeNodeKey(index: number): string {
  return `issue1239node${String(index).padStart(2, '0')}`
}
