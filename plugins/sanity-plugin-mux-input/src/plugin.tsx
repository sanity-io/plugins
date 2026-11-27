import {lazy} from 'react'

import VideoThumbnail from './components/VideoThumbnail'
import {MuxApiHostProvider} from './context/MuxApiHostContext'
import type {MuxInputProps, PluginConfig, VideoAssetDocument} from './util/types'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const Input = lazy(() => import('./components/Input'))

export function muxVideoCustomRendering(config: PluginConfig) {
  return {
    components: {
      input: (props: MuxInputProps) => (
        <MuxApiHostProvider muxApiHost={config.muxApiHost}>
          <Input config={{...config, ...props.schemaType.options}} {...props} />
        </MuxApiHostProvider>
      ),
    },
    preview: {
      select: {
        filename: 'asset.filename',
        playbackId: 'asset.playbackId',
        status: 'asset.status',
        assetId: 'asset.assetId',
        thumbTime: 'asset.thumbTime',
        data: 'asset.data',
      },
      prepare: (asset: Partial<VideoAssetDocument>) => {
        const {filename, playbackId, status} = asset
        return {
          title: filename || playbackId || '',
          subtitle: status ? `status: ${status}` : null,
          media: asset.playbackId ? <VideoThumbnail asset={asset} width={64} /> : null,
        }
      },
    },
  }
}
