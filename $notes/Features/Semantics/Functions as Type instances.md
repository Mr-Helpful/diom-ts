Functions types should be similar to the other combination types (`Enum`, `Struct`, `Tuple`) in that they can be constructed using a similar syntax to their type. Honestly this one's just better explained with pseudo-code, just look at the snippet:
```
# Here `Func1` is a type alias to an *unnamed function type*
let Func1: (value: f64): bool

# which we can construct an instance of using the function constructor syntax
let func1: Func1 = (x: f64): bool x < 2.0
```

There are several rules around Function types that set them apart from the other types:
1. They cannot have any [[Traits]] implemented on them
2. Function types using different parameter names are *equivalent*
	1. i.e. they can be substituted for each other
3. They are the only type that can be called

This distinction allows us to do a few neat things:
1. We can implement operator precedence in terms of the underlying functions
2. We can allow for left / right bracketing (@todo: can't remember the name here)
By using associated types on the unnamed Function type  (which the compiler can work out)