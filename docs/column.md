# Column

## Columns

A `Column` object is a simple container for an `Array` of values (`data`).
It also has a `type` member that describes the type of the `data` (if known).

## Namespaces
Columns can be combined into `Namespace`s, which are just `Object`s that map names to `Column`s.
All the `Column`s in a `Namespace` should have the same `length`!
