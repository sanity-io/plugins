---
"@sanity/hierarchical-document-list": major
---

Add `createStructureHierarchy` and deprecate `createDeskHierarchy`. Now that Studio's `sanity/desk` has been replaced by `sanity/structure`, the structure-builder helper is renamed to `createStructureHierarchy`. `createDeskHierarchy` continues to work as a deprecated alias and will be removed in a future major version.

Require Node.js 24.11 or later, to match the `engines.node` constraint of the `@nosferatu500/react-sortable-tree@5` runtime dependency (previously the package advertised a wider range that could fail engine-strict installs and mislead users).

This release also fixes several bugs and documentation issues:

- The structure helper now rejects any non-string or empty `documentId` immediately, instead of only erroring on values that are both non-string and falsy.
- `creatableTypes` is now correctly validated as a subset of `referenceTo` (the previous `indexOf` check inside `some()` could discard a valid subset or accept invalid types).
- Warning messages now render across multiple lines again by splitting on both real and escaped newlines, and the "not live editable" warning no longer has a misspelled function name or stray whitespace.
- Updated the README usage example to `structureTool`/`createStructureHierarchy`, restored the plugin screenshot, dropped the outdated Studio compatibility note, and removed the duplicate License section.
