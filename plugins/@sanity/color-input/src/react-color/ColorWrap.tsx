/**
 * `CustomPicker` higher-order component: manages color state and injects the
 * normalized color (`hsl`/`hsv`/`rgb`/`hex`) plus an `onChange` handler into the
 * wrapped picker.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/ColorWrap.js | react-color's ColorWrap}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 *
 * @remarks
 * Kept as a class component for this round (function-component conversion is a
 * follow-up PR). `prop-types` and the unused `lodash` `debounce` of
 * `onChangeComplete` have been removed.
 */
import {PureComponent} from 'react'
import type {ComponentType, ReactElement} from 'react'

import {simpleCheckForValidColor, toState} from './helpers/color'
import type {Color, ColorState, CustomPickerInjectedProps, CustomPickerProps} from './types'

type Diff<T, U> = Pick<T, Exclude<keyof T, keyof U>>

const DEFAULT_COLOR: Color = {h: 250, s: 0.5, l: 0.2, a: 1}

export function CustomPicker<A extends object>(
  Picker: ComponentType<A & CustomPickerInjectedProps>,
): ComponentType<Diff<A, CustomPickerProps> & CustomPickerProps> {
  type OuterProps = Diff<A, CustomPickerProps> & CustomPickerProps

  class ColorPicker extends PureComponent<OuterProps, ColorState> {
    static getDerivedStateFromProps(nextProps: CustomPickerProps, state: ColorState): ColorState {
      return {...toState(nextProps.color ?? DEFAULT_COLOR, state.oldHue)}
    }

    constructor(props: OuterProps) {
      super(props)
      this.state = {...toState(props.color ?? DEFAULT_COLOR, 0)}
    }

    private readonly handleChange = (data: Color): void => {
      if (!simpleCheckForValidColor(data)) {
        return
      }
      const incomingHue = typeof data === 'string' ? undefined : 'h' in data ? data.h : undefined
      const colors = toState(data, incomingHue || this.state.oldHue)
      this.setState(colors)
      this.props.onChange?.(colors)
    }

    override render(): ReactElement {
      const injected: CustomPickerInjectedProps = {
        hsl: this.state.hsl,
        hsv: this.state.hsv,
        rgb: this.state.rgb,
        hex: this.state.hex,
        oldHue: this.state.oldHue,
        source: this.state.source,
        onChange: this.handleChange,
      }
      // The merged props satisfy the wrapped picker's contract at runtime, but the
      // generic `Diff` plumbing can't be expressed to the type-checker.
      // oxlint-disable-next-line no-unsafe-type-assertion
      const pickerProps = {...this.props, ...injected} as A & CustomPickerInjectedProps
      return <Picker {...pickerProps} />
    }
  }

  return ColorPicker
}
