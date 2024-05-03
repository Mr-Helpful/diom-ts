import { ParseError } from './error.js'
import { Result } from '../result/index.js'

/** @template T */
export class Parser {
  /** @type {(input: string) => ParseResult<T>} */
  #parser

  /** Constructs a parser class from either a `Parser` or a function
   * @param {Parser<T> | (input: string) => ParseResult<T> | string} parser
   */
  constructor(parser) {
    if (parser instanceof Parser) {
      this.#parser = parser
    } else if (typeof parser === 'string') {
      // @todo implement a string matching parser
      this.#parser = input => ({ variant: 'err', error: ParseError() })
    } else if (typeof parser === 'function') {
      this.#parser = parser
    } else {
      throw TypeError(`Unable to construct a Parser from ${parser}`)
    }
  }

  /** Single character parser
   * @param {string} char the character to match
   * @return {Parser<string>} a parser that returns the given character on match
   */
  static chr(char) {
    return Parser(input =>
      input[0] === char ? Result.ok(char) : Result.err(ParseError)
    )
  }

  /** Multi character string parser */
  static str(chars) {
    return Parser(
      Result.wrap(input => {
        for (const char of chars) {
        }
      })
    )
  }

  /**
   * @template U
   * @param {(value: T) => Parser<U>}
   */
  then(f) {}

  /**
   * @template U
   * @param {(value: T) => U}
   */
  map(f) {}

  /**
   * @template U
   * @param {(value: T) => }
   */
  map_res(f) {}

  zip(parser) {}

  /** Runs a parser on the given input string */
  parse(input) {
    return this.#parser(input)
  }
}
Parser.prototype = function (input) {
  this.parse(input)
}
