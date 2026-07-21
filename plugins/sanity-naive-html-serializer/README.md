# Naive HTML serialization from Sanity documents

## Table of Contents

- [What this package solves](#what-this-package-solves)
- [What this package does](#what-this-package-does)
- [Quick start](#quick-start)
- [Internationalized array formats](#internationalized-array-formats)
- [v2-to-v3-changes](#v2-to-v3-changes)

## What this package solves

This is not a plugin, and probably does not need to be installed independently. Instead, it is a dependency for our translation tooling. If you're using any of our `TranslationsTab` plugins and need to solve a serialization issue, you can skip to the [custom serialization guide](https://github.com/sanity-io/sanity-naive-html-serializer/blob/main/docs/serialization-guide.md).

## What this package does

This is the source for tooling for naively turning documents and rich text fields into HTML, deserializing them, combining them with source documents, and patching them back. Ideally, this should take in objects that are in portable text, text arrays, or objects with text fields without knowing their specific names or types, and be able to patch them back without additional work on the part of the developer.

This builds heavily on [@portabletext/to-html](https://github.com/portabletext/to-html) and Sanity's [block-tools](https://github.com/sanity-io/sanity/tree/next/packages/@sanity/block-tools), and it's highly recommended you familiarize yourself with these if you plan on customizing.

## Quick start

Remember, you probably don't want this package on its own! For those that do:

From the same directory as your studio:

```sh
npm install --save sanity-naive-html-serializer
```

or

```sh
yarn add sanity-naive-html-serializer
```

Now, you can import something from the serializer and use it in your code:

```javascript
import {
  BaseDocumentSerializer,
  BaseDocumentDeserializer,
  BaseDocumentMerger,
} from 'sanity-naive-html-serializer'
```

## Internationalized array formats

When serializing and merging with the `internationalizedArray` translation level, both data formats of [sanity-plugin-internationalized-array](https://github.com/sanity-io/plugins/tree/main/plugins/sanity-plugin-internationalized-array) are supported:

- **v4 and below**: the language lives in the item's `_key`, e.g. `{"_key": "en", "_type": "internationalizedArrayStringValue", "value": "hello"}`
- **v5 and above**: the language lives in a dedicated `language` field and `_key` is a random string, e.g. `{"_key": "abc123", "_type": "internationalizedArrayStringValue", "language": "en", "value": "hello"}`

Serialized files are identical for both formats (items are identified by their language code), and `BaseDocumentMerger.internationalizedArrayMerge` writes patches in whichever format the target document already uses, preserving existing item keys when replacing.

## v2-to-v3-changes

You likely will not need to make changes to your usage of this package. The biggest change to your codebase will be feeding in the schema to `BaseDocumentSerializer`. `BaseDocumentSerializer` should be the only affected interface.

### In v2

```javascript
import schemas from 'part:@sanity/base/schema'

const serializer = BaseDocumentSerializer(schemas)
const serialized = serializer.serializeDocument(doc, 'document')
```

### In v3

If you're in a valid React context:

```javascript
import useSchema from 'sanity'

const MyComponent = (doc) => {
  const schemas = useSchema()
  const serializer = BaseDocumentSerializer(schemas)
  const serialized = serializer.serializeDocument(doc, 'document')
}
```

If you're not in a component, you'll likely have access to the schema from the `context` param passed through most configuration functions. For example:

```javascript
const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schema}) => {
  return S.document().views([
    S.view.form(),
    S.view
      .component(SerializeView)
      .options({
        serializeFunc: (doc: SanityDocument) => {
          BaseDocumentSerializer(schema).serializeDocument(doc, 'document')
        },
      })
      .title('Serialize'),
  ])
}
```

## License

[MIT](LICENSE) © Sanity.io
