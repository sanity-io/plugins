import {useEffect, useState} from 'react'

/**
 * Creates a detached `.media-portal` element appended to `document.body` for the
 * lifetime of the component, used as a portal target for the plugin's dialogs
 * and overlays. The element is removed on unmount.
 */
const useRootPortalElement = (): HTMLDivElement => {
  const [container] = useState(() => document.createElement('div'))

  useEffect(() => {
    container.classList.add('media-portal')
    document.body.appendChild(container)
    return () => {
      document.body.removeChild(container)
    }
  }, [container])

  return container
}

export default useRootPortalElement
