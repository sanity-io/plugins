// oxlint-disable typescript/no-deprecated - legacy Mux plugin patterns pending migration

import {Box, type ButtonProps, Flex, Text} from '@sanity/ui'
import {isValidElement, useId, forwardRef, useCallback} from 'react'
import {isValidElementType} from 'react-is'

import {FileButton} from './FileInputMenuItem.styled'

export interface FileInputMenuItemProps extends ButtonProps {
  accept?: string
  capture?: 'user' | 'environment'
  multiple?: boolean
  onSelect?: (files: File[]) => void
  disabled?: boolean
}

export const FileInputMenuItem = forwardRef(function FileInputMenuItem(
  props: FileInputMenuItemProps &
    Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'ref' | 'type' | 'value' | 'onSelect'>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    icon: Icon,
    id: idProp,
    accept,
    capture,
    fontSize,
    multiple,
    onSelect,
    space = 3,
    textAlign,
    text,
    disabled,
    ...rest
  } = props
  const idHook = useId()
  const id = idProp || idHook

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onSelect && event.target.files) {
        onSelect(Array.from(event.target.files))
      }
    },
    [onSelect],
  )

  const content = (
    <Flex align="center" justify="flex-start">
      {/* Icon */}
      {Icon && (
        <Box marginRight={text ? space : undefined}>
          <Text size={fontSize}>
            {isValidElement(Icon) && Icon}
            {isValidElementType(Icon) && <Icon />}
          </Text>
        </Box>
      )}

      {/* Text */}
      {text && (
        <Text align={textAlign} size={fontSize} textOverflow="ellipsis">
          {text}
        </Text>
      )}
    </Flex>
  )

  return (
    <FileButton {...rest} htmlFor={id} disabled={disabled} ref={forwardedRef}>
      {content}

      {/* Visibly hidden input */}
      <input
        data-testid="file-button-input"
        accept={accept}
        capture={capture}
        id={id}
        multiple={multiple}
        onChange={handleChange}
        type="file"
        value=""
        disabled={disabled}
      />
    </FileButton>
  )
})
