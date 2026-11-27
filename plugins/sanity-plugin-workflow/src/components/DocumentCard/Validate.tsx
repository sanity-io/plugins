import {useEffect} from 'react'
import {type ValidationMarker} from 'sanity'
import {useValidationStatus} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

type ValidateProps = {
  documentId: string
  type: string
  onChange: (validation: {isValidating: boolean; validation: ValidationMarker[]}) => void
}

// Document validation is siloed into its own component
// Because it's not performant to run on a lot of documents
export default function Validate(props: ValidateProps) {
  const {documentId, type, onChange} = props
  // oxlint-disable-next-line no-useless-default-assignment
  const {isValidating, validation = []} = useValidationStatus(documentId, type)

  useEffect(() => {
    onChange({isValidating, validation})
  }, [onChange, isValidating, validation])

  return null
}
