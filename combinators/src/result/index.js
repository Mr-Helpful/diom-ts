import { inspect } from 'node:util'
import dedent from 'dedent'

/**
 * @template T,E
 * @typedef {import("./types").Result<T, E>} Result<T,E>
 */
/**
 * @typedef {import("./types").ResultWrapper} ResultWrapper
 */

const ResultSymbol = Symbol('Result')

/** Tests whether a value is a Result
 * @param value
 * @return {value is Result<any,any>}
 */
const isResult = value =>
  typeof value === 'object' && value[ResultSymbol] === true

/**
 * Ok variant for the `Result` type.
 * Represents a successful operation.
 * @template T,E
 * @type {(value: T) => Result<T,E>}
 */
const ok = value => ({
  [ResultSymbol]: true,

  toString: () => `Result.ok(${value})`,
  [inspect.custom]() {
    return this.toString()
  },

  is_ok: true,
  is_err: false,
  is_ok_and: f => f(value),
  is_err_and: _ => false,

  unwrap: () => value,
  unwrap_or: _ => value,
  unwrap_err() {
    throw Error(`Unable to unwrap error from ${this}`)
  },

  map: f => ok(f(value)),
  map_err: _ => ok(value),
  map_or: (f, _) => f(value),

  then: f => f(value),
  then_err: _ => ok(value),
  then_wrap: f => wrap(f)(value),

  or: _ => ok(value),
  zip: res => res.map(other => [value, other])
})

/**
 * Err variant for the `Result` type.
 * Represents a failed operation.
 * @template T,E
 * @type {(error: E) => Result<T,E>}
 */
const err = error => ({
  [ResultSymbol]: true,

  toString: () => `Result.err(${error})`,
  [inspect.custom]() {
    return this.toString()
  },

  is_ok: false,
  is_err: true,
  is_ok_and: _ => false,
  is_err_and: f => f(error),

  unwrap() {
    throw error
  },
  unwrap_or: d => d,
  unwrap_err: () => error,

  map: _ => err(error),
  map_err: f => err(f(error)),
  map_or: (_, d) => d,

  then: _ => err(error),
  then_err: f => f(error),
  then_wrap: _ => err(error),

  or: res => res,
  zip: _ => err(error)
})

/**
 * A function that generates the `wrap` function
 * for a given `ok` and `err` variant
 * @template T,E
 * @param {(value: T) => Result<T, E>} ok the `ok` variant
 * @param {(error: E) => Result<T, E>} err the `err` variant
 */
export function wrap_factory(ok, err) {
  /**
   * Wraps a function to return a `Result`
   * @type {ResultWrapper}
   * @param f the function to wrap
   * @return the wrapped function, will return `Result.err` if the function throws an `Error`, otherwise returns `Result.ok`
   */
  return function wrap(f) {
    return (...args) => {
      try {
        const result = f(...args)
        return isResult(result) ? result : ok(result)
      } catch (e) {
        if (e instanceof Error) return err(e)
        throw new TypeError(dedent`
          Wrapped function did not throw a subclass of \`Error\`
          it instead threw \`${e}\`.
          help: try implementing a custom error type that extends \`Error\`
        `)
      }
    }
  }
}

const Result = { isResult, ok, err, wrap: wrap_factory(ok, err) }
export { Result }
