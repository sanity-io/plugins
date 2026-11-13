import * as z from 'zod'

// Helper to generate localized string schema
function localizedStringSchema(locales?: {id: string}[]) {
  if (!locales || locales.length === 0) {
    return z.string().trim().optional()
  }
  const shape: Record<string, z.ZodType> = {}
  for (const locale of locales) {
    shape[locale.id] = z.string().trim().optional()
  }
  return z.object(shape).loose()
}

export const tagOptionSchema = z.object({
  label: z.string().trim().min(1, {error: 'Label cannot be empty'}),
  value: z.string().trim().min(1, {error: 'Value cannot be empty'}),
})

export function getAssetFormSchema(locales?: {id: string}[]) {
  return z.object({
    altText: localizedStringSchema(locales),
    creditLine: localizedStringSchema(locales),
    description: localizedStringSchema(locales),
    opt: z.object({
      media: z.object({
        tags: z.array(tagOptionSchema).nullable(),
      }),
    }),
    originalFilename: z.string().trim().min(1, {error: 'Filename cannot be empty'}),
    title: localizedStringSchema(locales),
  })
}

export const assetFormSchema = getAssetFormSchema()

export const tagFormSchema = z.object({
  name: z.string().min(1, {error: 'Name cannot be empty'}),
})

export const folderFormSchema = z.object({
  name: z.string().trim().min(1, {error: 'Name cannot be empty'}),
})
