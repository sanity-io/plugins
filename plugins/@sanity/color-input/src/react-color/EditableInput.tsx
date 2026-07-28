/**
 * Labeled text input with arrow-key stepping and drag-to-change support.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/EditableInput.js | react-color's EditableInput}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 */
import {
  startTransition,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
} from 'react'

import {useDrag} from './helpers/useDrag'
import type {EditableInputStyles} from './types'

const DEFAULT_ARROW_OFFSET = 1

const getNumberValue = (value: string | number): number => Number(String(value).replace(/%/g, ''))

const normalizeDisplayValue = (value: string | number | undefined): string =>
  String(value ?? '').toUpperCase()

type EditableInputEvent =
  | ChangeEvent<HTMLInputElement>
  | ReactKeyboardEvent<HTMLInputElement>
  | MouseEvent

export interface EditableInputProps {
  label: string
  value?: string | number | undefined
  style?: EditableInputStyles | undefined
  arrowOffset?: number | undefined
  placeholder?: string | undefined
  hideLabel?: boolean | undefined
  dragLabel?: boolean | undefined
  dragMax?: number | undefined
  onChange?: ((value: Record<string, string>, event: EditableInputEvent) => void) | undefined
}

export function EditableInput({
  label,
  value: valueProp,
  style,
  arrowOffset,
  placeholder,
  hideLabel,
  dragLabel,
  dragMax,
  onChange,
}: EditableInputProps): ReactElement {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const labelRef = useRef<HTMLLabelElement | null>(null)
  const initialValue = normalizeDisplayValue(valueProp)
  const [inputValue, setInputValue] = useState(initialValue)
  const [blurValue, setBlurValue] = useState(initialValue)

  useEffect(() => {
    const nextValue = normalizeDisplayValue(valueProp)
    if (nextValue === inputValue) {
      // The prop caught up with what's displayed — drop any blur-sync value
      // captured from an older prop so blur doesn't restore it.
      startTransition(() => {
        setBlurValue('')
      })
      return
    }

    const isFocused = inputRef.current === document.activeElement

    if (isFocused) {
      setBlurValue(nextValue)
      return
    }

    setInputValue(nextValue)
    setBlurValue((currentBlurValue) => (currentBlurValue ? '' : nextValue))
  }, [inputValue, valueProp])

  const handleBlur = () => {
    if (blurValue) {
      // Restore from the prop rather than the stored value: the transition
      // that clears a stale `blurValue` may not have committed yet, but
      // `valueProp` is always current — so a value the parent already
      // accepted is never rolled back.
      setInputValue(normalizeDisplayValue(valueProp))
      setBlurValue('')
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const {value} = event.target
    onChange?.({[label]: value}, event)
    setInputValue(value)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    const numericValue = getNumberValue(event.currentTarget.value)
    const isUp = event.key === 'ArrowUp'
    const isDown = event.key === 'ArrowDown'
    if (!Number.isNaN(numericValue) && (isUp || isDown)) {
      const offset = arrowOffset ?? DEFAULT_ARROW_OFFSET
      const updatedValue = isUp ? numericValue + offset : numericValue - offset
      onChange?.({[label]: String(updatedValue)}, event)
      setInputValue(String(updatedValue))
    }
  }

  const handleDrag = (event: MouseEvent) => {
    if (!dragLabel) {
      return
    }
    const numericValue = typeof valueProp === 'number' ? valueProp : Number(valueProp)
    const newValue = Math.round(numericValue + event.movementX)
    if (dragMax !== undefined && newValue >= 0 && newValue <= dragMax) {
      onChange?.({[label]: String(newValue)}, event)
    }
  }

  const showLabel = Boolean(label && !hideLabel)

  useDrag(labelRef, {
    enabled: showLabel,
    onDragStart: (event) => {
      if (!dragLabel) {
        return false
      }
      event.preventDefault()
      handleDrag(event)
      return true
    },
    onDrag: handleDrag,
  })

  const resolvedStyle = style ?? {}
  const wrapStyle: CSSProperties = {position: 'relative', ...resolvedStyle.wrap}
  const inputStyle: CSSProperties = {...resolvedStyle.input}
  const labelStyle: CSSProperties = {
    ...resolvedStyle.label,
    ...(dragLabel ? {cursor: 'ew-resize'} : null),
  }

  return (
    <div style={wrapStyle}>
      <input
        id={inputId}
        style={inputStyle}
        ref={inputRef}
        value={inputValue}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        spellCheck="false"
      />
      {showLabel ? (
        <label htmlFor={inputId} ref={labelRef} style={labelStyle}>
          {label}
        </label>
      ) : null}
    </div>
  )
}
