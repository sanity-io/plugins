import {lazy, Suspense} from 'react'

import type {TranslationReference} from '../../types'

// It imports `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`, which must stay
// out of what the studio shell loads.
const ReferencePatcher = lazy(() => import('./ReferencePatcher'))

type OptimisticallyStrengthenProps = {
  translations: TranslationReference[]
}

// There's no good reason to leave published references as weak
// So this component will run on every render and strengthen them
export default function OptimisticallyStrengthen(props: OptimisticallyStrengthenProps) {
  // oxlint-disable-next-line no-useless-default-assignment
  const {translations = []} = props

  if (!translations.length) {
    return null
  }

  return (
    <Suspense fallback={null}>
      {translations.map((translation) =>
        translation.value._strengthenOnPublish?.type ? (
          <ReferencePatcher key={translation._key} translation={translation} />
        ) : null,
      )}
    </Suspense>
  )
}
