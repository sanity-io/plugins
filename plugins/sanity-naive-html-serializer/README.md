# Naive HTML serialization from Sanity documents

> This is a **Sanity Studio v3** package.
> For the v2 version, please refer to the [v2-branch](https://github.com/sanity-io/sanity-naive-html-serializer/tree/studio-v2).

## Table of Contents

- [What this package solves](#what-this-package-solves)
- [What this package does](#what-this-package-does)
- [Quick start](#quick-start)
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

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-naive-html-serializer/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
