---
'sanity-plugin-mux-input': patch
---

Start uploads faster and stop failing uploads when the asset takes a moment to appear. The plugin no longer checks the Mux credentials before every upload, checks for the finished asset soon after the upload completes, and keeps retrying with a growing wait for up to 30 seconds instead of giving up on the first error. Cancelling a failed upload also retries briefly if the upload isn't available yet.
