import {describe, expect, test, vi} from 'vitest'

import {GoogleMap} from './Map'

type GoogleMapProps = ConstructorParameters<typeof GoogleMap>[0]
type GoogleMapState = GoogleMap['state']

function createMap(props: Partial<GoogleMapProps>): GoogleMap {
  const fullProps = {
    location: {lat: 0, lng: 0},
    ...props,
  } as unknown as GoogleMapProps
  return new GoogleMap(fullProps)
}

function setMap(instance: GoogleMap, map: {getZoom: () => number | undefined}): void {
  instance.state = {map} as unknown as GoogleMapState
}

describe('GoogleMap zoom handling (saveZoom)', () => {
  test('forwards the current integer zoom to onZoomChange', () => {
    const onZoomChange = vi.fn()
    const instance = createMap({onZoomChange})
    setMap(instance, {getZoom: () => 7})

    instance.handleZoomChange()

    expect(onZoomChange).toHaveBeenCalledTimes(1)
    expect(onZoomChange).toHaveBeenCalledWith(7)
  })

  test('ignores non-integer zoom values', () => {
    const onZoomChange = vi.fn()
    const instance = createMap({onZoomChange})
    setMap(instance, {getZoom: () => undefined})

    instance.handleZoomChange()

    expect(onZoomChange).not.toHaveBeenCalled()
  })

  test('attaches a zoom_changed listener when onZoomChange is provided', () => {
    const addListener = vi.fn<
      (target: unknown, event: string, handler: unknown) => {remove: () => void}
    >(() => ({remove: vi.fn()}))
    const onClick = vi.fn()
    const onZoomChange = vi.fn()
    const map = {getZoom: () => 5}
    const instance = createMap({
      api: {event: {addListener}} as unknown as GoogleMapProps['api'],
      onClick,
      onZoomChange,
    })
    setMap(instance, map)

    instance.attachClickHandler()

    expect(addListener).toHaveBeenCalledWith(map, 'click', onClick)
    expect(addListener).toHaveBeenCalledWith(map, 'zoom_changed', instance.handleZoomChange)
  })

  test('does not attach a zoom listener when onZoomChange is omitted', () => {
    const addListener = vi.fn<
      (target: unknown, event: string, handler: unknown) => {remove: () => void}
    >(() => ({remove: vi.fn()}))
    const instance = createMap({
      api: {event: {addListener}} as unknown as GoogleMapProps['api'],
      onClick: vi.fn(),
    })
    setMap(instance, {getZoom: () => 5})

    instance.attachClickHandler()

    const listenedEvents = addListener.mock.calls.map((call) => call[1])
    expect(listenedEvents).not.toContain('zoom_changed')
  })
})
