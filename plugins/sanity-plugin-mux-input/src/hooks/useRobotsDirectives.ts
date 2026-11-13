import {useDataset, useProjectId} from 'sanity'
import useSWR from 'swr'

import {listRobotsDirectives} from '../actions/robots'
import {capabilityFromError} from '../robots/capability'
import type {RobotsCapability, RobotsDirective} from '../robots/types'
import {useClient} from './useClient'

/** One page. A page that comes back full may not be all of them. */
const PAGE_SIZE = 100

export type RobotsDirectiveListing =
  | {status: 'pending'}
  | {status: 'loaded'; directives: RobotsDirective[]; isComplete: boolean}
  | {status: 'failed'; capability?: RobotsCapability | undefined}

/**
 * The account's directives, for pickers and names. Ids are the truth and names a convenience:
 * every caller renders the id when the listing fails or a directive is gone.
 */
export function useRobotsDirectives(enabled: boolean): {
  listing: RobotsDirectiveListing
  reload: () => void
} {
  const client = useClient()
  const projectId = useProjectId()
  const dataset = useDataset()
  const {data, error, mutate} = useSWR(
    enabled ? `/${projectId}/addons/mux/robots/${dataset}/directives` : null,
    async () => (await listRobotsDirectives(client, {limit: PAGE_SIZE})).data ?? [],
    {revalidateOnFocus: false, shouldRetryOnError: false},
  )

  let listing: RobotsDirectiveListing = {status: 'pending'}
  if (data) listing = {status: 'loaded', directives: data, isComplete: data.length < PAGE_SIZE}
  else if (error) listing = {status: 'failed', capability: capabilityFromError(error)}

  return {listing, reload: () => void mutate()}
}

/** id → display name, falling back to the id for anything the listing doesn't cover. */
export function directiveNamesById(
  listing: RobotsDirectiveListing,
  fallbackIds: string[] = [],
): Record<string, string> {
  const names: Record<string, string> = Object.fromEntries(fallbackIds.map((id) => [id, id]))
  if (listing.status === 'loaded') {
    for (const directive of listing.directives) names[directive.id] = directive.name || directive.id
  }
  return names
}

/** Configured ids a complete listing doesn't have. A failed or full listing is no evidence. */
export function missingDirectiveIds(listing: RobotsDirectiveListing, ids: string[]): string[] {
  if (listing.status !== 'loaded' || !listing.isComplete) return []
  const listed = new Set(listing.directives.map((directive) => directive.id))
  return ids.filter((id) => !listed.has(id))
}
