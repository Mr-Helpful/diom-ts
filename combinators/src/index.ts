import assert from 'assert'
import {
  EofError,
  MismatchError,
  ParseError,
  PredicateError
} from './errors/index.js'
import { Option } from './option.js'
import { Err, Ok, Result, isResult } from './result.js'
import { Stream } from './stream.js'
import type {
  AltParser,
  ExtractError,
  PFromFunc,
  PFunc,
  ToString,
  ZipOutput,
  ZipParser
} from './types.js'

/** Hints to the typescript compiler that a value is a type */
function assert_type<T>(_: any): asserts _ is T {
  return
}

/** A Wrapper for Parser functions that adds common combinators */
export class Parser<O, E extends Error = Error, I extends ToString = string> {
  /** Tests if a value is a valid parser output */
  static isParserOutput<I, O>(value: any): value is [Stream<I>, O] {
    return (
      Array.isArray(value) && value.length == 2 && Stream.isStream(value[0])
    )
  }

  /** @constructor */
  constructor(public parser: PFunc<I, O, E>) {}

  /** Creates a function that has parser methods
   * @param parser the parser function to add methods to
   * @returns the function with methods
   */
  static create<O, E extends Error, I extends ToString>(
    parser: PFunc<I, O, E>
  ): PFunc<I, O, E> & Parser<O, E, I> {
    return Object.assign(parser, new Parser(parser))
  }

  /** Converts from function based parsers.
   *
   * This handles a few common pitfalls when defining parsing functions:
   * - not returning a `Result` type from a parser, throwing errors instead
   * - only returning the output on a successful parse
   * - not returning a `ParseError` with the input on a failed parse
   *
   * @param parser the parsing function to be converted
   */
  static from_func<O, E extends Error, I extends ToString>(
    parser: PFromFunc<I, O, E>
  ): Parser<O, E, I> {
    return Parser.create(input => {
      try {
        let result = parser(new Stream(input))
        if (!isResult(result)) result = Ok(result)
        return result
          .map((out): [Stream<I>, O] =>
            Parser.isParserOutput(out) ? out : [input, out]
          )
          .map_err(err => new ParseError(input, err))
      } catch (err) {
        return Err(new ParseError(input, err as E))
      }
    })
  }

  /** Trivially succeeds with `output`
   * @param output the output to always return
   */
  static success<I extends ToString, O>(output: O): Parser<O, never, I> {
    return Parser.create(input => Ok([input, output]))
  }

  /** Creates output for a successful parse
   * @param input the input received
   * @param output the output to return
   */
  static succeeded<I extends ToString, O>(
    input: Stream<I>,
    output: O
  ): Result<[Stream<I>, O], never> {
    return Ok([input, output])
  }

  /** Trivially fails with `error`
   * @param error the error to always fail with
   */
  static failure<I extends ToString, E extends Error>(
    error: E
  ): Parser<never, E, I> {
    return Parser.create(input => Err(new ParseError(input, error)))
  }

  /** Creates an error for a failed parse
   * @param input the input received
   * @param error the error to fail with
   */
  static failed<I extends ToString, E extends Error>(
    input: Stream<I>,
    error: E
  ): Result<never, ParseError<I, E>> {
    return Err(new ParseError(input, error))
  }

  /** Consumes an item and throws if it doesn't match `f`
   * @param f the function to test the item with
   */
  static matches<I extends ToString>(
    f: (value: I) => boolean
  ): Parser<I, EofError | PredicateError<I>, I> {
    return Parser.create(input => {
      let item = input[Symbol.iterator]().next()
      if (item.done) return Parser.failed(input, new EofError())
      if (!f(item.value)) return Parser.failed(input, new PredicateError(f))
      return Ok([input, item.value])
    })
  }

  /** Matches a single item, returning that item on success
   * @param item the item to match against
   */
  static char<I extends ToString>(item: I): Parser<I, MismatchError<I>, I> {
    return Parser.matches<I>(i => i === item).map_err(err =>
      err.replace(new MismatchError(item))
    )
  }

  /** Matches each item in an iterable, returning after all after success
   * @param items the items to match in sequence
   */
  static str<I extends ToString>(
    items: Iterable<I>
  ): Parser<I[], MismatchError<I>, I> {
    const parsers = Array.from(items).map(Parser.char)
    if (parsers.length === 0) return Parser.success([])
    return parsers[0].zip(...parsers.slice(1))
  }

  /** Helper method for parsing input.
   * The only difference here is that this can be better typechecked...
   * @param input the input to the parser
   */
  parse(input: Stream<I>): Result<[Stream<I>, O], ParseError<I, E>> {
    return this.parser(input)
  }

  /** Constructs a parser that attempts this parser and backtracks */
  maybe(): Parser<O, E, I> {
    return Parser.create(input => this.parse(input.clone()))
  }

  zip<Ps extends Parser<any, Error, I>[]>(
    ...parsers: Ps
  ): ZipParser<I, [this, ...Ps]> {
    const all_parsers = [this, ...parsers]
    return Parser.create(input => {
      let outputs = []

      for (const parser of all_parsers) {
        const result = parser.parse(input)
        if (result.is_err()) {
          return result as Result<
            never,
            ParseError<I, ExtractError<this | Ps[number]>>
          >
        }

        const [new_input, output] = result.unwrap()
        input = new_input
        outputs.push(output)
      }

      return Ok([input, outputs as ZipOutput<[this, ...Ps]>])
    })
  }

  /** Constructs a parser that attempts each parser in turn,
   * returning output of the first to succeed on input
   * @param parsers the parsers to attempt in turn
   * @return the parser that attempts each in turn
   */
  alt<Ps extends Parser<any, Error, I>[]>(
    ...parsers: Ps
  ): AltParser<I, this | Ps[number]> {
    return Parser.create(input => {
      let recoverable:
        | ParseError<I, ExtractError<this | Ps[number]>>
        | undefined
      const position = input.position

      for (const parser of [this, ...parsers]) {
        const result = parser.parse(input)
        // parser succeeded, return output
        if (result.is_ok()) return result
        assert_type<
          Result<never, ParseError<I, ExtractError<this | Ps[number]>>>
        >(result)

        // parser has consumed input, error can't be recovered, return
        if (result.is_err_and(e => position < e.position)) return result

        // error is recoverable, merge with other errors
        const error = result.unwrap_err()
        recoverable = recoverable?.merge?.(error) ?? error
      }

      assert(recoverable !== undefined)
      return Err(recoverable)
    })
  }

  /** Helper method that applies maybe to each parser and then alt
   * @param parsers the parsers to attempt in turn
   * @return the parser that attempts each
   */
  alt_maybe<Ps extends Parser<any, any, I>[]>(
    ...parsers: Ps
  ): AltParser<I, this | Ps[number]> {
    return this.maybe().alt(...parsers.map(parser => parser.maybe()))
  }

  /** Constructs that accepts either `this` or an empty string */
  opt(): Parser<Option<O>, E, I> {
    return Parser.create(input => {
      let result = this.parse(input.clone())
      return Ok([input, result.ok().map(([_, output]) => output)])
    })
  }

  /** Constructs a parser that applies `this` some number of times
   * @param range a range for a number of times that the parser will be called, defaults to any number of times
   */
  many(
    range: [number] | [number, number] = [0, Number.MAX_VALUE]
  ): Parser<O[], E, I> {
    const [start, end] = range.length === 1 ? [0, range[0]] : range
    return Parser.create(input => {
      let outputs = []
      let i = 0

      for (; i < end; i++) {
        const result = this.parse(input)
        if (result.is_err()) {
          if (i < start) return result
          continue
        }
        const [new_input, output] = result.unwrap()
        input = new_input
        outputs.push(output)
      }

      return Ok([input, outputs])
    })
  }

  /** Constructs a parser from this parser's output and uses it
   * @param f the function to construct a parser with
   * @return the parser that uses the output to parse
   */
  then<O2, E2 extends Error>(
    f: (value: O) => Parser<O2, E2, I>
  ): Parser<O2, E | E2, I> {
    return Parser.create(
      (input): Result<[Stream<I>, O2], ParseError<I, E | E2>> =>
        this.parse(input).then(([input, output]) => f(output).parse(input))
    )
  }

  /** Applies a function to the result output of this parser
   * @template O2,E2
   * @param {(value: O) => Result<O2, E2>} f
   * @return {Parser<I, O2, E2>}
   */
  then_res<O2, E2 extends Error>(
    f: (value: O) => Result<O2, E2>
  ): Parser<O2, E | E2, I> {
    return Parser.create(
      (input): Result<[Stream<I>, O2], ParseError<I, E | E2>> =>
        this.parse(input).then(([input, output]) =>
          f(output)
            .map((output2): [Stream<I>, O2] => [input, output2])
            .map_err(err => new ParseError(input, err))
        )
    )
  }

  /** Applies a function to the output of this parser
   * @param f the function to transform output with
   * @return a parser that returns `f(output)` on success
   */
  map<O2>(f: (value: O) => O2): Parser<O2, E, I> {
    return Parser.create(input =>
      this.parse(input).map(([input, output]) => [input, f(output)])
    )
  }

  /** Applies a function to the error from this parser
   * @param f the function to transform the error with
   * @return a parser that returns `f(error)` on failure
   */
  map_err<E2 extends Error>(
    f: (error: ParseError<I, E>) => ParseError<I, E2>
  ): Parser<O, E2, I> {
    return Parser.create(input => this.parse(input).map_err(f))
  }
}
