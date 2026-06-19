export function publicId(id: string): string {
  return id.replace('drafts.', '')
}
