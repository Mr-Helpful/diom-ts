import { ASTNode } from './nodes'

export type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}.${P}`
    : never
  : never

/** The type for all parsers used in this library */
export type Parser = (input: Iterable<Token>) => [Iterable<Token>, ASTNode]

/** A really neat type to get all paths throughout a object
 * from [here](https://evolved.io/articles/typescript-nested-object-paths)
 * though I've modified it a bit to only get leaf nodes
 */
export type Paths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? T[K] extends Function
          ? `${K}`
          : Join<K, Paths<T[K]>>
        : never
    }[keyof T]
  : never
