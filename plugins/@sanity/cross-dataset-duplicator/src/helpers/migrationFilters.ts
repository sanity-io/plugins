import type {MigrationFilter} from '../types'

type IsAllowedMigrationTargetOptions = {
  migrationFilters: MigrationFilter[] | undefined
  sourceProjectId: string | undefined
  sourceDataset: string | undefined
  targetProjectId: string
  targetDataset: string
}

/**
 * Determine whether a Workspace is an allowed Migration destination for the
 * current source Dataset, based on the optional `migrationFilters` config.
 *
 * If no filter is configured for the source Dataset, every target is allowed
 * (the default behaviour). When a filter is configured, only the listed targets
 * are allowed.
 */
export function isAllowedMigrationTarget(options: IsAllowedMigrationTargetOptions): boolean {
  const {migrationFilters, sourceProjectId, sourceDataset, targetProjectId, targetDataset} = options

  const migrationFilter = migrationFilters?.find((filter) => filter.sourceDataset === sourceDataset)

  // If no migrationFilter is configured for this dataset, allow all migration targets.
  if (!migrationFilter) {
    return true
  }

  return migrationFilter.targets.some((target) => {
    if (target.dataset !== targetDataset) {
      return false
    }

    // If a project ID is configured for the target, check that it matches.
    if (target.projectId) {
      return target.projectId === targetProjectId
    }

    // If a project ID is not configured for the target, only allow targets in
    // the same project as the source.
    return targetProjectId === sourceProjectId
  })
}
