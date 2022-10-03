# Expressions

Expressions are a tree structure that can be traversed and evaluated.

## Methods

### evaluate

`evaluate` takes a `namespace` argument for looking up column references,
a `selection` argument containing the valid row numbers
and a `length` argument that gives the allocation size of the output
It returns a `Column` object containing the computed data for all selected rows.

### alias

Returns a default name for the column in case the user does not specify one.

## Classes

These are the expression classes:

### ConstExpr

`ConstExpr` represents a single constant value. 
When evaluated, it returns a `Column` containing `length` copies of the value.

### RefExpr

`RefExpr` represents a column reference. 
When evaluated, it just returns the named `Column` from the `namespace`.
If the column does not exist, it will throw a `ReferenceError`.

### FuncExpr

`FuncExpr` represents a function call.
It has a function and an `Array` of arguments (`args`).
When evaluated, it first evaluates its arguments and then applies the function to each argument set.

### CaseExpr

`CaseExpr` evaluate sql-style `CASE` statements:

```sql
CASE [<case expression>]
WHEN <when expression 1> THEN <then expression 1>
WHEN <when expression 2> THEN <then expression 2>
[ELSE <else expression>]
END
```

If there is no case expression, it defaults to the constant value `true`.
If there is no else expression, it defaults to `null`.

The cases are tested in order, and the output expressions are only evaluated if the case matches.
This can be useful for avoiding expcetions like dividing by zero.
