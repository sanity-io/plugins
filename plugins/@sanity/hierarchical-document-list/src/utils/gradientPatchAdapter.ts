// Adapted from @sanity/form-builder/src/sanity/utils/gradientPatchAdapter.ts
import {arrayToJSONMatchPath} from '@sanity/mutator'

interface Patch {
  type?: string
  path?: any[]
  position?: string
  items?: unknown[]
  value?: unknown
}

type GradientPatch = Record<string, any>

export function toGradient(patches: Patch[]): GradientPatch[] {
  return patches.map(toGradientPatch)
}

function toGradientPatch(patch: Patch): GradientPatch {
  const matchPath = arrayToJSONMatchPath(patch.path || [])
  if (patch.type === 'insert') {
    const {position, items} = patch
    return {
      insert: {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion - patch position key from Sanity mutator API
        [position as string]: matchPath,
        items: items,
      },
    }
  }

  if (patch.type === 'unset') {
    return {
      unset: [matchPath],
    }
  }

  if (!patch.type) {
    throw new Error(`Missing patch type in patch ${JSON.stringify(patch)}`)
  }
  if (matchPath) {
    return {
      [patch.type]: {
        [matchPath]: patch.value,
      },
    }
  }
  return {
    [patch.type]: patch.value,
  }
}
