---
"sanity-plugin-mux-input": major
---

Enable React Compiler

The package is now built with React Compiler targeting React 19, so published components are memoized automatically. As a result the `react` peer dependency is tightened from `^18.3 || ^19` to `^19.2`, since the compiled output relies on `react/compiler-runtime`. In practice this doesn't drop any supported setup: the `sanity` peer dependency (`^5 || ^6.0.0-0`) already requires React 19.2.
