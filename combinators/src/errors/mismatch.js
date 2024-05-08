import { inspect } from 'node:util'

/** @template I */
export class MismatchError extends SyntaxError {
  /** @type {Set<I>} */
  #expected

  /**
   * @constructor
   * @param {I} expected the next character expected by the parser
   */
  constructor(expected) {
    super()
    this.#expected = new Set([expected])
  }

  toString() {
    const expected = Array.from(this.#expected.values())
    return `Parser expected one of [${expected}].`
  }
  [inspect.custom]() {
    return this.toString()
  }

  /** Combines this error with another and returns the result
   * @param {this} error the error to merge with
   * @return {this} for use in method chaining
   */
  push(error) {
    error.#expected.forEach(e => this.#expected.add(e))
    return this
  }
}
