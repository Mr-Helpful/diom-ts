Whenever a 0 or 1 arguments is passed to a function, the brackets can be omitted from the call.
## Examples
```
let f(x: u32) = x + 5;
f(3) == 8;
f 3  == 8;

let g() = 3 + 5;
g() == 8;
g   == 8;
```
## Notes
In the case of curried functions (i.e. functions that return functions), this means we can provide individual arguments in a syntax similar to:
```
let f(x: u32)(y: u32)(z: u32) = x + y * z;
f(3)(4)(5) == 23;
f 3  4  5  == 23;
```

### Lazy Evaluation
To better support [[Lazy Evaluation]], we can arbitrarily add / remove 0 argument function calls to types as so:
```
# T is equivalent to (): T is equivalent to (): (): T is equivalent to (): ...: T

let x = 3;
# y is explicitly lazy and won't affect x
let y: (): i32 = {x += 1; x};
# z is implicitly lazy and won't affect x
let z = {x += 1; x};

let f(x: (): i32) = x() + 2;
```
This works as these two types have equal number of possible values.

**note**: this is the **only** type of implicit conversion that is supported in this language.
Other conversions need to be performed with `From` and `Into` traits.

### If statements
Single argument simplification lets us use `if` statements via the function:
```
let if(true)(expr: (): T): Option<T> = Some(expr());
let if(false)(_: (): T): Option<T> = None;

if true {
  3
} == Some(3);
if false {
  3
} == None;
```

### While loops
And `while` loops via the function:
```
let while(cond: (): bool)(expr: (): T): Option<T> = {
  if cond() {
    let value = expr();
    while cond expr;
    value
  }
};

let x = 2;
while (x < 4) {x += 1; x} == Some(4);
x == 4;
while (x < 4) {x += 1; x} == None;
x == 4;
```

> What can I say, I kinda like unnecessarily expressing things as functions :P
