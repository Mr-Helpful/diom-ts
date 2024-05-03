/** 
@template I,O,E
@typedef {import("../parser/types").Parser<I,O,E>} Parser<I,O,E>
*//**
@template P
@typedef {import("./types").ExtractOutput<P>} ExtractOutput<P>
*//**
@template P
@typedef {import("./types").ExtractError<P>} ExtractError<P>
*//**
@template I,P
@typedef {import("./types").AltParser<I,P>} AltParser<I,P>
*/

import { ParseError } from "../parser/error"
import { Result, Result } from "../result"
import { Stream } from "../stream"

/** Constructs a parser that attempts this parser and backtracks
 * @template I,O,E
 * @param {Parser<I,O,E>} parser
 * @return {Parser<I, O, E>}
 */
export function maybe(parser) {
  return input => parser(input.clone())
}

/** Constructs a parser that attempts each parser in turn,
 * returning output of the first to succeed on input
 * @template I,O,E
 * @template {Parser<I,any,Error>[]} Ps
 * @param {Parser<I,O,E>} parser the root parser to try first
 * @param {Ps} parsers the parsers to attempt in turn
 * @return {AltParser<I,Parser<I,O,E>|Ps[number]>} the parser that attempts each
 */
export function alt(parser, ...parsers) {
  const all_parsers = [parser, ...parsers]
  return input => {
    /** @type {ParseError<I,E>} */
    let recoverable = undefined
    const position = input.position

    for(const parser of all_parsers) {
      const result = parser(input)
      // parser succeeded, return output
      if(result.is_ok) return result
      // parser has consumed input, error can't be recovered, return
      if(result.is_err_and(e => position < e.position)) return result

      // error is recoverable, merge with other errors
      const error = result.unwrap_err()
      if(recoverable === undefined) {
        recoverable = error
      } else {
        recoverable.add(error)
      }
    }

    return Result.err(recoverable)
  }
}

/** Helper method that applies try to each parser and then alt
 * @template I,O,E
 * @template {Parser<I,any,Error>[]} Ps
 * @param {Parser<I,O,E>} parser the root parser to try first
 * @param {Ps} parsers the parsers to attempt in turn
 * @return {AltParser<I,Parser<I,O,E>|Ps[number]>} the parser that attempts each
 */
function alt_maybe(parser, ...parsers) {
  return alt(maybe(parser), ...parsers.map(maybe))
}

/** Constructs a parser from this parser's output and uses it
 * @template O2,E2
 * @param {Parser<I,O,E>} parser the parser to construct from
 * @param {(value: O) => Parser<I, O2, E2>} f the function to construct a parser with
 * @return {Parser<I, O2, E | E2>} the parser that uses the output to parse
 */
export function then(parser, f) {
  return input => parser(input).then(([input, output]) => f(output)(input))
}

/** Applies a function to the output of this parser
 * @template O2
 * @param {Parser<I,O,E>} parser
 * @param {(value: O) => O2} f the function to transform output with
 * @return {Parser<I, O2, E>} a parser that applies this parser and returns `f(output)`
 */
export function map(parser, f) {
  return input => parser(input).map(([input, output]) => [input, f(output)])
}

/** Applies a function to the result output of this parser
 * @template O2,E2
 * @param {Parser<I,O,E>} parser
 * @param {(value: O) => Result<O2, E2>} f
 * @return {Parser<I, O2, E2>}
 */
export function map_res(parser, f) {
  return input => parser(input).then(([input, output]) => {
    return f(output).map(output2 => [input, output2])
  })
}