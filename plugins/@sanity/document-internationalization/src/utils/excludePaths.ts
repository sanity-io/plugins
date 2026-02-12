import {extractWithPath, Mutation} from '@sanity/mutator'
import {
  isDocumentSchemaType,
  type ObjectSchemaType,
  type Path,
  pathToString,
  type SanityDocument,
  type SchemaType,
} from 'sanity'

export interface DocumentMember {
  schemaType: SchemaType
  path: Path
  name: string
  value: unknown
}

/**
 * Removes fields from a document that are marked with the
 * `documentInternationalization.exclude` schema option. This is used when
 * duplicating a source document to create a translation, so that
 * language-specific or non-translatable fields are stripped from the copy.
 * Returns the document with excluded paths unset, or `null` if the input is null.
 */
export function removeExcludedPaths(
  doc: SanityDocument | null,
  schemaType: ObjectSchemaType,
): SanityDocument | null {
  // If the supplied doc is null or the schemaType
  // isn't a document, return as is.
  if (!isDocumentSchemaType(schemaType) || !doc) {
    return doc
  }

  // The extractPaths function gets all the fields in the doc with
  // a value, along with their schemaTypes and paths. We'll end up
  // with an array of paths in string form which we want to exclude
  const pathsToExclude: string[] = extractPaths(doc, schemaType, [])
    // We filter for any fields which should be excluded from the document
    // duplicate action, based on the schemaType option being set.
    .filter((field) => field.schemaType?.options?.documentInternationalization?.exclude === true)
    // then we return the stringified version of the path
    .map((field) => {
      return pathToString(field.path)
    })

  // Now we can use the Mutation class from @sanity/mutator to patch the document
  // to remove all the paths that are for one of the excluded fields. This is just
  // done locally, and the documents themselves are not patched in the Content Lake.
  const mut = new Mutation({
    mutations: [
      {
        patch: {
          id: doc._id,
          unset: pathsToExclude,
        },
      },
    ],
  })

  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  return mut.apply(doc) as SanityDocument
}

function extractPaths(
  doc: SanityDocument,
  schemaType: ObjectSchemaType,
  path: Path,
): DocumentMember[] {
  const result: DocumentMember[] = []

  for (const field of schemaType.fields) {
    const fieldPath = [...path, field.name]
    const fieldSchema = field.type
    const {value} = extractWithPath(pathToString(fieldPath), doc)[0] ?? {}
    if (value === undefined || value === null) {
      continue
    }

    const thisFieldWithPath: DocumentMember = {
      path: fieldPath,
      name: field.name,
      schemaType: fieldSchema,
      value,
    }

    if (fieldSchema.jsonType === 'object') {
      const innerFields = extractPaths(doc, fieldSchema, fieldPath)
      result.push(thisFieldWithPath, ...innerFields)
    } else if (
      fieldSchema.jsonType === 'array' &&
      fieldSchema.of.length &&
      fieldSchema.of.some((item) => 'fields' in item)
    ) {
      const {value: arrayValue} = extractWithPath(pathToString(fieldPath), doc)[0] ?? {}

      result.push(thisFieldWithPath)
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      if ((arrayValue as unknown[])?.length) {
        // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
        for (const item of arrayValue as Array<{
          _key?: string
          language?: string
          _type?: string
        }>) {
          if (!item._key) continue
          const itemPath = [...fieldPath, {_key: item._key}] as Path
          let itemSchema = fieldSchema.of.find((t) => t.name === item._type)
          if (!item._type) {
            itemSchema = fieldSchema.of[0]
          }
          if (itemSchema) {
            // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
            const innerFields = extractPaths(doc, itemSchema as ObjectSchemaType, itemPath)
            const arrayMember: DocumentMember = {
              path: itemPath,
              name: item.language ?? item._key,
              schemaType: itemSchema,
              value: item,
            }
            result.push(arrayMember, ...innerFields)
          }
        }
      }
    } else {
      result.push(thisFieldWithPath)
    }
  }

  return result
}
