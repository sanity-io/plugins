import type {SanityClient} from 'sanity'

/**
 * Maps a Studio client handed out by the plugin's `useClient` hook to the client that
 * sends Mux addon (`/addons/mux/...`) requests. Only populated when `muxApiHost` is set.
 */
const muxAddonClients = new WeakMap<SanityClient, SanityClient>()

/**
 * Validates `muxApiHost` and strips trailing slashes, so it can be used as `apiHost`.
 * Throws if it is not an absolute `http(s)` URL without a path, query or hash.
 */
export function normalizeMuxApiHost(muxApiHost: string): string {
  let url: URL
  try {
    url = new URL(muxApiHost)
  } catch {
    throw new Error(
      `[sanity-plugin-mux-input] \`muxApiHost\` must be an absolute URL, like "http://127.0.0.1:8080". Got: "${muxApiHost}"`,
    )
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `[sanity-plugin-mux-input] \`muxApiHost\` must use http or https. Got: "${muxApiHost}"`,
    )
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new Error(
      `[sanity-plugin-mux-input] \`muxApiHost\` must not have a path, query or hash. The plugin adds "/v<apiVersion>/addons/mux/...". Got: "${muxApiHost}"`,
    )
  }
  return url.origin
}

/**
 * Creates the client for Mux addon requests from a Studio client.
 *
 * The host is used as-is: no project id is prepended (`useProjectHostname: false`).
 * `@sanity/client` then sends the project id in a request header.
 * Auth config (`token`, `withCredentials`) is copied from the Studio client.
 */
function createMuxAddonClient(client: SanityClient, muxApiHost: string): SanityClient {
  return client.withConfig({
    apiHost: normalizeMuxApiHost(muxApiHost),
    // oxlint-disable-next-line no-deprecated -- only way to keep the project id out of the hostname
    useProjectHostname: false,
    useCdn: false,
  })
}

/**
 * Returns a copy of the Studio client that is linked to a Mux addon client on `muxApiHost`.
 * Content Lake requests on the returned client still use the Studio API host.
 */
export function withMuxApiHost(client: SanityClient, muxApiHost: string): SanityClient {
  const studioClient = client.withConfig({})
  muxAddonClients.set(studioClient, createMuxAddonClient(client, muxApiHost))
  return studioClient
}

/**
 * Returns the client to use for Mux addon requests.
 * Without a `muxApiHost` override, this is the same client that was passed in.
 */
export function getMuxAddonClient(client: SanityClient): SanityClient {
  return muxAddonClients.get(client) ?? client
}
