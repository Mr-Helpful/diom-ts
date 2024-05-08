import { inspect } from 'node:util'
import { Option } from '../option/types'

/** A utility result type implementation
 * Heavily inspired by [this article](https://dev.to/rgeraldporter/building-expressive-monads-in-javascript-introduction-23b)
 */
export interface Result<T, E> {
  /** Displays the Result type and its value / error */
  toString(): String
  [inspect.custom](): String

  /** Whether this result contains the `Ok` variant */
  is_ok: boolean
  /** Whether this result contains the `Err` variant */
  is_err: boolean
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

  then<R>(f: (value: T) => Result<R, E>): Result<R, E>
  then_err<R>(f: (value: E) => Result<T, R>): Result<T, R>
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
