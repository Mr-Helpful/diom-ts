import { Token } from '.'

export class Colon extends Token {
  regex = /:/
}

export class Semi extends Token {
  regex = /;/
}

export class Comma extends Token {
  regex = /,/
}
