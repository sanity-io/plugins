# Performance findings: `sanity-plugin-internationalized-array`

This note summarizes likely lag sources when many `internationalizedArray` inputs are mounted in a document form.

## Observed symptoms

- Form typing and interaction become laggy when many internationalized inputs are present at once.
- Lag is most visible on mount and when editing a single item while many siblings are mounted.

## Primary hotspots (highest impact)

### 1) Broad field wrapper + per-field subscriptions

- `plugin.tsx` registers `form.components.field` globally for all fields.
- `InternationalizedField` calls `useFormValue(props.path.slice(0, -1))`.
- This means many field instances subscribe to form state and can rerender frequently.

Likely impact: high in large forms because this scales with total field count.

### 2) Row-level subscription to whole parent array

- `InternationalizedInput` reads `parentValue` with `useFormValue` for each row.
- Each row then derives shared data (e.g. language keys in use) from the entire array.
- A change to one row can trigger rerenders across sibling rows.

Likely impact: high when many languages/items are mounted.

### 3) Prop identity churn in row rendering

- `wrappedOnChange` and `inlineProps` are recreated on each render in `InternationalizedInput`.
- `renderInput(inlineProps)` receives unstable identities, which can invalidate memoization in expensive child inputs.

Likely impact: high for heavier field types (Portable Text, references, custom inputs).

## Secondary contributors (medium impact)

### 4) Repeated linear lookups on each render

- `AddButtons` runs `value?.find(...)` for each language button.
- `InternationalizedArray` performs multiple `find/filter/map` passes for ordering/validity checks.

Likely impact: medium; grows with `languages × items`.

### 5) Full-document traversal during document-level buttons

- `DocumentAddButtons` computes `getDocumentsToTranslate(value, [])` during render.
- This recursively scans the full document value tree.

Likely impact: medium to high on large documents, especially with frequent rerenders.

### 6) Serialization work for language cache keys

- Provider cache key generation stringifies selected values (`JSON.stringify`).
- If `select` includes large structures, this adds extra work during updates.

Likely impact: medium; depends on `select` shape and document size.

## Important code-path clarification

- In current `InternationalizedField`, logic effectively:
  - optionally hides the `"value"` title when language ID is valid,
  - uses `level: 0` for `schemaType.name` starting with `internationalizedArray`,
  - otherwise renders default.
- Previously present branches checking `schemaType.name === 'string' | 'number' | 'text'` under the `startsWith('internationalizedArray')` branch are not reachable and were removed.

## Recommended optimization order

1. **Reduce subscriptions in `InternationalizedField`**
   - Avoid `useFormValue` for non-internationalized paths.
   - Keep a fast path that immediately returns `renderDefault` for unrelated fields.

2. **Remove per-row parent-array subscriptions in `InternationalizedInput`**
   - Compute shared row metadata once in parent/context.
   - Pass down derived values rather than having each row call `useFormValue`.

3. **Stabilize identities in `InternationalizedInput`**
   - Wrap handlers in `useCallback`.
   - Build `inlineProps` with `useMemo` and minimal dependencies.

4. **Switch repeated membership checks to `Set` lookups**
   - Precompute sets for language IDs present in value arrays.

5. **Move/guard expensive document scans**
   - Memoize `getDocumentsToTranslate` by document value identity or compute lazily on click.

6. **Revisit cache key strategy**
   - Reduce `JSON.stringify` frequency or hash only required select fields.

## How to validate improvements

- Create a stress case with many internationalized fields/items in `dev/test-studio`.
- Compare before/after:
  - input typing latency,
  - mount time,
  - number of rerenders in React DevTools Profiler.
- Prioritize changes that reduce rerender fan-out over micro-optimizations.

7. **Duplicated context**
