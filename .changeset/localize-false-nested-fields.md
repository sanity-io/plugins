---
'sanity-naive-html-serializer': patch
---

Ignore `localize: false` on fields inside nested objects, page-builder modules, and inline object types when sending a document for translation

Blocks that declare extra fields still send their text. Array types that reuse the same inline object name keep their own fields, and named objects do not send keys the schema does not declare
