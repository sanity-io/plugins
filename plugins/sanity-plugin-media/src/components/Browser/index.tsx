import {Card, Flex, PortalProvider} from '@sanity/ui'
import {useState} from 'react'
import {type AssetSourceComponentProps, type SanityDocument} from 'sanity'

import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import {MediaActorsProvider} from '../../contexts/MediaActorsContext'
import {useToolOptions} from '../../contexts/ToolOptionsContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import GlobalStyle from '../../styled/GlobalStyles'
import {isSupportedAssetType} from '../../utils/isSupportedAssetType'
import Controls from '../Controls'
import DebugControls from '../DebugControls'
import Dialogs from '../Dialogs'
import FolderBreadcrumbs from '../FolderBreadcrumbs'
import FolderPanel from '../FolderPanel'
import Header from '../Header'
import Items from '../Items'
import PickedBar from '../PickedBar'
import TagsPanel from '../TagsPanel'
import UploadDropzone from '../UploadDropzone'

type Props = {
  assetType?: AssetSourceComponentProps['assetType']
  document?: SanityDocument
  isMultiSelect?: boolean
  onClose?: AssetSourceComponentProps['onClose']
  onSelect?: AssetSourceComponentProps['onSelect']
  selectedAssets?: AssetSourceComponentProps['selectedAssets']
  schemaType?: AssetSourceComponentProps['schemaType']
}

function getMediaTagNames(schemaType?: AssetSourceComponentProps['schemaType']): string[] {
  const mediaTags = (schemaType?.options as {mediaTags?: string[]} | undefined)?.mediaTags
  if (!mediaTags?.length) return []
  const unique = new Set(
    mediaTags.map((t) => t?.trim()).filter((t): t is string => Boolean(t?.length)),
  )
  return Array.from(unique)
}

const BrowserContent = ({onClose}: {onClose?: AssetSourceComponentProps['onClose']}) => {
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  return (
    <PortalProvider element={portalElement}>
      <UploadDropzone>
        <Dialogs />

        <Card data-testid="media-browser" display="flex" height="fill" ref={setPortalElement}>
          <Flex direction="column" flex={1}>
            {/* Header */}
            <Header onClose={onClose} />

            {/* Browser Controls */}
            <Controls />

            <FolderBreadcrumbs />

            <Flex flex={1}>
              <FolderPanel />
              <Flex align="flex-end" direction="column" flex={1} style={{position: 'relative'}}>
                <PickedBar />
                <Items />
              </Flex>
              <TagsPanel />
            </Flex>

            {/* Debug */}
            <DebugControls />
          </Flex>
        </Card>
      </UploadDropzone>
    </PortalProvider>
  )
}

const Browser = (props: Props) => {
  const client = useVersionedClient()
  const {excludeTagSlugs, showMediaLibraryAssets} = useToolOptions()

  return (
    <MediaActorsProvider
      assetTypes={isSupportedAssetType(props.assetType) ? [props.assetType] : ['file', 'image']}
      client={client}
      document={props.document}
      excludeTagSlugs={excludeTagSlugs}
      mode={{type: 'browser', mediaTagNames: getMediaTagNames(props.schemaType)}}
      selectedAssetIds={props.selectedAssets?.map((asset) => asset._id) ?? []}
      showMediaLibraryAssets={showMediaLibraryAssets}
    >
      <AssetBrowserDispatchProvider isMultiSelect={props.isMultiSelect} onSelect={props.onSelect}>
        <GlobalStyle />
        <BrowserContent onClose={props.onClose} />
      </AssetBrowserDispatchProvider>
    </MediaActorsProvider>
  )
}

export default Browser
