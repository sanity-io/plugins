// copied from react-hookz/web
// https://github.com/react-hookz/web/blob/579a445fcc9f4f4bb5b9d5e670b2e57448b4ee50/src/useDebouncedCallback/index.ts
import {useCallback, useEffect, useMemo, useRef} from 'react'

/**
 * Run effect only when component is unmounted.
 *
 * @param effect Effector to run on unmount
 */
function useUnmountEffect(effect: CallableFunction): void {
  const effectRef = useRef(effect)
  useEffect(() => {
    effectRef.current = effect
  }, [effect])
  useEffect(() => () => effectRef.current(), [])
}

export type DebouncedFunction<Fn extends (...args: any[]) => any> = (
  this: ThisParameterType<Fn>,
  ...args: Parameters<Fn>
) => void

/**
 * Makes passed function debounced, otherwise acts like `useCallback`.
 *
 * @param callback Function that will be debounced.
 * @param delay Debounce delay.
 * @param maxWait The maximum time `callback` is allowed to be delayed before
 * it's invoked. 0 means no max wait.
 */
export function useDebouncedCallback<Fn extends (...args: any[]) => any>(
  callback: Fn,
  delay: number,
  maxWait = 0,
): DebouncedFunction<Fn> {
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const waitTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cb = useRef(callback)
  const lastCall = useRef<{args: Parameters<Fn>; this: ThisParameterType<Fn>}>(undefined)

  const clear = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current)
      timeout.current = undefined
    }

    if (waitTimeout.current) {
      clearTimeout(waitTimeout.current)
      waitTimeout.current = undefined
    }
  }, [])

  // Cancel scheduled execution on unmount
  useUnmountEffect(clear)

  useEffect(() => {
    cb.current = callback
  }, [callback])

  // oxlint-disable react/react-compiler
  return useMemo(() => {
    const execute = () => {
      clear()

      // Barely possible to test this line
      /* istanbul ignore next */
      if (!lastCall.current) return

      const context = lastCall.current
      lastCall.current = undefined

      cb.current.apply(context.this, context.args)
    }

    const wrapped = function (this, ...args) {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }

      lastCall.current = {args, this: this}

      // Plan regular execution
      timeout.current = setTimeout(execute, delay)

      // Plan maxWait execution if required
      if (maxWait > 0 && !waitTimeout.current) {
        waitTimeout.current = setTimeout(execute, maxWait)
      }
    } as DebouncedFunction<Fn>

    Object.defineProperties(wrapped, {
      length: {value: callback.length},
      name: {value: `${callback.name || 'anonymous'}__debounced__${delay}`},
    })

    return wrapped
  }, [callback, clear, delay, maxWait])
  // oxlint-enable react/react-compiler
}
