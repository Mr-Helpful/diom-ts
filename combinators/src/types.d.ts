import { Stream } from './stream/index'
import { Result, ResultFrom } from './result/types'
import { ParseError } from './errors/index'
import { Parser } from '.'

/** The parser returned by the `alt` parser combinator */
export type AltParser<I,P> = Parser<I,ExtractOutput<P>,ExtractError<P>>
type ExtractOutput<P> = P extends Parser<any,infer O,any> ? O : never
type ExtractError<P> = P extends Parser<any,any,infer E> ? E : never

/** The base types for parsing functions.
 * Takes an input and returns remaining input and output on success 
 */
export type PFunc<I, O, E extends Error = Error> =
  (input: Stream<I>) => Result<[Stream<I>, O], ParseError<I, E>>

/** A parsing function that can be converted into the parser */
export type PFromFunc<I,O,E> = (
  input: Stream<I> | Iterable<I>
) => ResultFrom<[Stream<I>, O] | O, ParseError<I, E> | E>

/** Something that can be converted into a parser */
export type PFrom<I,O,E extends Error> = PFromFunc<I,O,E> | Iterable<I>