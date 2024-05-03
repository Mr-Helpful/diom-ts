# Expressive Parser Combinators

This library attempts an implementation of the Haskell Parsec library ([paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/parsec-paper-letter.pdf)),<br>
focusing on expressive error reporting and method based composition.

**Note**: in this implementation I've made the simplifying assumption that a successful parse **always** consumes input.
You will not be able to implement parsers that check ahead without consuming, i.e. `/(?=hello world)h/`
