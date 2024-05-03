import { Token } from '.'

export class Comment extends Token {
  content = ''
}

export class MultiComment extends Comment {}

export class SingleComment extends Comment {}
