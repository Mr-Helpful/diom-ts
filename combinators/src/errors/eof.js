import { inspect } from 'node:util'

export class EofError extends SyntaxError {
  toString() {
    return 'Parser expected another item.'
  }
  [inspect.custom]() {
    return this.toString()
  }

  /** Combines this error with another and returns the result
   * @param {this} _ the error to merge with
   * @return {this} for use in method chaining
   */
  push(_) {
    return this
  }
}
