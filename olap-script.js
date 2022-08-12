/**
 * This module implements a relational pipeline tookit 
 * for manipulating Google Sheets using App Script.
 * 
 * The central object is a Table, which uses a column oriented storage model
 * for holding Values. The values can be read from a sheet or provided as
 * JavaScript data structures. Tables can be written out to target sheets
 * when processing is complete.
 * 
 * To support pipelining, the Table class provides data streaming methods for
 * relational and data cleaning operations. This lets you write SQL-like chains
 * of operations:
 * 
 * Table.fromSheet(<source sheet>)
 *      .select(<expressions>)
 *      .unnest(<array column>)
 *      .fill(<column>, <default>)
 *      .where(<predicate>)
 *      .equiJoin(<Table>, <matching keys>)
 *      .groupby(<groups>, <aggregates>)
 *      .orderby(<ordering>)
 *      .limit(100)
 *      .toSheet(<target sheet>);
 * 
 * Pipelines avoid copying data wherever possible, so intermediate results 
 * can be cached without worrying about later processing.
 * 
 * Expressions are implemented as a simple tree of nodes, and any function
 * can be used in a function node. Column reference expressions make no copies.
 * Aggregates are a separate type of object, with initialize, update and finalize 
 * functions, and the arguments can be arbitraary expressions. Ordering is also 
 * expression-based.
 * 
 * Note that some of this functionality is not yet implemented, and the error checking
 * is pretty much non-existent, but the architecture is based on 50 years of database
 * theory and is hopefully easy to express data validation and sheet generation with.
 * 
 * Copyright © 2022 Richard Wesley and Ellen Ratajak
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
 * and associated documentation files (the “Software”), to deal in the Software without restriction, 
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
 * subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies 
 * or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * A class for modeling a single column. It has a data type and an Array of values.
 * 
 * @type {Type} The data type of the column
 * @data {Array} The data values.
 */
class Column {
  constructor(type, data) {
    this.type = type || typeof undefined;
    this.data = data || [];
  }
  getRowCount() {
    return this.data.length;
  }
}

/**
 * A base class for expressions.
 * 
 * @param {String} type - The type of expression
 */
class Expr {
  constructor(type) {
    this.type = type;
  }
}

/**
 * A class for modelling function expressions
 * 
 * @param {Function} func - The function to evaluate
 * @param {Array} args - The input expressions for the function call.
 */
class FuncExpr extends Expr {
  constructor(func, args) {
    super('function');
    this.func = func;
    this.args = args;
  }

  alias() {
    return this.func.name + "(" + args.map(arg => arg.alias()).join(", ") + ")";
  }
}

/**
 * Evaluates a function expression by evaluating the input columns 
 * and applying the function to each one
 * 
 * @param {Object} namespace - A mapping from names to Columns
 * @param {Array} selection - The valid row ids
 * @returns {Column} The result of evaluating the function on each input row.
 */
FuncExpr.prototype.evaluate = function(namespace, selection) {
  const inputs = this.args.map(arg => arg.evaluate(namespace, selection));
  const count = Object.keys(namespace).reduce((count, name) => Math.max(count, namespace[name].data.length), 0);
  const that = this;
  const data = selection.reduce(function(data, selid) {
      data[selid] = that.func.apply(that.func, inputs.map(column => column.data[selid]));
      return data;
    },
    new Array(count).fill(null)
  );


  return new Column(undefined, data);
}

/**
 * A class for modeling column references
 * 
 * @param reference - The name of the column being referenced
 */
class RefExpr extends Expr {
  constructor(reference) {
    super('reference');
    this.reference = reference;
  }

  alias() {
    return this.reference;
  }

  evaluate(namespace, selection) {
    const result = namespace[this.reference];
    if (!result) {
      throw new ReferenceError("Unknown column: " + this.reference);
    }
    return result;
  }
}

/**
 * A class for modelling constant scalars
 * 
 * @param {Any} constant - The constant value.
 */
class ConstExpr extends Expr {
  constructor(constant) {
    super('constant');
    this.constant = constant;
    this.datatype = typeof constant;
  }

  alias() {
    return this.constant.toString();
  }
}

/**
 * Evaluate a constant expression
 * 
 * @param namespace - A mapping from names to Columns
 * @returns {Column} - A column containing the constants.
 */
ConstExpr.prototype.evaluate = function(namespace, selection) {
 const count = Object.keys(namespace).reduce((count, name) => Math.max(count, namespace[name].data.length), 0);
 const that = this;
 return new Column(this.type, Array(count).fill(that.constant));
}

/**
 * A table class for performing relational operations on Google Sheets
 * 
 * @param {Object} namespace - A mapping from names to Columns
 * @param {Array} ordinals - The order of the columns
 * @param {Array}  selection - The positions in columns.
 * @param {Object} options - Other properties of the Table
 */
class Table {
  constructor(namespace, ordinals, selection, options_p) {
    const defaults = {
        name: 'Table',
        alias: 't',
    };
    var options = Object.assign({}, defaults, options_p || {});

    this.name = options.name;
    this.alias = options.alias;
    this.namespace = namespace || {};
    this.ordinals = ordinals || [];

    this.selection = selection || this.namespace[this.ordinals[0]].data.map((v, rowid) => rowid);
  }

  getRowCount() {
    return this.selection.length;
  }
}

/**
 * Simplify writing expressions by converting literals to constant expressions
 */
Table.normaliseExpr = function(expr) {
  if (expr.evaluate) {
    if (expr.args) {
      if (!Array.isArray(expr.args)) {
        expr.args = [expr.args,];
      }
      expr.args = expr.args.map(arg => Table.normaliseExpr(arg));
    }
    return expr;
  }

  return new ConstExpr(expr);
}

/**
 * Simplify writing bindings by converting expressions to bindings.
 */
Table.normaliseBinding = function(binding) {
  if (!binding.expr) {
    binding = {expr: binding};
  }
  binding.expr = Table.normaliseExpr(binding.expr);

  if (!binding.as) {
    binding.as = binding.expr.alias();
  }

  return binding;
}

/**
 * US Spellings
 */
Table.normalise = Table.normaliseExpr;
Table.normalize = Table.normalise;
Table.normalizeBinding = Table.normaliseBinding;

/**
 * Utility to build an empty set of columns
 * 
 * @returns {Object}
 */
Table.prototype.emptyNamespace_ = function() {
  const that = this;
  return this.ordinals.reduce(function (namespace, columnName) {
    namespace[columnName] = new Column(that.namespace[columnName].type, []);
    return namespace;
  },
  {});
}

/**
 * Create a Table from a given sheet. By default it will use the active sheet.
 * 
 * @param {Sheet} sheet
 * @param {Object} options
 * @returns {Table}
 */
Table.fromSheet = function(sheet, options) {
  const range = sheet.getRange("A1").getDataRegion();
  const values = range.getValues();
  const namespace = {}
  const ordinals = Array(0);
  // Pivot the data into columns
  for (var c = 0; c < range.getNumColumns(); ++c) {
    const data = Array.from(values, row => row[c]);
    const name = data.shift();
    const type = undefined;
    const col = new Column(type, data);
    namespace[name] = col;
    ordinals.push(name);
  }
  return new Table(namespace, ordinals, undefined, {name: sheet.getName()});
}

/**
 * Create a Table from a set of row Objects
 * 
 * @param {Array} rows
 * @param {Object} options
 * @returns {Table}
 */
Table.fromRows = function(rows, options_p) {
  const defaults = {};
  const options = Object.assign({}, defaults, options_p || {});
  const ordinals = options.ordinals || Object.keys(rows[0]) || [];
  const namespace = ordinals.reduce(function (namespace, name) {
    namespace[name] = new Column(typeof rows[0][name])
    return namespace;
  }, 
  {});
  rows.forEach(row => ordinals.forEach(name => namespace[name].data.push(row[name])));
  const selection = rows.map((row, rowid) => rowid);

  return new Table(namespace, ordinals, selection, options);
}

/**
 * Write a Table out to a given sheet
 * 
 * @param {Sheet} sheet
 * @returns {Table}
 */
Table.prototype.toSheet = function(sheet) {
  sheet.clearContents();
  const lastColumn = this.ordinals.length;
  if (lastColumn == 0) {
    return this;
  }
  
  // Make it the correct size
  var maxColumns = sheet.getMaxColumns();
  if (maxColumns < lastColumn) {
    sheet.insertColumnsAfter(maxColumns, lastColumn - maxColumns);
    maxColumns = lastColumn;
  }
  
  const lastRow = 1 + this.getRowCount();
  var maxRows = sheet.getMaxRows();
  if (maxRows < lastRow) {
    sheet.insertRowsAfter(maxRows, lastRow - maxRows);
    maxRows = lastRow;
  }

  // Write the column headers in the first row
  const header = sheet.getRange(1, 1, 1, lastColumn);
  header.setValues([this.ordinals,]);

  // Write the column data to the columns
  if (lastRow > 1) {
    const range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
    const that = this;
    // Row-major order
    range.setValues(that.selection.map(selid => this.ordinals.map(name => that.namespace[name].data[selid])));
  }

  return this;
}

/**
 * Returns a row as an Object.
 * Note that this is not the internal model, 
 * so it should be used only for truly row-based operations.
 * 
 * @param {Integer} rowid
 * @returns {Object}
 */
Table.prototype.getRow = function(rowid) {
  const that = this;
  const selid = this.selection[rowid];
  return this.ordinals.reduce((row, name) => Object.assign(row, {name: that.namespace[name].data[selid]}), {});
}

/**
 * Projects a table to new column names.
 * The mappings are taking in order and 
 * the new table has only the mapped columns.
 * Eventually, they should be expressions 
 * not just column references.
 * 
 * @param {Array} expressions - An ordered list of expressions and aliases.
 * @returns {Table}
 */
Table.prototype.select = function(expressions) {
  const namespace = {};
  const ordinals = [];
  const that = this;
  expressions.forEach(function(expr) {
    ordinals.push(expr.as);
    namespace[expr.as] = expr.expr.evaluate(that.namespace, that.selection);
  });

  return new Table(namespace, ordinals, this.selection, this);
}

/**
 * Filters a Table based on a predicate
 * 
 * @param {Object} predicate - A Boolean function
 * @returns {Table}
 * 
 */
Table.prototype.where = function(predicate) {
  // Normalise arguments
   if (predicate.expr) {
    predicate = predicate.expr;
  }
  predicate = Table.normalise(predicate);

  const that = this;
  const matches = predicate.evaluate(this.namespace, this.selection).data;
  const selection = this.selection.reduce(function(selection, rowid) {
      if (matches[rowid]) {
        selection.push(rowid);
      }
      return selection;
    },
    []);
  
  return new Table(this.namespace, this.ordinals, selection, this);
}

/**
 * Add aliases for SQL clauses that are internally just filtering.
 */
Table.prototype.having = Table.prototype.where;
Table.prototype.qualify = Table.prototype.where;

/**
 * Unnest an array column by producing multiple rows for each array element.
 * Rows with empty arrays are filtered out.
 * 
 * @param {String} columnName - The array column,
 * @returns {Table}
 */
Table.prototype.unnest = function(columnName) {
  const that = this;
  const namespace = this.emptyNamespace_();
  const selection = [];
 
  this.selection.forEach(function(selid, rowid) {
    const values = that.namespace[columnName].data[selid];
    values.forEach(function(value) {
      that.ordinals.forEach(function(name) {
        if (name != columnName) {
          namespace[name].data.push(that.namespace[name].data[selid]);
        }
      });
      namespace[columnName].data.push(value);
      selection.push(selection.length);
  })
  });

  return new Table(namespace, this.ordinals, selection, this);
}

/**
 * Implements a relational equi-join, which is a join where all the predicates
 * are AND-ed and involve equality of key pairs, one from each table.
 * This is the most common kind of join, and is used for looking up data,
 * or connecting tables with primary/foreign key matches.
 * 
 * @param {Table} build - The right hand side (smaller) table.
 * @keys {Array} keys - The key column name pairs [{left: right}, ...]
 * @returns {Table}
 */
Table.prototype.equiJoin = function(build, keys=[{probe: 'fk', build: 'pk'}]) {
  const probe = this;

  // Sort out the output schema
  // All the probe columns will be imported;
  // Only build columns that do not have name collisions will be imported.
  const buildImports = build.ordinals.filter(name => !probe.namespace.hasOwnProperty(name));
  const ordinals = probe.ordinals.map(name => name).concat(buildImports);
  
  const namespace = probe.emptyNamespace_();
  const buildNamespace = build.emptyNamespace_();
  buildImports.forEach(name => namespace[name] = buildNamespace[name]);

  // Build keys => rowid
  const buildKeys = keys.map(pair => pair.build);
  const ht = build.selection.reduce(function (ht, val, buildID) {
    const key = JSON.stringify(buildKeys.map(name => build.namespace[name].data[buildID]));
    const rows = ht.get(key);
    if (rows) {
      rows.push(buildID);
    } else {
      ht.set(key, [buildID,]);
    }
    return ht;
  }, new Map());

  // Probe the hash table and emit the new values
  const probeKeys = keys.map(pair => pair.probe);
  probe.selection.forEach(function (val, probeID) {
    const key = JSON.stringify(buildKeys.map(name => build.namespace[name].data[probeID]));
    const matches = ht.get(key);
    if (matches) {
      matches.forEach(function(buildID) {
        // Copy the probe data
        probe.ordinals.forEach(function(name) {
          namespace[name].data.push(probe.namespace[name].data[probeID]);
        });
        // Import the build data
        buildImports.forEach(function(name) {
          namespace[name].data.push(build.namespace[name].data[buildID]);
        })
      });
    }
  });

  return new Table(namespace, ordinals, undefined, this);
}

/**
 * Normalise an aggregate expression
 */
Table.normaliseAggr = function(aggr) {
  if (!aggr.func) {
    aggr = {func: aggr};
  }
  aggr.args = aggr.args || [];
  aggr.args = aggr.args.map(arg => Table.normaliseExpr(arg));

  aggr.as = aggr.as || aggr.func.name;

  return aggr;
}
/**
 * Implements the aggregation operator (GROUP BY).
 * 
 * @param {Array} groups - The grouping expressions.
 * @param (Array} aggrs - The aggregate funtions
 * @returns {Table}
 * 
 * Aggregate functions are classes with two methods.
 * Construction initializes the state, which is then updated
 * 
 *  update - Update the state with a new value
 *  finalize - Compute the final value from the state
 * 
 */
Table.prototype.groupby = function(groups, aggrs) {
  // Normalise the inputs
  groups = groups || [];
  if (groups && !Array.isArray(groups)) {
    groups = [groups,];
  }
  groups = groups.map(group => Table.normaliseBinding(group));
  
  if (aggrs && !Array.isArray(aggrs)) {
    aggrs = [aggrs,];
  }
  aggrs = aggrs || [];
  aggrs = aggrs.map(aggr => Table.normaliseAggr(aggr));

  const that = this;
  
  // Set up the results
  const ordinals = groups.map(group => group.as).concat(aggrs.map(aggr => aggr.as));
  const namespace = ordinals.reduce(function(namespace, name) {
    namespace[name] = new Column(); 
    return namespace;
  },
  {});

  // Evaluate the grouping keys
  const groupbys = groups.map(group => group.expr.evaluate(that.namespace, that.selection));
  
  // Evaluate the aggregate input expressions
  const inputs = aggrs.map(aggr => aggr.args.map(arg => arg.evaluate(that.namespace, that.selection)));
  
  // Evaluate the aggregates using a hash table
  const ht = this.selection.reduce(function(ht, selid, rowid) {
    const values = groupbys.map(groupby => groupby.data[selid]);

    const key = JSON.stringify(values);
    if (!ht.has(key)) {
      ht.set(key, {group: selid, states: aggrs.map(aggr => new aggr.func())});
    }
    const entry = ht.get(key);
    entry.states.forEach((state, a) => state.update.apply(state, inputs[a]));
    return ht;
  },
  new Map()
);

  // Finalize the aggregate states by running through the hash table.
  ht.forEach(function(entry) {
    //  Copy the group values from the rowid
    groups.forEach((group, g) => namespace[group.as].data.push(groupbys[g].data[entry.group]));
    aggrs.forEach((aggr, a) => namespace[aggr.as].data.push(entry.states[a].finalize()));
  });

  return new Table(namespace, ordinals, undefined, this);
}

/**
 * The COUNTSTAR aggregate function.
 * This also works as a single value state base class
 * 
 */
class CountStar {
  constructor() {
    this.count = 0;
  }

  update() {
    ++this.count;
  }

  finalize() {
    return this.count;
  }
};

/**
 * The COUNT aggregate function
 * 
 */
class Count extends CountStar {
  update(val) {
    this.count += (val !== null);
  }
};

/**
 * The SUM aggregate function
 * 
 */
class Sum extends Count {
  constructor() {
    this.sum = null;
  }
};

Sum.prototype.update = function(val) {
  Count.prototype.update(val);
  if (val !== null) {
    if (this.sum == null) {
      this.sum = val;
    } else {
      this.sum += val;
    }
  }
}

/**
 * The AVG aggregate function
 * 
 */
class Avg extends Sum {
  finalize() {
    if (this.count) {
      return super.finalize() / this.count;
    } else {
      return null;
    }
  }
}

/**
 * Make it easier to write ORDER BY expressions
 * 
 * @param order - The order spec to normalise
 */
Table.normaliseOrder = function(order) {
  if (!order.expr) {
    order = {expr: order};
  }
  order.expr = Table.normaliseExpr(order.expr);
  order.asc = order.asc || true;
  order.nullsFirst || true;

  return order;
}

/**
 * Implements the ORDER BY relational operator
 * 
 * @param {Array} orders - An array of ordering specifications {expr, asc, nullsFirst}
 * @returns {Table}
 */
Table.prototype.orderby = function(orders) {
  // Normalize arguments
  orders = orders || [];
  if (!Array.isArray(orders)) {
    orders = [orders,];
  }
  orders = orders.map(order => Table.normaliseOrder(order));
  // Sort a copy of our selection so we don't disturb the input data
  const selection = this.selection.map(selid => selid);
  if (!selection.length) {
    return this;
  }

  const that = this;
  const ordercols = orders.map(order => order.expr.evaluate(this.namespace, selection));
  selection.sort(function(lidx, ridx) {
    return orders.reduce(function (cmp, order, colidx) {
      if (cmp) {
        return cmp;
      }
      const asc = order.asc || true;
      const nullsFirst = order.nullsFirst || true;
      const data = ordercols[colidx].data;
      const lval = data[lidx];
      const rval = data[ridx];
      if (lval === null || rval == null) {
        if (lval === rval) {
          return 0;
        }
        if (lval === null) {
          if (nullsFirst) {
            return asc ? -1 : 1;
          } else {
            return asc ? 1 : -1;
          }
        }
      }

      if (lval == rval) {
        return 0;
      } else if (lval < rval) {
        return asc ? -1 : 1;
      } else {
        return asc ? 1 : -1;
      }
    },
    0)
  });

  return new Table(this.namespace, this.ordinals, selection, this);
}

/**
 * Implements the LIMIT clause with a count and optional offset.
 * 
 * @param {Number} count - The maximum number of rows to return
 * @param {Number} offset - The first row to return (default 1)
 */
Table.prototype.limit = function(count, offset) {
  // Normalise the arguments
  offset = offset || 1;
  --offset;

  // Just filter the selection
  const end = offset + count;
  const selection = this.selection.filter((selid, rowid) => (rowid >= offset && rowid < end));

  return new Table(this.namespace, this.ordinals, selection, this);
}
