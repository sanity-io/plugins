import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, render} from '@testing-library/react'
import type {ReactNode} from 'react'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {Arrow} from './Arrow'
import {GoogleMap} from './Map'
import {Marker} from './Marker'
import {SearchInput} from './SearchInput'

type Spy = ReturnType<typeof vi.fn>

interface MockMarker {
  opts: Record<string, unknown>
  setPosition: Spy
  setLabel: Spy
  setZIndex: Spy
  setOpacity: Spy
  setMap: Spy
}

interface MockPolyline {
  opts: Record<string, unknown>
  setPath: Spy
  setMap: Spy
}

interface MockMap {
  opts: Record<string, unknown>
  panTo: Spy
  fitBounds: Spy
}

interface MockAutocomplete {
  getPlace: Spy
}

interface CapturedListener {
  instance: unknown
  event: string
  handler: (...args: unknown[]) => void
  remove: Spy
}

function createMockApi() {
  const markerInstances: MockMarker[] = []
  const polylineInstances: MockPolyline[] = []
  const mapInstances: MockMap[] = []
  const autocompleteInstances: MockAutocomplete[] = []
  const listeners: CapturedListener[] = []

  const event = {
    addListener: vi.fn(
      (instance: unknown, eventName: string, handler: (...args: unknown[]) => void) => {
        const remove = vi.fn()
        listeners.push({instance, event: eventName, handler, remove})
        return {remove}
      },
    ),
  }

  // Regular function expressions (not arrow functions) so they can be used with `new`.
  const MarkerCtor = vi.fn(function (opts: Record<string, unknown>): MockMarker {
    const instance: MockMarker = {
      opts,
      setPosition: vi.fn(),
      setLabel: vi.fn(),
      setZIndex: vi.fn(),
      setOpacity: vi.fn(),
      setMap: vi.fn(),
    }
    markerInstances.push(instance)
    return instance
  })

  const PolylineCtor = vi.fn(function (opts: Record<string, unknown>): MockPolyline {
    const instance: MockPolyline = {opts, setPath: vi.fn(), setMap: vi.fn()}
    polylineInstances.push(instance)
    return instance
  })

  const MapCtor = vi.fn(function (_element: unknown, opts: Record<string, unknown>): MockMap {
    const instance: MockMap = {opts, panTo: vi.fn(), fitBounds: vi.fn()}
    mapInstances.push(instance)
    return instance
  })

  const CircleCtor = vi.fn(function () {
    return {getBounds: vi.fn(() => ({}))}
  })

  const AutocompleteCtor = vi.fn(function (): MockAutocomplete {
    const instance: MockAutocomplete = {getPlace: vi.fn(() => ({name: 'Mock Place'}))}
    autocompleteInstances.push(instance)
    return instance
  })

  const PointCtor = vi.fn(function (x: number, y: number) {
    return {x, y}
  })
  const LatLngCtor = vi.fn(function (lat: number, lng: number) {
    return {lat, lng}
  })

  const api = {
    Marker: MarkerCtor,
    Polyline: PolylineCtor,
    Map: MapCtor,
    Circle: CircleCtor,
    Point: PointCtor,
    LatLng: LatLngCtor,
    SymbolPath: {FORWARD_OPEN_ARROW: 3},
    places: {Autocomplete: AutocompleteCtor},
    event,
  }

  return {
    api: api as unknown as typeof window.google.maps,
    markerInstances,
    polylineInstances,
    mapInstances,
    autocompleteInstances,
    listeners,
  }
}

function createMockMap() {
  return {getCenter: vi.fn(() => ({lat: () => 0, lng: () => 0}))} as unknown as google.maps.Map
}

function first<T>(instances: T[]): T {
  const [instance] = instances
  if (!instance) {
    throw new Error('Expected at least one instance to have been created')
  }
  return instance
}

function ThemeWrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={buildTheme()}>{children}</ThemeProvider>
}

afterEach(() => {
  cleanup()
})

describe('Marker', () => {
  test('creates a marker once on mount and removes it on unmount', () => {
    const {api, markerInstances} = createMockApi()
    const map = createMockMap()
    const markerRef = {current: undefined as google.maps.Marker | undefined}

    const {unmount} = render(
      <Marker api={api} map={map} position={{lat: 1, lng: 2}} markerRef={markerRef} />,
    )

    expect(api.Marker).toHaveBeenCalledTimes(1)
    expect(markerInstances).toHaveLength(1)
    expect(markerRef.current).toBe(markerInstances[0])

    unmount()

    expect(first(markerInstances).setMap).toHaveBeenCalledWith(null)
    expect(markerRef.current).toBeUndefined()
  })

  test('updates marker position imperatively without recreating it', () => {
    const {api, markerInstances} = createMockApi()
    const map = createMockMap()

    const {rerender} = render(<Marker api={api} map={map} position={{lat: 1, lng: 2}} />)
    expect(api.Marker).toHaveBeenCalledTimes(1)

    rerender(<Marker api={api} map={map} position={{lat: 3, lng: 4}} />)

    expect(api.Marker).toHaveBeenCalledTimes(1)
    expect(first(markerInstances).setPosition).toHaveBeenCalledWith({lat: 3, lng: 4})
  })

  test('creates a draggable marker and attaches a dragend listener when onMove is provided', () => {
    const {api, markerInstances, listeners} = createMockApi()
    const map = createMockMap()
    const onMove = vi.fn()

    render(<Marker api={api} map={map} position={{lat: 1, lng: 2}} onMove={onMove} />)

    expect(first(markerInstances).opts).toMatchObject({draggable: true})
    const dragend = listeners.find((listener) => listener.event === 'dragend')
    expect(dragend).toBeDefined()
    expect(dragend?.handler).toBe(onMove)
  })
})

describe('Arrow', () => {
  test('creates a polyline on mount and removes it on unmount', () => {
    const {api, polylineInstances} = createMockApi()
    const map = createMockMap()

    const {unmount} = render(
      <Arrow api={api} map={map} from={{lat: 1, lng: 1}} to={{lat: 2, lng: 2}} />,
    )

    expect(api.Polyline).toHaveBeenCalledTimes(1)
    expect(first(polylineInstances).opts).toMatchObject({
      path: [
        {lat: 1, lng: 1},
        {lat: 2, lng: 2},
      ],
    })

    unmount()

    expect(first(polylineInstances).setMap).toHaveBeenCalledWith(null)
  })

  test('recreates the polyline and cleans up the old one when endpoints change', () => {
    const {api, polylineInstances} = createMockApi()
    const map = createMockMap()

    const {rerender} = render(
      <Arrow api={api} map={map} from={{lat: 1, lng: 1}} to={{lat: 2, lng: 2}} />,
    )
    expect(api.Polyline).toHaveBeenCalledTimes(1)

    rerender(<Arrow api={api} map={map} from={{lat: 1, lng: 1}} to={{lat: 5, lng: 5}} />)

    expect(api.Polyline).toHaveBeenCalledTimes(2)
    expect(first(polylineInstances).setMap).toHaveBeenCalledWith(null)
  })
})

describe('GoogleMap', () => {
  test('constructs the map after mount and renders children with it', () => {
    const {api, mapInstances} = createMockApi()
    const renderChildren = vi.fn(() => <div data-testid="map-child" />)

    const {getByTestId} = render(
      <GoogleMap api={api} location={{lat: 10, lng: 20}}>
        {renderChildren}
      </GoogleMap>,
    )

    expect(api.Map).toHaveBeenCalledTimes(1)
    expect(mapInstances).toHaveLength(1)
    expect(renderChildren).toHaveBeenCalledWith(mapInstances[0])
    expect(getByTestId('map-child')).toBeInTheDocument()
  })

  test('pans to the new center when the location changes without reconstructing', () => {
    const {api, mapInstances} = createMockApi()

    const {rerender} = render(<GoogleMap api={api} location={{lat: 10, lng: 20}} />)
    expect(mapInstances).toHaveLength(1)

    rerender(<GoogleMap api={api} location={{lat: 30, lng: 40}} />)

    expect(first(mapInstances).panTo).toHaveBeenCalled()
    expect(api.Map).toHaveBeenCalledTimes(1)
  })

  test('attaches a click handler when onClick is provided', () => {
    const {api, listeners} = createMockApi()
    const onClick = vi.fn()

    render(<GoogleMap api={api} location={{lat: 10, lng: 20}} onClick={onClick} />)

    const click = listeners.find((listener) => listener.event === 'click')
    expect(click).toBeDefined()
    expect(click?.handler).toBe(onClick)
  })
})

describe('SearchInput', () => {
  test('initializes Places Autocomplete and always calls the latest onChange', () => {
    const {api, listeners} = createMockApi()
    const map = createMockMap()
    const onChangeInitial = vi.fn()

    const {rerender, getByPlaceholderText} = render(
      <ThemeWrapper>
        <SearchInput api={api} map={map} onChange={onChangeInitial} />
      </ThemeWrapper>,
    )

    expect(api.places.Autocomplete).toHaveBeenCalledTimes(1)
    expect(getByPlaceholderText('Search for place or address')).toBeInTheDocument()

    const placeChanged = listeners.find((listener) => listener.event === 'place_changed')
    expect(placeChanged).toBeDefined()

    const onChangeLatest = vi.fn()
    rerender(
      <ThemeWrapper>
        <SearchInput api={api} map={map} onChange={onChangeLatest} />
      </ThemeWrapper>,
    )

    // Autocomplete is set up once, not recreated on prop changes
    expect(api.places.Autocomplete).toHaveBeenCalledTimes(1)

    act(() => {
      placeChanged?.handler()
    })

    expect(onChangeInitial).not.toHaveBeenCalled()
    expect(onChangeLatest).toHaveBeenCalledWith({name: 'Mock Place'})
  })
})
