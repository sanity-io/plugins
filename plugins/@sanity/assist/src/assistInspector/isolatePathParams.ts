type PaneParams = Record<string, string | undefined>

function shallowEqualParams(a: PaneParams, b: PaneParams): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every((key) => a[key] === b[key])
}

export interface IsolatedPathParams {
  /** The `path` value to keep in the nested pane's local state. */
  nextLocalPath: string | undefined
  /**
   * Params to forward to the host pane router, or `null` when only `path`
   * changed — in which case the host router (and therefore the host document's
   * focus and selected field group) is left untouched.
   */
  forwardParams: PaneParams | null
}

/**
 * The AI Assist inspector renders a nested document form for the instruction
 * document, but it reuses the host document's pane router. Sanity's document
 * pane mirrors the router `path` param to programmatic focus, and focus drives
 * the selected field group. So when the nested form writes `path`, the host
 * document re-focuses and its field group selection resets (SAPP-3970).
 *
 * This keeps the nested form's `path` navigation local, while still forwarding
 * every other param (e.g. the selected `instruction`) to the host router and
 * preserving the host document's own `path`.
 */
export function isolatePathParams(
  nextParams: PaneParams,
  hostParams: PaneParams,
): IsolatedPathParams {
  const {path: nextLocalPath, ...restNext} = nextParams
  const {path: hostPath, ...restHost} = hostParams

  if (shallowEqualParams(restNext, restHost)) {
    return {nextLocalPath, forwardParams: null}
  }

  return {nextLocalPath, forwardParams: {...restNext, path: hostPath}}
}
