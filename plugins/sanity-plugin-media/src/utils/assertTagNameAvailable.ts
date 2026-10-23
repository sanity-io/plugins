import type {SanityClient} from '@sanity/client'
import groq from 'groq'

import {TAG_DOCUMENT_NAME} from '../constants'
import {createHttpError} from '../machines/utils'

/** Rejects with a 409 when a tag named `name` already exists. */
export async function assertTagNameAvailable(client: SanityClient, name: string): Promise<void> {
  const existingTagCount = await client.fetch<number>(
    groq`count(*[_type == "${TAG_DOCUMENT_NAME}" && name.current == $name])`,
    {name},
  )
  if (existingTagCount > 0) {
    throw createHttpError('Tag already exists', 409)
  }
}
