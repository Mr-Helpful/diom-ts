/** @template T @typedef {import("../option/types").Option<T>} Option<T> */
import { Option } from '../option'

/**
 * An wrapper over an iterator that provides position and current symbol.
 *
 * This is useful when determining whether a parser has consumed input
 * and in printing certain errors produced by parsing.
 * @template I
 * @extends {Iterable<I>}
 */
export class Stream extends Iterable {
  /** Tests whether a value is a stream
   * @param value
   * @return {value is Stream<any>}
   */
  static isStream(value) {
    return typeof value === 'object' && value instanceof Stream
  }

  /** @type {Iterable<I>} the wrapped input */
  #input
  /** @type {Option<I>} the current item */
  #current = Option.None
  /** @type {number} the current position */
  #position = 0

  get position() {
    return this.#position
  }
  get current() {
    return this.#current
  }

  /** @param {Iterable<I>} input the input iterator to use */
  constructor(input) {
    super()
    this.#input = Stream.isStream(input) ? input.clone().#input : input
  }

  /** Helper method to clone this iterator
   * @note it's possible to do some clever stuff where cloned
   * values use the original iterator and keep a temporary stack
   * which is then consumed to catch up, saving memory
   * @return {this}
   */
  clone() {
    return structuredClone(this)
  }

  *[Symbol.iterator]() {
    for (const item of this.#input) {
      this.#current = item
      yield this.#current
      this.#position += 1
    }
    this.#current = undefined
  }
}
