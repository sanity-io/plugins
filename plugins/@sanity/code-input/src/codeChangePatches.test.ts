import {PatchEvent, setIfMissing, type FormPatch} from 'sanity'
import {describe, expect, test} from 'vitest'

import {codeChangePatches} from './codeChangePatches'

/**
 * Studio's object field prepends `setIfMissing({_type})` before patches from a
 * custom object input. `setIfMissing` does nothing once that proto value
 * exists, so a language placed only inside the input's own `setIfMissing` is
 * dropped.
 */
function applyCodeFieldChange(
  documentValue: Record<string, unknown>,
  fieldName: string,
  event: FormPatch[],
): Record<string, unknown> {
  const patches = PatchEvent.from(event)
    .prepend(setIfMissing({_type: 'code'}))
    .prefixAll(fieldName).patches

  return patches.reduce(applyPatch, documentValue)
}

function pathKey(segment: FormPatch['path'][number]): string {
  if (typeof segment === 'string') return segment
  if (typeof segment === 'number') return `${segment}`
  throw new Error(`Unsupported path segment: ${JSON.stringify(segment)}`)
}

function objectAt(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const existing = parent[key]
  if (existing === undefined) {
    const created: Record<string, unknown> = {}
    parent[key] = created
    return created
  }
  if (typeof existing !== 'object' || existing === null || Array.isArray(existing)) {
    throw new Error(`Expected an object at ${key}`)
  }
  const copy: Record<string, unknown> = {}
  for (const childKey of Object.keys(existing)) {
    copy[childKey] = Reflect.get(existing, childKey)
  }
  parent[key] = copy
  return copy
}

function applyPatch(root: Record<string, unknown>, patch: FormPatch): Record<string, unknown> {
  const next = structuredClone(root)
  const path = patch.path
  if (path.length === 0) {
    throw new Error(`Unexpected root patch: ${patch.type}`)
  }

  let cursor = next
  for (const segment of path.slice(0, -1)) {
    cursor = objectAt(cursor, pathKey(segment))
  }

  const tail = path[path.length - 1]
  if (tail === undefined) {
    throw new Error(`Unexpected empty path for ${patch.type}`)
  }
  const last = pathKey(tail)
  switch (patch.type) {
    case 'set':
      cursor[last] = patch.value
      return next
    case 'setIfMissing':
      if (cursor[last] === undefined) {
        cursor[last] = patch.value
      }
      return next
    case 'unset':
      delete cursor[last]
      return next
    case 'insert':
    case 'diffMatchPatch':
      throw new Error(`Unsupported patch: ${patch.type}`)
    default: {
      const unsupported: never = patch
      throw new Error(`Unsupported patch: ${JSON.stringify(unsupported)}`)
    }
  }
}

describe('code field language', () => {
  test('stores the language the control is showing when code is edited', () => {
    const patches = codeChangePatches({
      code: 'const answer = 42',
      typeName: 'code',
      storedLanguage: undefined,
      selectedLanguage: 'javascript',
    })

    expect(applyCodeFieldChange({}, 'example', patches)).toEqual({
      example: {
        _type: 'code',
        language: 'javascript',
        code: 'const answer = 42',
      },
    })
  })

  test('stores plain text when that is the language shown and none is configured', () => {
    const patches = codeChangePatches({
      code: 'hello',
      typeName: 'code',
      storedLanguage: undefined,
      selectedLanguage: 'text',
    })

    expect(applyCodeFieldChange({}, 'example', patches)['example']).toMatchObject({
      language: 'text',
      code: 'hello',
    })
  })

  test('keeps a language that is already stored', () => {
    const patches = codeChangePatches({
      code: 'h1 { color: red }',
      typeName: 'code',
      storedLanguage: 'css',
      selectedLanguage: 'css',
    })

    expect(
      applyCodeFieldChange(
        {example: {_type: 'code', language: 'css', code: 'old'}},
        'example',
        patches,
      ),
    ).toEqual({
      example: {
        _type: 'code',
        language: 'css',
        code: 'h1 { color: red }',
      },
    })
  })

  test('records the shown language when the editor is cleared', () => {
    const patches = codeChangePatches({
      code: '',
      typeName: 'code',
      storedLanguage: undefined,
      selectedLanguage: 'javascript',
    })

    expect(applyCodeFieldChange({}, 'example', patches)).toEqual({
      example: {
        _type: 'code',
        language: 'javascript',
      },
    })
  })
})
