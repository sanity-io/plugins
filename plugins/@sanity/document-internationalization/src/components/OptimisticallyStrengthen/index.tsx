import type {TranslationReference} from '../../types'
import ReferencePatcher from './ReferencePatcher'

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
    <>
      {translations.map((translation) =>
        translation.value._strengthenOnPublish?.type ? (
          <ReferencePatcher key={translation._key} translation={translation} />
        ) : null,
      )}
    </>
  )
}
