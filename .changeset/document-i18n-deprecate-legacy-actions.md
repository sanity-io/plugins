---
'@sanity/document-internationalization': patch
---

Deprecate the legacy `DeleteTranslationAction` and `DuplicateWithTranslationsAction` action exports. Use the hook-based actions instead: `useDeleteTranslationAction` and `useDuplicateWithTranslationsAction`.

To insert the hook-based actions, add them in your Studio `document.actions` configuration:

```ts
import {
  useDeleteTranslationAction,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'

export default defineConfig({
  // ...
  document: {
    actions: (prev, context) => {
      const translatedSchemaTypes = ['lesson', 'article']

      if (translatedSchemaTypes.includes(context.schemaType)) {
        return [...prev, useDeleteTranslationAction, useDuplicateWithTranslationsAction]
      }

      return prev
    },
  },
})
```
