---
'sanity-plugin-mux-input': patch
---

Start uploads faster and stop failing uploads when the asset takes a moment to appear. The plugin no longer checks the Mux credentials before every upload, checks for the finished asset soon after the upload completes, and keeps checking with a growing wait for up to 30 seconds while Mux processes the file. If the upload isn't available yet it retries for a few seconds, and on a server or network error it retries twice before showing the error. The uploader says "Processing upload…" when Mux takes a while after the file has been sent. Missing and rejected Mux credentials now show separate messages. Cancelling a failed upload also retries briefly if the upload isn't available yet.
