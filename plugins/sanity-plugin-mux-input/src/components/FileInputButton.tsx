import {Button, type ButtonProps} from '@sanity/ui'
import {useCallback, useId, useRef} from 'react'

import {hiddenInput, label} from './FileInputButton.css'

export interface FileInputButtonProps extends Omit<ButtonProps, 'onSelect'> {
  onSelect: (files: FileList) => void
  accept: string
}
export const FileInputButton = ({onSelect, accept, ...props}: FileInputButtonProps) => {
  const inputId = `FileSelect${useId()}`
  const inputRef = useRef<HTMLInputElement>(null)
  const handleSelect = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      if (onSelect) {
        onSelect(event.target.files!)
      }
    },
    [onSelect],
  )
  const handleButtonClick = useCallback(() => inputRef.current?.click(), [])
  return (
    <label className={label} htmlFor={inputId}>
      <input
        className={hiddenInput}
        accept={accept}
        ref={inputRef}
        tabIndex={0}
        type="file"
        id={inputId}
        onChange={handleSelect}
        value=""
      />
      <Button
        onClick={handleButtonClick}
        mode="default"
        tone="primary"
        style={{width: '100%'}}
        {...props}
      />
    </label>
  )
}
