import { inspect } from 'node:util'
import { Err, Ok, type Result } from '../result/index.js'

const OptionSymbol = Symbol('Option')

/** A utility option type implementation
 * Heavily inspired by [this article](https://dev.to/rgeraldporter/building-expressive-monads-in-javascript-introduction-23b)
 */
export interface Option<T> {
  [OptionSymbol]: true

  /** Displays the `Option` type and its value */
  toString(): string
  [inspect.custom](): string

  /** Whether this option contains the `Some` variant */
  is_some(): boolean
  /** Whether this option contains the `None` variant */
  is_none(): boolean
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

/** Tests whether a value is a Option */
export const isOption = (value: any): value is Option<any> =>
  typeof value === 'object' && value[OptionSymbol] === true

/**
 * `Some` variant for the `Option` type.
 * Represents the presence of a value.
 */
export const Some = <T>(value: T): Option<T> => ({
  [OptionSymbol]: true,

  toString: () => `Option.Some(${value})`,
  [inspect.custom]() {
    return this.toString()
  },

  is_some: () => true,
  is_none: () => false,
  is_some_and: f => f(value),

  unwrap: () => value,
  unwrap_or: _ => value,

  map: f => Some(f(value)),
  map_or: (f, _) => f(value),

  then: f => f(value),
  or: _ => Some(value),
  zip: res => res.map(other => [value, other]),

  ok: _ => Ok(value),
  err: _ => Err(value)
})

/**
 * `None` variant for the `Option` type.
 * Represents the absence of a value.
 */
export const None: Option<never> = {
  [OptionSymbol]: true,

  toString: () => `Option.None`,
  [inspect.custom]() {
    return this.toString()
  },

  is_some: () => false,
  is_none: () => true,
  is_some_and: _ => false,

  unwrap() {
    throw new TypeError('Cannot unwrap `None` value')
  },
  unwrap_or: d => d,

  map: _ => None,
  map_or: (_, d) => d,

  then: _ => None,
  or: res => res,
  zip: _ => None,

  ok: error => Err(error),
  err: value => Ok(value)
}
