import { None, Option, Some } from '../option/index.js'

/**
 * An wrapper over an iterator that provides position and current symbol.
 *
 * This is useful when determining whether a parser has consumed input
 * and in printing certain errors produced by parsing.
 */
export class Stream<I> implements Iterable<I> {
  /** Tests whether a value is a stream
   * @param value
   */
  static isStream(value: any): value is Stream<any> {
    return typeof value === 'object' && value instanceof Stream
  }

  /** the wrapped input */
  #input: Iterable<I>
  /** the current item */
  #current: Option<I> = None
  /** the current position */
  #position: number = 0

  get position() {
    return this.#position
  }
  get current() {
    return this.#current
  }

  /** @param input the input iterator to use */
  constructor(input: Iterable<I>) {
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
      this.#current = Some(item)
      yield this.#current.unwrap()
      this.#position += 1
    }
    this.#current = None
  }
}
