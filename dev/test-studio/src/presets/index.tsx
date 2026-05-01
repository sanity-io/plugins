import {createPresetsRegistry} from '@sanity/presets'
import {definePlugin, defineType, defineField} from 'sanity'

// Firstly, create a presets registry instance. The presets registry allows
// presets to be configured globally, and returns `define<type>` factory
// functions (such as `definePage`) that produce schema types.
//
// A convenient pattern is to destructure the `define<type>` functions.
const {defineImage, definePage, defineLink, defineRichText} = createPresetsRegistry({
  link: {
    // Presets can be globally configured. Here, `link.internalTypes` is
    // configured to include the "corePresetsTest" document type in all
    // link objects (unless the `internalTypes` is overridden when `defineLink`
    // is called).
    //
    // Globally configuring a preset is useful, because the configuration
    // cascades to all other presets that compose it. For example: when creating
    // a call to action type using `defineCta`, or a Portable Text type using
    // `defineRichText`, the link type it composes will automatically be
    // configured to allow internal links to the "corePresetsTest" document
    // type.
    internalTypes: ['corePresetsTest'],
  },
})

export const presetsWorkspace = definePlugin(() => ({
  schema: {
    types: [
      // The page preset can be used by calling the `definePage` function. It
      // produces a document schema type geared towards page building.
      //
      // Here, a test page named "corePresetsTest" is created.
      //
      // By default, the page preset includes fields for the page's content (an
      // array of page-builder blocks), a slug, and metadata fields for storing
      // details like its title and Open Graph image.
      //
      // Presets are designed to be extensible. Take a look at the way the
      // `groups` and `fields` options are being used to extend the preset, and
      // the way the `map.fields` option is used to dynamically change the
      // fields produced by the preset.
      //
      // Note: `definePage` isn't the only way to create documents that will
      // be rendered as pages in your frontend. It's simply an opinionated
      // set of defaults to get you started quickly. You can create your own
      // specialised page schemas without the page preset by using the
      // `defineType` function directly. [See the Sanity Studio documentation
      // for more information](https://www.sanity.io/docs/studio/document-type).
      definePage({
        name: 'corePresetsTest',
        title: 'Core Presets Test',
        // To avoid being overly rigid about content types and frontend
        // presentation, the page preset doesn't include any page builder blocks
        // by default.
        //
        // `pageBuilderBlocks` accepts both string references to types defined
        // elsewhere (like `'blockquote'`, defined further down in this file)
        // and inline preset instances created with a `define<Type>` factory.
        pageBuilderBlocks: ['blockquote', defineImage({name: 'imageBlock', title: 'Image'})],
        // The page preset includes "Main" and "Metadata" groups for structuring
        // the document editor. Additional groups can be created by adding them
        // to the `groups` array.
        //
        // Here, a "Settings" group is added. It will be appended after the
        // "Main" and "Metadata" groups.
        groups: [
          {
            name: 'settings',
            title: 'Settings',
          },
        ],
        // The `fields` array works the same way as the `groups` array; here
        // "Header image" and "Canonical URL" fields are added. They'll be
        // appended after the fields provided by the preset itself.
        fields: [
          defineImage({
            name: 'headerImage',
            title: 'Header image',
            group: 'settings',
          }),
          defineField({
            name: 'canonicalUrl',
            title: 'Canonical URL',
            type: 'url',
            // This field is added to the "Metadata" group, which is a group
            // created by the preset itself.
            group: 'metadata',
          }),
          defineField({
            name: 'body',
            title: 'Body',
            type: 'richTextDefaults',
            group: 'main',
          }),
        ],
        map: {
          // Map hooks serve as an escape hatch, allowing developers to override
          // any schema configuration produced by a preset. Map hooks receive
          // the corresponding schema configuration produced by the preset, and
          // must return a compatible configuration.
          //
          // Here, `map.fields` is used to *prepend* a "Type" field to the page
          // document. When using `field`, developers can only append fields,
          // whereas `map.fields` provides full control over all fields.
          //
          // When using map hooks, be careful not to break the preset's
          // intended functionality. Map hooks have the final say in the
          // produced schema type, providing great flexibility.
          //
          // - If you find yourself heavily using map hooks, it may be better to
          //   model and own the schema type yourself.
          // - If you use map hooks to rename fields, you may need to migrate
          //   existing documents to use the new names. [Read about content
          //   migrations here](https://www.sanity.io/docs/content-lake/schema-and-content-migrations).
          fields: (fields = []) => [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              group: 'main',
              options: {
                list: [
                  {
                    title: 'Landing page',
                    value: 'landingPage',
                  },
                  {
                    title: 'Marketing page',
                    value: 'marketingPage',
                  },
                  {
                    title: 'Documentation page',
                    value: 'documentationPage',
                  },
                ],
              },
            }),
            ...fields,
          ],
        },
      }),
      // Defaults enable all three embedded objects: link, image, and cta.
      defineRichText({
        name: 'richTextDefaults',
        title: 'Rich text (defaults)',
      }),
      defineRichText({
        name: 'richTextMinimal',
        title: 'Rich text (minimal)',
        objects: false,
      }),
      // Presets aren't intend to replace all content modelling. You'll likely
      // still need to use `defineDocument` and `defineType` to add custom
      // types to your schema. This is fully supported, with custom types
      // being able to include presets, and vice versa.
      defineType({
        name: 'blockquote',
        title: 'Blockquote',
        type: 'object',
        fields: [
          defineField({
            name: 'quote',
            type: 'text',
          }),
          defineField({
            name: 'author',
            type: 'text',
          }),
          defineLink({
            name: 'link',
            title: 'Link',
          }),
        ],
      }),
    ],
  },
}))
