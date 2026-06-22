// oxlint-disable typescript/no-deprecated - legacy code will be lint-cleaned in a follow-up PR
import {Button, Card, Dialog, Stack, Text} from '@sanity/ui'
import {createContext, useCallback, useContext, useMemo, useState} from 'react'

import {type PluginConfig} from '../util/types'

const LOCAL_STORAGE_HAS_SHOWN_WARNING_KEY = 'mux-plugin-has-shown-drm-playback-warning'

type DrmPlaybackWarningContextContextProps = {
  hasShownWarning: boolean
  setHasWarnedAboutDrmPlayback: (b: boolean) => void
}

const DrmPlaybackWarningContext = createContext<DrmPlaybackWarningContextContextProps>({
  hasShownWarning: false,
  setHasWarnedAboutDrmPlayback: () => {
    return null
  },
})

interface DrmPlaybackWarningContextProviderProps {
  config?: PluginConfig
  children: React.ReactNode
}

export const DrmPlaybackWarningContextProvider = ({
  config,
  children,
}: DrmPlaybackWarningContextProviderProps) => {
  const warningDisabled = config?.disableDrmPlaybackWarning ?? false
  const hasWarned: boolean =
    warningDisabled || window.localStorage.getItem(LOCAL_STORAGE_HAS_SHOWN_WARNING_KEY) === 'true'
  const [hasWarnedAboutDrmPlayback, setHasWarnedAboutDrmPlayback] = useState(hasWarned)

  const setHasShownWarning = useCallback((b: boolean) => {
    window.localStorage.setItem(LOCAL_STORAGE_HAS_SHOWN_WARNING_KEY, b.toString())
    setHasWarnedAboutDrmPlayback(b)
  }, [])

  const value = useMemo(
    () => ({
      hasShownWarning: hasWarnedAboutDrmPlayback,
      setHasWarnedAboutDrmPlayback: setHasShownWarning,
    }),
    [hasWarnedAboutDrmPlayback, setHasShownWarning],
  )

  return (
    <DrmPlaybackWarningContext.Provider value={value}>
      {children}
    </DrmPlaybackWarningContext.Provider>
  )
}

export const useDrmPlaybackWarningContext = () => {
  const context = useContext(DrmPlaybackWarningContext)
  return context
}

export const DRMWarningDialog = ({onClose}: {onClose: () => void}) => {
  const {setHasWarnedAboutDrmPlayback} = useDrmPlaybackWarningContext()
  const _onClose = () => {
    setHasWarnedAboutDrmPlayback(true)
    onClose()
  }
  return (
    <Dialog
      open
      id="drm-playback-warn"
      onClose={_onClose}
      header="DRM Playback Warning"
      footer={
        <Stack padding={3}>
          <Button mode="ghost" tone="primary" onClick={_onClose} text="Ok" />
        </Stack>
      }
    >
      <Stack space={3} padding={3}>
        <Card padding={[3, 3, 3]} radius={2}>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              DRM-protected playback will generate a license with a small associated cost. The
              plugin will attempt to play signed or public playback IDs instead whenever possible.
            </Text>
          </Stack>
        </Card>
        <Card padding={[3, 3, 3]} radius={2} tone="suggest">
          <Stack space={3}>
            <Text size={1} weight="semibold">
              This is a one time warning. If it persists, you can disable it from your plugin
              configuration.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Dialog>
  )
}
