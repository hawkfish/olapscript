# Apps Script Examples

Here are some examples of using the OLAPScript objects for various Apps Script tasks.

## Extracting a Subset of a Sheet

Suppose you have a sheet containing customer data with user-friendly column names, 
and you want to extract a subset that contains only the address data for a single ZIP code.
You can do this using the `select` and `where` operations:

```js
function testNarrow(sourceName, targetName) {
  const app = SpreadsheetApp;
  const ss = app.getActiveSpreadsheet();
  const source = ss.getSheetByName(sourceName))
  var target = ss.getSheetByName(targetName);
  if (target == null) {
    target = ss.insertSheet(targetName);
  }

  Table.fromSheet(source)
       .select([
        {expr: new RefExpr("Customer Name"), as: "Name"}, 
        {expr: new RefExpr('Address Line 1'), as: 'addressLine1'}, 
        {expr: new RefExpr('Address Line 2'), as: 'addressLine2'}, 
        {expr: new RefExpr('City'), as: 'city'}, 
        {expr: new RefExpr('ZIP'), as: 'ZIP'},
      ])
      .where(new FuncExpr(Expr.eq, [new RefExpr('ZIP'), 10036]))
      .toSheet(target);
}
```

Here is what happens:

* The `fromSheet` method takes the original sheet and turns it into an `OLAPScript` `Table`;
* The `select` method takes an `Array` of `Objects`, each of which has an expression (`expr`) and a column name (`as`). The expressions in this case are all column reference expressions (`RefExpr`) that refer to the names of the `Table` and the names are the names you want for your new table.
* The `where` method takes a predicate expression `FuncExpr` that returns `true` for the rows that should be kept. The `FuncExpr` can take any JavaScript function for its first argument, and it takes an array of expressions that will become the function's arguments.
* the `toSheet` method then overwrites the target with the `Table` contents.

You can then use the new table for further processing, such as driving a targeted mail campaign.

## Finding missing values

When data is entered by hand into spreadsheets, there are always data entry errors (there is research to back up this extreme claim!)
A common kind of error is that a dimension table is "missing" a dimension, like a name.
Often the name is just misspelled.

In SQL, this search would look like:

```sql
SELECT  DISTINCT name
FROM    sales
WHERE   NOT EXISTS (
  SELECT  NULL
  FROM    customers
  WHERE   customers.name = sales.name
)
```

To find values that are in one table but not another, you can use a _left join_ followed by a filter

```js
// Make expressions to refer to the columns
const name = new RefExpr("name");
const name2 = new RefExpr("name2");

// Read the data for sheet1
const sales = Table.fromSheet(salesSheet)
  // Keep only the name column
  .select([{expr: name}]);

// Read the data from sheet2
const customers = Table.fromSheet(customerSheet)
  // keep only the "name" column renamed to "name2"
  .select([{expr: name, as: "name2"}]);

// Build the list of unique missing names from sales
const missing = sales
  // A left join keeps any unmatched rows from the left (probe, sales) side
  // by filling in nulls for the right (build, customers) side columns
  .equiJoin(customers, {probe: name, build: name2}, {type: 'left'})
  // We can then filter it down to the name2 values that are null
  .where(new FuncExpr(Expr.isnull, [name2]))
  // And remove the duplicates
  .groupBy(name);
```
