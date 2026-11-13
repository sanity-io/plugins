/**
 * The largest media index (`useMediaIndex` of `@sanity/ui`) that is too small
 * for the sidebar: up to it the Studio is on a phone-sized screen, which the
 * tool has no layout for yet, so the sidebar stays closed
 */
export const MIN_MEDIA_INDEX_FOR_SIDEBAR = 2
/** The largest media index that is too small for the split preview — two Studios side by side take room */
export const MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN = 3
/**
 * The Studio navbar's root, the `Card` that draws its bottom border — its
 * test id is stable and unique to the navbar, unlike its `data-ui` name
 */
export const NAVBAR_SELECTOR = '[data-testid="studio-navbar"]'
