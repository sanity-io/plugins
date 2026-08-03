export interface EmbeddingsIndexConfig {
  /**
   * Name of the index
   */
  indexName: string
  maxResults?: number
  /**
   * Determines which search mode is enabled by default for the reference field.
   *
   * - 'default': Studio's standard reference search
   * - 'embeddings': Semantic search backed by the embeddings index
   *
   * Defaults to 'default'.
   */
  searchMode?: 'embeddings' | 'default'
}

declare module 'sanity' {
  interface ReferenceBaseOptions {
    /**
     * Enables toggleable semantic search for a reference field.
     *
     * When set to `true`, the plugin will use the default plugin configuration.
     * If no default configuration is provided, an error will be thrown.
     */
    embeddingsIndex?: true | EmbeddingsIndexConfig
  }
}
