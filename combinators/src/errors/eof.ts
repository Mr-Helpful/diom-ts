import { inspect } from 'node:util'

/** A Parser ran out of input whilst attempting to parse */
export class EofError extends SyntaxError {
  toString() {
    return 'Parser expected another item.'
  }
  [inspect.custom]() {
    return this.toString()
  }
}
