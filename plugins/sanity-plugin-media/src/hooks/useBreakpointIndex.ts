// oxlint-disable react/exhaustive-deps, typescript/no-deprecated - legacy code will be lint-cleaned in a follow-up PR
import {studioTheme} from '@sanity/ui'
import {useEffect, useState} from 'react'

// Determine the current breakpoint index
// - create MediaQueryLists from every breakpoint defined in our sanity studio theme
// - for each MQL, listen to change events and return the selected breakpoint index
const useBreakpointIndex = (): number => {
  const mediaQueryLists = studioTheme?.container?.map((width) =>
    window.matchMedia(`(max-width: ${width}px)`),
  )

  const getBreakpointIndex = () => mediaQueryLists.findIndex((mql) => mql.matches)

  const [value, setValue] = useState(getBreakpointIndex())

  useEffect(() => {
    const handleBreakpoint = () => {
      setValue(getBreakpointIndex)
    }

    // NOTE: older versions of Safari use the older `addListener` and `removeListener` methods
    mediaQueryLists.forEach((mql) => {
      try {
        mql.addEventListener('change', handleBreakpoint)
      } catch {
        try {
          mql.addListener(handleBreakpoint)
        } catch {
          // Do nothing
        }
      }
    })
    return () => {
      try {
        mediaQueryLists.forEach((mql) => mql.removeEventListener('change', handleBreakpoint))
      } catch {
        try {
          mediaQueryLists.forEach((mql) => mql.removeListener(handleBreakpoint))
        } catch {
          // Do nothing
        }
      }
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps - use the hook from `@sanity/ui` instead of this home-rolled one
  }, [])

  return value
}

export default useBreakpointIndex
