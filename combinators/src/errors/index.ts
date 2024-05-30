import dedent from 'dedent'
import { inspect } from 'node:util'
import { Stream } from '../stream/index.js'
import { ToString } from '../types.js'

/**
 * The main type of Error that will be returned by Parsers
 * Used to combine together errors that Parsers may encounter
 */
export class ParseError<
  I extends ToString,
  E extends Error
> extends SyntaxError {
  input: Stream<I>
  trace: string[] = []
  errors: { [key: string]: E[] }

  /**
   * @constructor
   * @param input the remaining input to the Parser
   * @param error the type of error that was encountered during parsing
   */
  constructor(input: Stream<I>, error: E | ParseError<I, E>) {
    super()
    this.input = input
    if (typeof error === 'object' && error instanceof ParseError) {
      this.errors = error.clone().errors
    } else {
      this.errors = { [error.name]: [error] }
    }
  }

  static create<I extends ToString, E extends Error>(
    input: ParseError<I, E>['input'],
    trace: ParseError<I, E>['trace'],
    errors: ParseError<I, E>['errors']
  ): ParseError<I, E> {
    const p_err: ParseError<I, E> = Object.create(ParseError.prototype)
    p_err.input = input
    p_err.trace = trace
    p_err.errors = errors
    return p_err
  }

  toString() {
    const parser = this.trace.at(-1) ?? '<unknown>'
    const current = this.input.current?.toString() ?? '<EOF>'
    const trace_str = this.trace.join(' -> ') || '<empty>'
    const error_str = Array.from(Object.values(this.errors)).map(err =>
      Array.isArray(err) ? err.map(err => `- ${err}`).join('\n') : `${err}`
    )
    return dedent`
      ParseError: parser ${parser} failed at ${current}, due to:
      ${error_str}
      help: traceback = ${trace_str}
    `
  }
  [inspect.custom]() {
    return this.toString()
  }

  /** Utility method for cloning this error
   * @return {this} the copy of this error
   */
  clone() {
    return structuredClone(this)
  }

  /** Fetches the position where the error occurred at */
  get position() {
    return this.input.position
  }

  /** Adds a label to the traceback.
   * We add to the front as it better enables building a traceback on tail calls
   * @param name the name to add to traceback
   * @return for use in method chaining
   */
  label(name: string) {
    this.trace.unshift(name)
    return this
  }

  /** Combines this error with another and returns the result.
   * Pretty much solely used by the `alt` combinator to accumulate errors
   * @param error the error to merge with
   * @returns the `ParseError` with the new error
   */
  with<E2 extends Error>(error: E2): ParseError<I, E | E2> {
    return ParseError.create<I, E | E2>(this.input, this.trace, {
      ...this.errors,
      [error.name]: [...(this.errors[error.name] ?? []), error]
    })
  }

  /** Merges current errors with all those in another `ParseError`
   * @param errors the other parse errors to merge with
   * @returns the `ParseError` with all errors from both
   */
  merge<E2 extends Error>(errors: ParseError<I, E2>): ParseError<I, E | E2> {
    let merged: ParseError<I, E | E2>['errors'] = { ...this.errors }
    for (const [name, error] of Object.entries(errors.errors)) {
      merged[name] = [...merged[name], ...error]
    }
    return ParseError.create<I, E | E2>(this.input, this.trace, merged)
  }

  /** Replaces all current errors with the given error
   * @param error the error to replace with
   * @returns the `ParseError` with only `error`
   */
  replace<E2 extends Error>(error: E2): ParseError<I, E2> {
    return ParseError.create<I, E2>(this.input, this.trace, {
      [error.name]: [error]
    })
  }
}

export { EofError } from './eof.js'
export { MismatchError } from './mismatch.js'
export { PredicateError } from './predicate.js'
