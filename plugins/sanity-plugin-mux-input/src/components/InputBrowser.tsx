import {Dialog} from '@sanity/ui'
import {clsx} from 'clsx/lite'
import {type ComponentProps, useCallback, useId} from 'react'

import type {SetDialogState} from '../hooks/useDialogState'
import SelectAsset, {type Props as SelectAssetProps} from './SelectAsset'

import {fullHeightDialog} from './InputBrowser.css'

function StyledDialog({className, ...props}: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} className={clsx(fullHeightDialog, className)} />
}

export default function InputBrowser({
  setDialogState,
  asset,
  onChange,
  config,
}: Pick<SelectAssetProps, 'onChange' | 'asset' | 'config'> & {
  setDialogState: SetDialogState
}) {
  const id = `InputBrowser${useId()}`
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  return (
    <StyledDialog
      __unstable_autoFocus
      header="Select video"
      id={id}
      onClose={handleClose}
      width={2}
    >
      <SelectAsset
        config={config}
        asset={asset}
        onChange={onChange}
        setDialogState={setDialogState}
      />
    </StyledDialog>
  )
}
