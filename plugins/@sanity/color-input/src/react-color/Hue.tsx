/**
 * Hue slider.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Hue.js | react-color's Hue}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 *
 * @remarks
 * Kept as a class component for this round (function-component conversion is a
 * follow-up PR). The upstream raw `<style>` tag holding the static hue gradient
 * has been replaced with a `styled-components` element, and `reactcss` removed.
 */
import {Component, createRef, type CSSProperties, type ReactElement} from 'react'
import {styled} from 'styled-components'

import * as hue from './helpers/hue'
import type {ColorChangeHandler, HSLColor, HueColorResult, PickerEvent} from './types'

const HueGradient = styled.div<{$direction: 'horizontal' | 'vertical'}>`
  background: ${({$direction}) =>
    $direction === 'vertical'
      ? 'linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
      : 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'};
`

export interface HueProps {
  hsl: HSLColor
  direction?: 'horizontal' | 'vertical' | undefined
  radius?: string | undefined
  shadow?: string | undefined
  onChange?: ColorChangeHandler<HueColorResult> | undefined
}

export class Hue extends Component<HueProps> {
  private containerRef = createRef<HTMLDivElement | null>()
  private abortControllerRef = createRef<AbortController | null>()

  override componentWillUnmount(): void {
    this.abortControllerRef.current?.abort()
  }

  private readonly handleChange = (event: PickerEvent): void => {
    if (!this.containerRef.current) {
      return
    }
    const change = hue.calculateChange(
      event,
      this.props.direction,
      this.props.hsl,
      this.containerRef.current,
    )
    if (change && typeof this.props.onChange === 'function') {
      this.props.onChange(change)
    }
  }

  private readonly handleMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
    this.handleChange(event.nativeEvent)
    if (this.abortControllerRef.current) {
      this.abortControllerRef.current.abort()
    }
    this.abortControllerRef.current = new AbortController()
    const {signal} = this.abortControllerRef.current
    window.addEventListener('mousemove', this.handleChange, {signal})
    window.addEventListener('mouseup', this.handleMouseUp, {signal})
  }

  private readonly handleMouseUp = (): void => {
    this.abortControllerRef.current?.abort()
  }

  override render(): ReactElement {
    const {hsl, direction = 'horizontal', radius, shadow} = this.props
    const pointerStyle: CSSProperties =
      direction === 'vertical'
        ? {position: 'absolute', left: '0px', top: `${-((hsl.h * 100) / 360) + 100}%`}
        : {position: 'absolute', left: `${(hsl.h * 100) / 360}%`}

    return (
      <div style={{position: 'absolute', inset: 0, borderRadius: radius, boxShadow: shadow}}>
        <HueGradient
          $direction={direction}
          style={{padding: '0 2px', position: 'relative', height: '100%', borderRadius: radius}}
          ref={this.containerRef}
          onMouseDown={this.handleMouseDown}
          onTouchMove={this.handleChange}
          onTouchStart={this.handleChange}
        >
          <div style={pointerStyle}>
            <div
              style={{
                marginTop: '1px',
                width: '4px',
                borderRadius: '1px',
                height: '8px',
                boxShadow: '0 0 2px rgba(0, 0, 0, .6)',
                background: '#fff',
                transform: 'translateX(-2px)',
              }}
            />
          </div>
        </HueGradient>
      </div>
    )
  }
}
