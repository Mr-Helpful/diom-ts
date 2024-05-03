import { Colon, Semi } from './punctuation'

export class Token {
  /**
   * Attempts to construct this token from the next input characters
   * @param {string} input the raw text input to match this token against
   * @return {[string, this] | null} the remaining string and constructed token
   */
  static match(input) {
    return null
  }
}

export class Ident extends Token {
  name = ''

  /** @type {Token['match']} */
  static match(input) {
    let regex = /(?<name>[A-Za-z_]\w*)/
    const results = regex.exec(input)
    if (results === null) return null
    results['name']
  }
}

export class Bracket extends Token {}
