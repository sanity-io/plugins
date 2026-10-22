import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useRef, useState} from 'react'

import {readImagePixels} from './imageFile'
import {extractImagePalette, type ImagePalette} from './imagePalette'

/**
 * Extracts the palette of image files on device and hands it to `onPalette`,
 * along with the file it came from. Failures end up as a toast.
 *
 * @internal
 */
export function useImagePalette(onPalette: (palette: ImagePalette, file: File) => void): {
  busy: boolean
  pickImage: (file: File) => void
} {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const onPaletteRef = useRef(onPalette)
  // Picks are numbered so that a slow earlier image cannot overwrite a later
  // pick once its extraction finishes
  const latestPickRef = useRef(0)

  useEffect(() => {
    onPaletteRef.current = onPalette
  }, [onPalette])

  const pickImage = useCallback(
    (file: File) => {
      const pick = ++latestPickRef.current

      setBusy(true)

      // Whether this pick is still the latest one. Nothing checks whether the
      // component still shows: adding the theme opens the editor, which hides
      // the list in an `Activity` — its state survives that, and the flag
      // must clear before the list shows again
      const isCurrent = () => latestPickRef.current === pick

      const extract = async () => {
        const palette = extractImagePalette(await readImagePixels(file))

        if (!isCurrent()) return

        if (Object.values(palette).every((swatch) => swatch === null)) {
          toast.push({status: 'warning', title: 'Found no colors in that image'})
        } else {
          onPaletteRef.current(palette, file)
        }
      }

      extract()
        .catch(() => {
          if (isCurrent()) toast.push({status: 'error', title: 'Could not read that image'})
        })
        .finally(() => {
          if (isCurrent()) setBusy(false)
        })
    },
    [toast],
  )

  return {busy, pickImage}
}
