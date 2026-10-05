# Reproducing issue #1239 in the test-studio

Tracking: https://github.com/sanity-io/plugins/issues/1239

## Summary

With about 40 documents arranged in a hierarchy, switching to or from that
view used to freeze the Studio for several seconds. Each tree row mounted the
drag-indicator `createGlobalStyle`. styled-components rebuilds that style
group on every unmount, so leaving the view paid a quadratic cost.

## Automated reproduction

```bash
pnpm exec vitest run --project @sanity/hierarchical-document-list \
  plugins/@sanity/hierarchical-document-list/src/components/TreeNodeRendererScaffold.test.tsx
```

On the first commit of this branch (`test(...): reproduce per-row scaffold
style hang`), that test fails with `80` keyframe copies for 40 rows vs `2`
for one row. After the fix commit it passes.

## End-to-end repro in the dev test-studio

### 1. Desk item

`dev/test-studio/src/hierarchical-document-list/index.tsx` registers a
dedicated hierarchy:

- Title: **Issue #1239 hierarchy hang**
- Document id: `issue-1239-hierarchy`
- Types: `hierarchyAuthor`, `hierarchyBook`

Path in the Home workspace:

**Document list builders → Issue #1239 hierarchy hang**

### 2. Seed the ~40-document tree

1. Start the studio: `pnpm dev`
2. Open the Home workspace authenticated (cloud agents: `#token=…` hash).
3. Go to **Scripts → Seed issue #1239 hierarchy hang**
   (`/home/scripts/seed-issue-1239`).
4. Leave the defaults (`issue-1239-hierarchy`, `40`) and run the script.

The script creates published `hierarchyBook` documents
`issue-1239-book-01` … `issue-1239-book-40` and writes them as a flat tree
into `issue-1239-hierarchy`.

### 3. Feel the hang (pre-fix only)

The stylesheet hoist is already on this branch tip, so switching panes should
stay responsive. To observe the original hang:

```bash
git checkout e7017dc4c   # reproduction commit (before the fix)
pnpm dev
```

Then:

1. Run the seed script again if needed.
2. Open **Document list builders → Issue #1239 hierarchy hang**.
3. Wait until all ~40 rows render.
4. Click away to another structure item (for example Hierarchy Author).

Expected without the fix: the UI freezes for multiple seconds while the pane
unmounts. A tree with only a handful of rows does not.

### 4. Confirm the fix

```bash
git checkout cursor/sieve-1239-0b07
pnpm dev
```

Repeat the same navigation. Leaving the 40-row hierarchy should return
immediately.

## Cleanup

Delete documents with ids matching `issue-1239-*` from the dataset when you
no longer need the fixture, or re-run the seed with a smaller `documentCount`
after manually clearing the tree document.
