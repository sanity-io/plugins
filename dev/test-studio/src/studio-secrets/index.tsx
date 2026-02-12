import {definePlugin} from 'sanity'

// @sanity/studio-secrets exports useSecrets hook and SettingsView component
// These are utilities used by other plugins, not a plugin itself
// See the README for usage: https://github.com/sanity-io/plugins/tree/main/plugins/@sanity/studio-secrets
export const studioSecretsExample = definePlugin(() => ({
  name: 'studio-secrets-example',
}))
