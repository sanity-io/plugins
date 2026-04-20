# @sanity/presets

> **This package is under active development and is not ready for use.**
> The API is unstable and will change without notice. Do not install it as a dependency.

## Status

This plugin is a work in progress. There are no stable APIs, no published releases intended for production, and no guarantees of backward compatibility.

When the package is ready, this README will be updated with installation and usage instructions.

## Do not use this package

- It is not published to npm as a usable release
- It contains no stable public API
- It will change without notice

Check back later, or watch the repository for updates.

## Installation

```sh
npm install @sanity/presets
```

Import `createPresetsRegistry` and create a registry instance. The registry returns `define<Type>` functions that produce schema types:

```ts
import {createPresetsRegistry} from '@sanity/presets'

const {defineLink, defineCta, defineSeo, defineImage, definePage} = createPresetsRegistry({
  link: {
    internalTypes: ['page', 'post'],
  },
})
```

The `define<Type>` functions are used directly in your `schema.types` configuration, alongside standard `defineType` and `defineField` calls:

```ts
import {defineConfig} from 'sanity'

export default defineConfig({
  // ...
  schema: {
    types: [
      definePage({
        name: 'marketingPage',
        title: 'Marketing Page',
        pageBuilderBlocks: ['hero', 'featureGrid'],
      }),
      // your other types...
    ],
  },
})
```

## Concepts

### Registry

The **presets registry** is the entry point to `@sanity/presets`. Call `createPresetsRegistry()` to get a set of `define<Type>` functions that produce schema types.

The registry serves two purposes:

1. **Global configuration.** Presets can be configured at the registry level, providing defaults that apply everywhere a preset is used. For example, configuring `link.internalTypes` once means every link — whether standalone, inside a CTA, or inside rich text — knows which document types are available for internal links.

2. **Composition.** Some presets compose other presets internally. The CTA preset includes a link field; the page preset includes SEO fields. The registry ensures these composed presets share the same global configuration.

```ts
const {defineLink, defineCta, definePage} = createPresetsRegistry({
  link: {
    // Every link in this registry — standalone, inside CTAs,
    // inside rich text — will offer these types for internal links.
    internalTypes: ['marketingPage', 'blogPost'],
  },
})
```

Global configuration can be overridden at the call site. If a specific link instance needs different internal types, pass them directly:

```ts
defineLink({
  name: 'specialLink',
  // Overrides the registry-level internalTypes for this instance only.
  internalTypes: ['product'],
})
```

### Composition

Presets can compose other presets. This means configuring one preset can affect others that depend on it.

The **link** preset is the clearest example. When you configure `link.internalTypes` at the registry level, that configuration cascades to:

- **CTA (call to action)** — the CTA preset includes an inline link field. The link field automatically uses the registry-level `internalTypes` configuration.
- **Rich text** — the rich text preset includes link annotations. Those annotations also use the registry-level `internalTypes` configuration.

This means you configure link behaviour once, and every preset that uses links inherits that configuration automatically.

### Map hooks

Every preset accepts a `map` option containing **map hooks** — functions that receive the schema configuration produced by the preset and return a modified version.

Map hooks exist as an escape hatch. They give you full control over the schema type a preset produces, including the ability to reorder, rename, or remove fields.

```ts
definePage({
  name: 'marketingPage',
  map: {
    // Prepend a "Type" field before all other fields.
    fields: (fields = []) => [
      defineField({name: 'type', type: 'string', group: 'main'}),
      ...fields,
    ],
  },
})
```

Each hook receives the value produced by the preset (after any `fields`, `groups`, or other options have been applied) and must return a compatible value.

**Use map hooks carefully.** They have the final say in the produced schema, which means they can break a preset's intended functionality if used carelessly. A few guidelines:

- If you find yourself heavily rewriting a preset's output with map hooks, it may be a sign that you should model the schema type yourself using `defineType` and `defineField` directly.
- If you use map hooks to rename fields, existing documents may need to be migrated. See the [schema and content migrations documentation](https://www.sanity.io/docs/content-lake/schema-and-content-migrations).

## Usage

### Page

The page preset produces a document type designed for page building. It includes fields for a page name, slug, content (an array of page-builder blocks), and SEO metadata.

```ts
definePage({
  name: 'marketingPage',
  title: 'Marketing Page',
  pageBuilderBlocks: ['hero', 'featureGrid', 'testimonial'],
})
```

**Default fields:**

| Field     | Type     | Group    | Description                                                                      |
| --------- | -------- | -------- | -------------------------------------------------------------------------------- |
| `name`    | `string` | Main     | The page's display name. Required.                                               |
| `slug`    | `slug`   | Main     | URL-friendly slug, sourced from `name`.                                          |
| `content` | `array`  | Main     | Page builder blocks. Types are specified via `pageBuilderBlocks`.                |
| `seo`     | `object` | Metadata | SEO fields (title, description, Open Graph image). Composed from the SEO preset. |

**Default groups:** Main (default), Metadata.

**Options:**

| Option              | Type                     | Description                                     |
| ------------------- | ------------------------ | ----------------------------------------------- |
| `pageBuilderBlocks` | `string[]`               | Type names to include in the content array.     |
| `fields`            | `FieldDefinition[]`      | Additional fields to append.                    |
| `groups`            | `FieldGroupDefinition[]` | Additional groups to append after the defaults. |

The page preset is not the only way to create page documents. It provides opinionated defaults to get started quickly. For specialised page types, use `defineType` directly. See the [document type documentation](https://www.sanity.io/docs/studio/document-type).

### Link

The link preset produces an object type for internal and external links. It includes fields for the link type (internal or external), a reference field for internal links, a URL field for external links, and an "open in new tab" toggle.

```ts
defineLink({
  name: 'primaryLink',
  internalTypes: ['page', 'post'],
})
```

**Default fields:**

| Field          | Type        | Description                                                                                              |
| -------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `linkType`     | `string`    | Radio selector: "Internal" or "External". Defaults to "Internal".                                        |
| `reference`    | `reference` | Internal link. Hidden when link type is external. Targets configured via `internalTypes`.                |
| `url`          | `url`       | External URL. Hidden when link type is internal. Validates `http`, `https`, `mailto`, and `tel` schemes. |
| `openInNewTab` | `boolean`   | Whether to open in a new tab. Hidden for internal links.                                                 |

**Options:**

| Option          | Type       | Description                                                                                         |
| --------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `internalTypes` | `string[]` | Document types available for internal links. Falls back to the registry-level `link.internalTypes`. |

### CTA (call to action)

The CTA preset produces an object type for call-to-action elements. It includes an inline link field (composed from the link preset) and a level selector for visual hierarchy.

```ts
defineCta({
  name: 'heroCta',
})
```

**Default fields:**

| Field   | Type     | Description                                                                                |
| ------- | -------- | ------------------------------------------------------------------------------------------ |
| `link`  | `object` | An inline link, composed from the link preset. Inherits `internalTypes` from the registry. |
| `level` | `number` | Visual hierarchy level (1, 2, or 3). Displayed as radio buttons.                           |

### SEO (search engine optimization)

The SEO preset produces an object type for search engine metadata. It includes fields for a title, description, and Open Graph image with dimension validation.

```ts
defineSeo({
  name: 'metadata',
  group: 'metadata',
})
```

**Default fields:**

| Field         | Type     | Description                                                                                        |
| ------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `title`       | `string` | Page title for search engines. Warns when exceeding 70 characters.                                 |
| `description` | `text`   | Meta description. Warns when exceeding 150 characters.                                             |
| `ogImage`     | `image`  | Open Graph image. Validates dimensions are exactly 1200×630. Includes a landscape hotspot preview. |

The SEO preset is also composed into the page preset, where it appears as an inline object field in the Metadata group.

### Image

The image preset produces an object type for images with optional alt text and caption fields. It includes built-in preview configuration.

```ts
defineImage({
  name: 'heroImage',
  altText: true,
  caption: false,
  hotspot: true,
})
```

**Default fields:**

| Field     | Type     | Description                                                                            |
| --------- | -------- | -------------------------------------------------------------------------------------- |
| `image`   | `image`  | The image asset. Hotspot is enabled by default.                                        |
| `altText` | `string` | Alt text for accessibility. Enabled by default. Shows a validation warning when empty. |
| `caption` | `text`   | Image caption. Enabled by default.                                                     |

**Options:**

| Option    | Type      | Default | Description                 |
| --------- | --------- | ------- | --------------------------- |
| `altText` | `boolean` | `true`  | Include the alt text field. |
| `caption` | `boolean` | `true`  | Include the caption field.  |
| `hotspot` | `boolean` | `true`  | Enable image hotspot.       |

### Rich text

> The rich text preset is under development on a separate branch and is not yet available. This section will be updated when it ships.

The rich text preset will produce a Portable Text array type with configurable block styles, decorators, annotations (including links composed from the link preset), and inline/block-level objects.

## Recommended patterns

### Use presets alongside custom types

Presets are not intended to replace all content modelling. They provide opinionated defaults for common patterns — pages, links, images, metadata — but your schema will likely include custom types that are specific to your project.

Custom types and presets work well together. You can use presets inside custom types, and reference custom types from presets:

```ts
// A custom "blockquote" type that includes a link preset.
defineType({
  name: 'blockquote',
  type: 'object',
  fields: [
    defineField({name: 'quote', type: 'text'}),
    defineField({name: 'author', type: 'string'}),
    defineLink({name: 'source', title: 'Source'}),
  ],
})
```

### Extend presets with fields and groups

Rather than reaching for map hooks, use the `fields` and `groups` options to extend a preset. Fields and groups added this way are appended after the preset's own fields and groups:

```ts
definePage({
  name: 'blogPost',
  pageBuilderBlocks: ['richText', 'image'],
  groups: [{name: 'settings', title: 'Settings'}],
  fields: [
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      group: 'metadata',
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      group: 'settings',
    }),
  ],
})
```

### Use presets inline or as named types

Presets can be used in two ways:

1. **As named types** in `schema.types` — the preset is registered as a top-level type and can be referenced by name from any field:

   ```ts
   schema: {
     types: [
       defineLink({name: 'link'}),
       defineType({
         name: 'banner',
         type: 'object',
         fields: [
           defineField({name: 'cta', type: 'link'}),
         ],
       }),
     ],
   }
   ```

2. **Inline** in a `fields` array — the preset produces an anonymous object field directly:

   ```ts
   definePage({
     name: 'landingPage',
     fields: [
       defineImage({
         name: 'heroImage',
         group: 'main',
       }),
     ],
   })
   ```

When used inline, the preset accepts `group` and `fieldset` properties for placement within the parent type's editor layout.

### Reserve map hooks for structural changes

The `fields` option is sufficient for adding new fields to a preset. Use map hooks only when you need to change the structure of the preset's output — for example, reordering fields, wrapping existing fields, or conditionally removing them:

```ts
definePage({
  name: 'simplePage',
  map: {
    // Remove the slug field entirely.
    fields: (fields = []) => fields.filter((f) => f.name !== 'slug'),
  },
})
```

If you find yourself rewriting most of a preset's fields with map hooks, consider creating the schema type directly with `defineType` instead. Presets are most valuable when their defaults align closely with what you need.

### Configure links globally

The link preset is used by multiple other presets (CTA, rich text). Configure `internalTypes` at the registry level so all links share the same set of linkable document types:

```ts
const {defineLink, defineCta, definePage} = createPresetsRegistry({
  link: {
    internalTypes: ['page', 'post', 'product'],
  },
})
```

This single configuration flows into every `defineLink`, `defineCta`, and `defineRichText` call from this registry. Override at the call site only when a specific instance needs different behaviour.
