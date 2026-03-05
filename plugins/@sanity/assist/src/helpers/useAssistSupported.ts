import {useMemo} from 'react'
import type {Path, SchemaType} from 'sanity'

import {isAssistSupported} from './assistSupported'

export function useAssistSupported(_path: Path, schemaType: SchemaType) {
  return useMemo(() => isAssistSupported(schemaType), [schemaType])
}
