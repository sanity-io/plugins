import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {Button, Text} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {useEffect, useRef, useState} from 'react'

import {usePortalPopoverProps} from '../../hooks/usePortalPopoverProps'

type Props = {
  disabled?: boolean
  url: string
}

const ButtonAssetCopy = ({disabled, url}: Props) => {
  const popoverProps = usePortalPopoverProps()
  const refPopoverTimeout = useRef<ReturnType<typeof window.setTimeout>>(null)
  const [popoverVisible, setPopoverVisible] = useState(false)

  const handleClick = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        if (refPopoverTimeout.current) {
          clearTimeout(refPopoverTimeout.current)
        }

        setPopoverVisible(true)
        refPopoverTimeout.current = setTimeout(() => {
          setPopoverVisible(false)
        }, 1250)
      },
      (err: unknown) => {
        console.error('[sanity-plugin-media] Failed to copy URL:', err)
      },
    )
  }

  // Effects
  useEffect(() => {
    return () => {
      if (refPopoverTimeout.current) {
        clearTimeout(refPopoverTimeout.current)
      }
    }
  }, [])

  return (
    <Popover
      content={
        <Text muted size={1}>
          Copied!
        </Text>
      }
      open={popoverVisible}
      padding={2}
      placement="top"
      radius={1}
      {...popoverProps}
    >
      <Button
        disabled={disabled}
        fontSize={1}
        icon={ClipboardIcon}
        mode="ghost"
        onClick={handleClick}
        text="Copy URL"
      />
    </Popover>
  )
}

export default ButtonAssetCopy
