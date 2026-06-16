---
'@sanity/sanity-plugin-async-list': major
---

Refactor the input into a real React component and fix the `async-list-undefined` namespace/id

- **Breaking:** `AsyncList` is now a regular React component that takes a single `props` argument (the standard Sanity input props plus an `options` field), instead of being called as `AsyncList(props, options)`. For the `components.input` slot, use the new `createAsyncListInput(options)` factory: `input: createAsyncListInput({loader})`. This makes the input safe under the Rules of Hooks and lets the React Compiler optimize it.
- **Breaking:** the secrets namespace and DOM `id` are no longer derived as `async-list-${schemaType}` (which became the literal `async-list-undefined` for component usage). The DOM `id` now uses Sanity's stable per-field id, and the secrets namespace falls back to `async-list` (instead of `async-list-undefined`) when no `schemaType`/`secrets.namespace` is available. When using the component with `secrets`, set an explicit `secrets.namespace`; a dev warning is logged if it is missing.
- Fix: the debounced search handler is stable and is cancelled on unmount, so it no longer drops queued calls or updates state on an unmounted tree.
- Fix: the value-change handler no longer depends on the whole `props` object, avoiding unnecessary `Autocomplete` re-renders.
- Fix: loader results are validated to ensure each option's `value` is a string.
