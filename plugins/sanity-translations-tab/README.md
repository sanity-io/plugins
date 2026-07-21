# sanity-translations-tab

This is the base module for implementing common translation vendor tasks from a Studio, such as sending content to be translated in some specific languages, importing content back etc. Not useful on its own, but vendor-specific plugins will use this for its chrome.

## Installation

```sh
npm install sanity-translations-tab
```

Unless you are involved in developing this module or a translation plugin, you probably do not need to interact with this package. You likely want to use a vendor-specific plugin, such as [sanity-plugin-studio-smartling](https://github.com/sanity-io/sanity-plugin-studio-smartling)

## Usage

Add the `TranslationsTab` component as a view in your document structure:

```js
import {StructureBuilder as S} from 'sanity/structure'

import {TranslationsTab, DummyAdapter} from 'sanity-translations-tab'

export const getDefaultDocumentNode = ({schemaType}) => {
  if (schemaType === 'translatable') {
    return S.document().views([
      S.view.form(),
      S.view
        .component(TranslationsTab)
        .title('Translations')
        .options({
          // Vendor-specific plugins will have their own adapter, use this for dev
          adapter: DummyAdapter,
          // These two async functions are expected by the plugin
          exportForTranslation: async (props) => props,
          importTranslation: async (props) => props,
          /**
           * If the translation vendor has different workflow options,
           * such as machine translation or human, pass them here and
           * they'll be displayed as Select menu options in the tab.
           * If one or more options are included, there will automatically
           * be a "Default" option that will submit the form with no
           * additional parameters
           */
          workflowOptions: [
            {
              workflowUid: '123',
              workflowName: 'Machine Translation (testing)',
            },
          ],
          /**
           * Optional sync or async function used on translation import to
           * Sanity, if the locale codes used by the translation vendor don't
           * match Sanity's. Receives the vendor locale ID and returns the
           * corresponding Sanity ID.
           */
          localeIdAdapter: (translationVendorId) => sanityId,

          /**
           * the key for the "source content" (for field level) or the code in the
           * language field on the "base document" (for document level)
           *  (e.g. "en" or "en_US").
           */
          baseLanguage: 'en_US',

          /**
           * Format used when writing NEW `translation.metadata` documents.
           * - 'language-field' (default): stores the language in a dedicated `language`
           *   field with a random `_key`, matching `@sanity/document-internationalization` v6.
           * - 'legacy': stores the language id in `_key`, for projects still on the
           *   pre-v6 format.
           * Existing metadata documents keep their detected format regardless of this
           * option. Both formats are read transparently.
           */
          newMetadataFormat: 'language-field',
        }),
    ])
  }

  return S.document()
}
```

## License

[MIT](LICENSE) © Sanity.io
