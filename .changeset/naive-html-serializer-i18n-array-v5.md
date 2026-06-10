---
'sanity-naive-html-serializer': minor
---

Support the internationalized array v5 data format, where the language is stored in a dedicated `language` field instead of `_key`. Serialization, deserialization and merging now work with both formats, and merge patches are written in whichever format the target document already uses.
