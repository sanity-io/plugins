import {expect, test} from 'vitest'

import {BaseDocumentMerger} from '../../src'
import {internationalizedArrayArticle} from '../BaseDocumentSerializer/utils'
import {getInternationalizedArrayDocument} from './utils'

const newDocument = getInternationalizedArrayDocument()
const internationalizedArrayPatches = BaseDocumentMerger.internationalizedArrayMerge(
  newDocument,
  internationalizedArrayArticle,
  'es_ES',
  'en',
  0,
)

test('Global internationalized array snapshot test', () => {
  expect(internationalizedArrayPatches).toMatchSnapshot()
})
