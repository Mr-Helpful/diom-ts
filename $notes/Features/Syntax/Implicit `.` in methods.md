Whenever a method / property is accessed, the `.` normally used to access it can be replaced with any amount of whitespace.
## Examples
```
let vector = {
  x = 4,
  y = 3,
  get_x(self)() = self.x
};
vector.x == vector x
vector.get_x() == vector get_x()
```
## Notes
I don't actually think this is compatible with [[Simplified function calls]] and [[Function overloading]] combined as, when all three are used, there is syntax ambiguity between a function call and a method access:
```
let x = {
  y(self) = 5,
  (self)(v) = v + 4
};
let y = 3;
let z = x y;
# is z `x.y == 5` or `x(y) == 7`?
```
If I can't find a way to resolve this, I'm going to decide in favour of removing [[Function overloading]] as:
1. Implicit `.` lets us implement simple [[Operator overloading]] and nice `if...else`
2. [[Simplified function calls]] as it makes [[Lazy Evaluation]] simpler to implement and use within the language.

### `if ... else ...`  statements
Using implicit `.`, single argument functions and lazy evaluation, we can define the else branch as a method of the `Option` type returned by an `if` function:
```
let Option<T>.else(Some(x))(_: (): T): T = x;
let Option<T>.else(None)(expr: (): T): T = expr();

assert(Some(1).else(2) == 1);
assert(None.else(2) == 2);

# with both implicit `.` and simple function calls
assert(Some(1) else 2 == 1);
assert(None else 2 == 2);

# demonstrating lazy evaluation
let x = 1;
assert(Some(1) else {x += 1; x} == 1);
assert(x == 1);
assert(None else {x += 1; x} == 2);
assert(x == 2);

# definition of if function
let if<T>(cond: bool)(expr: (): T): Option<T>;

# using if function
let y = 1;
assert {
  if true {
    y -= 1; y
  } else {
    y += 1; y
  } == 0
};
assert(y == 0);
let y = 1
assert {
  if false {
    y -= 1; y
  } else {
    y += 1; y
  } == 2
};
assert(y == 2);
```
Note again, there's literally **no** specialised syntax used in this example; an `if ... else ...` statement is implemented using **only** a function `if` and a method `Option<T>.else`
