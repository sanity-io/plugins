/** Robots directives on a new upload. */

/** The configured directives an upload attaches: not the ones Mux doesn't have or were unchecked. */
export function directivesToAttach(
  configuredIds: string[],
  {missingIds = [], uncheckedIds = []}: {missingIds?: string[]; uncheckedIds?: string[]} = {},
): string[] {
  return configuredIds.filter((id) => !missingIds.includes(id) && !uncheckedIds.includes(id))
}

/**
 * Adds `directives` to the new asset settings only when there are any, so every other upload
 * request stays exactly as it was. Both upload paths send these settings: the proxy moves them
 * into `new_asset_settings` for a file, and a URL ingest sends them to Mux as they are.
 */
export function withDirectives<T extends object>(
  settings: T,
  directiveIds: string[],
): T & {directives?: {id: string}[]} {
  return directiveIds.length > 0
    ? {...settings, directives: directiveIds.map((id) => ({id}))}
    : settings
}
