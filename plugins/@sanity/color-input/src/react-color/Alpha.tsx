/**
 * Alpha (transparency) slider.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Alpha.js | react-color's Alpha}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 *
 * @remarks
 * Kept as a class component for this round (function-component conversion is a
 * follow-up PR). `reactcss` has been removed in favor of plain inline styles,
 * and the unused custom `pointer` slot dropped.
 */
import {Component} from 'react'
import type {CSSProperties, ReactElement} from 'react'

import {Checkboard} from './Checkboard'
import * as alpha from './helpers/alpha'
import type {
  AlphaColorResult,
  CheckboardRenderers,
  ColorChangeHandler,
  HSLColor,
  PickerEvent,
  RGBColor,
} from './types'

export interface AlphaProps {
  rgb: RGBColor
  hsl: HSLColor
  a?: number | undefined
  direction?: 'horizontal' | 'vertical' | undefined
  radius?: string | undefined
  shadow?: string | undefined
  renderers?: CheckboardRenderers | undefined
  onChange?: ColorChangeHandler<AlphaColorResult> | undefined
}

export class Alpha extends Component<AlphaProps> {
  private container: HTMLDivElement | null = null

  override componentWillUnmount(): void {
    this.unbindEventListeners()
  }

  private readonly setContainerRef = (node: HTMLDivElement | null): void => {
    this.container = node
  }

  private readonly handleChange = (event: PickerEvent): void => {
    if (!this.container) {
      return
    }
    const change = alpha.calculateChange(
      event,
      this.props.hsl,
      this.props.direction,
      this.props.a,
      this.container,
    )
    if (change && typeof this.props.onChange === 'function') {
      this.props.onChange(change)
    }
  }

  private readonly handleMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
    this.handleChange(event.nativeEvent)
    window.addEventListener('mousemove', this.handleChange)
    window.addEventListener('mouseup', this.handleMouseUp)
  }

  private readonly handleMouseUp = (): void => {
    this.unbindEventListeners()
  }

  private readonly unbindEventListeners = (): void => {
    window.removeEventListener('mousemove', this.handleChange)
    window.removeEventListener('mouseup', this.handleMouseUp)
  }

  override render(): ReactElement {
    const {rgb, direction, radius, shadow, renderers} = this.props
    const alphaValue = rgb.a ?? 1
    const gradient =
      direction === 'vertical'
        ? `linear-gradient(to bottom, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%, rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`
        : `linear-gradient(to right, rgba(${rgb.r},${rgb.g},${rgb.b}, 0) 0%, rgba(${rgb.r},${rgb.g},${rgb.b}, 1) 100%)`
    const pointerStyle: CSSProperties =
      direction === 'vertical'
        ? {position: 'absolute', left: 0, top: `${alphaValue * 100}%`}
        : {position: 'absolute', left: `${alphaValue * 100}%`}

    return (
      <div style={{position: 'absolute', inset: 0, borderRadius: radius}}>
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: radius}}>
          <Checkboard renderers={renderers} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: gradient,
            boxShadow: shadow,
            borderRadius: radius,
          }}
        />
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the slider surface is dragged via pointer coordinates, which have no keyboard equivalent */}
        <div
          style={{position: 'relative', height: '100%', margin: '0 3px'}}
          ref={this.setContainerRef}
          onMouseDown={this.handleMouseDown}
          onTouchMove={this.handleChange}
          onTouchStart={this.handleChange}
        >
          <div style={pointerStyle}>
            <div
              style={{
                width: '4px',
                borderRadius: '1px',
                height: '8px',
                boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
                background: '#fff',
                marginTop: '1px',
                transform: 'translateX(-2px)',
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}
