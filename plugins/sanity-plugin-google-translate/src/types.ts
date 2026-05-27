export type GoogleTranslateSchemaOptions = {
  translate?: boolean
  apiKey?: string
}

export type FieldNameLangPair = {
  fieldName: string
  fieldLang: string
}

export type TranslationConfig = {
  language: string
  baseLanguage: string
  content: string
}
