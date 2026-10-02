import {ImageIcon} from '@sanity/icons/Image'
import type {ButtonProps} from '@sanity/ui'
import {useRef} from 'react'

import {TooltipButton} from './TooltipButton'

/**
 * The file picker for an image, as a hidden file input that a button or menu
 * item clicks: the chosen file goes to `onFile`, and nowhere else — nothing
 * is uploaded.
 *
 * @internal
 */
export function ImageFileInput({
  onFile,
  ref,
}: {
  onFile: (file: File) => void
  ref: React.Ref<HTMLInputElement>
}) {
  return (
    <input
      accept="image/*"
      hidden
      onChange={(event) => {
        const file = event.currentTarget.files?.[0]

        // Picking the same file again should work, so the input forgets it
        event.currentTarget.value = ''

        if (file) onFile(file)
      }}
      ref={ref}
      type="file"
    />
  )
}

/**
 * A button that opens the file picker for an image, and hands the chosen file
 * over.
 *
 * @internal
 */
export function ImageFileButton(
  props: {onFile: (file: File) => void; tooltip: string} & Pick<
    ButtonProps,
    'disabled' | 'loading' | 'mode' | 'padding' | 'text' | 'width'
  >,
) {
  const {onFile, ...buttonProps} = props
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <TooltipButton {...buttonProps} icon={ImageIcon} onClick={() => inputRef.current?.click()} />
      <ImageFileInput onFile={onFile} ref={inputRef} />
    </>
  )
}
