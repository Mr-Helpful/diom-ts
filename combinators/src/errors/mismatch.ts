import { inspect } from 'node:util'

/** A Parser encountered an incorrect item whilst attempting to parse */
export class MismatchError<I> extends SyntaxError {
  /**
   * @constructor
   * @param expected the next character expected by the parser
   */
  constructor(public expected: I) {
    super()
  }

  toString() {
    return `Parser expected ${this.expected}.`
  }
  [inspect.custom]() {
    return this.toString()
  }
}
