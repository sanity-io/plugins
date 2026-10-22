import {useEffect} from 'react'

import * as styles from './GlobalStyles.module.css'

// Reference-counted so overlapping instances (e.g. the Browse tool and an Edit Media
// asset source mounted at the same time) don't have one unmounting turn the rules off
// for the other.
let activeCount = 0

const GlobalStyle = () => {
  useEffect(() => {
    activeCount += 1
    document.body.classList.add(styles.scopeActive)

    return () => {
      activeCount -= 1
      if (activeCount === 0) {
        document.body.classList.remove(styles.scopeActive)
      }
    }
  }, [])

  return null
}

export default GlobalStyle
