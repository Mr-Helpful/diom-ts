export { Parser } from './temp'

/**
 * @template I,O,E
 * @typedef {import("./types").Parser<I,O,E>} Parser<I,O,E>
 */

/**
 * @template I,O,E
 * @type {Parser<I, O, E>}
 */
const methods = {
  try() {
    return of(input => this(input).map_err(e => e))
  }
}

/**  */
const of = f
