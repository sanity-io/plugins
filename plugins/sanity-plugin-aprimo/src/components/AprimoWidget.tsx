import {Box, Button, Card, Grid, Text} from '@sanity/ui'
import {useEffect, useState, useMemo} from 'react'
import {PatchEvent, type ObjectInputProps, set, unset} from 'sanity'

import type {AprimoCDNAsset, AprimoAsset, AprimoConfig} from '../types'

import {openSelector} from '../utils'
import {AprimoCDNPreview} from './AprimoCDNPreview'
import {AprimoFilePreview} from './AprimoFilePreview'

const isAprimoCDNAsset = (value: AprimoCDNAsset | AprimoAsset): value is AprimoCDNAsset => {
  return value && value.hasOwnProperty('rendition')
}

const isAprimoAsset = (value: AprimoCDNAsset | AprimoAsset): value is AprimoAsset => {
  //the ID is all we need to construct a link back to Aprimo
  return value && value.hasOwnProperty('id')
}

export interface AprimoWidgetProps extends ObjectInputProps<AprimoCDNAsset | AprimoAsset> {
  pluginConfig: AprimoConfig
}

export function AprimoWidget(props: AprimoWidgetProps): React.JSX.Element {
  const {
    value,
    readOnly,
    onChange,
    schemaType,
    pluginConfig: {tenantName},
  } = props

  const _key = value?._key
  const removeValue = () => {
    onChange(PatchEvent.from(unset()))
  }

  //this keeps track of which component is requesting an asset
  const [isLoading, setIsLoading] = useState(false)

  const setAsset = (asset: Record<string, any>) => {
    onChange(PatchEvent.from(asset ? set(asset) : unset()))
  }

  useEffect(() => {
    const handleMessageEvent = async (event: MessageEvent) => {
      // Ensure only messages from the Aprimo Content Selector are handled
      if (tenantName && event.origin === `https://${tenantName || ''}.dam.aprimo.com`) {
        //if cancel, get out of fetching state
        if (event.data.result === 'cancel') {
          setIsLoading(false)
        } else if (event.data.selection && event.data.selection[0] && isLoading) {
          if (_key) {
            setAsset({...event.data.selection[0], _key})
          } else {
            setAsset(event.data.selection[0])
          }
          setIsLoading(false)
        }
      }
    }

    window.addEventListener('message', handleMessageEvent)
    //cleanup
    return () => window.removeEventListener('message', handleMessageEvent)
  }, [tenantName, isLoading, _key])

  const action = () => {
    const selectType = schemaType.name === 'aprimo.cdnasset' ? 'singlerendition' : 'singlefile'
    setIsLoading(true)
    openSelector(tenantName, selectType)
  }

  const preview = useMemo(() => {
    if (value && schemaType.name === 'aprimo.cdnasset' && isAprimoCDNAsset(value)) {
      return <AprimoCDNPreview value={value} layout="default" />
    } else if (value && schemaType.name === 'aprimo.asset' && isAprimoAsset(value)) {
      return <AprimoFilePreview value={value} tenantName={tenantName} />
    }
    return null
  }, [tenantName, schemaType, value])

  if (!tenantName) {
    return (
      <Box padding={3}>
        <Card padding={4} radius={2} shadow={1} tone="caution">
          <Text>
            The tenant name has not been set in the configuration for the Aprimo plugin. Please add
            a tenant name.
          </Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box>
      <Box>{preview}</Box>
      <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
        <Button
          disabled={readOnly}
          mode="ghost"
          title="Select an asset"
          kind="default"
          onClick={action}
        >
          Select…
        </Button>
        <Button
          disabled={readOnly || !value}
          color="danger"
          mode="ghost"
          title="Remove asset"
          onClick={removeValue}
        >
          Remove
        </Button>
      </Grid>
    </Box>
  )
}
