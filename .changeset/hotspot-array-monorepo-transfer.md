---
'sanity-plugin-hotspot-array': major
---

Port sanity-plugin-hotspot-array to the Sanity plugins monorepo

This major release includes breaking changes as part of the migration to the monorepo:

- **React Compiler enabled**: The package is now built with React Compiler targeting React 19
- **react-dom 19.2+ required**: `react-dom` is now a required peer dependency

Other changes:

- **Sanity Studio v5 support restored**: The `sanity` peer dependency range is now `^5 || ^6.0.0-0` (v4.0.0 required `^6`)
- **Node.js 20.19+ supported**: The engines range is now `>=20.19 <22 || >=22.12` (previously `>=22.12`)
