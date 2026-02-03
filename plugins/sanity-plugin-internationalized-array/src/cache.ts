import type {Language, LanguageCallback} from './types'

export const namespace = 'sanity-plugin-internationalized-array'

export const version = 'v1'

// Simple in-memory cache for validation functions that run outside React context
const validationCache = new Map<string, Language[]>()

// Cache for function references to enable sharing between same functions
const functionCache = new Map<string, Language[]>()

// Cache for function keys to avoid recalculating them
const functionKeyCache = new WeakMap<LanguageCallback, string>()

// Cache for React.use promises
const promiseCache = new Map<string, Promise<Language[]>>()

// Helper to create a cache key string from an array
function stringifyCacheKey(key: unknown[]): string {
  return JSON.stringify(key)
}

// Preloading: store promises in cache for React.use
export const preload = (fn: () => Promise<Language[]>) => {
  const key = stringifyCacheKey([version, namespace])
  if (!promiseCache.has(key)) {
    promiseCache.set(key, fn())
  }
}

// Enhanced preload function that can use custom cache keys
export const preloadWithKey = (fn: () => Promise<Language[]>, key: (string | number)[]) => {
  const keyStr = stringifyCacheKey(key)
  if (!promiseCache.has(keyStr)) {
    promiseCache.set(keyStr, fn())
  }
}

// Cache busting: clear all promise caches
export const clear = () => {
  promiseCache.clear()
}

// Peeking into entries outside of suspense
export const peek = (selectedValue: Record<string, unknown>) => {
  const key = stringifyCacheKey([version, namespace, selectedValue])
  const promise = promiseCache.get(key)
  if (promise) {
    // Check if promise is resolved
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const status = (promise as any)._status
    if (status === 'fulfilled') {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return (promise as any)._value as Language[] | undefined
    }
  }
  return undefined
}

// Helper function to create a stable cache key that matches the component's key structure
export const createCacheKey = (selectedValue: Record<string, unknown>, workspaceId?: string) => {
  const selectedValueHash = JSON.stringify(selectedValue)
  return workspaceId
    ? [version, namespace, selectedValueHash, workspaceId]
    : [version, namespace, selectedValueHash]
}

// Enhanced peek function that can work with workspace context
export const peekWithWorkspace = (selectedValue: Record<string, unknown>, workspaceId?: string) => {
  const key = stringifyCacheKey(createCacheKey(selectedValue, workspaceId))
  const promise = promiseCache.get(key)
  if (promise) {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
    const status = (promise as any)._status
    if (status === 'fulfilled') {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
      return (promise as any)._value as Language[] | undefined
    }
  }
  return undefined
}

// Create or get cached promise for React.use
export const createOrGetPromise = (
  fn: () => Promise<Language[]>,
  key: (string | number | Record<string, unknown>)[],
): Promise<Language[]> => {
  const keyStr = stringifyCacheKey(key)
  if (promiseCache.has(keyStr)) {
    return promiseCache.get(keyStr)!
  }
  const promise = fn()
  promiseCache.set(keyStr, promise)
  return promise
}

// Generate a unique key for a function reference (cached for performance)
export const getFunctionKey = (fn: LanguageCallback): string => {
  // Check if we already have a cached key for this function
  const cachedKey = functionKeyCache.get(fn)
  if (cachedKey) {
    return cachedKey
  }

  // Create a hash for functions (only when needed)
  const fnStr = fn.toString()
  let hash = 0
  // Only hash the first 100 characters for performance
  const maxLength = Math.min(fnStr.length, 100)
  for (let i = 0; i < maxLength; i++) {
    const char = fnStr.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32-bit integer
  }
  const key = `anonymous_${Math.abs(hash)}`
  functionKeyCache.set(fn, key)
  return key
}

// Create a cache key that includes function identity
export const createFunctionCacheKey = (
  fn: LanguageCallback,
  selectedValue: Record<string, unknown>,
  workspaceId?: string,
): string => {
  const functionKey = getFunctionKey(fn)
  const selectedValueHash = JSON.stringify(selectedValue)
  return workspaceId
    ? `${functionKey}:${selectedValueHash}:${workspaceId}`
    : `${functionKey}:${selectedValueHash}`
}

// Cache for validation functions with function awareness
export const getValidationCache = (key: string): Language[] | undefined => {
  return validationCache.get(key)
}

export const setValidationCache = (key: string, languages: Language[]): void => {
  validationCache.set(key, languages)
}

export const clearValidationCache = (): void => {
  validationCache.clear()
}

// Function-aware cache operations
export const getFunctionCache = (
  fn: LanguageCallback,
  selectedValue: Record<string, unknown>,
  workspaceId?: string,
): Language[] | undefined => {
  const key = createFunctionCacheKey(fn, selectedValue, workspaceId)
  return functionCache.get(key)
}

export const setFunctionCache = (
  fn: LanguageCallback,
  selectedValue: Record<string, unknown>,
  languages: Language[],
  workspaceId?: string,
): void => {
  const key = createFunctionCacheKey(fn, selectedValue, workspaceId)
  functionCache.set(key, languages)
}

export const clearFunctionCache = (): void => {
  functionCache.clear()
}

// Clear function key cache as well
export const clearAllCaches = (): void => {
  functionCache.clear()
  promiseCache.clear()
  // Note: WeakMap doesn't have a clear method, but it will be garbage collected
  // when the function references are no longer held
}

// Check if two functions are the same reference
export const isSameFunction = (fn1: LanguageCallback, fn2: LanguageCallback): boolean => {
  return fn1 === fn2 || getFunctionKey(fn1) === getFunctionKey(fn2)
}
