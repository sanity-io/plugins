---
"sanity-plugin-internationalized-array": patch
---

Prevent `defaultLanguages` auto-add from recreating a document after it is deleted. The effect now follows the document pair store instead of form `_rev`, which can linger on the last displayed snapshot, and it will not patch once the document has left the store.
