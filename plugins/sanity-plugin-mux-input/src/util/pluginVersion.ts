export const PLUGIN_VERSION_QUERY = {
  sanityVersion:
    // @ts-expect-error - this constant is search/replaced so must be exact, not accessed with an index signature
    process.env.PKG_VERSION!,
}
