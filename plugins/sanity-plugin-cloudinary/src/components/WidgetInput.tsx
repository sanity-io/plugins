import {PlugIcon} from '@sanity/icons/Plug'
import {Button, Flex, Grid, Stack} from '@sanity/ui'
import {clsx} from 'clsx/lite'
import {type ComponentProps, useCallback} from 'react'
import {type ObjectInputProps, PatchEvent, unset} from 'sanity'

import type {CloudinaryAsset} from '../types'
import AssetPreview from './AssetPreview'

import {actionGrid, previewFlex, setupButtonContainer} from './WidgetInput.css'

function SetupButtonContainer({className, ...props}: ComponentProps<'div'>) {
  return <div {...props} className={clsx(setupButtonContainer, className)} />
}

function PreviewFlex({className, ...props}: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={clsx(previewFlex, className)} />
}

function ActionGrid({className, ...props}: ComponentProps<typeof Grid>) {
  return <Grid {...props} className={clsx(actionGrid, className)} />
}

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

      <PreviewFlex marginBottom={2}>
        <AssetPreview value={value as CloudinaryAsset} />
      </PreviewFlex>

      <ActionGrid gap={1}>
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
      </ActionGrid>
    </Stack>
  )
}

export default WidgetInput
