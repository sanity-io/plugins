
## Installation

```sh
npm install sanity-plugin-studio-smartling
```

## Usage

# Studio Plugin for Sanity & Smartling

![smartling gif](https://user-images.githubusercontent.com/3969996/125689321-bf37021f-ba55-4147-83eb-1745eb8acb1f.gif)

We're proud to be partnered with Smartling and their [official connector](https://help.smartling.com/hc/en-us/articles/1260803085050-Sanity-Connector-Overview-) makes it quick and easy to get your studio content into your Smartling project.

This is a separate plugin, and differs in that it provides editors a visual progress bar for ongoing translations and a way to import translations back into your content at either the document or field level. Feel free to try it out and see which solution works for you!

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
npm install sanity-plugin-studio-smartling
```

2. Because of Smartling CORS restrictions, you will need to set up a proxy endpoint to funnel requests to Smartling. We've provided a tiny Next.js app you can set up [here](https://github.com/sanity-io/example-sanity-smartling-proxy). If that's not useful, the important thing to pay attention to is that this endpoint handles requests with an `X-URL` header that contains the Smartling URL configured by the plugin, and can parse a data file to an HTML string and send it back to the adapter.

3. Create or use a Smartling project token.

[Please refer to the Smartling documentation on creating a token if you don't have one already.](https://help.smartling.com/hc/en-us/articles/115004187694-API-Tokens)

In your Studio folder, create a file called `populateSmartlingSecrets.js` with the following contents:

```javascript
// ./populateSmartlingSecrets.js
// Do not commit this file to your repository

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2023-02-15'})

client.createOrReplace({
  // The `.` in this _id will ensure the document is private
  // even in a public dataset!
  _id: 'translationService.secrets',
  _type: 'smartlingSettings',
  //replace these with your values
  organization: 'YOUR_SMARTLING_ORGANIZATION_HERE',
  project: 'YOUR_SMARTLING_PROJECT_HERE',
  secret: '{"userIdentifier":"xxxxxx","userSecret":"xxxx"}', //in this format from Smartling when you press the button "copy token" on creation
  proxy: 'my-proxy-endpoint.com/api/proxy' //the endpoint you set up in step 2
})
```

On the command line, run the file:

```sh
npx sanity exec populateSmartlingSecrets.js --with-user-token
```

Verify that the document was created using the Vision Tool in the Studio and query `*[_id == 'translationService.secrets']`. Note: If you have multiple datasets, you'll have to do this across all of them.

If the document was found in your dataset(s), delete `populateSmartlingSecrets.js`.

If you have concerns about this being exposed to authenticated users of your studio, you can control access to this path with [role-based access control](https://www.sanity.io/docs/access-control).

4. Get the Smartling tab on your desired document type, using whatever pattern you like. You'll use the [desk structure](https://www.sanity.io/docs/structure-builder-introduction) for this. The options for translation will be nested under this desired document type's views. Here's an example:

```javascript
import {DefaultDocumentNodeResolver} from 'sanity/desk'
//...your other desk structure imports...
import {TranslationsTab, defaultDocumentLevelConfig} from 'sanity-plugin-studio-smartling'
//if you are using field-level translations, you can import the field-level config instead:
//import {TranslationsTab, defaultFieldLevelConfig} from 'sanity-plugin-studio-smartling'
//if you're not sure which, please look at the document-level and field-level sections below

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'myTranslatableDocumentType') {
    return S.document().views([
      S.view.form(),
      //...my other views -- for example, live preview, document pane, etc.,
      S.view.component(TranslationsTab).title('Smartling').options(defaultDocumentLevelConfig)
      //again, if you're using field-level translations, you can use the field-level config instead:
      //S.view.component(TranslationsTab).title('Smartling').options(defaultFieldLevelConfig)
    ])
  }
  return S.document()
}
```

And that should do it! Go into your studio, click around, and check the document in Smartling (it should be under its Sanity `_id` by default, but you can override this). Once it's translated, check the import by clicking the `Import` button on your Smartling tab!

## Assumptions

To use the default config mentioned above, we assume that you are following the conventions we outline in [our documentation on localization](https://www.sanity.io/docs/localization).

### Field-level translations

If you are using field-level translation and the `defaultFieldLevelConfig` configuration, we assume any fields you want translated exist in the multi-locale object form we recommend.
For example, a non-localizable "title" field will be a flat string: `title: 'My title is here.'` For a field you want to include many languages for, your title may look like
`    
{ 
  title: {
    en: 'My title is here.',
    es_ES: 'Mi título está aquí.',
    etc...
  }
}
   `
_Important_: Smartling's locale representation includes hyphens, like `fr-FR`. These aren't valid as Sanity field names, so ensure that on your fields you change the hyphens to underscores (like `fr_FR`).

### Document level translations

Since we often find users want to use the [Document internationalization plugin](https://www.sanity.io/plugins/document-internationalization) if they're using document-level translations, we assume that any documents you want in different languages will be present in a `translation.metadata` document.

_Important_: The above is true if you are using the Document Internationalization Plugin at version 2 or above. If you are using version 1 please use the `legacyDocumentLevelConfig` configuration exported from this plugin. This configuration assumes your translations follow the pattern `{id-of-base-language-document}__i18n_{locale}`


### Final note

It's okay if your data doesn't follow these patterns and you don't want to change them! You will simply have to override how the plugin gets and patches back information from your documents. Please see [Overriding defaults](#overriding-defaults).

## Studio experience

By adding the `TranslationsTab` to your desk structure, your users should now have an additional view on their document. The boxes at the top of the tab can be used to send translations off to Smartling, and once those jobs are started, they should see progress bars monitoring the progress of the jobs. They can import a partial or complete job back. They can also re-send a document, which should update the existing job.

## Overriding defaults

To personalize this configuration it's useful to know what arguments go into `TranslationsTab` as options (the `defaultConfigs` are just wrappers for these):

- `exportForTranslation`: a function that takes your document id and returns an object like:

```javascript
{
 `name`: /*the field you want to use identify your doc in Smartling (by default this is `_id`) */
 `content`: /* a serialized HTML string of all the fields in your document to be translated. */
}
```

- `importTranslation`: a function that takes in `id` (your document id), `localeId` (the locale of the imported language), and `document` (the translated HTML from Smartling). It will deserialize your document back into an object that can be patched into your Sanity data, and then executes that patch.
- `Adapter`: An interface with methods to send things over to Smartling. You likely don't want to override this!

There are several reasons to override these functions. Generally, developers will customize to ensure documents serialize and deserialize correctly. Since the serialization functions are used across all our translation plugins currently, you can find some frequently encountered scenarios at [their repository here](https://github.com/sanity-io/sanity-naive-html-serializer), along with code examples for customized configurations.

## Migrating to Sanity Studio v3

There is one major breaking change in this plugin's migration to Sanity Studio v3: the proxy was set in an environment variable, and now it should be part of the `secrets` document.

In v2, you would set the proxy in a `.env` file, like so:

```env
SANITY_STUDIO_SMARTLING_PROXY=https://my-proxy-endpoint.com/api/proxy
```

In v3, you should set the proxy in the `secrets` document. If you have an existing secrets document, you can patch it like so:

```javascript
// ./patchSmartlingSecrets.js
// Do not commit this file to your repository

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2023-02-15'})

client.patch('translationService.secrets').set({proxy: 'https://my-proxy.com/api/proxy'}).commit()
```

and run the script with `sanity exec patchSmartlingSecrets.js --with-user-token`.

Alternatively, you can re-run the `populateSmartlingSecrets` script in [Quickstart](#quickstart) to create a new secrets document with the proxy set.

We apologize for the inconvenience. Because of the new embeddability of the studio, developers may find that their v3 Studio is built and deployed in different ways, with access to different environments. Keeping this setting in `secrets` allows developers to set it in a way that works for their deployment and reduce complexity. You can find more information on our guidance around environment variables [here](https://github.com/sanity-io/sanity/releases/tag/v3.5.0).

Otherwise, you should not have to do anything to migrate to Sanity Studio v3. If you are using the default configs, you should be able to upgrade without any changes. If you are using custom serialization, you may need to update how `BaseDocumentSerializer` receives your schema.

These are outlined in the serializer README [here](https://github.com/sanity-io/sanity-naive-html-serializer#v2-to-v3-changes).

The final change from the v2 to v3 version of the plugin is in how progress in a translation job is calculated. The plugin will now count progress as the percentage of all strings that have reached the final stage of a Smartling workflow.

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
