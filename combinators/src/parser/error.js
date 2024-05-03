import dedent from 'dedent'
import { inspect } from 'node:util'
import { Stream } from '../stream'

/** A ParseError should:
 * 1. have a position that it occurs at
 * 2. contain all expected next values
 * @template {string}[I=string]
 * @template {Error} E
 */
export class ParseError extends SyntaxError {
  /** @type {string[]} */
  #trace = []
  /** @type {Error[]} */
  #errors = []
  /** @type {Stream<I>} */
  #input

  /**
   * @constructor
   * @param {Stream<I>} input
   */
  constructor(input) {
    this.#input = input
  }

  toString() {
    const parser = this.#trace.at(-1) ?? '<unknown>'
    const current = this.#input.current ?? '<EOF>'
    const trace_str = this.#trace.join(' -> ') || '<empty>'
    return dedent`
      ParseError: parser ${parser} failed at ${current}, due to:
      ${this.#errors}
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
   * @param {this} error the error to merge with
   * @return {this} for use in method chaining
   */
  add(error) {
    // @todo come up with a better version of merging errors
    // it should ideally merge errors of the same type, simplifying them
    // and should produce nicer errors when `console.log`ing
    this.#errors.push(error)
  }
}

/** @template I */
export class ItemMismatch extends ParseError {
  /** @type {Set<I>} */
  #expected

  /**
   * @constructor
   * @param {Stream<I>} input the remaining input to the parser
   * @param {I} expected the next character expected by the parser
   */
  constructor(expected) {
    this.#expected = new Set([expected])
  }

  toString() {
    const expected = Array.from(this.#expected.values())
    return dedent`ItemMismatch expected one of [${expected}].`
  }
  [inspect.custom]() {
    return this.toString()
  }

  /** Combines this error with another and returns the result
   * @param {this} error the error to merge with
   * @return {this} for use in method chaining
   */
  add(error) {
    error.#expected.forEach(e => this.#expected.add(e))
    return this
  }
}
