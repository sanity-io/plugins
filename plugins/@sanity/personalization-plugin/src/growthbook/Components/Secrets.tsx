import {SettingsView, useSecrets} from '@sanity/studio-secrets'
import {useEffect, useState} from 'react'
import type {ObjectInputProps} from 'sanity'

import {useGrowthbookContext} from './GrowthbookContext'

export const namespace = 'growthbook'
export const apiKeyName = 'apiKey'

const pluginConfigKeys = [
  {
    key: apiKeyName,
    title: 'Your secret API key',
  },
]

export const Secrets = (props: ObjectInputProps) => {
  // useSecrets is generic; the stored secret shape for this namespace is {apiKey: string}
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const {secrets, loading} = useSecrets(namespace) as {secrets: {apiKey: string}; loading: boolean}
  const {setSecret} = useGrowthbookContext()
  const [showSettings, setShowSettings] = useState<boolean>(false)

  useEffect(() => {
    if (loading) return undefined
    if (!secrets && !loading) {
      setSecret(undefined)
      // oxlint-disable-next-line react/react-compiler
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
        title={'Growthbook secret'}
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
