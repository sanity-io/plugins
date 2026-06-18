---
'@sanity/hierarchical-document-list': major
---

Require Node.js 24.11 or later, to match the `engines.node` constraint of the `@nosferatu500/react-sortable-tree@5` runtime dependency (previously the package advertised a wider range that could fail engine-strict installs and mislead users).

This release also fixes several bugs and documentation issues:

- `createDeskHierarchy` now rejects any non-string or empty `documentId` immediately, instead of only erroring on values that are both non-string and falsy.
- `creatableTypes` is now correctly validated as a subset of `referenceTo` (the previous `indexOf` check inside `some()` could discard a valid subset or accept invalid types).
- Desk warning messages now render across multiple lines again by splitting on both real and escaped newlines.
- Fixed the `createDeskHierarchy` typo and stray whitespace in the "not live editable" warning, and collapsed the multi-line draft warning into a single line.
- Updated the README usage example to `structureTool` from `sanity/structure`, removed the broken screenshot and outdated compatibility note, and removed the duplicate License section.
