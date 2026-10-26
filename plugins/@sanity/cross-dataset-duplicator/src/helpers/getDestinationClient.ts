import type {SanityClient} from '@sanity/client'
import type {AuthState, AuthStore, WorkspaceSummary} from 'sanity'

type GetDestinationClientOptions = {
  originClient: SanityClient
  destination: Pick<WorkspaceSummary, 'projectId' | 'dataset' | 'auth'>
  apiVersion?: string
}

// Resolve with the first auth state the store emits. The subscription may emit
// synchronously, so unsubscribe on the next microtask rather than inside `next`.
function getCurrentAuthState(auth: AuthStore): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    const subscription = auth.state.subscribe({
      next: (state) => {
        resolve(state)
        queueMicrotask(() => subscription.unsubscribe())
      },
      error: reject,
    })
  })
}

/**
 * Get a client that can read from and write to the destination Workspace.
 *
 * Within the same Project the origin client's credentials are valid, so it is
 * re-pointed at the destination Dataset. Credentials are scoped to a Project
 * though (e.g. the token stored by the default `dual` login method), so for a
 * destination in another Project the client comes from that Workspace's own
 * auth store instead.
 *
 * Returns `null` if the user is not logged in to the destination Workspace.
 */
export async function getDestinationClient(
  options: GetDestinationClientOptions,
): Promise<SanityClient | null> {
  const {originClient, destination, apiVersion} = options
  const config = apiVersion ? {apiVersion} : {}

  if (destination.projectId === originClient.config().projectId) {
    return originClient.withConfig({
      ...config,
      dataset: destination.dataset,
      projectId: destination.projectId,
    })
  }

  const {authenticated, client} = await getCurrentAuthState(destination.auth)

  if (!authenticated) {
    return null
  }

  return client.withConfig({...config, dataset: destination.dataset})
}
