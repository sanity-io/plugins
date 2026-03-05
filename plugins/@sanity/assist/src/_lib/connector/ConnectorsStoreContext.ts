import {createContext} from 'react'

import type {ConnectorsStore} from './ConnectorsStore'

export const ConnectorsStoreContext = createContext<ConnectorsStore | null>(null)
