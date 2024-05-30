import dedent from 'dedent'
import { inspect } from 'node:util'
import { None, Some, type Option } from '../option/index.js'

const ResultSymbol = Symbol('Result')

/** A utility result type implementation
 * Heavily inspired by [this article](https://dev.to/rgeraldporter/building-expressive-monads-in-javascript-introduction-23b)
 */
export interface Result<T, E> {
  [ResultSymbol]: true

  /** Displays the Result type and its value / error */
  toString(): string
  [inspect.custom](): string

  /** Whether this result contains the `Ok` variant */
  is_ok(): this is Result<T, never>
  /** Whether this result contains the `Err` variant */
  is_err(): this is Result<never, E>
  /** Whether the `Ok` variant satisfies `f` */
  is_ok_and(f: (value: T) => boolean): boolean
  /** Whether the `Err` variant satisfies `f` */
  is_err_and(f: (error: E) => boolean): boolean

  /** Unwraps the `Ok` value or throws the contained error */
  unwrap(): T
  /** Unwraps the contained value or returns default value `d` */
  unwrap_or(d: T): T
  /** Unwraps the `Err` value or throws a generic error */
  unwrap_err(): E

  /** Modifies the contained value of a `Result` */
  map<R>(f: (value: T) => R): Result<R, E>
  /** Modifies the contained error of a `Result` */
  map_err<R>(f: (error: E) => R): Result<T, R>
  /**
   * Applies the `f` to the contained value,
   * or returns default value `d` if the result contains an error.
   *
   */
  map_or<R>(f: (value: T) => R, d: R): R

  then<R, E2>(f: (value: T) => Result<R, E2>): Result<R, E | E2>
  then_err<R, T2>(f: (value: E) => Result<T2, R>): Result<T | T2, R>
  then_wrap<R>(f: (value: T) => R): Result<R, E>

  or<R>(res: Result<T, R>): Result<T, R>
  zip(res: Result<T, E>): Result<[T, T], E>

  ok(): Option<T>
  err(): Option<E>
}

export type ResultFrom<T, E> = T | Result<T, E>
export type ResultWrapper<E extends Error = Error> = <Args extends any[], T>(
  f: (...args: Args) => T
) => (...args: Args) => T extends Result<any, E> ? T : Result<T, E>

/** Tests whether a value is a Result
 * @param value
 * @return {value is Result<any,any>}
 */
export const isResult = (value: any): value is Result<any, any> =>
  typeof value === 'object' && value[ResultSymbol] === true

/**
 * `Ok` variant for the `Result` type.
 * Represents a successful operation.
 */
export const Ok = <T>(value: T): Result<T, never> => ({
  [ResultSymbol]: true,

  toString: () => `Result.Ok(${value})`,
  [inspect.custom]() {
    return this.toString()
  },

  is_ok: () => true,
  is_err: () => false,
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
  then_wrap: <R, E>(f: (value: T) => R) => wrap(f)(value) as Result<R, E>,

  or: _ => Ok(value),
  zip: res => res.map(other => [value, other]),

  ok: () => Some(value),
  err: () => None
})

/**
 * `Err` variant for the `Result` type.
 * Represents a failed operation.
 */
export const Err = <E>(error: E): Result<never, E> => ({
  [ResultSymbol]: true,

  toString: () => `Result.Err(${error})`,
  [inspect.custom]() {
    return this.toString()
  },

  is_ok: () => false,
  is_err: () => true,
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

  ok: () => None,
  err: () => Some(error)
})

/**
 * Wraps a function to return a `Result`
 * @param f the function to wrap
 * @return the wrapped function, will return `Result.Err` if the function throws an `Error`, otherwise returns `Result.Ok`
 */
function wrap<E, Args extends any[], T>(
  f: (...args: Args) => T,
  is_err: (e: any) => e is E = (e => e instanceof Error) as (e: any) => e is E
): (...args: Args) => Result<T, E> {
  return (...args: Args): Result<T, E> => {
    try {
      const result = f(...args)
      return isResult(result) ? result : Ok(result)
    } catch (e) {
      if (is_err(e)) return Err(e)
      throw new TypeError(dedent`
        Wrapped function did not throw a subclass of \`Error\`
        it instead threw \`${e}\`.
        help: try implementing a custom error type that extends \`Error\`
      `)
    }
  }
}
