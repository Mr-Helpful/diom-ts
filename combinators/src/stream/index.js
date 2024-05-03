/** @template I */
export class Stream {
  /** @type {Iterable<I>} */
  #input
  /** @type {I | undefined} */
  #current = undefined
  /** @type {number} */
  #position = 0

  get position() {
    return this.#position
  }
  get current() {
    return this.#current
  }

  /** @param {Iterable<I>} input */
  constructor(input) {
    this.#input = input
  }

  /** Helper method to clone this iterator
   * @todo it's possible to do some clever stuff where cloned
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
