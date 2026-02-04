---
"@sanity/document-internationalization": major
---

Migrate to new plugins monorepo with updated build tooling and dependencies:

- Use React 19's native `use()` hook instead of `suspend-react`
- Require `styled-components` as a peer dependency  
- Update to work with `sanity` v5
- Use `rxjs` for document store operations
- Update to use `sanity-plugin-internationalized-array` from workspace
- Fix deprecated APIs (`useClickOutside` → `useClickOutsideEvent`, proper typing for form events)
- Use proper index signature access for TypeScript 4111 compliance
- Add proper type guards for language field values
