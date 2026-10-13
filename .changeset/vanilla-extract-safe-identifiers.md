---
'@sanity/color-input': patch
'@sanity/google-maps-input': patch
'@sanity/themer': patch
'sanity-plugin-bynder-input': patch
'sanity-plugin-workflow': patch
---

Build the vanilla-extract styles with `identifiers: 'safe'`, so every release gets its own class names. The previous hash covered only the package name and file path, so a release that reordered a file's styles reused the class names of the previous release for different rules, and a page that loaded the stylesheets of both releases styled elements with the wrong rules.
