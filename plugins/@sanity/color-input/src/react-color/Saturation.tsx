/**
 * Saturation / value box.
 *
 * Forked from
 * {@link https://github.com/casesandberg/react-color/blob/v2.19.3/src/components/common/Saturation.js | react-color's Saturation}
 * (MIT, Copyright (c) 2015 Case Sandberg). See the plugin LICENSE.
 *
 * @remarks
 * Kept as a class component for this round (function-component conversion is a
 * follow-up PR). The upstream raw `<style>` tag holding the static white/black
 * gradients has been replaced with `styled-components` elements, `reactcss`
 * removed, and `lodash` swapped for `lodash-es`.
 */
import throttle from 'lodash-es/throttle'
import {Component} from 'react'
import type {CSSProperties, ReactElement} from 'react'
import {styled} from 'styled-components'

import * as saturation from './helpers/saturation'
import type {
  ColorChangeHandler,
  HSLColor,
  HSVColor,
  PickerEvent,
  SaturationColorResult,
} from './types'

type ThrottledChange = ReturnType<
  typeof throttle<
    (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult) => void
  >
>

const SaturationWhite = styled.div`
  background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
`

const SaturationBlack = styled.div`
  background: linear-gradient(to top, #000, rgba(0, 0, 0, 0));
`

export interface SaturationProps {
  hsl: HSLColor
  hsv: HSVColor
  radius?: string | undefined
  shadow?: string | undefined
  onChange?: ColorChangeHandler<SaturationColorResult> | undefined
}

export class Saturation extends Component<SaturationProps> {
  private container: HTMLDivElement | null = null

  private readonly throttle: ThrottledChange = throttle(
    (handler: ColorChangeHandler<SaturationColorResult>, data: SaturationColorResult): void => {
      handler(data)
    },
    50,
  )

  override componentWillUnmount(): void {
    this.throttle.cancel()
    this.unbindEventListeners()
  }

  private readonly setContainerRef = (node: HTMLDivElement | null): void => {
    this.container = node
  }

  private getContainerRenderWindow(): Window {
    const {container} = this
    let renderWindow: Window = window
    while (!renderWindow.document.contains(container) && renderWindow.parent !== renderWindow) {
      renderWindow = renderWindow.parent
    }
    return renderWindow
  }

  private readonly handleChange = (event: PickerEvent): void => {
    if (!this.container || typeof this.props.onChange !== 'function') {
      return
    }
    this.throttle(
      this.props.onChange,
      saturation.calculateChange(event, this.props.hsl, this.container),
    )
  }

  private readonly handleMouseDown = (event: React.MouseEvent<HTMLDivElement>): void => {
    this.handleChange(event.nativeEvent)
    const renderWindow = this.getContainerRenderWindow()
    renderWindow.addEventListener('mousemove', this.handleChange)
    renderWindow.addEventListener('mouseup', this.handleMouseUp)
  }

  private readonly handleMouseUp = (): void => {
    this.unbindEventListeners()
  }

  private readonly unbindEventListeners = (): void => {
    const renderWindow = this.getContainerRenderWindow()
    renderWindow.removeEventListener('mousemove', this.handleChange)
    renderWindow.removeEventListener('mouseup', this.handleMouseUp)
  }

  override render(): ReactElement {
    const {hsl, hsv, radius, shadow} = this.props
    const pointerStyle: CSSProperties = {
      position: 'absolute',
      top: `${-(hsv.v * 100) + 100}%`,
      left: `${hsv.s * 100}%`,
      cursor: 'default',
    }

    return (
      // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the picker surface is dragged via pointer coordinates, which have no keyboard equivalent
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `hsl(${hsl.h},100%, 50%)`,
          borderRadius: radius,
        }}
        ref={this.setContainerRef}
        onMouseDown={this.handleMouseDown}
        onTouchMove={this.handleChange}
        onTouchStart={this.handleChange}
      >
        <SaturationWhite style={{position: 'absolute', inset: 0, borderRadius: radius}}>
          <SaturationBlack
            style={{position: 'absolute', inset: 0, boxShadow: shadow, borderRadius: radius}}
          />
          <div style={pointerStyle}>
            <div
              style={{
                width: '4px',
                height: '4px',
                boxShadow:
                  '0 0 0 1.5px #fff, inset 0 0 1px 1px rgba(0,0,0,.3), 0 0 1px 2px rgba(0,0,0,.4)',
                borderRadius: '50%',
                cursor: 'hand',
                transform: 'translate(-2px, -2px)',
              }}
            />
          </div>
        </SaturationWhite>
      </div>
    )
  }
}
