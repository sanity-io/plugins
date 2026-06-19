/**
 * Labeled text input with arrow-key stepping and drag-to-change support.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/EditableInput.js | react-color's EditableInput}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 *
 * @remarks
 * Kept as a class component for this round; converting to a function component
 * (with `useId`, `useRef`, etc.) is deferred to a follow-up PR. `reactcss` and
 * `prop-types` have been removed, and deprecated `keyCode` checks replaced with
 * `event.key`.
 */
import {Component} from 'react'
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
} from 'react'

import type {EditableInputStyles} from './types'

const DEFAULT_ARROW_OFFSET = 1

const getNumberValue = (value: string | number): number => Number(String(value).replace(/%/g, ''))

let idCounter = 1

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

interface EditableInputState {
  value: string
  blurValue: string
}

export class EditableInput extends Component<EditableInputProps, EditableInputState> {
  private readonly inputId: string
  private input: HTMLInputElement | null = null

  constructor(props: EditableInputProps) {
    super(props)
    const initialValue = String(props.value).toUpperCase()
    this.state = {value: initialValue, blurValue: initialValue}
    this.inputId = `rc-editable-input-${idCounter++}`
  }

  override componentDidUpdate(prevProps: EditableInputProps, prevState: EditableInputState): void {
    if (
      this.props.value !== this.state.value &&
      (prevProps.value !== this.props.value || prevState.value !== this.state.value)
    ) {
      const nextValue = String(this.props.value).toUpperCase()
      const isFocused = this.input === document.activeElement
      // Sync the controlled value into local state, but only when the input is
      // not focused so we don't clobber what the user is typing. This needs a
      // post-update `activeElement` check that `getDerivedStateFromProps` can't do.
      // oxlint-disable-next-line react/no-did-update-set-state
      this.setState(
        isFocused
          ? {blurValue: nextValue}
          : {value: nextValue, blurValue: this.state.blurValue ? '' : nextValue},
      )
    }
  }

  override componentWillUnmount(): void {
    this.unbindEventListeners()
  }

  private readonly setInputRef = (input: HTMLInputElement | null): void => {
    this.input = input
  }

  private readonly getValueObjectWithLabel = (value: string | number): Record<string, string> => {
    return {[this.props.label]: String(value)}
  }

  private readonly getArrowOffset = (): number => this.props.arrowOffset ?? DEFAULT_ARROW_OFFSET

  private readonly setUpdatedValue = (value: string | number, event: EditableInputEvent): void => {
    this.props.onChange?.(this.getValueObjectWithLabel(value), event)
    this.setState({value: String(value)})
  }

  private readonly handleBlur = (): void => {
    if (this.state.blurValue) {
      this.setState({value: this.state.blurValue, blurValue: ''})
    }
  }

  private readonly handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.setUpdatedValue(event.target.value, event)
  }

  private readonly handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    // If `event.target.value` is a percentage, drop the `%` before stepping.
    // https://github.com/casesandberg/react-color/issues/383
    const value = getNumberValue(event.currentTarget.value)
    const isUp = event.key === 'ArrowUp'
    const isDown = event.key === 'ArrowDown'
    if (!Number.isNaN(value) && (isUp || isDown)) {
      const offset = this.getArrowOffset()
      const updatedValue = isUp ? value + offset : value - offset
      this.setUpdatedValue(updatedValue, event)
    }
  }

  private readonly handleDrag = (event: MouseEvent): void => {
    if (!this.props.dragLabel) {
      return
    }
    const {dragMax, value} = this.props
    const numericValue = typeof value === 'number' ? value : Number(value)
    const newValue = Math.round(numericValue + event.movementX)
    if (dragMax !== undefined && newValue >= 0 && newValue <= dragMax) {
      this.props.onChange?.(this.getValueObjectWithLabel(newValue), event)
    }
  }

  private readonly handleMouseDown = (event: React.MouseEvent<HTMLLabelElement>): void => {
    if (!this.props.dragLabel) {
      return
    }
    event.preventDefault()
    this.handleDrag(event.nativeEvent)
    window.addEventListener('mousemove', this.handleDrag)
    window.addEventListener('mouseup', this.handleMouseUp)
  }

  private readonly handleMouseUp = (): void => {
    this.unbindEventListeners()
  }

  private readonly unbindEventListeners = (): void => {
    window.removeEventListener('mousemove', this.handleDrag)
    window.removeEventListener('mouseup', this.handleMouseUp)
  }

  override render(): ReactElement {
    const style = this.props.style ?? {}
    const wrapStyle: CSSProperties = {position: 'relative', ...style.wrap}
    const inputStyle: CSSProperties = {...style.input}
    const labelStyle: CSSProperties = {
      ...style.label,
      ...(this.props.dragLabel ? {cursor: 'ew-resize'} : null),
    }

    return (
      <div style={wrapStyle}>
        <input
          id={this.inputId}
          style={inputStyle}
          ref={this.setInputRef}
          value={this.state.value}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          placeholder={this.props.placeholder}
          spellCheck="false"
        />
        {this.props.label && !this.props.hideLabel ? (
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the label is a drag affordance using pointer coordinates; the input also supports arrow-key stepping
          <label htmlFor={this.inputId} style={labelStyle} onMouseDown={this.handleMouseDown}>
            {this.props.label}
          </label>
        ) : null}
      </div>
    )
  }
}
