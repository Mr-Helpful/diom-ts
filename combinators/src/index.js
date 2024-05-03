import { Result } from './result/index.js'

console.log(
  Result.ok(5)
    .map(x => x + 1)
    .then(_ => Result.err(2))
)
