// oxlint-disable-next-line typescript/ban-ts-comment, typescript/prefer-ts-expect-error - @ts-ignore is needed because package tsc has Node globals
// @ts-ignore - legacy oxlint type-check config lacks Node globals
export const PLUGIN_VERSION_QUERY = {sanityVersion: process.env.PKG_VERSION!}
