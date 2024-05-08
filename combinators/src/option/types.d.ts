import { inspect } from 'node:util'
import { Result } from '../result'

/** A utility option type implementation
 * Heavily inspired by [this article](https://dev.to/rgeraldporter/building-expressive-monads-in-javascript-introduction-23b)
 */
export interface Option<T> {
  /** Displays the `Option` type and its value */
  toString(): String
  [inspect.custom](): String

  /** Whether this option contains the `Some` variant */
  is_some: boolean
  /** Whether this option contains the `None` variant */
  is_none: boolean
  /** Whether the `Some` variant satisfies `f` */
  is_some_and(f: (value: T) => boolean): boolean

  /** Unwraps the `Some` value or throws an error */
  unwrap(): T
  /** Unwraps the contained value or returns default value `d` */
  unwrap_or(d: T): T

  /** Modifies the contained value of a `Option` */
  map<R>(f: (value: T) => R): Option<R>
  /**
   * Applies the `f` to the contained value,
   * or returns default value `d` if the option is `None`.
   */
  map_or<R>(f: (value: T) => R, d: R): R

  then<R>(f: (value: T) => Option<R>): Option<R>

  or(res: Option<T>): Option<T>
  zip(res: Option<T>): Option<[T, T]>

  /** Converts the contained value into a `Result.Ok` variant */
  ok<E>(err: E): Result<T, E>
  /** Converts the contained value into a `Result.Err` variant */
  err<R>(value: R): Result<R, T>
}

export type ResultFrom<T> = T | Option<T>
