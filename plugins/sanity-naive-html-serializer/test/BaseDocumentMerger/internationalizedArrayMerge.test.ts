import {internationalizedArrayArticle} from '../BaseDocumentSerializer/utils'
import {BaseDocumentMerger} from '../../src'
import {getInternationalizedArrayDocument} from './utils'
import {expect, test} from 'vitest'

const newDocument = getInternationalizedArrayDocument()
const internationalizedArrayPatches = BaseDocumentMerger.internationalizedArrayMerge(
  newDocument,
  internationalizedArrayArticle,
  'es_ES',
  'en',
  0
)

test('Global internationalized array snapshot test', () => {
  expect(internationalizedArrayPatches).toMatchSnapshot()
})
