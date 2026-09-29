import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'

import type {ThemerProps} from './context'
import {decodeTheme, encodeTheme, type SharedTheme} from './share'
import {displayTitle} from './themes'

/**
 * Copying a theme as a code to share, and adding a theme from a code someone
 * shared — with toasts telling how it went.
 *
 * @internal
 */
export function useThemeCodes({actorRef}: Pick<ThemerProps, 'actorRef'>): {
  copyTheme: (theme: SharedTheme) => Promise<void>
  /** Adds the theme in the text, if there is one — the result says whether there was */
  addThemeFromText: (text: string) => boolean
  /** Adds the theme on the clipboard, if there is one and the browser hands the clipboard over */
  addThemeFromClipboard: () => Promise<'added' | 'no-theme' | 'no-clipboard'>
} {
  const toast = useToast()

  const copyTheme = async (theme: SharedTheme) => {
    const title = displayTitle(theme.title)

    try {
      await navigator.clipboard.writeText(encodeTheme(theme))
      toast.push({
        status: 'success',
        title: `Copied ${title} as a code`,
        description: 'Paste it in the themer of another Studio to add the theme there',
      })
    } catch {
      toast.push({status: 'error', title: `Could not copy ${title}`})
    }
  }

  const addThemeFromText = (text: string) => {
    const theme = decodeTheme(text)

    if (!theme) return false

    actorRef.send({type: 'theme.import', title: theme.title, options: theme.options})
    toast.push({status: 'success', title: `Added ${theme.title}`})

    return true
  }

  const addThemeFromClipboard = async () => {
    let text: string

    try {
      text = await navigator.clipboard.readText()
    } catch {
      return 'no-clipboard'
    }

    return addThemeFromText(text) ? 'added' : 'no-theme'
  }

  return {copyTheme, addThemeFromText, addThemeFromClipboard}
}

/**
 * Adds a theme pasted anywhere in the Studio while the themer's list is
 * showing — pastes into inputs and other editable things are theirs.
 *
 * @internal
 */
export function usePasteThemeCodes({actorRef}: Pick<ThemerProps, 'actorRef'>): void {
  const toast = useToast()

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (isEditable(event.target)) return

      const theme = decodeTheme(event.clipboardData?.getData('text/plain') ?? '')

      if (!theme) return

      event.preventDefault()
      actorRef.send({type: 'theme.import', title: theme.title, options: theme.options})
      toast.push({status: 'success', title: `Added ${theme.title}`})
    }

    document.addEventListener('paste', handlePaste)

    return () => document.removeEventListener('paste', handlePaste)
  }, [actorRef, toast])
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches('input, textarea, select'))
  )
}
