import {createContext} from 'react'

import type {GoogleMapsInputConfig} from '../types'

/**
 * Diff components are resolved by the Studio outside of the form, so they can't
 * receive the plugin config as a prop the way the inputs do. The plugin installs
 * this provider at the Studio layout level so diff previews can read the API key.
 */
export const GoogleMapsInputContext = createContext<GoogleMapsInputConfig | null>(null)
GoogleMapsInputContext.displayName = 'GoogleMapsInputContext'
