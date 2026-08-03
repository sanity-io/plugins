---
"@sanity/personalization-plugin": patch
---

Address review feedback from the migration into the monorepo:

- Fix LaunchDarkly experiment pagination so `offset` advances between pages, preventing duplicate results and a possible infinite loop
- Correct misspelled plugin names (`personalistaion` → `personalization`) and stop the LaunchDarkly entry point from identifying itself as the GrowthBook plugin
- Fix an operator-precedence bug in the experiment field preview that could set the title to the entire field object
- Walk reference preview paths with optional chaining to avoid throwing on missing intermediate fields
- Move the experiment item activation patch out of render and into an effect
- Remove unused `Select` props
- Fix the GrowthBook (`project` config key) and LaunchDarkly (`fieldLevelExperiments` usage) docs and drop the stale standalone-repo Studio version / tooling references
