import { ParseError } from './errors/index.js'
import { Parser } from './index.js'
import { Result, ResultFrom } from './result.js'
import { Stream } from './stream.js'

export interface ToString {
  toString(): string
}

export type ExtractError<P> = P extends Parser<any, infer E, any> ? E : never

export type AltOutput<P> = P extends Parser<infer O, any, any> ? O : never
/** The parser returned by the `alt` parser combinator */
export type AltParser<I extends ToString, P> = Parser<
  AltOutput<P>,
  ExtractError<P>,
  I
>

export type ZipOutput<Ps extends any[]> = {
  [K in keyof Ps]: Ps[K] extends Parser<infer O, any, any> ? O : never
}
/** The parser returned by the `zip` parser combinator */
export type ZipParser<I extends ToString, Ps extends any[]> = Parser<
  ZipOutput<Ps>,
  ExtractError<Ps[number]>,
  I
>

/** The base types for parsing functions.
 * Takes an input and returns remaining input and output on success
 */
export type PFunc<I extends ToString, O, E extends Error = Error> = (
  input: Stream<I>
) => Result<[Stream<I>, O], ParseError<I, E>>

/** A parsing function that can be converted into the parser */
export type PFromFunc<I extends ToString, O, E extends Error> = (
  input: Stream<I> | Iterable<I>
) => ResultFrom<[Stream<I>, O] | O, ParseError<I, E> | E>
