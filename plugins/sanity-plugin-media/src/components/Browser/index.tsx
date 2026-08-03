import {Card, Flex, PortalProvider} from '@sanity/ui'
import {useState} from 'react'
import {type AssetSourceComponentProps, type SanityDocument} from 'sanity'

import {AssetBrowserDispatchProvider} from '../../contexts/AssetSourceDispatchContext'
import useVersionedClient from '../../hooks/useVersionedClient'
import GlobalStyle from '../../styled/GlobalStyles'
import Controls from '../Controls'
import DebugControls from '../DebugControls'
import Dialogs from '../Dialogs'
import FolderBreadcrumbs from '../FolderBreadcrumbs'
import FolderPanel from '../FolderPanel'
import Header from '../Header'
import Items from '../Items'
import Notifications from '../Notifications'
import PickedBar from '../PickedBar'
import ReduxProvider from '../ReduxProvider'
import TagsPanel from '../TagsPanel'
import UploadDropzone from '../UploadDropzone'
import {useBrowserInit} from './useBrowserInit'

type Props = {
  assetType?: AssetSourceComponentProps['assetType']
  document?: SanityDocument
  isMultiSelect?: boolean
  onClose?: AssetSourceComponentProps['onClose']
  onSelect?: AssetSourceComponentProps['onSelect']
  selectedAssets?: AssetSourceComponentProps['selectedAssets']
  schemaType?: AssetSourceComponentProps['schemaType']
}

const BrowserContent = ({
  onClose,
  schemaType,
}: {
  onClose?: AssetSourceComponentProps['onClose']
  schemaType?: AssetSourceComponentProps['schemaType']
}) => {
  const client = useVersionedClient()
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  useBrowserInit(client, schemaType)

  return (
    <PortalProvider element={portalElement}>
      <UploadDropzone>
        <Dialogs />
        <Notifications />

        <Card display="flex" height="fill" ref={setPortalElement}>
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

  return (
    <ReduxProvider
      assetType={props?.assetType}
      client={client}
      document={props?.document}
      selectedAssets={props?.selectedAssets}
    >
      <AssetBrowserDispatchProvider isMultiSelect={props?.isMultiSelect} onSelect={props?.onSelect}>
        <GlobalStyle />
        <BrowserContent onClose={props?.onClose} schemaType={props?.schemaType} />
      </AssetBrowserDispatchProvider>
    </ReduxProvider>
  )
}

export default Browser
