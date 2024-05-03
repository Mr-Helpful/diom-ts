import { Stream } from '../stream/index'
import { Result } from '../result/types'
import { ParseError } from './error'

export type PResult<I extends string,O,E extends Error = Error> = Result<[Stream<I>, O], ParseError<I, E>>

export interface Parser<I extends string, O = any, E extends Error = Error> {
  (input: Stream<I>): Result<[Stream<I>, O], ParseError<I, E>>
}

