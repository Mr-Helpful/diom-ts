For any type that implements the `Monad` [[Traits|trait]], defined as so:
```
let Monad<T> {
  then<U>(self)(f: (value: T): Monad<U>): Monad<U>,
  return(value: T): Self
}
```

The `?` and `!` postfix operators provide the syntactic sugar below:
```
let x = {
  let a = Some(3.1)?;
  let b = (a try_div 0.0)? + 2.1;
  b!
};

# Is directly converted to

let y = {
  Some(3.1) then (<variable 1>: f32){
    let a = <variable 1>;
    (a try_div 0.0) then (<variable 2>: f32) {
      let b = <variable 2> + 2.1;
      Monad return b
    }
  }
};

# Hence

assert(x == None) # because `(a try_div 0.0)?` short circuits
assert(y == None) # because `(a try_div 0.0) then (...) == None`
```
Here `<variable 1>` and `<variable 2>` are variables that:
1. Are only used by the compiler
2. Cannot be written by the programmer
3. Are guaranteed to be distinct
To ensure that they don't collide with any other variables in the program

This lets us implement:
- `Option`s and `Result`s
- `Promise`s
- random `Distribution`s
- `Iterator`s
- others...? (I'm not entirely sure what else this can be used for)
In a relatively simple and pleasing manner