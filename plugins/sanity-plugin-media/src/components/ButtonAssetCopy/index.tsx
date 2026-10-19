import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {Button} from '@sanity/ui'
import copy from 'copy-to-clipboard'
import {useEffect, useRef, useState} from 'react'

type Props = {
  disabled?: boolean
  label?: string
  value: string
}

const ButtonAssetCopy = ({disabled, label = 'Copy URL', value}: Props) => {
  const refCopiedTimeout = useRef<ReturnType<typeof window.setTimeout>>(null)
  const [copied, setCopied] = useState(false)

  const handleClick = () => {
    if (refCopiedTimeout.current) {
      clearTimeout(refCopiedTimeout.current)
    }

    setCopied(true)
    copy(value)

    refCopiedTimeout.current = setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (refCopiedTimeout.current) {
        clearTimeout(refCopiedTimeout.current)
      }
    }
  }, [])

  return (
    <Button
      disabled={disabled}
      fontSize={1}
      icon={ClipboardIcon}
      mode="ghost"
      onClick={handleClick}
      text={copied ? 'Copied!' : label}
    />
  )
}

export default ButtonAssetCopy
