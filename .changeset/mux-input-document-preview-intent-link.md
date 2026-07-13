---
"sanity-plugin-mux-input": patch
---

Render document previews in the video references list with `IntentLink` passed directly to `PreviewCard`'s `as` prop, instead of recreating a wrapper link component on every render. This preserves the card's styling and focus ring on the rendered link and avoids unnecessary remounts.
