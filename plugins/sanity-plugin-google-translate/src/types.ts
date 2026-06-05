export type GoogleTranslateSchemaOptions = {
  translate?: boolean
  apiKey?: string
}

declare module 'sanity' {
  interface ObjectOptions extends GoogleTranslateSchemaOptions {}
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
