import * as parsers from './parsers/index.js'
import { C, Streams } from '@masala/parser'

/** @typedef {import("./types").Paths<typeof parsers>} ParserPath */

const result = C.char(' ').parse(Streams.ofString('f '))
console.log(result)
