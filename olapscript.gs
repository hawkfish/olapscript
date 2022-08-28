/**
 * This module implements a single column for OLAPScript.
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
    this.data = data || [];
    this.type = type || typeof this.data[0];
  }

  getRowCount() {
    return this.data.length;
  }
}

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Column
  }
};
/**
 * This module implements expression trees for OLAPScript.
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
 * Node imports
 */
if (typeof Column === 'undefined') {
  Column = require("./column").Column;
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
 * A function to compute the Levenshtein (edit) distance between two strings.
 *
 * @param {String} a
 * @param {String} b
 * @returns {Number} The edit distance
 *
 * Following https://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
 * (MIT License)
 */
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) == a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

Expr.topNLevenshtein = function(strings, target, n = 5, threshold = 5) {
	return strings
		.map(str => ({candidate: str, score: getEditDistance(str, target)}))
		.filter(score => score.score < threshold)
		.sort((a, b) => (a.score - b.score))
		.slice(0, n)
	;
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
    return this.func.name + "(" + this.args.map(arg => arg.alias()).join(", ") + ")";
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
FuncExpr.prototype.evaluate = function(namespace, selection, length) {
  const inputs = this.args.map(arg => arg.evaluate(namespace, selection, length));
  const that = this;
  const data = selection.reduce(function(data, selid) {
      data[selid] = that.func.apply(that.func, inputs.map(column => column.data[selid]));
      return data;
    },
    new Array(length).fill(null)
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

  toString() {
  	if (this.reference.includes(' ')) {
    	return '"' + this.reference + '"';
    } else {
    	return this.reference;
    }
  }

  alias() {
  	return this.reference;
  }

  evaluate(namespace, selection, length) {
    const result = namespace[this.reference];
    if (!result) {
    	const candidates = Object.keys(namespace).map(name => name.toLowerCase());
    	const closest = Expr.topNLevenshtein(candidates, this.reference.toLowerCase(), 1, 5);
    	if (closest.length) {
      	throw new ReferenceError("Unknown column: " + this.alias() + '. Did you mean "' + closest[0].candidate + '"?');
      } else {
      	throw new ReferenceError("Unknown column: " + this.alias());
      }
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

  toString() {
    return String(this.constant);
  }

  alias() {
    return String(this.constant);
  }

  evaluate(namespace, selection, length) {
 		return new Column(this.datatype, Array(length).fill(this.constant));
 	}
}

/**
 * A class for handling case statements with short circuiting
 *
 * @param {Array} args - The input expressions for the function call.
 * @param {Function} expr - The optional case value expression.
 */
class CaseExpr extends Expr {
	constructor(args, expr) {
		super('case');
		this.expr = expr;
		this.args = args;
		// Add a missing else clause
		if (args.length % 2 == 0) {
			this.args.push(new ConstExpr(null));
		}
	}

	toString() {
		var result = 'case';
		if (this.expr) {
			result += ' ' + this.expr.alias();
		}
		var a = 0;
		while (a < this.args.length - 1) {
			result += ' when ' + this.args[a++].alias();
			result += ' then ' + this.args[a++].alias();
		}
		result += ' else ' + this.args[a++].alias() + ' end';

		return result;
	}

	alias() {
		return "case";
	}

	evaluate(namespace, selection, length) {
 		const result = new Column(this.args[1].datatype, Array(length).fill(null));

		// Use constant true for a missing expression.
		const expr = this.expr || new ConstExpr(true);
		const keys = expr.evaluate(namespace, selection, length);

		var remaining = selection.length;
		var passing = Array(remaining).fill(null);
		var a = 0;
		while (a < this.args.length - 1) {
			const whens = this.args[a++].evaluate(namespace, selection, length);

			var failing = Array(remaining).fill(null);
			var passed = 0;
			var failed = 0;
			selection.forEach(function(selidx) {
				const key = keys.data[selidx];
				if (whens.data[selidx] == key && key != null) {
					passing[passed++] = selidx;
				} else {
					failing[failed++] = selidx;
				}
			});

			const thens = this.args[a++].evaluate(namespace, passing, length);
			passing.forEach(selidx => (result.data[selidx] = thens.data[selidx]));

			remaining = failed;
			selection = failing;
		}

		const elses = this.args[a++].evaluate(namespace, selection, length);
		for (var i = 0; i < remaining; ++i) {
			const selidx = selection[i];
			result.data[selidx] = elses.data[selidx];
		}

		return result;
	}
}

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Expr, FuncExpr, ConstExpr, RefExpr, CaseExpr
  }
};

/**
 *	The Scalar Expression library.
 *
 * This is a convenient place to put functions that get used a lot.
 */

/**
 * A utility wrapper that returns null if an of the arguments are null.
 * The first argument is taken to be the function to evaluate.
 */
Expr.nullWrapper_ = function(...args) {
	const f = args.shift();
	if (args.includes(null)) {
		return null;
	}
	return f.apply(f, args);
}

/**
 *	AND, OR, NOT
 *
 * Since Javascript doesn't expose these as function objects,
 * we have them in the library for potentially reasoning about expression trees.
 */
Expr.and = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result && arg), true);
}

Expr.or = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result || arg), false);
}

Expr.not = function(b) {
	return (b == null) ? null : !b;
}

/**
 *	eq, ne, le, lt, ge, gt, isdistinct, isnotdistinct, isnull, isnotnull, between
 *
 * Since Javascript doesn't expose these as function objects,
 * we have them in the library for potentially reasoning about expression trees.
 */
Expr.eq = function(lhs, rhs) {
	return Expr.nullWrapper_((l, r) => (l == r), lhs, rhs);
}

Expr.ne = function(lhs, rhs) {
	return Expr.nullWrapper_((l, r) => (l != r), lhs, rhs);
}

Expr.lt = function(lhs, rhs) {
	return Expr.nullWrapper_((l, r) => (l < r), lhs, rhs);
}

Expr.le = function(lhs, rhs) {
	return Expr.nullWrapper_((l, r) => (l <= r), lhs, rhs);
}

Expr.gt = function(lhs, rhs) {
	return Expr.nullWrapper_((l, r) => (l > r), lhs, rhs);
}

Expr.ge = function(lhs, rhs) {
	return Expr.nullWrapper_((l, r) => (l >= r), lhs, rhs);
}

Expr.between = function(val, low, high) {
	return Expr.nullWrapper_((x, lo, hi) => ((lo <= x) && (x <= hi)), val, low, high);
}

Expr.isdistinct = function(lhs, rhs) {
	//	nulls are significant
	return lhs != rhs;
}

Expr.isnotdistinct = function(lhs, rhs) {
	//	nulls are significant
	return lhs == rhs;
}

Expr.isnull = function(lhs) {
	//	nulls are significant
	return lhs == null;
}

Expr.isnotnull = function(lhs) {
	//	nulls are significant
	return lhs != null;
}

/**
 * Casting functions
 */

/*
 *
 * The cast function really applies a function to a value.
 *
 * @param {Any} value - The value to cast
 * @param {Function} type - The casting function.
 * @returns {Any} The value cast to the given type
 */
Expr.cast = function(value, type) {
	if (type == Array) {
		if (Array.isArray(value)) {
			return value;
		} else {
			return Expr.nullWrapper_(value => ([value]), value);
		}
	} else if (type == Date) {
			return Expr.nullWrapper_(value => new Date(value), value);
	} else {
		return Expr.nullWrapper_(value => type(value), value);
	}
}

/**
 *	TRIM, LTRIM and RTRIM
 *
 * @param {string} untrimmed - The string to trim
 * @returns {string}
 */
Expr.trim = function(untrimmed) {
	return Expr.nullWrapper_(arg => arg.trim(), untrimmed);
}

Expr.ltrim = function(untrimmed) {
	return Expr.nullWrapper_(arg => arg.replace(/^[\s]+/, ""), untrimmed);
}

Expr.rtrim = function(untrimmed) {
	return Expr.nullWrapper_(arg => arg.replace(/[\s]+$/, ""), untrimmed);
}

/**
 * CONTAINS
 *
 * Tests whether a string contains a substring.
 *
 * @param {String} target - The string to search
 * @param {String} query - The string to search for
 * @returns {Boolean}
 */
Expr.contains = function(target, query) {
	return Expr.nullWrapper_((target, query) => target.includes(query), target, query);
};

/**
 * NOW and TODAY
 *
 * Note that SQL uses UTC unless time zone support is in use.
 *
 */
Expr.now = function() {
	return new Date();
}

Expr.today = function() {
	const dt = new Date();
	const yyyy = dt.getUTCFullYear();
	const mm = dt.getUTCMonth();
	const dd = dt.getUTCDate();
	return new Date(Date.UTC(yyyy, mm, dd));
}
/**
 * This module implements the aggregate function library for OLAPScript.
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
 * A base class for aggregates.
 * It defines all the basic operations common to all aggregates.
 *
 * Members:
 *	{Array} args - The function arguments.
 *  {Object} - config - A set pf configuration properties
 *
 */
class Aggr {
	constructor(args, options) {
		args = args || [];
		if (!Array.isArray(args)) {
			args = [args];
		}
		this.args = args;
		this.options = options || {};
	}

	initialize() {
		return {};
	}

	update(state, value) {
	}

	finalize(state) {
		return null;
	}
};

/**
 * The COUNTSTAR aggregate function.
 * This also works as a single value state base class
 *
 */
class CountStar extends Aggr {
  constructor(options) {
  	super([], options);
  }

	initialize() {
		return Object.assign(super.initialize(), {count: 0});
	}

  update(state) {
    ++state.count;
  }

  finalize(state) {
    return state.count;
  }
};

/**
 * The COUNT aggregate function
 *
 */
class Count extends Aggr {
	initialize() {
		return Object.assign(super.initialize(), {count: 0});
	}

  update(state, val) {
    state.count += (val !== null);
  }

  finalize(state) {
    return state.count;
  }
};

/**
 * The SUM aggregate function
 *
 */
class Sum extends Aggr {
  constructor(args, options) {
    super(args, options);
  }

	initialize() {
		return Object.assign(super.initialize(), {sum: null});
	}

  update(state, val) {
    if (val !== null) {
      if (state.sum == null) {
        state.sum = val;
      } else {
        state.sum += val;
      }
    }
  }

  finalize(state) {
    return state.sum;
  }
};

/**
 * The AVG aggregate function
 *
 */
class Avg extends Sum {
	initialize() {
		return Object.assign(super.initialize(), {count: 0});
	}

	update(state, val) {
		super.update(state, val);
    state.count += (val !== null);
	}

  finalize(state) {
    if (state.count) {
      return super.finalize(state) / state.count;
    } else {
      return null;
    }
  }
}

/**
 * A utility aggregate that tracks a single value, initially NULL.
 *
 */
class ValueAggr extends Aggr {
	constructor(selector, args, options) {
		super(args, options);
		this.selector = selector;
	}

	initialize() {
		return Object.assign(super.initialize(), {value: null});
	}

	update(state, val) {
		super.update(state, val);
		if (val !== null) {
			if (state.value !== null) {
				state.value = this.selector(state.value, val);
			} else {
				state.value = val;
			}
		}
	}

  finalize(state) {
  	return state.value;
  }
}

/**
 * MIN
 *
 * @param {Any} value
 * @returns {Any} The smallest non-null value
 *
 */
class Min extends ValueAggr {
	constructor(args, options) {
		super((a,b) => ((a < b) ? a : b), args, options);
	}
};

/**
 * MAX
 *
 * @param {Any} value
 * @returns {Any} The smallest non-null value
 *
 */
class Max extends ValueAggr {
	constructor(args, options) {
		super((a,b) => ((a > b) ? a : b), args, options);
	}
};

/**
 * First
 *
 * @param {Any} value
 * @returns {Any} The first non-null value
 *
 */
class First extends ValueAggr {
	constructor(args, options) {
		super((a,b) => a, args, options);
	}
};

/**
 * Last
 *
 * @param {Any} value
 * @returns {Any} The last non-null value
 *
 */
class Last extends ValueAggr {
	constructor(args, options) {
		super((a,b) => b, args, options);
	}
};

/**
 * ArrayAgg
 *
 * @param {Any} value -
 * @returns {Array} The array consisting of all the values in order
 *
 */
class ArrayAgg extends Aggr {
	initialize() {
		return Object.assign(super.initialize(), {value: null});
	}

	update(state, val) {
		if (state.value == null) {
			state.value = [];
		}
		state.value.push(val);
	}

  finalize(state) {
  	return state.value;
  }
};

/**
 * StringAgg
 *
 * @param {String} value -
 * @param {String} sep - The separator (must be constant)
 * @returns {String} The strings separated by the separator
 *
 */
class StringAgg extends ValueAggr {
	constructor(args, options) {
		//	Extract the separator
		const arg2 = args[1] || {constant: ','};
		const sep = arg2.constant || ',';

		//	Only pass on the first argument
		super((a, b) => (a + sep + b), [args[0]], options);
		this.sep = sep;
	}
};

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Aggr, CountStar, Count,
    Sum, Avg,
    Min, Max, First, Last,
    StringAgg, ArrayAgg
  };
};
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
 * Node imports
 */
if (typeof Column === 'undefined') {
  Column = require("./column").Column;
}
if (typeof ConstExpr === 'undefined') {
  const expr = require("./expr");
  ConstExpr = expr.ConstExpr;
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
  	this.length = Object.keys(this.namespace).reduce((count, name) => Math.max(count, namespace[name].data.length), 0);
  }

  getRowCount() {
    return this.selection.length;
  }

  getDataLength() {
    return this.length;
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
 * Utility function from ES6
 */
function findLastIndex(array, predicate) {
	const len = array.length

	if (!predicate.call) {
		throw new TypeError('predicate must be a function');
	}

	var thisArg;
	if (arguments.length > 1) {
		thisArg = arguments[1];
	}

	var k = len - 1;
	while (k >= 0) {
		var kValue = array[k]
		var testResult = predicate.call(thisArg, [kValue, k, this]);
		if (testResult) {
			return k;
		}
		k -= 1;
	}

	return -1;
};

/**
 * Create a Table from a given sheet.
 *
 * @param {Sheet} sheet
 * @param {Object} options
 * @returns {Table}
 */
Table.fromSheet = function(sheet, options_p) {
  // Set up the table location
  const defaults = {
    // The top data cell
    top: 1,
    // The left data cell
    left: 1,
    // The number of data rows
    limit: sheet.getLastRow() - 1,
    // The number of columns
    width: sheet.getLastColumn(),
    // The header row (null for first data row being the header)
    header: null,
    // The number of header rows
    headerCount: 1,
    // The data column numbers (used to determine the valid row range)
    dataBounds: []
  };
  const options = Object.assign({}, defaults, options_p || {});

  // Detect any data bounds first.
  if (options.dataBounds.length) {
    // Find the covering range for the given columns
    const bounds = options.dataBounds.reduce(function(bounds, colno) {
        const colRange = sheet.getRange(options.top, colno,
                                        options.top + options.limit - 1, colno);
        const values = colRange.getValues();
        const top = values.findIndex(row => row[0]) + options.top;
        if (top < options.top) {
          return bounds;
        }
        const limit = findLastIndex(values, (row => row[0])) + 1;
        if (bounds.top) {
          return {top: Math.min(bounds.top, top), limit: Math.max(bounds.limit, limit)};
        } else {
          return {top: top, limit: limit};
        }
      }, {top: null, limit: null}
    );
    // Update the valid row range.
    options.top = bounds.top;
    options.limit = bounds.limit;
  }
  // Adjust for inclusive header
  if (!options.header) {
    options.header = options.top;
    options.top += options.headerCount;
  }

  // Extract the header
  var header = options.columns || Array(options.width).fill(null).map((v, i) => 'F' + (i+1));
  if (options.headerCount) {
    const headerRange = sheet.getRange(options.header, options.left, options.headerCount, options.width);
    header = headerRange.getValues().reduce(function(header, row) {
      return row.reduce(function(header, text, colid) {
        if (text) {
          if (header[colid]) {
            header[colid] += ' ';
          }
          header[colid] += text;
        }
        return header;
      }, header);
    }, Array(options.width).fill(''));
  }

  // Extract the values
  const valueRange = sheet.getRange(options.top, options.left, options.limit, options.width);
  const values = valueRange.getValues();

  // Create unique column names
  const unique = header.reduce((unique, key) => (unique[key] = 0, unique), {});
  const ordinals = header.map(function(header) {
    if (!unique[header]) {
      ++unique[header];
      return header;
    }

    var tag = ++unique[header];
    var name = header + ' ' + tag;
    while (name in unique) {
      name = header + ' ' + ++tag;
    }

    return name;
  });

  const namespace = {}
  // Pivot the data into columns
  for (var c = 0; c < valueRange.getNumColumns(); ++c) {
    const data = Array.from(values, row => row[c]);
    const name = ordinals[c];
    const type = undefined;
    const col = new Column(type, data);
    namespace[name] = col;
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
 * List all the tables in a Spreadsheet
 *
 * SELECT * FROM information_schema.tables
 *
 * @param {Spreadsheet} schema - The spreadsheet to query
 * @returns {Table}
 */
Table.tables = function(schema) {
  const ordinals = [
    'table_catalog',
    'table_schema',
    'table_name',
    'table_type',
    'self_referencing_column_name',
    'reference_generation',
    'user_defined_type_catalog',
    'user_defined_type_schema',
    'user_defined_type_name',
    'is_insertable_into',
    'is_typed',
    'commit_action'
    ];

  const template = ordinals.reduce(function(row, name) {row[name] = null; return row}, {});
  template.table_schema = schema.getName();
  template.table_type = "BASE TABLE";
  template.is_insertable_into = 'YES';
  template.is_typed = 'NO';
  template.commit_action = 'NO';
  const rows = schema.getSheets().map(sheet => Object.assign({}, template, {table_name: sheet.getName()}));

  return Table.fromRows(rows, {ordinals: ordinals});
}

/**
 * List all the columns in a Spreadsheet
 *
 * SELECT * FROM information_schema.columns
 *
 * @param {Spreadsheet} schema - The spreadsheet to query
 * @returns {Table}
 */
Table.columns = function(schema) {
  const ordinals = [
    'table_catalog',
    'table_schema',
    'table_name',
    'column_name',
    'ordinal_position',
    'column_default',
    'is_nullable',
    'data_type',
    'character_maximum_length',
    'character_octet_length',
    'numeric_precision',
    'numeric_scale',
    'datetime_precision'
    ];

  const template = ordinals.reduce(function(row, name) {row[name] = null; return row}, {});
  template.table_schema = schema.getName();
  template.is_nullable = 'YES';
  const rows = schema.getSheets().reduce(function(rows, sheet) {
    const table = Table.fromSheet(sheet, {limit: 10});
    return rows.concat(table.ordinals.map(function(column_name, ordinal_position) {
      const column = table.namespace[column_name];
      const row = {
        table_name: sheet.getName(),
        column_name: column_name,
        ordinal_position: ordinal_position + 1,
        data_type: column.type
      };

      return Object.assign({}, template, row);
    }));
  },
  []);

  return Table.fromRows(rows);
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
  return this.ordinals.reduce(function (row, name) {
    return { ...row, [name]: that.namespace[name].data[selid]};
    },
    {});
}

/**
 * Returns a Table as an Array of rows.
 * Note that this is not the internal model,
 * so it should be used only for truly row-based operations.
 *
 * @returns {Array}
 */
Table.prototype.toRows = function() {
	const that = this;
	return this.selection.map(function(selid) {
		return that.ordinals.reduce(function (row, name) {
			return { ...row, [name]: that.namespace[name].data[selid]};
			},
			{});
	});
}

/**
 * Returns a column as an Array.
 *
 * @param {Integer} rowid
 * @returns {Array}
 */
Table.prototype.getColumn = function(name) {
  const that = this;
	return this.selection.map(selidx => that.namespace[name].data[selidx]);
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
  expressions
  	.map(expr => Table.normaliseBinding(expr))
  	.forEach(function(expr) {
			ordinals.push(expr.as);
			namespace[expr.as] = expr.expr.evaluate(that.namespace, that.selection, that.length);
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
  const matches = predicate.evaluate(this.namespace, this.selection, this.length).data;
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
 * Implements the UNION ALL operation.
 * This is what normal people think of as a UNION: just concatenate the columns.
 *
 * @param {Table} second - The second Table in the union
 * @param {Object} options - Concatenation options
 *
 * Options include:
 *  by - 'position' (default), 'name'
 */
Table.prototype.unionAll = function(second, options_p) {
  const options = Object.assign({}, {by: 'position'} , options_p || {});

  const byName = (options.by == 'name');
  const first = this;
  const namespace = this.ordinals.reduce(function(namespace, name, colIndex) {
      const target = namespace[name].data;
      var source = first.namespace[name].data;
      first.selection.forEach((selid, rowid) => target.push(source[selid]));
      source = second.namespace[byName ? name : second.ordinals[colIndex]].data;
      second.selection.forEach((selid, rowid) => target.push(source[selid]));
      return namespace;
    },
    this.emptyNamespace_()
  );

  return new Table(namespace, this.ordinals, undefined, this);
}

/**
 * Implements a relational equi-join, which is a join where all the predicates
 * are AND-ed and involve equality of key pairs, one from each table.
 * This is the most common kind of join, and is used for looking up data,
 * or connecting tables with primary/foreign key matches.
 *
 * @param {Table} build - The right hand side (smaller) table.
 * @param {Array} keys - The key expression pairs [{build: <expr>, probe: <expr>}, ...]
 * @param {Object} options - Join options
 * @returns {Table}
 *
 * Defined options are:
 *  type - "inner" (default), "left", "right", "full"
 *
 * The key expressions may also use left and right instead of probe and build (resp.)
 * for readability.
 */
Table.prototype.equiJoin = function(build, keys, options_p) {
  // Normalise the options
  const options = Object.assign({}, {type: 'inner'} , options_p || {});
  const leftOuter = options.type in {left: null, full: null};
  const rightOuter = options.type in {right: null, full: null};

  // Normalise the arguments
  if (!Array.isArray(keys)) {
    keys = [keys,];
  };
  keys = keys.map(pair => ({
    build: Table.normaliseExpr(pair.build || pair.right),
    probe: Table.normaliseExpr(pair.probe || pair.left)
  }));
  const probe = this;

  // Sort out the output schema
  // All the probe columns will be imported;
  // Only build columns that do not have name collisions will be imported.
  const buildImports = build.ordinals.filter(name => !probe.namespace.hasOwnProperty(name));
  const ordinals = probe.ordinals.map(name => name).concat(buildImports);

  const namespace = probe.emptyNamespace_();
  const buildNamespace = build.emptyNamespace_();
  buildImports.forEach(name => namespace[name] = buildNamespace[name]);

  // Build keys => expr
  const buildKeys = keys.map(pair => pair.build.evaluate(build.namespace, build.selection, build.length));
  const buildMatches = {};
  const ht = build.selection.reduce(function (ht, val, buildID) {
    const key = JSON.stringify(buildKeys.map(result => result.data[buildID]));
    const rows = ht.get(key);
    if (rows) {
      rows.push(buildID);
    } else {
      ht.set(key, [buildID,]);
    }
    return ht;
  }, new Map());

  // Probe the hash table and emit the new values
  const probeKeys = keys.map(pair => pair.probe.evaluate(probe.namespace, probe.selection, probe.length));
  const probeMatches = {}
  probe.selection.forEach(function (val, probeID) {
    const key = JSON.stringify(probeKeys.map(result => result.data[probeID]));
    const matches = ht.get(key);
    if (matches) {
      probeMatches[probeID] = matches;
      matches.forEach(function(buildID) {
        // Copy the probe data
        probe.ordinals.forEach(function(name) {
          namespace[name].data.push(probe.namespace[name].data[probeID]);
        });
        // Import the build data
        buildImports.forEach(function(name) {
          namespace[name].data.push(build.namespace[name].data[buildID]);
        });
        buildMatches[buildID] = true;
      });
    }
  });

  // Emit any outer join pairs
  if (leftOuter) {
    probe.selection.forEach(function(probeID) {
      if (!probeMatches[probeID]) {
        // Copy the probe data
        probe.ordinals.forEach(function(name) {
          namespace[name].data.push(probe.namespace[name].data[probeID]);
        });
        // Use nulls for the build data
        buildImports.forEach(function(name) {
          namespace[name].data.push(null);
        });
      }
    });
  }

  if (rightOuter) {
    build.selection.forEach(function(buildID) {
      if (!buildMatches[buildID]) {
        // Use nulls for the probe data
        probe.ordinals.forEach(function(name) {
          namespace[name].data.push(null);
        });
        // Import the build data
        buildImports.forEach(function(name) {
          namespace[name].data.push(build.namespace[name].data[buildID]);
        });
      }
    });
  }

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
  if (!Array.isArray(aggr.args)) {
  	aggr.args = [aggr.args];
  }
  aggr.args = aggr.args.map(arg => Table.normaliseExpr(arg));

  aggr.as = aggr.as || aggr.func.constructor.name;

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
  const groupbys = groups.map(group => group.expr.evaluate(that.namespace, that.selection, that.length));

  // Evaluate the aggregate input expressions
  const inputs = aggrs.map(aggr =>
  	aggr.func.args.map(arg =>
  		arg.evaluate(that.namespace, that.selection, that.length)));

  // Evaluate the aggregates using a hash table
  const ht = this.selection.reduce(function(ht, selid, rowid) {
    const values = groupbys.map(groupby => groupby.data[selid]);

    const key = JSON.stringify(values);
    if (!ht.has(key)) {
      ht.set(key, {group: selid, states: aggrs.map(aggr => aggr.func.initialize())});
    }
    const entry = ht.get(key);
    entry.states.forEach(function(state, a) {
    	const func = aggrs[a].func;
    	const row = [state].concat(inputs[a].map(col => col.data[selid]));
    	func.update.apply(func, row);
    });

    return ht;
  },
  new Map()
);

  // Finalize the aggregate states by running through the hash table.
  ht.forEach(function(entry) {
    //  Copy the group values from the rowid
    groups.forEach((group, g) => namespace[group.as].data.push(groupbys[g].data[entry.group]));
    aggrs.forEach((aggr, a) => namespace[aggr.as].data.push(aggr.func.finalize(entry.states[a])));
  });

  return new Table(namespace, ordinals, undefined, this);
}
Table.prototype.groupBy = Table.prototype.groupby;

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
  const ordercols = orders.map(order => order.expr.evaluate(that.namespace, selection, that.length));
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

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
      Table
  }
};
