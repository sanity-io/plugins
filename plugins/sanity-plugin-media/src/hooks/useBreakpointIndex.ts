import {studioTheme} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'

// Determine the current breakpoint index
// - create MediaQueryLists from every breakpoint defined in our sanity studio theme
// - for each MQL, listen to change events and return the selected breakpoint index
const useBreakpointIndex = (): number => {
  const mediaQueryLists = useMemo(
    // oxlint-disable-next-line no-deprecated -- studioTheme is the only static theme accessor
    () => studioTheme.v2!.container.map((width) => window.matchMedia(`(max-width: ${width}px)`)),
    [],
  )

  const getBreakpointIndex = useCallback(
    () => mediaQueryLists.findIndex((mql) => mql.matches),
    [mediaQueryLists],
  )

  const [value, setValue] = useState(getBreakpointIndex())

  useEffect(() => {
    const handleBreakpoint = () => {
      setValue(getBreakpointIndex)
    }

    mediaQueryLists.forEach((mql) => {
      mql.addEventListener('change', handleBreakpoint)
    })
    return () => {
      mediaQueryLists.forEach((mql) => mql.removeEventListener('change', handleBreakpoint))
    }
  }, [getBreakpointIndex, mediaQueryLists])

  return value
}

export default useBreakpointIndex
