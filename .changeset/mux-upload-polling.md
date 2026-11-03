---
'sanity-plugin-mux-input': patch
---

Start uploads faster and stop failing uploads when the asset takes a moment to appear. The plugin no longer checks the Mux credentials before every upload, polls for the finished asset straight away, and retries for up to 30 seconds instead of giving up on the first error
