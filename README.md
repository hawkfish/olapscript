# OLAPScript
An OLAP engine for Google Apps Script

This module implements a relational pipeline tookit 
 for manipulating Google Sheets using Apps Script.
 
 The central object is a Table, which uses a column oriented storage model
 for holding Values. The values can be read from a sheet or provided as
 JavaScript data structures. Tables can be written out to target sheets
 when processing is complete.
 
 To support pipelining, the Table class provides data streaming methods for
 relational and data cleaning operations. This lets you write SQL-like chains
 of operations:
 
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
 
 Pipelines avoid copying data wherever possible, so intermediate results 
 can be cached without worrying about later processing.
 
 Expressions are implemented as a simple tree of nodes, and any function
 can be used in a function node. Column reference expressions make no copies.
 Aggregates are a separate type of object, with initialize, update and finalize 
 functions, and the arguments can be arbitraary expressions. Ordering is also 
 expression-based.
 
 Note that some of this functionality is not yet implemented, and the error checking
 is pretty much non-existent, but the architecture is based on 50 years of database
 theory and is hopefully easy to express data validation and sheet generation with.
