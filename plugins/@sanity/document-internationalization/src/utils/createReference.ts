import {randomKey} from '@sanity/util/content'
import {LANGUAGE_FIELD_NAME} from 'sanity-plugin-internationalized-array'

import type {TranslationReference} from '../types'

/**
 * Creates a translation reference object used in metadata documents to link
 * a language key to a document. References are created as weak by default,
 * with optional strengthen-on-publish metadata so the reference becomes
 * strong once the referenced document is published.
 */
export function createReference(
  language: string,
  ref: string,
  type: string,
  strengthenOnPublish: boolean = true,
): TranslationReference {
  return {
    [LANGUAGE_FIELD_NAME]: language,
    _key: randomKey(),
    _type: 'internationalizedArrayReferenceValue',
    value: {
      _type: 'reference',
      _ref: ref,
      _weak: true,
      // If the user has configured weakReferences, we won't want to strengthen them
      ...(strengthenOnPublish ? {_strengthenOnPublish: {type}} : {}),
    },
  }
}
