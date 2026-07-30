import {useEffect, useState} from 'react'
import {useClient} from 'sanity'

import type {CloudinaryAsset} from '../types'
import AssetPreview from './AssetPreview'

const API_VERSION = '2023-01-01'

interface ReferencePreviewProps {
  value?: {_ref?: string}
  /** Bump to force a refetch when the referenced document is updated in place */
  revision?: number
}

const ReferencePreview = (props: ReferencePreviewProps) => {
  const {value, revision = 0} = props
  const client = useClient({apiVersion: API_VERSION})
  const ref = value?._ref
  const [result, setResult] = useState<{
    ref: string
    revision: number
    asset: CloudinaryAsset | null
  } | null>(null)

  useEffect(() => {
    if (!ref) {
      return undefined
    }

    let cancelled = false
    client
      .getDocument<{asset?: CloudinaryAsset}>(ref)
      .then((document) => {
        if (!cancelled) {
          setResult({ref, revision, asset: document?.asset ?? null})
        }
        return null
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ref, revision, asset: null})
        }
        console.error('Error fetching referenced asset:', err)
      })

    return () => {
      cancelled = true
    }
  }, [ref, client, revision])

  if (!ref) {
    return null
  }

  // Derive loading/asset from the fetched result for the current ref+revision
  if (result?.ref !== ref || result.revision !== revision) {
    return <div>Loading asset...</div>
  }

  if (!result.asset) {
    return null
  }

  return <AssetPreview value={result.asset} layout="block" />
}

export default ReferencePreview
