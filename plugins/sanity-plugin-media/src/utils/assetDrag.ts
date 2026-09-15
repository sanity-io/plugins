import type {DragEvent} from 'react'

/**
 * Custom drag data type used when dragging assets from the browser grid or table
 * onto a folder in the folder panel.
 *
 * A custom MIME type keeps these drags separate from OS file drags, so the upload
 * dropzone (which only reacts to `Files`) ignores them.
 */
export const ASSET_DRAG_TYPE = 'application/x-sanity-media-assets'

/**
 * Write the dragged asset ids onto the drag event.
 */
export function setDragAssetIds(event: DragEvent, assetIds: string[]): void {
  event.dataTransfer.setData(ASSET_DRAG_TYPE, JSON.stringify(assetIds))
  event.dataTransfer.effectAllowed = 'move'
}

/**
 * Whether a drag event carries asset ids written by `setDragAssetIds`.
 *
 * During `dragover`, browsers hide the data payload but still expose the type list.
 */
export function isAssetDrag(event: DragEvent): boolean {
  return Array.prototype.includes.call(event.dataTransfer.types, ASSET_DRAG_TYPE)
}

/**
 * Read the dragged asset ids from a `drop` event. Returns an empty array when the
 * payload is missing or malformed.
 */
export function getDragAssetIds(event: DragEvent): string[] {
  const raw = event.dataTransfer.getData(ASSET_DRAG_TYPE)
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}
