# Diom Typescript

Typescript implementation of the Diom compiler.

I've chosen to implement the compiler in Typescript as:

1. it has *decent* support for types
  a. the main thing I'm going for here are `interfaces`
  b. I was considering `go` but its typing's a bit lacking (no `enum`s)
2. it has support for mutability
  a. sure `OCaml` does mutability, but it's very restricted
  b. I kinda want mutability as it's a bit easier to implement caches in
3. it's still comparatively quick to prototype in
  a. I was originally trying `rust` but it was very slow to work in
4. it kinda supports progressive typing
