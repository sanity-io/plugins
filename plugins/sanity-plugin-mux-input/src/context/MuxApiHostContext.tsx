import {createContext, useContext} from 'react'

const MuxApiHostContext = createContext<string | undefined>(undefined)

export function MuxApiHostProvider({
  muxApiHost,
  children,
}: {
  muxApiHost: string | undefined
  children: React.ReactNode
}) {
  if (!muxApiHost) return children
  return <MuxApiHostContext.Provider value={muxApiHost}>{children}</MuxApiHostContext.Provider>
}

export function useMuxApiHost() {
  return useContext(MuxApiHostContext)
}
