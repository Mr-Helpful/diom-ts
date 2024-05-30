import { inspect } from 'node:util'

/** A Parser encountered an invalid item whilst attempting to parse */
export class PredicateError<I> extends SyntaxError {
  /**
   * @constructor
   * @param predicate the predicate used to test items
   */
  constructor(public predicate: (value: I) => boolean) {
    super()
  }

  toString() {
    return `Parser expected ${this.predicate} to pass.`
  }
  [inspect.custom]() {
    return this.toString()
  }
}
