// oxlint-disable typescript/no-unsafe-type-assertion - legacy media plugin ported code
import {zodResolver} from '@hookform/resolvers/zod'
import type {FieldValues, Resolver} from 'react-hook-form'

/**
 * `@hookform/resolvers/zod` resolves its own `zod` typings through dependency
 * hoisting, which in this monorepo lands on zod v4, while this plugin authors its
 * form schemas with zod v3. The resolver accepts v3 schema instances correctly at
 * runtime, so this thin wrapper only bridges the type-only v3/v4 mismatch. The
 * react-hook-form field types stay fully checked at the call sites.
 */
export default function zodFormResolver<TFieldValues extends FieldValues>(
  schema: unknown,
): Resolver<TFieldValues> {
  return zodResolver(
    schema as Parameters<typeof zodResolver>[0],
  ) as unknown as Resolver<TFieldValues>
}
