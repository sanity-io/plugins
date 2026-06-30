import {expect, test} from 'vitest'

import {getGeopointStaticMapUrl} from './staticMapUrl'

const API_KEY = 'test-key'
const value = {lat: 59.91273, lng: 10.74609}

function zoomOf(url: string): string | null {
  return new URL(url).searchParams.get('zoom')
}

test('getGeopointStaticMapUrl defaults to zoom 13', () => {
  expect(zoomOf(getGeopointStaticMapUrl(value, API_KEY))).toBe('13')
})

test('getGeopointStaticMapUrl persists a saved zoom (saveZoom)', () => {
  expect(zoomOf(getGeopointStaticMapUrl(value, API_KEY, {zoom: 5}))).toBe('5')
})

test('getGeopointStaticMapUrl falls back to the default when zoom is undefined', () => {
  expect(zoomOf(getGeopointStaticMapUrl(value, API_KEY, {zoom: undefined}))).toBe('13')
})
