Each line of code should be an expression, with a connected value and type.

`{`, `}` and `;` define a custom collection of items called a 'block' that, when evaluated, evaluates all expressions within it in rough sequence and gives the value of the final expression in the block.
## Examples
```
{5} == 5
{
  3;
  4;
  5
} == 5
{
  let x = 5;
  x
} == 5
```