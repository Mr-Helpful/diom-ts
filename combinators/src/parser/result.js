import { ParseError } from './error'
import { Result, wrap_factory } from '../result'

// we'll need this result variant to unify its parse errors when:
// 1.

/**
 * @template T
 * @template {ParseError} E
 * @typedef {import("../result/types").Result<[string, T], E>} ParseResult<T,E>
 */

/**
 * Ok variant for the `Result` type.
 * Represents a successful operation.
 * @template T,E
 * @type {(value: [string, T]) => ParseResult<T,E>}
 */
const ok = value => ({ ...Result.ok(value) })

/**
 * Err variant for the `Result` type.
 * Represents a failed operation.
 * @template T,E
 * @type {(error: E) => ParseResult<T,E>}
 */
const err = error => ({ ...Result.err(error) })

const ParseResult = { ok, err, wrap: wrap_factory(ok, err) }
export { ParseResult }
