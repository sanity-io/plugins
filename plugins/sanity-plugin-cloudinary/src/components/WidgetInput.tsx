import {PlugIcon} from '@sanity/icons/Plug'
import {Button, Flex, Grid, Stack} from '@sanity/ui'
import {useCallback} from 'react'
import {type ObjectInputProps, PatchEvent, unset} from 'sanity'

import type {CloudinaryAsset} from '../types'
import AssetPreview from './AssetPreview'

import * as styles from './WidgetInput.module.css'

type WidgetInputProps = ObjectInputProps & {openMediaSelector: () => void; onSetup: () => void}

const WidgetInput = (props: WidgetInputProps) => {
  const {onChange, readOnly, value, openMediaSelector} = props

  const removeValue = useCallback(() => {
    onChange(PatchEvent.from([unset()]))
  }, [onChange])

  return (
    <Stack>
      <div className={styles.setupButtonContainer}>
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
      </div>

      <Flex className={styles.previewFlex} marginBottom={2}>
        <AssetPreview value={value as CloudinaryAsset} />
      </Flex>

      <Grid className={styles.actionGrid} gap={1}>
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
