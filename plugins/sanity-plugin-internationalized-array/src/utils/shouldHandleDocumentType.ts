import type {PluginConfig} from '../types'

const METADATA_DOCUMENT_TYPE = 'translation.metadata'

/**
 * Decides whether the plugin should run for a given document type.
 *
 * - Standalone mode handles every document except translation metadata.
 * - Document internationalization integration mode only handles translation metadata.
 */
export function shouldHandleDocumentType(
  pluginConfig: Pick<PluginConfig, 'isDocumentInternationalizationIntegration'>,
  documentType: string,
): boolean {
  if (pluginConfig.isDocumentInternationalizationIntegration) {
    return documentType === METADATA_DOCUMENT_TYPE
  }

  return documentType !== METADATA_DOCUMENT_TYPE
}
