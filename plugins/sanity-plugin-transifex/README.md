
## Installation

```sh
npm install sanity-plugin-transifex
```

![2023-02-15 10 06 06](https://user-images.githubusercontent.com/3969996/219130146-8d34c5a6-f11c-4647-826d-e3c07eaf7144.gif)


# Sanity + Transifex = 🌍

This plugin provides an in-studio integration with [Transifex](https://transifex.com). It allows your editors to send any document to Transifex with the click of a button, monitor ongoing translations, and import partial or complete translations back into the studio.

_Recent updates for v4:_ We've added support for the new document internationalization plugin pattern. Please read the [Document level translations](#document-level-translations) section for more information.

# Table of Contents

- [Quickstart](#quickstart)
- [Assumptions](#assumptions)
- [Studio experience](#studio-experience)
- [Overriding defaults](#overriding-defaults)
- [License](#license)
- [Develop and test](#develop-and-test)

## Quickstart

1. In your studio folder, run:

```sh
npm install sanity-plugin-transifex
```

2. Ensure the plugin has access to your Transifex secrets. You'll want to create a document that includes your project name, organization name, and a token with appropriate access. 

[Please refer to the Transifex documentation on creating a token if you don't have one already.](https://docs.transifex.com/account/authentication)

In your Studio folder, create a file called `populateTransifexSecrets.js` with the following contents:

```javascript
// ./populateTransifexSecrets.js
// Do not commit this file to your repository

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2023-02-15'})

client.createOrReplace({
  // The `.` in this _id will ensure the document is private
  // even in a public dataset!
  _id: 'transifex.secrets',
  _type: 'transifexSettings',
  // Replace these with your values
  organization: 'YOUR_TRANSIFEX_ORG_HERE',
  project: 'YOUR_TRANSIFEX_PROJECT_HERE',
  token: 'YOUR_TRANSIFEX_TOKEN_HERE'
})
```

On the command line, run the file: 

```sh
npx sanity exec populateTransifexSecrets.js --with-user-token
```
  
Verify that the document was created using the Vision Tool in the Studio and query `*[_id == 'transifex.secrets']`. Note: If you have multiple datasets, you'll have to do this across all of them.

If the document was found in your dataset(s), delete `populateTransifexSecrets.js`. 

If you have concerns about this being exposed to authenticated users of your studio, you can control access to this path with [role-based access control](https://www.sanity.io/docs/access-control).

4. Get the Transifex tab on your desired document type, using whatever pattern you like. You'll use the [desk structure](https://www.sanity.io/docs/structure-builder-introduction) for this. The options for translation will be nested under this desired document type's views. Here's an example:

```javascript
import {DefaultDocumentNodeResolver} from 'sanity/desk'
//...your other desk structure imports...
import {TranslationsTab, defaultDocumentLevelConfig} from 'sanity-plugin-transifex'
//if you are using field-level translations, you can import the field-level config instead:
//import {TranslationsTab, defaultFieldLevelConfig} from 'sanity-plugin-studio-smartling'
//if you're not sure which, please look at the document-level and field-level sections below

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'myTranslatableDocumentType') {
    return S.document().views([
      S.view.form(),
      //...my other views -- for example, live preview, document pane, etc.,
      S.view.component(TranslationsTab).title('Transifex').options(defaultDocumentLevelConfig)
      //again, if you're using field-level translations, you can use the field-level config instead:
    ])
  }
}
```

And that should do it! Go into your studio, click around, and check the document in Transifex (it should be under its Sanity `_id`). Once it's translated, check the import by clicking the `Import` button on your Transifex tab!

## Assumptions

To use the default config mentioned above, we assume that you are following the conventions we outline in [our documentation on localization](https://www.sanity.io/docs/localization).

### Field-level translations

If you are using field-level translation and the `defaultFieldLevelConfig` configuration, we assume any fields you want translated exist in the multi-locale object form we recommend.

For example, on a document you don't want to be translated, you may have a "title" field that's a flat string: `title: 'My title is here.'` For a field you want to include many languages for your title may look like:

```javascript
{
  //...other document fields,
  title: {
    en: 'My title is here.',
    es: 'Mi título está aquí.',
    etc...
  }
}
```

### Document level translations

Since we often find users want to use the [Document internationalization plugin](https://www.sanity.io/plugins/document-internationalization) if they're using document-level translations, we assume that any documents you want in different languages will be present in a `translation.metadata` document.

_Important_: The above is true if you are using the Document Internationalization Plugin at version 2 or above. If you are using version 1 please use the `legacyDocumentLevelConfig` configuration exported from this plugin. This configuration assumes your translations follow the pattern `{id-of-base-language-document}__i18n_{locale}`

### Final note

It's okay if your data doesn't follow these patterns and you don't want to change them! You will simply have to override how the plugin gets and patches back information from your documents. Please see [Overriding defaults](#overriding-defaults).

## Studio experience

By adding the `TranslationsTab` to your desk structure, your users should now have an additional view. The boxes at the top of the tab can be used to send translations off to Transifex, and once those jobs are started, they should see progress bars monitoring the progress of the jobs. They can import a partial or complete job back.

## Overriding defaults

To personalize this configuration it's useful to know what arguments go into `TranslationsTab` as options (the `defaultConfigs` are just wrappers for these):

- `exportForTranslation`: a function that takes your document id and returns an object with `name`: the field you want to use identify your doc in Transifex (by default this is `_id` and `content`: a serialized HTML string of all the fields in your document to be translated.
- `importTranslation`: a function that takes in `id` (your document id) `localeId` (the locale of the imported language) and `document` the translated HTML from Transifex. It will deserialize your document back into an object that can be patched into your Sanity data, and then executes that patch.
- `Adapter`: An interface with methods to send things over to Transifex. You likely don't want to override this!

There are several reasons to override these functions. More general cases are often around ensuring documents serialize and deserialize correctly. Since the serialization functions are used across all our translation plugins currently, you can find some frequently encountered scenarios at [their repository here](https://github.com/sanity-io/sanity-naive-html-serializer), along with code examples for new config.

## Migrating to Sanity Studio v3

You should not have to do anything to migrate to Sanity Studio v3. If you are using the default configs, you should be able to upgrade without any changes. If you are using custom serialization, you may need to update how `BaseDocumentSerializer` receives your schema. 

These are outlined in the serializer README [here](https://github.com/sanity-io/sanity-naive-html-serializer#v2-to-v3-changes).

## License

[MIT](LICENSE) © Sanity.io

## Develop & test

This plugin is in early stages. We plan on improving some of the user-facing chrome, sorting out some quiet bugs, figuring out where things don't fail elegantly, etc. Please be a part of our development process!

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-plugin-transifex/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
