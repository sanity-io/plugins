import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {useEffect, useState} from 'react'
import type {ObjectInputProps} from 'sanity'

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
  const [settingsDismissed, setSettingsDismissed] = useState(false)
  const showSettings = !loading && !secrets && !settingsDismissed

  useEffect(() => {
    if (loading) {
      return
    }
    setSecret(secrets?.apiKey)
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
          setSettingsDismissed(true)
        }}
      />
      {props.renderDefault(props)}
    </>
  )
}
