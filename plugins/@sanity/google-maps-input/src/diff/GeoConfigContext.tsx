import {createContext, useContext} from 'react'
import type {LayoutProps} from 'sanity'

import type {GoogleMapsInputConfig} from '../types'

const GeoConfigContext = createContext<GoogleMapsInputConfig | null>(null)

/**
 * Diff components are resolved by the Studio outside of the form, so they can't
 * receive the plugin config as a prop the way the inputs do. The plugin installs
 * this provider at the Studio layout level so diff previews can read the API key.
 */
export function useGeoConfig(): GoogleMapsInputConfig | null {
  return useContext(GeoConfigContext)
}

export function createGeoConfigLayout(config: GoogleMapsInputConfig) {
  return function GeoConfigLayout(props: LayoutProps) {
    return (
      <GeoConfigContext.Provider value={config}>
        {props.renderDefault(props)}
      </GeoConfigContext.Provider>
    )
  }
}
