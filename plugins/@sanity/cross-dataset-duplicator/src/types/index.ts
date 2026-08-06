import type {SanityDocument} from 'sanity'

type PreDefinedQuery = {
  label: string
  query: string
}

/**
 * A single allowed migration target.
 * If `projectId` is omitted, the target is only allowed within the source project.
 * @public
 */
export type MigrationTarget = {
  projectId?: string
  dataset: string
}

/**
 * Restricts which Datasets (and Projects) a given source Dataset may migrate to.
 * @public
 */
export type MigrationFilter = {
  sourceDataset: string
  targets: MigrationTarget[]
}

/**
 * Plugin configuration
 * @public
 */
export interface PluginConfig {
  apiVersion?: string
  tool?: boolean
  types?: string[]
  filter?: string
  follow?: ('inbound' | 'outbound')[]
  queries?: PreDefinedQuery[]
  migrationFilters?: MigrationFilter[]
}

/**
 * Cross Dataset Duplicator document action props
 * @public
 */
export type CrossDatasetDuplicatorActionProps = {
  docs: SanityDocument[]
  onDuplicated?: () => Promise<void>
}
