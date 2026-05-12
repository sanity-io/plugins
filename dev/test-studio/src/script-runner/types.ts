import type {SanityClient} from 'sanity'

export type ScriptLogLevel = 'info' | 'success' | 'warning' | 'error'

export interface ScriptLogger {
  info: (...messages: unknown[]) => void
  success: (...messages: unknown[]) => void
  warning: (...messages: unknown[]) => void
  error: (...messages: unknown[]) => void
}

export interface ScriptStringInput {
  name: string
  title: string
  description?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
}

export interface ScriptRunContext {
  client: SanityClient
  inputs: Record<string, string>
  log: ScriptLogger
  signal: AbortSignal
}

export interface StudioScript {
  name: string
  title: string
  description?: string
  apiVersion?: string
  inputs?: ScriptStringInput[]
  run: (context: ScriptRunContext) => void | Promise<void>
}

export interface RegisteredStudioScript extends StudioScript {
  sourcePath: string
}
