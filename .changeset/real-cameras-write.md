---
"@sanity/presets": minor
---

Initial release.

This is the first `@sanity/presets` release, and should be considered
experimental as we work towards version 1. We aim to keep the API
stable, but may make adjustments to address feedback.

The following presets are available:

- page
- link
- cta
- seo
- image
- richText

Since the last changelog entry:

- The API is now based on inline type factories, rather than composing
  global types based on their name.
- `defineRichText` has been added to create Portable Text fields that
  include link, CTA, and image objects based on global configuration.
