**note**: this whole section is highly influenced by `rust`, if you know how Traits are used within that language, you'll probably already know most of this.

Traits provide an alternative to OOP for defining and reusing common behaviour within code that focuses on the functions / methods that an object exhibits, rather than the implementation of those functions / methods.

The language should focus on the use of trait composition to provide behaviour.
## Examples
A simple Trait for string conversion
```
let ToStr: {
  to_str(self)(): str
};

let Point2D {
  x: f64,
  y: f64,
};
let Point2D.ToStr {
  to_str(self)() = "({self.x},{self.y})"
};
let point = Point2D {x: 3.0, y: 4.0};
point.to_str() == "(3.0, 4.0)";
```

Generic traits for conversion
```
let From<T>: {
  from(value: T): Self
};
let Into<T>: {
  into(self)(): T
};


```