## Advanced configuration

This plugin provides defaults for most configuration options, but they can be overridden as needed. Please refer to the types to see what you should declare, but we also provide the type for all options, which we recommend using for quicker development.

```typescript
// sanity.config.ts
import {
  TranslationsTab,
  defaultDocumentLevelConfig,
  defaultFieldLevelConfig,
  type TranslationsTabConfigOptions,
} from 'sanity-plugin-studio-smartling'

const customConfig = {
  ...defaultDocumentLevelConfig,
  // baseLanguage is `en` by default, overwrite as needed. This is important for coalescing translations and creating accurate translation metadata.
  baseLanguage: 'en_US',
  // this is the field that will be used to determine the language of the document. It is `language` by default.
  languageField: 'locale',
  serializationOptions: {
    // use this option to exclude objects that do not need to be translated. The plugin already uses defaults for references, dates, numbers, etc.
    additionalStopTypes: ['colorTheme'],
    // use this option to serialize objects in a particular way. The plugin will try to filter and serialize objects as best as it can, but you can override this behavior here.
    // For now, you should also include these for annotations and inline objects in PortableText, if you want them to be translated.
    // NOTE: it is VERY important to include the _type as a class and the _key as id for accurately deserializing and coalescing
    additionalSerializers: {
      testObject: ({value}) => {
        return `<span class="${value._type}" id="${value._key}">${value.title}</span>`
      },
    },
    // Create a method to deserialize any custom serialization rules
    additonalDeserializers: {
      testObject: ({node}) => {
        return {
          _type: 'testObject',
          _key: node.id,
          title: node.textContent,
        }
      },
    },
    // Block text requires a special deserialization format based on @sanity/block-tools. Use this option for any annotations or inline objects that need to be translated.
    additionalBlockDeserializers: [
      {
        deserialize(el, next): TypedObject | undefined {
          if (!el.className || el.className?.toLowerCase() !== 'myannotation') {
            return undefined
          }

          const markDef = {
            _key: el.id,
            _type: 'myAnnotation',
          }

          return {
            _type: '__annotation',
            markDef: markDef,
            children: next(el.childNodes),
          }
        },
      },
    ],
  },
  // sometimes editors will duplicate a field or document and begin changing assets
  // THEN import the translation. this option merges your translated strings with 
  // the already-existing translated document or field.
  mergeWithTargetLocale: true,
  // adapter, baseLanguage, secretsNamespace, importTranslation, exportForTranslation should likely not be touched unless you very much want to customize your plugin.
} satisfies TranslationsTabConfigOptions


const defaultDocumentNode: DefaultDocumentNodeResolver = (S) => {
  return S.document().views([
    S.view.form(),
    S.view.component(TranslationsTab).title('Smartling').options(customConfig)
  ])
}
```
