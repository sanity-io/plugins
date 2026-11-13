---
'@sanity/cross-dataset-duplicator': patch
---

Fix duplicating to a Workspace in another Project failing with "Session does not match project host". The destination client now comes from the destination Workspace's own auth store instead of re-pointing the origin client, whose credentials are scoped to the origin Project.
