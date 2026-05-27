# sanity-plugin-google-translate

This plugin lets you connect Sanity fields to Google Cloud Translate API, giving you instant machine translations for 108 languages and counting! Enable it for all of them! ...or just the ones you need.

## Installation

```
npm install --save sanity-plugin-google-translate

OR

yarn add sanity-plugin-google-translate
```

## Usage

First, add it as a plugin in `sanity.config.ts/js`

```ts
// ./sanity.config.ts

import {createConfig} from 'sanity'
import {googleTranslate} from 'sanity-plugin-google-translate'

export const createConfig({
    // ...all other config settings
    plugins: [
       // ...all other plugins
       googleTranslate()
    ]
})
```

This plugin is designed to work with [field-level translated objects](https://www.sanity.io/docs/localization#cd568b11a09c) and replace the default input component with a Google Translate-powered one. By setting `options.translate = true` on an object field definition.

These objects should be registered in the way recommended by the [@sanity/language-filter plugin](https://www.npmjs.com/package/@sanity/language-filter). With a field for each language. The base language at the top level, and all other languages inside a fieldset.

Note: This will not translate Portable Text content, as that schema type should not be mapped over multiple times in a single document. If you need multiple languages of Portable Text, you are best to use [document-level translation](https://github.com/sanity-io/document-internationalization).

### Example: Add Google Translate to all localized `string` objects

```js
// ./schemas/fields/localizedString.ts

const languages = [
  {id: 'en', title: 'English', isDefault: true},
  {id: 'es', title: 'Spanish'},
  {id: 'fr', title: 'French'},
]

export default defineField({
  name: 'localizedString',
  type: 'object',
  options: {
    // This will replace the default input component
    translate: true,
    // This API key will be bundled with your studio
    // and so should be restricted by hostname
    // See: https://www.sanity.io/docs/studio-environment-variables
    apiKey: process.env.SANITY_STUDIO_GOOGLE_TRANSLATE_API_KEY,
  },
  fieldsets: [
    {
      title: 'Translations',
      name: 'translations',
      options: {collapsible: true, collapsed: false},
    },
  ],
  fields: languages.map((lang) => ({
    name: lang.id,
    title: lang.title,
    type: 'string', // or `text`, etc
    fieldset: lang.isDefault ? null : 'translations',
  })),
})
```

### Example: Extend some localized `string` objects with Google Translate

Alternatively, you could selectively extend specific uses of `localizedString`, by registering another object to your schema which uses it as a base. This is helpful if you only need Google Translate on specific fields.

```ts
// ./schemas/fields/localizedGoogleTranslateString.ts

export default defineField({
  name: 'localizedGoogleTranslateString',
  title: 'Localized String',
  type: 'localizedString',
  options: {
    translate: true,
    apiKey: process.env.SANITY_STUDIO_GOOGLE_TRANSLATE_API_KEY,
  },
})
```

## API Key security

By including your Google Cloud Translation API key in the schema definition it becomes part of the Studio bundle which is hosted as static files on web servers.

To avoid others using your key you should restrict it to hosts where your studio runs, like

- `http://localhost:3333/*`
- `http://<your-project>.sanity.studio/*`
- ...or custom domain you may be hosting the Studio

[More info on adding HTTP restrictions](https://cloud.google.com/docs/authentication/api-keys#adding_http_restrictions)
## License

MIT © Sanity.io
See LICENSE

## License

[MIT](LICENSE) © Sanity.io


## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-google-translate/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
