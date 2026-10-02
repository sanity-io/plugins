/**
 * The media index (`useMediaIndex` of `@sanity/ui`) the sidebar needs: below
 * it the Studio is on a phone-sized screen, which the tool has no layout for
 * yet — the sidebar stays closed there, and the navbar toggle stays away
 */
export const MIN_MEDIA_INDEX_FOR_SIDEBAR = 3
/** The media index the split preview needs — two Studios side by side take room */
export const MIN_MEDIA_INDEX_FOR_SPLIT_SCREEN = 3
/**
 * The Studio navbar's root, the `Card` that draws its bottom border — its
 * test id is stable and unique to the navbar, unlike its `data-ui` name
 */
export const NAVBAR_SELECTOR = '[data-testid="studio-navbar"]'
