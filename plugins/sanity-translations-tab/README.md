## Installation

```sh
npm install sanity-translations-tab
```

## Usage

# sanity-translations-tab

This is the base module for implementing common translation vendor tasks from a Studio, such as sending content to be translated in some specific languages, importing content back etc. Not useful on its own, but vendor-specific plugins will use this for its chrome.

Unless you are involved in developing this module or a translation plugin, you probably do not need to interact with this package. You likely want to use a vendor-specific plugin, such as [sanity-plugin-studio-smartling](https://github.com/sanity-io/sanity-plugin-studio-smartling)

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

Once you run `npm run link-watch` in the plugin repo and `npx yalc add sanity-translations-tab && npx yalc add sanity-translations-tab --link && npm install` in your test studio, per the instructions above, you can test the tab locally by adding the following to your desk structure:

```js
import S from '@sanity/desk-tool/structure-builder'

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
        }),
    ])
  }

  return S.document()
}
```

From here, you can start developing the plugin in the plugin repo. The plugin will be hot-reloaded in the studio.

## License

[MIT](LICENSE) © Sanity.io

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/sanity-translations-tab/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
