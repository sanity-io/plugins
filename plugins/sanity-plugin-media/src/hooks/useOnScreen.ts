import {type RefObject, useEffect, useState} from 'react'

const useOnScreen = (ref: RefObject<HTMLElement | null>, options = {}, once: boolean) => {
  const [isIntersecting, setIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return

      // Update state when observer callback fires
      setIntersecting(entry.isIntersecting)

      // Stop observing
      if (once && entry.isIntersecting) {
        if (element) {
          observer.unobserve(element)
        }
      }
    }, options)

    if (element) {
      observer.observe(element)
    }

    // Stop observing on unmount
    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [options, once, ref])

  return isIntersecting
}

export default useOnScreen
