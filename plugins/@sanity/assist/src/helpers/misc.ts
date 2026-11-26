import {useMemo} from 'react'
import {type Path} from 'sanity'
import {pathToString} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {documentRootKey, type StudioInstruction} from '../types'

export function usePathKey(path: Path | string) {
  return useMemo(() => {
    return getPathKey(path)
  }, [path])
}

function getPathKey(path: Path | string) {
  if (path.length) {
    return Array.isArray(path) ? pathToString(path) : path
  }
  return documentRootKey
}

export function getInstructionTitle(instruction?: StudioInstruction) {
  return instruction?.title ?? 'Untitled'
}

export function isDefined<T>(t: T | undefined | null): t is T {
  return t !== undefined && t !== null
}
