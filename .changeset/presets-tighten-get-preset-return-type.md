---
'@sanity/presets': patch
---

Tighten `RegistryContext.getPreset` return type to `SchemaTypeDefinition & FieldDefinition` to reflect what the registry actually returns
