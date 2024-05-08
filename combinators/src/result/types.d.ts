import { inspect } from 'node:util'

/** A utility result type implementation */
export interface Result<T, E> {
  /** Displays the Result type and its value / error */
  toString(): String
  [inspect.custom](): String

  /** Whether this result contains the `ok` variant */
  is_ok: boolean
  /** Whether this result contains the `err` variant */
  is_err: boolean
  /** Whether the `ok` variant satisfies `f` */
  is_ok_and(f: (value: T) => boolean): boolean
  /** Whether the `err` variant satisfies `f` */
  is_err_and(f: (error: E) => boolean): boolean

  /** Unwraps the `ok` value or throws the contained error */
  unwrap(): T
  /** Unwraps the contained value or returns default value `d` */
  unwrap_or(d: T): T
  /** Unwraps the `err` value or throws a generic error */
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
}

export type ResultFrom<T,E> = T | Result<T,E>

export type ResultWrapper<E extends Error = Error> = <Args extends any[], T>(
  f: (...args: Args) => T
) => (...args: Args) => T extends Result<any,E> ? T : Result<T, E>
