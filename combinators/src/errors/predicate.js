import { inspect } from 'node:util'

/** @template I */
export class PredicateError extends SyntaxError {
  /** @type {(value: I) => bool} */
  #predicate

  /**
   * @constructor
   * @param {(value: I) => bool} predicate the predicate used to test items
   */
  constructor(predicate) {
    super()
    this.#predicate = predicate
  }

  toString() {
    return `Parser expected ${this.#predicate} to pass.`
  }
  [inspect.custom]() {
    return this.toString()
  }
}