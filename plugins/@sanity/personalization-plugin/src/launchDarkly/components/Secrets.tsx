import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {useEffect, useState} from 'react'
import {ObjectInputProps} from 'sanity'

import {useLaunchDarklyContext} from './LaunchDarklyContext'

const namespace = 'launchdarkly'
const pluginConfigKeys = [
  {
    key: 'apiKey',
    title: 'Your secret API key',
  },
]

export const Secrets = (props: ObjectInputProps) => {
  const {secrets, loading} = useSecrets(namespace) as {secrets: {apiKey: string}; loading: boolean}
  const {setSecret} = useLaunchDarklyContext()
  const [showSettings, setShowSettings] = useState<boolean>(false)

  useEffect(() => {
    if (loading) return undefined
    if (!secrets && !loading) {
      setSecret(undefined)
      return setShowSettings(true)
    }
    setSecret(secrets.apiKey)
    return setShowSettings(false)
  }, [secrets, loading, setSecret])

  if (!showSettings) {
    return props.renderDefault(props)
  }
  return (
    <>
      <SettingsView
        title={`${namespace} api key`}
        namespace={namespace}
        keys={pluginConfigKeys}
        onClose={() => {
          setShowSettings(false)
        }}
      />
      {props.renderDefault(props)}
    </>
  )
}
