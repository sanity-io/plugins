/** The configured directives an upload attaches: not the ones Mux doesn't have or were unchecked. */
export function directivesToAttach(
  configuredIds: string[],
  {missingIds = [], uncheckedIds = []}: {missingIds?: string[]; uncheckedIds?: string[]} = {},
): string[] {
  return configuredIds.filter((id) => !missingIds.includes(id) && !uncheckedIds.includes(id))
}

/**
 * Adds `directives` only when there are any, so other uploads keep the request they had. The
 * proxy moves it into `new_asset_settings` for a file; a URL ingest sends it to Mux as is.
 */
export function withDirectives<T extends object>(
  settings: T,
  directiveIds: string[],
): T & {directives?: {id: string}[]} {
  return directiveIds.length > 0
    ? {...settings, directives: directiveIds.map((id) => ({id}))}
    : settings
}
