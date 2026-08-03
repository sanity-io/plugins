import type {PickerItem} from './types'

export function filterPickerItems(
  items: readonly PickerItem[],
  query: string,
): readonly PickerItem[] {
  if (query === '' || query === '/') return items

  const queryLower = query.toLowerCase()
  // Slash-mode queries always carry the leading "/", which titles and
  // keywords never contain — strip it before substring matching.
  const bareQuery = queryLower.startsWith('/') ? queryLower.slice(1) : queryLower

  return items.filter((item) => {
    // Triggers match with the slash stripped from both sides so that bare
    // shortcut-mode queries ("cta") reach them, not just slash-mode ones.
    const bareTrigger = item.trigger?.toLowerCase().replace(/^\//, '')
    if (bareTrigger && bareQuery !== '' && bareTrigger.startsWith(bareQuery)) return true
    if (bareQuery === '') return false
    if (item.title.toLowerCase().includes(bareQuery)) return true
    if (item.description?.toLowerCase().includes(bareQuery)) return true
    if (item.keywords?.some((kw) => kw.toLowerCase().includes(bareQuery))) return true
    return false
  })
}
