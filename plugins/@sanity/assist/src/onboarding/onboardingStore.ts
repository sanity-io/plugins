import {useCallback, useState} from 'react'

export const inspectorOnboardingKey = 'sanityStudio:assist:inspector:onboarding:dismissed'

function isFeatureOnboardingDismissed(featureKey: string): boolean {
  if (typeof localStorage === 'undefined') {
    return false
  }

  const value = localStorage.getItem(featureKey)
  return value === 'true'
}

function dismissFeatureOnboarding(featureKey: string) {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(featureKey, 'true')
}

export function useOnboardingFeature(featureKey: string) {
  const [showOnboarding, setShowOnboarding] = useState(
    () => !isFeatureOnboardingDismissed(featureKey),
  )
  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false)
    dismissFeatureOnboarding(featureKey)
  }, [setShowOnboarding, featureKey])

  return {showOnboarding, dismissOnboarding}
}
