import {useEffect, useRef} from 'react'

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  // oxlint-disable-next-line react-hooks-js/refs
  return ref.current
}
