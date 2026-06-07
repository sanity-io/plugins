import {SerializedDocument} from '../../src'
import annotationAndInlineBlocks from '../__fixtures__/annotationAndInlineBlocks.json'
import documentLevelArticle from '../__fixtures__/documentLevelArticle.json'
import fieldLevelArticle from '../__fixtures__/fieldLevelArticle.json'
import inlineDocumentLevelArticle from '../__fixtures__/inlineDocumentLevelArticle.json'
import internationalizedArrayArticle from '../__fixtures__/internationalizedArrayArticle.json'
import nestedLanguageFields from '../__fixtures__/nestedLanguageFields.json'

export {default as inlineSchema} from '../__fixtures__/inlineSchema'
export {default as schema} from '../__fixtures__/schema'
export {
  annotationAndInlineBlocks,
  documentLevelArticle,
  fieldLevelArticle,
  inlineDocumentLevelArticle,
  internationalizedArrayArticle,
  nestedLanguageFields,
}

export const getHTMLNode = (serialized: SerializedDocument): Document => {
  const htmlString = serialized.content
  const parser = new DOMParser()
  return parser.parseFromString(htmlString, 'text/html')
}

export const findByClass = (children: HTMLCollection, className: string): Element | undefined => {
  return Array.from(children).find((node) => node.className === className)
}
