import { Parser } from "../parser/types"

/** Extracts the error out of a union of `Parser`s */
type ExtractError<P> = P extends Parser<any, any, infer E> ? E : never
/** Extracts the output out of a union of `Parser`s */
type ExtractOutput<P> = P extends Parser<any, infer I> ? I : never
/** The Parser returned by the `alt` combinator, shares outputs and errors of all variants */
type AltParser<I, P> = Parser<I, ExtractOutput<P>, ExtractError<P>>

export interface Combinators<I, O = any, E extends Error = Error> {
  /** Constructs a parser that attempts this parser and backtracks */
  try(): Parser<I, O, E>

  /** Constructs a parser that attempts each parser in turn,
   * returning output of the first to succeed on input
   * @param parsers the parsers to attempt in turn
   * @return the parser that attempts each
   */
  alt<Ps extends Parser<I, any>[]>(...parsers: Ps): Parser<I, ExtractOutput<Ps[number]>, ExtractError<Ps[number]>>

  /** Helper method that applies try to each parser and then alt
   * @note maybe implement this?
   */
  // alt_try

  /** Constructs a parser from this parser's output and uses it
   * @param f the function to construct a parser with
   * @return the parser that uses the output to parse
   */
  then<O2, E2>(f: (value: O) => Parser<I, O2, E2>): Parser<I, O2, E | E2>

  /** Applies a function to the output of this parser
   * @param f the function to transform output with
   * @return a parser that applies this parser and returns `f(output)`
   */
  map<O2>(f: (value: O) => O2): Parser<I, O2, E>

  /** Applies a function to the result output of this parser */
  map_res<O2, E2>(f: (value: O) => Result<O2, E2>): Parser<I, O2, E2>
}