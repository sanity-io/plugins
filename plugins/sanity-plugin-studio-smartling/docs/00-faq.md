## Where should I place the Translations Tab?
The Translations Tab should be invoked as a view. This can be done in the `getDefaultDocumentNode` function in `schemas.ts`:
```ts
import {TranslationsTab, defaultDocumentLevelConfig, defaultFieldLevelConfig} from 'sanity-plugin-studio-smartling'

export const defaultDocumentNodeResolver = (S) =>
  S.document().views([
     // Give all documents the JSON preview, 
    // as well as the default form view
    S.view.form(),
    S.view.component(TranslationsTab).options(defaultDocumentLevelConfig)
  ])
```
If using a document-level translation pattern, you should likely only include this view in your "base" language. Please see the document internationalization plugin on building different desk structure options for different locales. (example code coming soon)

## What happens when I click the "Create Job" button?
The tab will do the following:
1. Fetch the latest draft of the document you're currently in.
2. Filter out (as best as it can) any fields that should not be translated (references, dates, numbers, etc.). It will also utilize options passed in to ignore certain fields and objects. See more in the Advanced Configuration docs.
3. Serialize the document into an HTML string. It will utilize options to serialize objects in particular ways, if provided.
4. Send the HTML string to the translation vendor's API, along with the locale code of the language(s) you want to translate to.
5. Look up the translation job ID in the response from the translation vendor (this will either match your document ID or be invoked by a custom job name resolver [coming soon]).
6. Show you the progress of the ongoing translation and a link to the job in the vendor, if available.

## How am I seeing my progress?
On load, the tab fetches the total amount of strings that have reached the LAST stage of translation and are ready to be imported. That is divided over the total amount of strings in the document, and the progress bar is updated accordingly.

## How do I import translations?
When the translation vendor has completed the translation, you can click the "Import Translations" button. This will do the following:
1. Deserialize the HTML string from the translation vendor into a Sanity document.
2. Fetch the revision of the document you're currently in at the time the translation was sent, if available. (This is to resolve the translation as smoothly as possible, in case the document has changed since it was sent to translation and cannot resolve conflicts)
3. Compare the two documents and merge the translated content with anything that was not sent for translation.
4. Issue a patch with the relevant merges to the relevant document. If using document internationalization, this will also update translation metadata. 

## How can I prevent certain fields from being sent to translation?
You can pass in a `stopTypes` parameter to name all objects you do not want translated. Alternately, the serializer also introspects your schema. You can set `localize: false` on any field you do not want translated.
```js
  fields: [
    defineField({
      name: 'categories',
      type: 'array',
      //ts-ignore
      localize: false,
      ...
    })]
```