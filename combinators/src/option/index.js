import { inspect } from 'node:util'
import { Result } from '../result'

/**
 * @template T
 * @typedef {import("./types").Option<T>} Option<T>
 */

const OptionSymbol = Symbol('Option')

/** Tests whether a value is a Option
 * @param value
 * @return {value is Option<any>}
 */
const isOption = value =>
  typeof value === 'object' && value[OptionSymbol] === true

/**
 * `Some` variant for the `Option` type.
 * Represents a successful operation.
 * @type {(value: T) => Option<T>}
 */
const Some = value => ({
  [OptionSymbol]: true,

  toString: () => `Option.Some(${value})`,
  [inspect.custom]() {
    return this.toString()
  },

  is_some: true,
  is_none: false,
  is_some_and: f => f(value),

  unwrap: () => value,
  unwrap_or: _ => value,

  map: f => Some(f(value)),
  map_or: (f, _) => f(value),

  then: f => f(value),
  or: _ => Some(value),
  zip: res => res.map(other => [value, other]),

  ok: _ => Result.Ok(value),
  err: _ => Result.Err(value)
})

/**
 * `None` variant for the `Option` type.
 * Represents a failed operation.
 * @template T
 * @type {Option<T>}
 */
const None = {
  [OptionSymbol]: true,

  toString: () => `Option.None`,
  [inspect.custom]() {
    return this.toString()
  },

  is_some: false,
  is_none: true,
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

  ok: error => Result.Err(error),
  err: value => Result.Ok(value)
}

const Option = { isOption, Some, None }
export { Option }
