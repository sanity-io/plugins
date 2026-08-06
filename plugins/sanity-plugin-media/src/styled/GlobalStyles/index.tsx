import {useEffect} from 'react'

import {globalStylesActive} from './GlobalStyles.css'

// Reference-counted so overlapping instances (e.g. the Browse tool and an Edit Media
// asset source mounted at the same time) don't have one unmounting turn the rules off
// for the other.
let activeCount = 0

const GlobalStyle = () => {
  useEffect(() => {
    activeCount += 1
    document.body.classList.add(globalStylesActive)

    return () => {
      activeCount -= 1
      if (activeCount === 0) {
        document.body.classList.remove(globalStylesActive)
      }
    }
  }, [])

  return null
}

export default GlobalStyle
