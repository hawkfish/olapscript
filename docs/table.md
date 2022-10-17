# Table

The `Table` class is the object that does all the heavy lifting for OLAPScript.
Each `Table` object has methods that implement various OLAP and data cleaning operations
and return a new table.

`Tables` are column-oriented, which means that all the data is stored column-wise.
Columnar layout is the preferred format for analytic workloads because
it makes adding and deleting attributes simpler.

## Components

### Namespace

The main component of a `Table` is a `namespace` `Object` that maps names to `Column` objects.
`Columns` contain a data type and an `Array` of data values.

### Ordinals

The `namespace` is unordered, so there is also a `Array` of columns names called `ordinals`.
This ordering is used for writing `Tables` out in user-visible form.

### Selection

All the `Table` operations are implemented so as to reduce data copying and will often just change an internal list of rows
called the `selection`.
* When a `Table` is filtered, the result has the same data but a smaller `selection` list.
* When a `Table` is sorted, the result again has the same data, but the `selection` has been reordered.

## Relational Operations

All the `Table` operations take an existing table as input and produce a new one as output.
This lets us create natural-looking data pipelines:

```js
Table.fromSheet(<source sheet>)
     .select(<expressions>)
     .unnest(<array column>)
     .fill(<column>, <default>)
     .where(<predicate>)
     .equiJoin(<Table>, <matching keys>)
     .groupby(<groups>, <aggregates>)
     .orderby(<ordering>)
     .limit(100)
     .toSheet(<target sheet>);
```

### select

`select` creates a new `Table` from the current one by evaluating a list of expressions
`select ` is intended to look like the `SELECT` clause in SQL, but has less functionality.
For example, to implement aggregation you need to explicitly use the `groupby` operation.

### unnest

`unnest` takes a single column containing `Array` values and expands the values to be on separate rows.
Each new row contains all the other column values from the original row, plus one of the `Array` values.
This means that if an `Array` is empty, the row will be deleted.

### fromRows

Create a Table from an `Array` of row `Object`s.

### unionAll

Unions two tables together without removing duplicates.
Unions can match columns either by position (the default) or by name.

```js
const input1 = Table.fromRows(alice1);
const input2 = Table.fromRows(alice2);
const options = {by: 'name'};
const unions = input1.unionAll(input2, options);
```

Supported options:

| Name | Type  | Description | Values |
| :--- | :---- |:---------- | :----- |
| by   | string | How to match columns | `'position'`, `'name'` |

### where

`where` filters the rows of a table using a single predicate expression.
`where` is intended to look like the `WHERE` clause in SQL, but has less functionality.
For example, it only applies filtering, so to implement a join, you need to explicitly use a join operation.

SQL also has filtering clauses for aggregate results (`HAVING`) and windowing results (`QUALIFY`),
but a filter is a filter, so `Table` has `having` and `qualify` methods that are just aliases for `where`.

### equiJoin

`equiJoin ` implements a relational equi-join, which is a join where all the predicates
are AND-ed and involve equality of key pairs, one from each table.
This is the most common kind of join, and is used for looking up data,
or connecting tables with primary/foreign key matches.
It is typically implemented using a hash table for the _build_ side using the keys
and then looking up those keys using the corresponding expressions from the _probe_ side.

The keys are an array of expression pairs.
Each pair is an object with `build` and `probe` keys, whose values are expressions.
The keys `left` and `right` can also be used as aliases for `probe` and `build` (resp.).

Supported options:

| Name | Type   | Description | Values |
| :--- | :----- |:----------- | :----- |
| type | string | Join type   | `'inner'` (default), `'left'`, `'right'`, `'full'` |
| imports | Object | Build column name mapping | `{build_name: "result_name"}` |

The default inner join will only return matches from both tables.
A  _left_ (outer)join will return all values from the left (probe) table,
filling in `null`s for the missing right (build) table.
A _right_ (outer) join does the opposite and a _full_ (outer) join
will do both and have all rows from both tables.

By default, the output table has the columns of the left/probe table
and any columns from the right/build table that do not conflict with them.
To import conflicting names, you can use the `imports` options to provide new names.
Any conflicts in this mapping will also be dropped.

One common application is to add data to a table in a star schema.
For example, you might have a list of users (generally called a _dimension_ table)
containing names, addresses and emails,
and their sales data (generally called a _fact_ table)
containing their ids.
To attach user names to sales records (for billing or an email campaign)
you would want to look up the user data for each sale using a join:

```sql
SELECT email
FROM Sales, Users ON Sales.uid = Users.id
WHERE Date > CURRENT_DATE() - INTERVAL 1 WEEK;
```

To express the join portion of this query, you would write:

```js
const dimension = Table.fromSheet(customersSheet);
const facts = Table.fromSheet(salesSheet);
const joined = dimension.equiJoin(salesSheet, {build: new RefExpr('id'), probe: new RefExpr('uid')});
```

### groupby

`groupby` implements the aggregation operation (`GROUP BY` in SQL).
It takes a list of grouping expressions and a list of aggregation expressions.
Either list can be empty.

Aggregation expressions have an aggregate function at the top.
An aggregate function is a class name, and the class need to implement three methods:
* `constructor` - Creates the aggregation state. For `SUM` this would be a single `null` value.
* `update` - Update the state with a new value. For `SUM` this would add the value to the state.
* `finalize` - Convert the state to the output value. For `SUM` this would just return the state.

### orderby

`orderby` implement the `ORDER BY` operations from SQL.
It takes a list of ordering specifications, which have the structure:
* `expr` - An expression to sort on.
* `asc` - True (default) for ascending sort, false for descending.
* `nullsFirst` - True (default) to sort `NULL` values first; `False` to put them last.

`orderby` does not actually move the data, it just reorders the `Table` selection,
which greatly reduces data copying.

### limit

Implements the SQL `LIMIT`/`OFFSET` operation.
This reduces the number of rows to the given `LIMIT` count,
starting from the `OFFSET` position (default 1).

## Data Extraction

After a pipeline has been run, the result will be a `Table` object.
There are some convenience methods defined to extract data as JavaScript objects.

### toRows

Creates an `Array` of row `Object`s from a Table.
Note that the rows will be the selected rows only.

### getColumn

Creates an array of the selected data from the column of the given name:

```js
table.getColumn("First Name");
```

## Apps Script Operations

### fromSheet

Create a Table from a given Google Apps Script `Sheet`:

```js
const app = SpreadsheetApp;
const ss = app.getActiveSpreadsheet();
const options = {};
const table = Table.fromSheet(ss.getSheetByName("My Sheet"), options);
```

The currently supported options are:

| Name  | Type | Description | Default |
| :---- | :--- | :---------- | ------: |
| top   | number | The first row to read (one-based) | `1` |
| left  | number | The first column to read (one-based) | `1` |
| limit | number | The maximum number of rows to read | `getLastRow() - 1` |
| width | number | The number of columns to read | `getLastColumn()` |
| header | number | The header row (`null` for the first data row being the header) | `null` |
| headerCount | number | The number of header rows (`0` for no header) | `1` |
| columns | Array | Caller-specified column names (only used when `headerCount` is `0`). | `['F1',..., 'F' + width]` |

If `header` is unspecified (`null`) then the first row is taken to be the header row
and `top` is incremented by `headerCount`.
If there is no header (`headerCount` set to `0`) then `columns` is used instead.
If there are multiple header rows, then each column name is made by concatenating all the
non-empty values in the header cells, separated by spaces.

`fromSheet` also provides column name de-duplication by adding numbers to the end of duplicate column names:

| Original | Renamed |
| :------- | :------ |
| Name | Name |
| Last | Last |
| Age | Age |
| Name | _Name 2_ |

The de-duplication will not overwrite existing column names:

| Original | Renamed |
| :------- | :------ |
| Name     | Name    |
| Name 2   | Name 2  |
| Age      | Age     |
| Name     | _Name 3_ |

### toSheet

Write a Table out to a given Google Apps Script `Sheet`.
This replaces the contents of the given sheet with the `Table`.

```js
const app = SpreadsheetApp;
const ss = app.getActiveSpreadsheet();
const options = {}
table.toSheet(ss.getSheetByName("My Sheet"), options);
```

The currently supported options are:

| Name  | Type    | Description | Default |
| :---- | :------ | :---------- | ------: |
| clear | Boolean | Clears the entire sheet | `false` |
| top   | number  | The first row to write to (one-based) | `1` |
| left  | number  | The first column to write to (one-based) | `1` |

### tables

Returns a table containing the tables in a Spreadsheet.
This is designed to look like PostgreSQL's `information_schema.tables` table,
but is restricted to a single Spreadsheet.
The Spreadsheet plays the role of the schema.

```js
const app = SpreadsheetApp;
const ss = app.getActiveSpreadsheet();
const table = Table.tables(ss);
```

The returned columns are:

| Column | Description | Type | Example |
|:---|:---|:---|:---|
| `table_catalog` |The SpreadsheetApp the table belongs to. Not yet implemented.| `VARCHAR` | `null` |
| `table_schema` |The Spreadsheet the Sheet belongs to.| `string` | `'My Project'` |
| `table_name` |The name of the Sheet.| `string ` | `'My Sheet'` |
| `table_type` |The type of table. One of: `BASE TABLE`, `LOCAL TEMPORARY`, `VIEW`.| `VARCHAR` | `'BASE TABLE'` |
| `self_referencing_column_name` |Unused.| `VARCHAR` | `null ` |
| `reference_generation` | Unused.| `VARCHAR` | `null ` |
| `user_defined_type_catalog` | Unused.| `VARCHAR` | `null ` |
| `user_defined_type_schema` | Unused.| `VARCHAR` | `null ` |
| `user_defined_type_name` | Unused.| `VARCHAR` | `null ` |
| `is_insertable_into` |`YES` if the table is insertable into, `NO` if not | `VARCHAR` | `'YES'` |
| `is_typed` |`YES` if the table is a typed table, `NO` if not.| `VARCHAR` | `'NO'` |
| `commit_action` | Unused.| `VARCHAR` | `'NO'` |

### columns

Returns a table containing the columns in a Spreadsheet.
This is designed to look like PostgreSQL's `information_schema.columns` table,
but is restricted to a single Spreadsheet.
The Spreadsheet plays the role of the schema.

```js
const app = SpreadsheetApp;
const ss = app.getActiveSpreadsheet();
const table = Table.columns(ss);
```

The returned columns are:

| Column | Description | Type | Example |
|:---|:---|:---|:---|
| `table_catalog` |Name of the SpreadsheetApp containing the table. Not yet implemented.| `VARCHAR` | `null` |
| `table_schema` |Name of the Spreadsheet containing the table.| `VARCHAR` | `'My Project'` |
| `table_name` |Name of the table.| `VARCHAR` | `'My Sheet'` |
| `column_name` |Name of the column. | `VARCHAR` | `'Address'` |
| `ordinal_position` |Ordinal position of the column within the table (count starts at 1). | `INTEGER` | `5` |
| `column_default` |Default expression of the column. Unused.|`VARCHAR`| `null` |
| `is_nullable` |`YES` if the column is possibly nullable, `NO` if it is known not nullable.|`VARCHAR`| `'YES'` |
| `data_type` |Data type of the column.|`string`| `'number'` |
| `character_maximum_length` |Unused.|`INTEGER`| `null` |
| `character_octet_length` |Unused.|`INTEGER`| `null` |
| `numeric_precision` |Unused.|`INTEGER`| `null` |
| `numeric_scale` | Unused.|`INTEGER`| `null ` |
| `datetime_precision` | Unused.|`INTEGER`| `null ` |

## Utilities

There are a number of utility methods attached to the class.

### Normalisation

Many of the argument types (especially expressions) have an overly complex structure at times.
To make it easier on the user, there are several methods that can infer missing parts of structures:

* `normaliseExpr` will expand single arguments to `Arrays and even convert anything without an `evaluate` method to a `ConstExpr`
* `normaliseBinding` will convert an expression to a binding by inferring the `as` from the `alias` and then normalise the expression itself.
* `normaliseAggr` performs normalisation on an aggregate function arguments and makes sure they are an `Array`.
* `normaliseOrder` converts expressions into ordering specifications with default values and normalises the expression.
