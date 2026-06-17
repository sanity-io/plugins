import type {SanityClient} from 'sanity'

import {getAsset, updateMasterAccess} from './assets'
import {testSecrets} from './secrets'

/**
 * Enables master access on a remote Mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target Mux asset ID.
 * @returns `true` on success.
 */
export async function enableMasterAccess(client: SanityClient, assetId: string): Promise<boolean> {
  try {
    const secretsValid = await testSecrets(client)
    if (!secretsValid?.status) return false

    await updateMasterAccess(client, assetId, 'temporary')
    return true
  } catch {
    return false
  }
}

/**
 * Disables master access on a remote Mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target Mux asset ID.
 * @returns `true` on success.
 */
export async function disableMasterAccess(client: SanityClient, assetId: string): Promise<boolean> {
  try {
    const secretsValid = await testSecrets(client)
    if (!secretsValid?.status) return false

    await updateMasterAccess(client, assetId, 'none')
    return true
  } catch {
    return false
  }
}

/**
 * Checks whether master access is enabled and available on a remote Mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target Mux asset ID.
 * @returns The master access link if available, otherwise an empty string.
 */
export async function pollMasterAccess(client: SanityClient, assetId: string): Promise<string> {
  try {
    const res = await getAsset(client, assetId)

    const status = res.data?.master?.status ?? 'errored'
    const url = res.data?.master?.url ?? ''
    if (status === 'ready') return url
    return ''
  } catch {
    return ''
  }
}

/**
 * Waits for master access to be enabled and available on a remote Mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target Mux asset ID.
 * @param timeout The timeout in seconds before giving up.
 * @param interval The interval in seconds between tries.
 * @param interrupt A manual interrupt function evaluated between tries.
 * @returns The master access link if available, otherwise an empty string.
 */
export async function waitForMasterAccess(
  client: SanityClient,
  assetId: string,
  timeout = 120,
  interval = 5,
  interrupt: () => Promise<boolean> | boolean = () => false
): Promise<string> {
  const limit = Date.now() + timeout * 1000
  while (Date.now() < limit && !(await interrupt())) {
    const url = await pollMasterAccess(client, assetId)
    if (url) return url

    await new Promise((resolve) => setTimeout(resolve, interval * 1000))
  }

  return ''
}
