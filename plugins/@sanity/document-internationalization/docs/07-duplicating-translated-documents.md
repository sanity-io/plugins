# Duplicating translated documents

This plugin includes a custom document action that will duplicate a localized document, its translations, and the metadata document that relates them.

![Duplicate document action](./img/duplicate-document-action.png)

Import the document action and configure which document types will use it:

```ts
import {
  documentInternationalization,
  useDuplicateWithTranslationsAction,
} from '@sanity/document-internationalization'

// The schema types you're passing to the plugin configuration
const translatedSchemaTypes = ['article', 'page']

export default defineConfig({
  // ...all other config
  document: {
    actions(prev, {schemaType}) {
      return translatedSchemaTypes.includes(schemaType)
        ? prev.map((action) =>
            action.action === 'duplicate' ? useDuplicateWithTranslationsAction : action,
          )
        : prev
    },
  },
})
```
