# Suppressing lint rules

oxlint (`pnpm lint`) runs type-aware across the whole monorepo. Sometimes a rule genuinely cannot
be satisfied — legacy ported code, an upstream API that is deprecated but intentionally still used,
a typing pattern a library forces on you. When that happens, suppress the rule **at the offending
code**, not from the central config.

## Anti-pattern: disabling rules via `overrides` in `.oxlintrc.json`

Do **not** add an entry to the `overrides` array in `.oxlintrc.json` to turn a rule `off` for a
glob of files.

```jsonc
// .oxlintrc.json — Incorrect
"overrides": [
  {
    "files": ["plugins/@sanity/google-maps-input/src/**/*.{ts,tsx}"],
    "rules": {
      "no-deprecated": "off",
      "no-unsafe-type-assertion": "off"
    }
  }
]
```

Why this is bad:

- **Invisible at the call site.** A reader of the code has no idea a rule is suppressed, or why.
  The justification lives in a file they will never open.
- **Too broad.** `off` for a whole `src/**` glob silences the rule for code written later that has
  no excuse, letting real violations slip in unnoticed.
- **Rots silently.** When the underlying reason goes away (the deprecated API is migrated, the
  legacy file is rewritten) nothing flags the override as stale.

The only thing `overrides` should be used for is genuinely scoping _configuration_ (e.g. enabling a
rule only for a directory), never blanket-disabling rules.

## Preferred: inline `oxlint-disable-next-line` with a reason

Suppress the single offending line and explain **why** it is safe/necessary on the line above. The
comment is the point — a bare disable is not allowed (`unicorn/no-abusive-eslint-disable` is an
error, and CI runs with `--report-unused-disable-directives` so stale directives fail the build).

```ts
// Correct
// react-sortable-tree hands us loosely-typed nodes; this shape is guaranteed by the schema
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
const items = rawNodes as LocalFlatDataItem[]
```

Use the rule name exactly as it appears in the `pnpm lint` report, with its plugin prefix:
`react(no-array-index-key)` → `react/no-array-index-key`, `typescript(no-unsafe-type-assertion)` →
`typescript/no-unsafe-type-assertion`. eslint-core rules (e.g. `eslint(no-await-in-loop)`) take the
bare name: `no-await-in-loop`.

## Fallback: file-level `oxlint-disable` when per-line is not enough

When the **same** rule fires many times throughout a file for the **same** reason — a Google Maps
component built entirely on the deprecated `google.maps.Marker` API, a ported serializer that casts
on nearly every line — annotating each line adds noise without adding information. In that case put
a single `oxlint-disable` (no `-next-line`) at the top of the file with one explanation.

```tsx
// Correct — entire file is built on the deprecated classic Google Maps Marker API,
// which Google still supports; migrating to AdvancedMarkerElement is out of scope.
// oxlint-disable typescript/no-deprecated
import {Marker} from '...'
```

Prefer the narrowest scope that works: reach for the file-level form only when a line-level comment
genuinely cannot express the suppression cleanly (many occurrences, or a disable that must span a
region). Never disable a rule for a whole file when only a line or two needs it, and never disable
more rules than are actually failing.
