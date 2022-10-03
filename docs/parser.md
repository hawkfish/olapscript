# Parser

The OLAPScript parser module converts SQL-like textual representations
of expressions and related data structures into the data structures themselves.
This functionality reduces constructing the arguments of relational operations
to writing familiar-looking text.
Unlike SQL, there are no facilities to optimise or simplify the arguments,
but textual argument parsing at least simplifies the construction 
of physical operator arguments.

The OLAPScript parser module consists of the `Parser` class and its methods.
The constructor takes the string to be parsed,
and the various methods then interpret this string as the desired data structure. 

## Tokens

The string passed to the constructor of a `Parser` object is first broken into _tokens_.
These token types are used to build expressions and more complex data structures.

### Whitespace

Whitespace tokens are just sequences of blank characters.
They are not interpreted during parsing, but they are extracted for error reporting.

### Comments

Comments are SQL-style comments indicated by a double dash `--`
and continue to the end of the line.
They are also not interpreted during parsing, but they are useful for documentation.

```sql
-- This is a comment
```

### Strings

SQL strings are conventionally delimited by _single_ quotes.
To embed single quotes, they must be repeated:

```sql
'string' -- A basic string
'Embedded '' Quote' - A string with an embedded single quote.
```

### References

SQL column references are conventionally delimited by _double_ quotes.
Note that this is at odds with many scripting languages!
Just like for strings, embedded double quotes, they must be repeated:

```sql
"column name" -- A column references with an embedded space.
"embedded "" quote" -- A column reference with an embedded double quote
```

### Numbers

SQL supports a wide range of numeric types, but OLAPScript is a JavaScript library.
Consequently, it only supports JavaScript floating point numbers.
It parses numbers using the JSON format.

### Dates

Standard SQL does not have a format for Date constants beyond casting strings,
but several relational systems (T-SQL, Tableau) have added a date constant format
that encloses dates in hash marks:

```
#2022-09-20#
#1998-05-27 04:13:55.123456#
```

Any string between the hashes is passed to the `Date` parser.

### Identifiers

Identifiers are unquoted "words" used mostly as keywords in the expression syntax.
They must start with an alphabetic character and are then followed by zero or more
alphanumeric characters.
Note that all identifiers are mapped to lower case, 

In addition to keywords, identifiers can refer to function names.
All function names are mapped to lower case for lookup.

Occasionally, identifiers can be interpreted as references,
but only if the reference has the same form (only alphanumerics, no spaces!)
Since all identifiers are mapped to lower case, 
using them as a reference only works if the reference is also be lower case.

```sql
CASE
AS
CONTAINS
```
### Symbols

Symbols are non-alphanumeric characters that are used for structure in expressions.
The most common symbols are parentheses and commas,
but several other characters (`[]{}:`) are reserved for future use in constructing
nested types like arrays and structs/objects.

### Comparators

SQL defines a number of comparison infix operators, 
which are parsed and converted to function calls.
Not that when either side of a comparison is NULL,
the result is NULL, not true or false!

```sql
= -- Equal to
<> -- Not equal
>= -- Greater than or equal to
<= -- Less than or equal to
> -- Greater than
< -- Less than
```

### Operators

Finally, SQL defines a number of numeric infix operators:

```sql
+ -- Addition, unary plus
- -- Subtraction, unary minus
* -- Multiplication
/ -- Division
% -- Modulus
^ -- Power/exponentation
```

## Expressions

Expressions are parsed from a token string using the `parse` method.
The result is a single `Expr` object, which may be a constant, a reference or a function.
In addition to the specific expression types described below,
any expression can be enclosed in parentheses.

### Constants

In addition to the constant token types (strings, numbers and dates) 
there are several identifiers that are interpreted as constants:

```sql
null -- A null value
true -- A Boolean true value.
false -- A Boolean false value.
```

These are case-insensitive.

### Functions

Function calls are invoked by giving the (case-insensitive) name of the function
followed by the SQL-style parenthesised argument list:

```sql
CONTAINS("string", 'substring')
```

### Prefix Operations

Prefix operations modify the following expression.
There are three:

```sql
\+ -- Unary plus. Has no effect.
- -- Unary minus. Negates the following numeric expression.
NOT -- Unary not. Negates the following Boolean expression.
```

### Infix Operations

SQL defines a number of so-called "infix" operations.
These are the familiar logical, arithmetic and comparison operations:

```sql
"a" AND "b"
"a" \+ "b"
"a" < "b"
```

### Case Expressions

SQL has two types of case statement and an if statement.
These are all supported and produce `CaseExp` expressions:

```sql
CASE "a" WHEN 1 THEN 'one' WHEN 2 THEN 'two' ELSE 'other' END
CASE WHEN "a" = 1 THEN 'one' WHEN "a" = 2 THEN 'two' ELSE 'other' END
IF "a" = 1 THEN 'one' ELSE 'other' END
```

The `ELSE` clauses are optional and default to `NULL`.

### Multi-token Comparisons

In addition to the grammar school infix comparisons,
SQL defines a few rather verbose comparison operations:

```sql
"a" BETWEEN 1 AND 2 -- Equivalent to (1 <= "a" AND "a" <= 2)
"a" IS [NOT] NULL -- True [False] if column "a" is NULL, false [true] otherwise
"a" IS [NOT] DISTINCT FROM "b" -- False [True] is "a" and "b" are the same (including NULLs)
```

## Operator Arguments

The `Table` operator typically take one or two arguments that are arrays of data structures.
The `Parser` can also be used to interpret strings as these arguments.
All of the operators will parse strings they are given using these formats,
which means that you only need to pass the strings 
instead of messing around constructing `Parser` objects.

### Select Lists

Select lists are comma-separated lists of expressions with optional names (`AS`):

```sql
"a" + "b" AS "c"
a + b AS ab, c + 1 AS c1
```

They can be used as the argument for a `select` operation 
or as the `groups` argument to a `groupby` operation.

### Aggregate Lists

Aggregate function lists are the second argument to the `groupby` operator.
They are comma-separated, 
and you can name the aggregate function call using the `AS` keyword.

Unlike SQL, they must be top-level aggregate function calls,
not expressions containing aggregate function calls.
If you need to perform further operations (like dividing by 2),
you need to add a `select` operator that does the division.

```sql
SUM(sales / 10) -- Single aggregated expression call
MIN(x) AS lo, MAX(x) AS hi -- List of aggregates with aliases
```

### Order By Lists

Order by lists are used with the `orderby` operator.
They are comma-separated lists of an expression and optional qualifiers.
The allowed qualifiers are `ASC/DESC` and `NULLS FIRST/LAST`,
with defaults of `ASC` and `NULLS FIRST`.

The order of the sort specifications gives the major and minor sorts.

```sql
"Last Name" ASC NULLS LAST -- Major sort only
"Last Name" DESC NULLS LAST, "First Name" ASC -- Major sort with one minor sort
"Last Name, "First Name", "Middle Initial" -- Major sort with two minor sorts
```

### Equi-join Predicates

The `equiJoin` operator takes pairs of expressions from each table that must be matched.
In SQL, the order is not important and the `AND`s can be nested arbitrarily, 
but for OLAPScript, the expression must be a single `AND`, 
and the left/probe (resp. right/build) table expressions must be the left (resp. right)
clauses of the comparison.

There are two comparison types that can be used in equi-joins: 
* `=` - SQL equality, NULLs do _not_ match)
* `IS NOT DISTINCT FROM` - SQL equality, NULLs _do_ match.

```sql
fk = pk -- Single key comparison
lastName = last AND firstName = first -- Multiple key comparisons
customerName IS NOT DISTINCT FROM customer -- Key comparisons with NULL equality.
