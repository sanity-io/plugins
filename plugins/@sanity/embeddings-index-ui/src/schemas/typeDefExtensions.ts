import 'sanity'

export interface EmbeddingsIndexConfig {
  /**
   * Name of the index
   */
  indexName: string
  maxResults?: number
  /**
   * Determines if which search mode is enabled by default for the reference field.
   * Default is the studio default search, while 'embeddings' enables
   * Defaults to 'default' behaviour
   */
  searchMode?: 'embeddings' | 'default'
}

/* eslint-disable no-unused-vars */
declare module 'sanity' {
  interface ReferenceBaseOptions {
    /**
     * Enables toggleable semantic search for a reference field.
     *
     * When `true`: will use default plugin configuration (if no config has been for the plugin provided ,this will throw an error)
     */
    embeddingsIndex?: true | EmbeddingsIndexConfig
  }
}
