import {randomKey} from '@sanity/util/content'
import {getCliClient} from 'sanity/cli'

/**
 * This script will create one or many "singleton" documents for each language
 * It works by appending the language ID to the document ID
 * and creating the translations.metadata document
 *
 * 1. Take a backup of your dataset with:
 * `npx sanity@latest dataset export`
 *
 * 2. Copy this file to the root of your Sanity Studio project
 *
 * 3. Update the SINGLETONS and LANGUAGES constants to your needs
 *
 * 4. Run the script (replace <schema-type> with the name of your schema type):
 * npx sanity@latest exec ./createSingletons.ts --with-user-token
 *
 * 5. Update your desk structure to use the new documents
 */

const SINGLETONS = [
  {id: 'home', _type: 'page', title: 'Home'},
  {id: 'login', _type: 'page', title: 'Login'},
]
const LANGUAGES = [
  {id: `en`, title: `English`},
  {id: `fr`, title: `French`},
]

// This will use the client configured in ./sanity.cli.ts
const client = getCliClient()
type CreateOrReplaceDocument = Parameters<
  ReturnType<typeof client.transaction>['createOrReplace']
>[0]

async function createSingletons() {
  const documents: CreateOrReplaceDocument[] = SINGLETONS.flatMap((singleton) => {
    const translations: CreateOrReplaceDocument[] = LANGUAGES.map((language) => ({
      _id: `${singleton.id}-${language.id}`,
      _type: singleton._type,
      language: language.id,
    }))

    const metadata: CreateOrReplaceDocument = {
      _id: `${singleton.id}-translation-metadata`,
      _type: `translation.metadata`,
      translations: translations.map((translation) => ({
        _key: randomKey(12),
        _type: 'internationalizedArrayReferenceValue',
        language: translation['language'],
        value: {
          _type: 'reference',
          _ref: translation._id,
        },
      })),
      schemaTypes: Array.from(new Set(translations.map((translation) => translation._type))),
    }

    return [metadata].concat(translations)
  })

  const transaction = client.transaction()

  documents.forEach((doc) => {
    transaction.createOrReplace(doc)
  })

  const result = await transaction.commit()

  // eslint-disable-next-line no-console
  console.log(result)
}

createSingletons().catch((err) => {
  console.error(err)
  process.exit(1)
})
