/** @template I,O,E @typedef {import("./types").PFunc<I,O,E>} PFunc<I,O,E> */
/** @template I,O,E @typedef {import("./types").PFromFunc<I,O,E>} PFromFunc<I,O,E> */
/** @template I,O,E @typedef {import("./types").PFrom<I,O,E>} PFrom<I,O,E> */
/** @template I,P @typedef {import("./types").AltParser<I,P>} AltParser<I,P> */
/** @template I @typedef {import("./stream").Stream<I>} Stream<I> */
/** @template T @typedef {import("./option/types").Option<T>} Option<T> */
import {
  EofError,
  MismatchError,
  ParseError,
  PredicateError
} from './errors/index'
import { Option } from './option'
import { Result } from './result'
import { Stream } from './stream'

/** Helper method for Parser failures
 * @template I,E
 * @param {Stream<I>} input
 * @param {E} error
 */
export function parse_failure(input, error) {
  return Result.Err(new ParseError(input, error))
}

/**
 * A Wrapper for Parser functions that adds common combinators
 * @template I,O
 * @template {Error} E
 * @extends {PFunc<I,O,E>}
 */
export class Parser extends Function {
  /** Tests whether a value is a Parser
   * @param value
   * @return {value is Parser<any,any,any>}
   */
  static isParser(value) {
    return typeof value === 'object' && value instanceof Parser
  }

  /** Tests if a value is a valid parser output */
  static isParserOutput(value) {
    return (
      Array.isArray(value) && value.length == 2 && Stream.isStream(value[0])
    )
  }

  /** @constructor @param {PFunc<I,O,E>} f */
  constructor(f) {
    return Object.assign(f, new.target.prototype)
  }

  /** Converts from function based parsers.
   *
   * This handles a few common pitfalls when defining parsing functions:
   * - not returning a `Result` type from a parser, throwing errors instead
   * - only returning the output on a successful parse
   * - not returning a `ParseError` with the input on a failed parse
   *
   * @template I,O
   * @template {Error} E
   * @param {PFromFunc<I,O,E>} f
   */
  static from_func(f) {
    return new Parser(input =>
      Result.wrap(f)(Stream.from(input))
        .map(out => (Parser.isParserOutput(out) ? out : [input, out]))
        .map_err(err => ParseError.from(input, err))
    )
  }

  /** Provides conversion from simpler forms of parsers
   * @template I,O
   * @template {Error} E
   * @param {PFrom<I,O,E>} f
   */
  static from(f) {
    return typeof f === 'function' ? Parser.from_func(f) : Parser.str(f)
  }

  /** Trivially succeeds with `output`
   * @param {O} output the output to always return
   * @return {Parser<I,O,E>}
   */
  static success(output) {
    return new Parser(input => Result.Ok([input, output]))
  }

  /** Trivially fails with `error`
   * @param {E} error the error to always fail with
   * @return {Parser<I,O,E>}
   */
  static failure(error) {
    return new Parser(input => Result.Err(new ParseError(input, error)))
  }

  /** Consumes an item and throws if it doesn't match `f`
   * @param {(value: I) => bool} f the function to test the item with
   * @return {Parser<I,I,E>}
   */
  static matches(f) {
    return new Parser(input => {
      let item = input[Symbol.iterator]().next()
      if (item.done) return Parser.failure(new EofError())(input)
      if (!f(item.value)) return Parser.failure(new PredicateError(f))(input)
      return [input, item.value]
    })
  }

  /** Matches a single item, returning that item on success
   * @param {I} item the item to match against
   * @return {Parser<I, I, E>}
   */
  static char(item) {
    return Parser.matches(i => i === item).map_err(err =>
      err.replace(new MismatchError(item))
    )
  }

  /** Matches each item in an iterable, returning after all after success
   * @param {Iterable<I>} items the items to match in sequence
   * @return {Parser<I, Array<I>, E>}
   */
  static str(items) {
    const arr_items = Array.from(items)
    return new Parser(
      Result.wrap(input => {
        for (const item of arr_items) {
          input = Parser.char(item).parse(input).unwrap()[0]
        }
        return arr_items
      })
    )
  }

  /** Helper method for parsing input.
   * The only difference here is that this can be better typechecked...
   * @param {Stream<I>} input
   * @return {Result<[Stream<I>, O], ParseError<I,E>>}
   */
  parse(input) {
    return this(input)
  }

  /** Constructs a parser that attempts this parser and backtracks
   * @return {this}
   */
  maybe() {
    return new Parser(input => this.parse(input.clone()))
  }

  /** Constructs a parser that attempts each parser in turn,
   * returning output of the first to succeed on input
   * @template {Parser<I,any,Error>[]} Ps
   * @param {Ps} parsers the parsers to attempt in turn
   * @return {AltParser<I,Parser<I,O,E>|Ps[number]>} the parser that attempts each
   */
  alt(...parsers) {
    const all_parsers = [this, ...parsers]
    return new Parser(input => {
      /** @type {ParseError<I,E>} */
      let recoverable
      const position = input.position

      for (const parser of all_parsers) {
        const result = parser(input)
        // parser succeeded, return output
        if (result.is_ok) return result
        // parser has consumed input, error can't be recovered, return
        if (result.is_err_and(e => position < e.position)) return result

        // error is recoverable, merge with other errors
        const error = result.unwrap_err()
        if (recoverable === undefined) {
          recoverable = error
        } else {
          recoverable.push(error)
        }
      }

      return Result.Err(recoverable)
    })
  }

  /** Helper method that applies maybe to each parser and then alt
   * @template {Parser<I,any,Error>[]} Ps
   * @param {Ps} parsers the parsers to attempt in turn
   * @return {AltParser<I,Parser<I,O,E>|Ps[number]>} the parser that attempts each
   */
  alt_maybe(...parsers) {
    return this.maybe().alt(...parsers.map(this.maybe.call))
  }

  /** Constructs that accepts either `this` or an empty string
   * @return {Parser<I, Option<O>, E>}
   */
  opt() {
    return new Parser(input => {
      let result = this.parse(input.clone())
      return Result.Ok([input, result.ok().map(([_, output]) => output)])
    })
  }

  /** Constructs a parser that applies `this` some number of times
   * @param {[number] | [number, number]} range a range for a number of times that the parser will be called, defaults to any number of times
   * @return {Parser<I, O[], E>}
   */
  many(range = [0, Number.MAX_VALUE]) {
    const [start, end] = range.length === 1 ? [0, range[0]] : range
    return new Parser(input => {
      let outputs = []
      /** @type {O} */
      let output
      let i = 0

      try {
        for (; i < end; i++) {
          ;[input, output] = this.parse(input).unwrap()
          outputs.push(output)
        }
      } catch (e) {
        if (i < start) return Result.Err(e)
      }

      return Result.Ok(outputs)
    })
  }

  /** Constructs a parser from this parser's output and uses it
   * @template O2,E2
   * @param {(value: O) => Parser<I, O2, E2>} f the function to construct a parser with
   * @return {Parser<I, O2, E | E2>} the parser that uses the output to parse
   */
  then(f) {
    return input => this(input).then(([input, output]) => f(output)(input))
  }

  /** Applies a function to the result output of this parser
   * @template O2,E2
   * @param {(value: O) => Result<O2, E2>} f
   * @return {Parser<I, O2, E2>}
   */
  then_res(f) {
    return input =>
      this(input).then(([input, output]) => {
        return f(output).map(output2 => [input, output2])
      })
  }

  /** Applies a function to the output of this parser
   * @template O2
   * @param {(value: O) => O2} f the function to transform output with
   * @return {Parser<I, O2, E>} a parser that returns `f(output)` on success
   */
  map(f) {
    return input => this(input).map(([input, output]) => [input, f(output)])
  }

  /** Applies a function to the error from this parser
   * @template E2
   * @param {(error: ParseError<I,E>) => ParseError<I,E2>} f the function to transform the error with
   * @return {Parser<I, O, E2>} a parser that returns `f(error)` on failure
   */
  map_err(f) {
    return input => this(input).map_err(f)
  }
}
