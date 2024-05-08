import { inspect } from 'node:util'
import dedent from 'dedent'
import { Option } from '../option'

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
 * `Ok` variant for the `Result` type.
 * Represents a successful operation.
 * @template T,E
 * @type {(value: T) => Result<T,E>}
 */
const Ok = value => ({
  [ResultSymbol]: true,

  toString: () => `Result.Ok(${value})`,
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

  map: f => Ok(f(value)),
  map_err: _ => Ok(value),
  map_or: (f, _) => f(value),

  then: f => f(value),
  then_err: _ => Ok(value),
  then_wrap: f => wrap(f)(value),

  or: _ => Ok(value),
  zip: res => res.map(other => [value, other]),

  ok: () => Option.Some(value),
  err: () => Option.None
})

/**
 * `Err` variant for the `Result` type.
 * Represents a failed operation.
 * @template T,E
 * @type {(error: E) => Result<T,E>}
 */
const Err = error => ({
  [ResultSymbol]: true,

  toString: () => `Result.Err(${error})`,
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

  map: _ => Err(error),
  map_err: f => Err(f(error)),
  map_or: (_, d) => d,

  then: _ => Err(error),
  then_err: f => f(error),
  then_wrap: _ => Err(error),

  or: res => res,
  zip: _ => Err(error),

  ok: () => Option.None,
  err: () => Option.Some(error)
})

/**
 * A function that generates the `wrap` function
 * for a given `Ok` and `Err` variant
 * @template T,E
 * @param {(value: T) => Result<T, E>} Ok the `Ok` variant
 * @param {(error: E) => Result<T, E>} Err the `Err` variant
 */
export function wrap_factory(Ok, Err) {
  /**
   * Wraps a function to return a `Result`
   * @type {ResultWrapper}
   * @param f the function to wrap
   * @return the wrapped function, will return `Result.Err` if the function throws an `Error`, otherwise returns `Result.Ok`
   */
  return function wrap(f) {
    return (...args) => {
      try {
        const result = f(...args)
        return isResult(result) ? result : Ok(result)
      } catch (e) {
        if (e instanceof Error) return Err(e)
        throw new TypeError(dedent`
          Wrapped function did not throw a subclass of \`Error\`
          it instead threw \`${e}\`.
          help: try implementing a custom error type that extends \`Error\`
        `)
      }
    }
  }
}

const Result = { isResult, Ok, Err, wrap: wrap_factory(Ok, Err) }
export { Result }
