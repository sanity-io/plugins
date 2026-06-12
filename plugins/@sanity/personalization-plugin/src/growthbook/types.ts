import {FieldDefinition} from 'sanity'

export type GrowthbookExperimentFieldPluginConfig = {
  fields: (string | FieldDefinition)[]
  environment: string
  baseUrl?: string
  project?: string
  convertBooleans?: boolean
  tags?: string[]
}

export type GrowthbookContextProps = {
  setSecret: (secret: string | undefined) => void
  secret: string | undefined
}
