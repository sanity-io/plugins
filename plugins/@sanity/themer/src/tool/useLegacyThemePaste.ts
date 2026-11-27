import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'

import type {ThemerProps} from '#types'

import {convertLegacyTheme} from './legacyTheme'
import {isEditable} from './useThemeCodes'

/**
 * Imports the hosted Themer themes pasted while the sidebar shows: pasting a
 * themer.sanity.build URL — or a snippet with one in it, like the import line
 * of a Studio config — anywhere but into a text field adds its theme,
 * converted to `buildTheme` options, and opens it in the editor. Pastes
 * without such a URL are left alone.
 *
 * @internal
 */
export function useLegacyThemePaste({actorRef}: Pick<ThemerProps, 'actorRef'>): void {
  const toast = useToast()

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented || isEditable(event.target)) return

      const conversion = convertLegacyTheme(event.clipboardData?.getData('text/plain') ?? '')

      switch (conversion.status) {
        case 'missing':
          return
        case 'invalid':
          event.preventDefault()
          toast.push({
            status: 'error',
            title: 'Could not import that themer.sanity.build URL',
            description: conversion.message,
          })
          return
        case 'converted':
          event.preventDefault()
          actorRef.send({type: 'theme.add', title: conversion.title, options: conversion.options})
          toast.push({
            status: 'success',
            title: `Imported “${conversion.title}”`,
            description: "Show its code from the list's menu to use it in your config",
          })
          return
        default:
          conversion satisfies never
      }
    }

    document.addEventListener('paste', handlePaste)

    return () => document.removeEventListener('paste', handlePaste)
  }, [actorRef, toast])
}
