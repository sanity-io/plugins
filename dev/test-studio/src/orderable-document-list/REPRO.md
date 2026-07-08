# Reproducing issue #1506 in the test-studio

Tracking: https://github.com/sanity-io/plugins/issues/1506

## Summary

`orderableDocumentListDeskItem()` sets a `canHandleIntent` callback that returns
`true` for **every** create/edit intent regardless of `params.type`. When an
orderable list for type `X` sits in the same structure as other creatable types,
creating a document of any other type gets routed into the orderable list.

The regressing line is in
`plugins/@sanity/orderable-document-list/src/desk-structure/orderableDocumentListDeskItem.ts`:

```ts
.canHandleIntent(() => createIntent !== false)
```

Because `createIntent` defaults to `undefined`, `createIntent !== false` is
always `true`, and the arity-0 callback ignores `params.type`.

## End-to-end repro in the dev test-studio

### 1. Schema and structure

Two document types are defined in
`dev/test-studio/src/orderable-document-list/issue-1506-repro.ts`:

- `issue1506Page` — a regular document type
- `issue1506TeamMember` — an orderable document type (with `orderRankField`)

The `home` workspace structure includes a dedicated **Issue #1506 repro**
section that mirrors the issue report:

```ts
S.list().items([
  S.documentTypeListItem('issue1506Page').title('Pages'),
  orderableDocumentListDeskItem({
    type: 'issue1506TeamMember',
    title: 'Team Members (orderable)',
    S,
    context,
  }),
])
```

### 2. Run the test-studio

From the monorepo root:

```bash
pnpm install
pnpm dev
```

Open the studio at `http://localhost:3333/home` (authenticate if prompted).

### 3. Observe the bug

1. In the Structure tool sidebar, open **Issue #1506 repro (orderable intent hijack)**.
2. Click the global **Create** button (or use **Create new document** from the
   command palette / navbar).
3. Choose **Issue #1506 Page** (the non-orderable type).

**Buggy behavior:** Studio opens the new page document inside the **Team Members
(orderable)** list view instead of the **Pages** list.

**Expected behavior:** The new `issue1506Page` document should open in (or
resolve to) the **Pages** list. The orderable list for `issue1506TeamMember`
should only handle intents where `params.type === 'issue1506TeamMember'`.

### 4. Additional checks

- Creating **Issue #1506 Team Member** from the global create menu correctly
  lands in the orderable list (this path works even with the bug).
- With multiple orderable lists at the same structure level, the intent resolves
  to whichever orderable list is closest to the structure root.

## Suggested fix

Make the callback type-aware while keeping the `createIntent` opt-out:

```ts
.canHandleIntent(
  (intentName, params) => createIntent !== false && params?.type === type,
)
```

After applying the fix, repeat step 3 — creating a Page should no longer be
captured by the Team Members orderable list.
