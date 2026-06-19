// oxlint-disable typescript/no-unsafe-type-assertion - legacy code will be lint-cleaned in a follow-up PR
import {PlugIcon} from '@sanity/icons'
import {Button, Flex, Grid, Stack} from '@sanity/ui'
import {useCallback} from 'react'
import {type ObjectInputProps, PatchEvent, unset} from 'sanity'
import {styled} from 'styled-components'

import type {CloudinaryAsset} from '../types'
import AssetPreview from './AssetPreview'

const SetupButtonContainer = styled.div`
  position: relative;
  display: block;
  font-size: 0.8em;
  transform: translate(0%, -10%);
`

type WidgetInputProps = ObjectInputProps & {openMediaSelector: () => void; onSetup: () => void}

const WidgetInput = (props: WidgetInputProps) => {
  const {onChange, readOnly, value, openMediaSelector} = props

  const removeValue = useCallback(() => {
    onChange(PatchEvent.from([unset()]))
  }, [onChange])

  return (
    <Stack>
      <SetupButtonContainer>
        <Flex flex={1} justify="flex-end">
          <Button
            color="primary"
            icon={PlugIcon}
            mode="bleed"
            title="Configure"
            onClick={props.onSetup}
            tabIndex={0}
          />
        </Flex>
      </SetupButtonContainer>

      <Flex style={{textAlign: 'center', width: '100%'}} marginBottom={2}>
        <AssetPreview value={value as CloudinaryAsset} />
      </Flex>

      <Grid gap={1} style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}>
        <Button
          disabled={readOnly}
          mode="ghost"
          title="Select an asset"
          tone="default"
          onClick={openMediaSelector}
          text="Select…"
        />
        <Button
          disabled={readOnly || !value}
          tone="critical"
          mode="ghost"
          title="Remove asset"
          text="Remove"
          onClick={removeValue}
        />
      </Grid>
    </Stack>
  )
}

export default WidgetInput
