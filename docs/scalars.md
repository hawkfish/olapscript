# Scalar Functions

For convenience, the `Expr` class contains a number of pre-defined functions that match the SQL semantics of functions with the same name. Unless otherwise noted, any `null` argument will produce a `null`result.

These functions are intended to be used to help construct `FuncExpr` objects.
For example, to trim spaces from the right side of a string column, you can use the expression:

```js
const expr = new FuncExpr(Expr.rtrim, [new RefExpr("strcol")])
``` 

For brevity, the leading `Expr` has been left off the function names.

## Logical Functions

These are functions that perform the standard Boolean operations.

| Function  | Description |
| :-------- | :---------- |
| `and(a, b, ...)` | Nary AND    |
| `or(a, b, ...)`  | Nary OR.    |
| `not(a)` | Negation.   |

### Logical Example

The first two logical functions are n-ary, which means they can take any number of Boolean arguments.
This means you can translate the SQL expression:

```sql
firstName = <fname> AND
lastName = <lname> AND
email = <email> AND
date = <some date> AND
invalidTimestamp IS NULL
```

to an `Expr` tree with only one `and`:

```js
new FuncExpr(Expr.and, [
  new FuncExpr(Expr.eq, [new RefExpr("firstName"), new ConstExpr('<fname>')]),
  new FuncExpr(Expr.eq, [new RefExpr("lastName"), new ConstExpr('<lname>')]),
  new FuncExpr(Expr.eq, [new RefExpr("email"), new ConstExpr('<email>')]),
  new FuncExpr(Expr.eq, [new RefExpr("date"), new ConstExpr(new Date('<some date>'))]),
  new FuncExpr(Expr.isnull, [new RefExpr("invalidTimestamp")])
])
```

## Comparison Functions

In SQL, comparing any value to `null` produces `null`, not `true` or `false`.
To treat `null`s as simple values, use the _distinct_ comparators.

| Function  | Description |
| :-------- | :---------- |
| `eq(a, b)` | Tests for equality. |
| `ne(a, b)` | Tests for inequality. |
| `lt(a, b)` | Tests for less than. |
| `le(a, b)` | Tests for less than or equal. |
| `gt(a, b)` | Tests for greater than. |
| `ge(a, b)` | Tests for greater than or equal. |
| `between(x, a, b)` | Tests whether `x` is between `a` and `b` (inclusive) |
| `isnotdistinct(a, b)` | Tests for equality, including `null`. |
| `isnotdistinct(a, b)` | Tests for inequality, including `null`. |
| `isnull(a)` | Tests for `null`. |
| `isnotdistinct(a)` | Tests not `null`. |

### Comparison Example

SQL has a useful postfix operator called `BETWEEN`:

```sql
"start" BETWEEN '2022-08-26' AND '2022-08-31'
```

This can be expressed using the `between` function:

```js
new FuncExpr(Expr.between, [
  new RefExpr("start"), 
  new ConstExpr(new Date(2022-08-26')), 
  new ConstExpr(new Date('2022-08-31'))
]);
```

## Casting

Casting is essentially a mapping operation using the class as the function performing the cast.
For simple scalars such as `String` and `Number`, this is straightforward.
For more complex `Object`s such as `Array` and `Date` require special handling, 
but the `cast` function will handle them correctly. 

| Name  | Description |
| :---- | :---------- |
| `cast(v, t)` | Converts `v` to type `t`.  Note that this will throw for invalid casts. |

### Casting Example

SQL dialects usually provide several casting syntaxes, such as:

```sql
CAST("datecol" AS DATE)
```

To express this with the `cast` function, you can write:

```js
new FuncExpr(Expr.cast, [new RefExpr("datecol"), new ConstExpr(Date)])
```


## String Functions

| Name  | Description |
| :---- | :---------- |
| `trim(s)` | Trims whitespace from both ends of the string. |
| `ltrim(s)`  | Trims whitespace from the left of a  the string. |
| `rtrim(s)`  | Trims whitespace from the right of a  the string. |

## Temporal Functions

SQL has a number of way to express the current date and timestamp,
and `Expr` provides them as nullify (no argument) functions:

| Name  | Description |
| :---- | :---------- |
| `now()` | Returns the current timestamp. |
| `today()`  | Returns the current date, expressed as a `Date` at midnight UTC. |

### Temporal Example

To get the current timestamp in an expression, you can use:

```js
new FuncExpr(Expr.now, [])
```
