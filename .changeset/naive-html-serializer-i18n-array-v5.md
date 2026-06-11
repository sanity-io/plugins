---
'sanity-naive-html-serializer': minor
---

Support both internationalized array data formats. The serializer, deserializer, and merger now read the language from either the legacy `_key` or the new `language` field (`sanity-plugin-internationalized-array` v5), and write merged translations back in whichever format the source document already uses.
