import dedent from 'dedent'
import { inspect } from 'node:util'
import { Stream } from '../stream'

/**
 * The main type of Error that will be returned by Parsers
 * Used to combine together errors that Parsers may encounter
 * @template {{toString(): string}} I
 * @template {Error} E
 */
export class ParseError extends SyntaxError {
  /** @type {string[]} */
  #trace = []
  /** @type {Map<string,E extends {push(...items: E[]): void} ? E : E[]>} */
  #errors = {}
  /** @type {Stream<I>} */
  #input

  /**
   * @constructor
   * @param {Stream<I>} input the remaining input to the Parser
   * @param {E} error the type of error that was encountered during parsing
   */
  constructor(input, error) {
    super()
    this.#input = input
    if (typeof error === 'object' && error instanceof ParseError) {
      this.#errors = error.clone().#errors
    } else {
      this.push(error)
    }
  }

  toString() {
    const parser = this.#trace.at(-1) ?? '<unknown>'
    const current = this.#input.current?.toString() ?? '<EOF>'
    const trace_str = this.#trace.join(' -> ') || '<empty>'
    const error_str = Array.from(this.#errors.values()).map(err =>
      Array.isArray(err) ? err.map(err => `- ${err}`).join('\n') : `${err}`
    )
    return dedent`
      ParseError: parser ${parser} failed at ${current}, due to:
      ${error_str}
      help: traceback = ${trace_str}
    `
  }
  [inspect.custom]() {
    return this.toString()
  }

  /** Utility method for cloning this error
   * @return {this} the copy of this error
   */
  clone() {
    return structuredClone(this)
  }

  /** Fetches the position where the error occurred at */
  get position() {
    return this.#input.position
  }

  /** Adds a label to the traceback.
   * We add to the front as it better enables building a traceback on tail calls
   * @param {string} name the name to add to traceback
   * @return {this} for use in method chaining
   */
  label(name) {
    this.#trace.unshift(name)
    return this
  }

  /** Combines this error with another and returns the result.
   * Pretty much solely used by the `alt` combinator to accumulate errors
   * @template {Error} E2
   * @param {E2} error the error to merge with
   * @return {ParseError<I,E|E2>} for use in method chaining
   */
  push(error) {
    if (this.#errors[error.name] !== undefined) {
      this.#errors[error.name].push(error)
    } else if (typeof error.push === 'function') {
      this.#errors[error.name] = error
    } else {
      this.#errors[error.name] = [error]
    }
    return this
  }

  /** Replaces all current errors with the given error
   * @template E2
   * @param {E2} error the error to replace with
   * @return {ParseError<I, E2>} for use in method chaining
   */
  replace(error) {
    this.#errors = {}
    this.push(error)
    return this
  }
}

export { EofError } from './eof'
export { MismatchError } from './mismatch'
export { PredicateError } from './predicate'
