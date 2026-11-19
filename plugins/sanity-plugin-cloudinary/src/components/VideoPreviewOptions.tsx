import {createContext, useContext} from 'react'
import type {LayoutProps, PluginOptions} from 'sanity'

import type {CloudinaryPluginConfig, CloudinaryVideoPreviewOptions} from '../types'

const NO_OPTIONS: CloudinaryVideoPreviewOptions = {}

const VideoPreviewOptionsContext = createContext<CloudinaryVideoPreviewOptions>(NO_OPTIONS)

export function useVideoPreviewOptions(): CloudinaryVideoPreviewOptions {
  return useContext(VideoPreviewOptionsContext)
}

type VideoPreviewLayoutProps = LayoutProps & {videoPreview: CloudinaryVideoPreviewOptions}

/**
 * Studio layout that hands the plugin's `videoPreview` options to the asset preview and
 * diff components, which are attached to the schema type and can't receive plugin config
 * any other way.
 */
function VideoPreviewLayout({videoPreview, ...props}: VideoPreviewLayoutProps) {
  return (
    <VideoPreviewOptionsContext.Provider value={videoPreview}>
      {props.renderDefault(props)}
    </VideoPreviewOptionsContext.Provider>
  )
}

/**
 * Only adds a Studio layout when `videoPreview` is configured, so without options the
 * plugins behave exactly as they did before the option existed.
 */
export function videoPreviewStudio(config: CloudinaryPluginConfig | void): PluginOptions['studio'] {
  const videoPreview = config?.videoPreview
  if (!videoPreview) {
    return undefined
  }
  return {
    components: {
      layout: (props) => <VideoPreviewLayout {...props} videoPreview={videoPreview} />,
    },
  }
}
