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

function applyPatch(root: Record<string, unknown>, patch: FormPatch): Record<string, unknown> {
  const next = structuredClone(root)
  const path = patch.path
  if (path.length === 0) {
    throw new Error(`Unexpected root patch: ${patch.type}`)
  }

  let cursor: Record<string, unknown> = next
  for (const segment of path.slice(0, -1)) {
    const key = String(segment)
    const child = cursor[key]
    if (child === undefined) {
      cursor[key] = {}
      cursor = cursor[key] as Record<string, unknown>
    } else if (typeof child === 'object' && child !== null) {
      cursor = child as Record<string, unknown>
    } else {
      throw new Error(`Cannot apply ${patch.type} through ${key}`)
    }
  }

  const last = String(path.at(-1))
  if (patch.type === 'set') {
    cursor[last] = patch.value
    return next
  }
  if (patch.type === 'setIfMissing') {
    if (cursor[last] === undefined) {
      cursor[last] = patch.value
    }
    return next
  }
  if (patch.type === 'unset') {
    delete cursor[last]
    return next
  }
  throw new Error(`Unsupported patch: ${patch.type}`)
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

    expect(applyCodeFieldChange({}, 'example', patches).example).toMatchObject({
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
