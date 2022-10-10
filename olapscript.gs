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
 * This module implements SQL-like temporal types for OLAPScript.
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
 * SQLDate - A pure date class
 *
 * Just a wrapper around Date that smacks some sense into it
 *
 */
class SQLDate {
	constructor(yyyy=1970, mm=0, dd=1) {
		this.date_ = new Date(Date.UTC(yyyy, mm, dd));
	}

	getFullYear() {
		return this.date_.getUTCFullYear();
	}

	getMonth() {
		return this.date_.getUTCMonth();
	}

	getDate() {
		return this.date_.getUTCDate();
	}

	getDay() {
		return this.date_.getUTCDay();
	}

	valueOf() {
		return this.date_.valueOf() / 1000;
	}

	toString() {
		return this.date_.toISOString().slice(0, 10);
	}
};

SQLDate.fromDate = function(ts) {
	if (!(ts instanceof Date)) {
		return ts;
	}
	if (ts.toISOString().indexOf('00:00:00.000') != -1) {
		return new SQLDate(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate());
	}
	if (ts.getHours() || ts.getMinutes() || ts.getSeconds() || ts.getMilliseconds()) {
		return ts;
	}
	return new SQLDate(ts.getFullYear(), ts.getMonth(), ts.getDate());
}

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    SQLDate
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
  constructor(func, args, fname) {
    super('function');
    this.func = func;
    this.args = args;
    this.fname = fname || 'FuncExpr';
  }

	toString() {
		return this.fname.toUpperCase() + "(" + this.args.map(arg => String(arg)).join(", ") + ")";
	}

  alias() {
    return this.fname + "(" + this.args.map(arg => arg.alias()).join(", ") + ")";
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
  	return RefExpr.encode(this.reference);
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

RefExpr.encode = function(r) {
  	return '"' + r.replace(/"/g, '""') + '"';
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
    if (constant instanceof Date) {
    	this.datatype = 'date';
    }
  }

  toString() {
  	switch (this.datatype) {
  	case 'string':
  		return "'" + this.constant.replace(/'/g, "''") + "'";
  	case 'date':
  		return '#' + this.constant.toISOString() + '#';
		}

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
 * @param {String} type - The type of case ('case' or 'if').
 * @param {Array} args - The input expressions for the case.
 * @param {Function} expr - The optional case value expression.
 */
class CaseExpr extends Expr {
	constructor(type, args, expr) {
		super(type.toLowerCase());
		this.expr = expr;
		this.args = args;
		// Add a missing else clause
		if (this.args.length % 2 == 0) {
			this.args.push(new ConstExpr(null));
		}
	}

	toString() {
		if (this.type == 'if') {
			return 'IF ' + this.args[0].toString()
					 + '\nTHEN ' + this.args[1].toString()
					 + '\nELSE ' + this.args[2].toString()
					 + '\nEND'
					 ;
		}

		var result = 'CASE';
		if (this.expr) {
			result += ' ' + this.expr.toString();
		}
		var a = 0;
		while (a < this.args.length - 1) {
			result += ' WHEN ' + this.args[a++].toString();
			result += ' THEN ' + this.args[a++].toString();
		}
		result += ' ELSE ' + this.args[a++].toString() + ' END';

		return result;
	}

	alias() {
		return this.type;
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
	return Expr.nullWrapper_(function(l, r) {
		if (l == r) {
	 		return true;
	 	}
	 	if ((typeof l.valueOf === 'function') && (typeof r.valueOf === 'function')) {
	 		return l.valueOf() == r.valueOf();
	 	}
	 	return false;
	 },
	 lhs, rhs);
}

Expr.ne = function(lhs, rhs) {
	return Expr.nullWrapper_(function(l, r) {
		if (l == r) {
	 		return false;
	 	}
	 	if ((typeof l.valueOf === 'function') && (typeof r.valueOf === 'function')) {
	 		return l.valueOf() != r.valueOf();
	 	}
	 	return true;
	 }, lhs, rhs);
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
 *	Arithmetic Functions
 *
 * Since Javascript doesn't expose these as function objects,
 * we have them in the library for potentially reasoning about expression trees.
 */
Expr.plus = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result + arg));
}

Expr.minus = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result - arg));
}

Expr.times = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result * arg), 1);
}

Expr.divide = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result === null) ? arg : (result / arg));
}

Expr.mod = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result === null) ? arg : (result % arg));
}

Expr.power = function(...args) {
	if (args.includes(null)) {
		return null;
	}
	return args.reduce((result, arg) => (result === null) ? arg : result ** arg);
}

Expr.negate = function(arg) {
	return Expr.nullWrapper_(a => -a, arg);
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
	constructor(args, options, fname) {
		this.fname = fname || 'Aggr';
		args = args || [];
		if (!Array.isArray(args)) {
			args = [args];
		}
		this.args = args;
		this.options = options || {};
	}

	toString() {
		return this.fname.toUpperCase() + "(" + this.args.map(arg => arg.toString()).join(", ") + ")";
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
  constructor(args, options) {
  	super(args, options, 'countstar');
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
  constructor(arg, options) {
  	super([arg], options, 'count');
  }

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
    super(args, options, 'sum');
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
  constructor(args, options) {
    super(args, options);
    this.fname = 'avg';
  }

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
	constructor(selector, args, options, fname) {
		super(args, options, fname);
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
		super((a,b) => ((a < b) ? a : b), args, options, 'min');
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
		super((a,b) => ((a > b) ? a : b), args, options, 'max');
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
		super((a,b) => a, args, options, 'first');
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
		super((a,b) => b, args, options, 'last');
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
	constructor(args, options) {
		super(args, options, 'arrayagg');
	}

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
		super((a, b) => (a + sep + b), [args[0]], options, 'stringagg');
		this.sep = sep;
	}
};

Aggr.countstar = CountStar;
Aggr.count = Count;

Aggr.sum = Sum;
Aggr.avg = Avg;

Aggr.min = Min;
Aggr.max = Max;
Aggr.first = First;
Aggr.last = Last;

Aggr.arrayagg = ArrayAgg;
Aggr.stringagg = StringAgg;

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Aggr
  };
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
if (typeof Expr === 'undefined') {
  Expr = require("./expr").Expr;
}
if (typeof FuncExpr === 'undefined') {
  FuncExpr = require("./expr").FuncExpr;
}
if (typeof RefExpr === 'undefined') {
  RefExpr = require("./expr").RefExpr;
}
if (typeof CaseExpr === 'undefined') {
  CaseExpr = require("./expr").CaseExpr;
}
if (typeof Aggr === 'undefined') {
  Aggr = require("./aggr").Aggr;
}

/**
 * Parser - A class for tokenising and parsing Expr (and Aggr) nodes from strings.
 */
class Parser {
	constructor(text, options = {}) {
		this.text = text;
		this.alltokens = Parser.tokenise(text);
		this.tokens = this.alltokens
			.filter(token => token.type > Parser.COMMENT)
			.map(function(token) {
				var text = token.text;
				if (text && token.type == Parser.IDENTIFIER) {
					text = text.toLowerCase();
				}
				return  Object.assign({}, token, {text: text});
			})
		;
		this.next = 0;
	}
};

Parser.patterns = [
	// Whitespace
	/^(\s+)/m,
	// Comments
	/^(--[^\n]*)\n?/m,
	// Strings
	/^((?:\'[^\']*\')+)/,
	// References
	/^((?:\"[^\"]*\")+)/,
	// Numbers
	/^(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/,
	// Dates
	/^(\#[-+:.,\w ]+\#)/,
	// Identifiers
	/^([A-Za-z_]\w*)/,
	// Symbols
	/^([(),:\[\]{}])/,
	// Comparisons
	/^(<>|(?:[=<>!]=?))/,
	// Operators
	/^([-+*/%^])/
];

/**
 *
 * Token type codes
 */
Parser.WHITESPACE = 0;
Parser.COMMENT = Parser.WHITESPACE + 1;
Parser.STRING = Parser.COMMENT + 1;
Parser.REFERENCE = Parser.STRING + 1;
Parser.NUMBER = Parser.REFERENCE + 1;
Parser.DATE = Parser.NUMBER + 1;
Parser.IDENTIFIER = Parser.DATE + 1;
Parser.SYMBOL = Parser.IDENTIFIER + 1;
Parser.COMPARISON = Parser.SYMBOL + 1;
Parser.OPERATOR = Parser.COMPARISON + 1;
Parser.UNKNOWN = Parser.patterns.length;
// End of Text token type
Parser.EOT = Parser.UNKNOWN + 1;

/**
 *
 * Token type names
 */
Parser.typeNames = [
	'whitespace',
	'comment',
	'string',
	'reference',
	'number',
	'date',
	'identifier',
	'symbol',
	'comparison',
	'operator',
	'unknown',
	'end',
];

Parser.typeArticles = [
	'',
	'a',
	'a',
	'a',
	'a',
	'a',
	'an',
	'a',
	'a',
	'an',
	'the',
	'the',
];

Parser.precedence = [
	'^',
	'/',
	'*',
	'-',
	'+',
	'between',
	'isnotdistinct',
	'isdistinct',
	'=',
	'<',
	'<=',
	'>',
	'>=',
	'<>',
	'and',
	'or'
].reduce(function(precedence, op, i) {precedence[op] = i; return precedence;}, {});

Parser.infixFunc = [
	Expr.power,
	Expr.divide,
	Expr.times,
	Expr.minus,
	Expr.plus,
	Expr.between,
	Expr.isnotdistinct,
	Expr.isdistinct,
	Expr.eq,
	Expr.lt,
	Expr.le,
	Expr.gt,
	Expr.ge,
	Expr.ne,
	Expr.and,
	Expr.or
];

/**
 * readToken - Reads a token from the current position
 *
 *	@param {String} text - The text to read from
 *	@param {Number} pos - The position to read from
 *
 * Tokens have the structure {type: Number, text: String, pos: Number, input: String}
 */
Parser.readToken = function(input, pos) {
	const target = input.slice(pos);
	const token = {type: 0, pos: pos, text: null, input: input};
	for (; token.type < Parser.patterns.length; ++token.type) {
		const pat = Parser.patterns[token.type];
		const match = pat.exec(input.slice(pos))
		if (match && !match.index) {
			token.text = match[1];
			break;
		}
	}
	return token;
}

/**
 * tokenise - Convert a string to tokens.
 *
 * Tokens have the structure {type: Number, text: String, pos: Number}
 *
 * @param {String} text - The text to tokenise
 * @returns <Array> An array of tokens.
 */
Parser.tokenise = function(input) {
	const tokens = [];
	for (var pos = 0; pos < input.length;) {
		const token = Parser.readToken(input, pos);
		if (token.text === null) {
			throw SyntaxError("Unknown token at position " + pos);
		}
		tokens.push(token);
		pos += token.text.length;
	}
	tokens.push({type: Parser.EOT, pos: pos, text: null, input: input});

	return tokens;
}

Parser.tokenize = Parser.tokenise;

Parser.onUnexpected = function(token) {
	throw SyntaxError(
		'Unexpected ' + Parser.typeNames[token.type] +
		' ("' + token.text +
		'") at position ' + token.pos);
}

Parser.prototype.peek_ = function(type, text) {
	const token = this.tokens[this.next];
	if (token.type != type) {
		return false;
	} else if (text && text != token.text) {
		return false;
	}

	return true;
}

Parser.prototype.next_ = function() {
	return this.tokens[this.next++];
}

Parser.prototype.expect_ = function(type, text) {
	const token = this.next_();
	if (text && text != token.text) {
		throw SyntaxError(
			"Expected '" + text +
			"' but found '" + token.text +
			"' at position " + token.pos
		);
	} else if (token.type != type) {
		throw SyntaxError(
			"Expected " + Parser.typeArticles[type] + ' ' + Parser.typeNames[type] +
			" but found " + Parser.typeArticles[token.type] + ' ' + Parser.typeNames[token.type] +
			" at position " + token.pos
		);
	}

	return token;
}

Parser.prototype.args_ = function() {
	const args = [];

	this.expect_(Parser.SYMBOL, '(');
	if (!this.peek_(Parser.SYMBOL, ')')) {
		args.push(this.expr_());
		while (this.peek_(Parser.SYMBOL, ',')) {
			this.expect_(Parser.SYMBOL, ',');
			args.push(this.expr_());
		}
	}
	this.expect_(Parser.SYMBOL, ')');

	return args;
}

Parser.prototype.func_ = function(name) {
	const func = Expr[name];
	if (!func) {
    	const candidates = Object.keys(Expr).filter(key => (key == key.toLowerCase()))
    	const closest = Expr.topNLevenshtein(candidates, name.toLowerCase(), 1, 5);
    	if (closest.length) {
      	throw new SyntaxError("Unknown function: " + name +
      		'. Did you mean "' + closest[0].candidate.toUpperCase() + '"?');
      } else {
      	throw new SyntaxError("Unknown function: '" + name);
      }
	}

	const args = this.args_();

	return new FuncExpr(func, args, name);
}

Parser.prototype.case_ = function() {
	var expr = null;
	const args = [];

	// CASE <expr> WHEN
	if (!this.peek_(Parser.IDENTIFIER, 'when')) {
		expr = this.expr_();
	}

	// WHEN <expr> THEN <expr>
	while (this.peek_(Parser.IDENTIFIER, 'when')) {
		this.next_();
		args.push(this.expr_());
		this.expect_(Parser.IDENTIFIER, 'then');
		args.push(this.expr_());
	}

	// ELSE <expr>
	if (this.peek_(Parser.IDENTIFIER, 'else')) {
		this.next_();
		args.push(this.expr_());
	}

	// END
	this.expect_(Parser.IDENTIFIER, 'end');

	return new CaseExpr('case', args, expr);
}

Parser.prototype.if_ = function() {
	const expr = null;
	const args = [];

	// IF <expr>
	args.push(this.expr_());

	// THEN <expr>
	this.expect_(Parser.IDENTIFIER, 'then');
	args.push(this.expr_());

	// ELSE <expr>
	if (this.peek_(Parser.IDENTIFIER, 'else')) {
		this.next_();
		args.push(this.expr_());
	}

	// END
	this.expect_(Parser.IDENTIFIER, 'end');

	return new CaseExpr('if', args, expr);
}

Parser.prototype.factor_ = function() {
	var token = this.next_();
	switch (token.type) {
	case Parser.STRING:
		return new ConstExpr(token.text.slice(1, -1).replace(/''/g, "'"));
	case Parser.REFERENCE:
		if (token.text.length < 3) {
			throw SyntaxError("Empty identifier at position " + token.pos);
		}
		return new RefExpr(token.text.slice(1, -1).replace(/""/g, '"'));
	case Parser.NUMBER:
		return new ConstExpr(JSON.parse(token.text));
	case Parser.DATE:
		return new ConstExpr(new Date(token.text.slice(1, -1)));
	case Parser.IDENTIFIER:
		switch (token.text) {
		case 'null':
			return new ConstExpr(null);
		case 'true':
			return new ConstExpr(true);
		case 'false':
			return new ConstExpr(false);
		case 'not':
			return new FuncExpr(Expr.not, [this.expr_()], token.text);
		case 'case':
			return this.case_();
		case 'if':
			return this.if_();
		default:
			if (!this.peek_(Parser.SYMBOL, '(')) {
				return new RefExpr(token.text);
			}
			return this.func_(token.text);
		}
	case Parser.SYMBOL:
		switch(token.text) {
		case '(': {
			const e = this.expr_();
			this.expect_(Parser.SYMBOL, ')');
			return e;
		}
		default:
			Parser.onUnexpected(token);
		}
	case Parser.OPERATOR:
		switch (token.text) {
		case '-':
			// Unary minus
			return new FuncExpr(Expr.negate, [this.expr_()], token.text);
		case '+':
			// Unary plus
			return this.expr_();
		default:
			Parser.onUnexpected(token);
		}
	default:
		Parser.onUnexpected(token);
	}
}

Parser.prototype.infix_ = function() {
	const token = this.tokens[this.next];
	switch (token.type) {
	case Parser.IDENTIFIER:
		switch (token.text) {
		case 'between':
		case 'is':
		case 'and':
		case 'or':
			break;
		default:
			return null;
		}
	case Parser.COMPARISON:
	case Parser.OPERATOR:
		break;
	default:
		return null;
	}

	this.next_();

	return token.text;
}

function logStack(stack) {
	stack.forEach((entry, e) => console.log(e, entry.op, entry.args.map(arg => '' + arg)));
}

Parser.prototype.expr_ = function() {
	const factor = this.factor_();

	const stack = [{op: null, args: [factor]}];

	// Handle infix operations
	while (true) {
		var op = this.infix_();
		if (!op) {
			break;
		}

		// Finish parsing multi-token operations
		if (op == 'is') {
			// NOT
			const negated = this.peek_(Parser.IDENTIFIER, 'not');
			if (negated) {
				this.next_();
			}

			const token = this.expect_(Parser.IDENTIFIER);
			switch (token.text) {
			case 'null': {
				// NULL
				//	Replace last argument with <arg> IS [NOT] NULL
				const lhs = stack[stack.length - 1].args.pop();
				op = negated ? 'isnotnull' : 'isnull';
				stack[stack.length - 1].args.push(new FuncExpr(negated ? Expr.isnotnull : Expr.isnull, [lhs], op));
				continue;
			}
			case 'distinct':
				//	DISTINCT
				this.expect_(Parser.IDENTIFIER, 'from');
				op = negated ? 'isnotdistinct' : 'isdistinct';
				break;
			default:
				Parser.onUnexpected(token);
			}
		}

		// Replace unknown infix with the current one
		if (!stack[stack.length - 1].op) {
			stack[stack.length - 1].op = op;
		}

		// Get the RHS of the infix
		const c = this.factor_();

		// Handle the association precedence between the previous and current ops.
		var prevOp = stack[stack.length - 1].op;
		if (prevOp == 'between') {
			// Special case <factor> BETWEEN <factor> AND <rhs>
			switch (op) {
			case 'between':
			case 'and':
				op = prevOp;
				break;
			default:
				throw SyntaxError('Unexpected BETWEEN separator: ' + op);
			}
		}

		// Associate arguments

		// Left Associative (e.g., a * b + c)
		// 	Pop the top of the stack and combine it into a single argument for the previous operand
		while (Parser.precedence[prevOp] < Parser.precedence[op]) {
			const top = stack.pop();
			const ab = new FuncExpr(Parser.infixFunc[Parser.precedence[top.op]], top.args, top.op);
			if (stack.length > 1) {
				stack[stack.length-1].args.push(ab);
			} else {
				stack.push({op: op, args: [ab]})
			}
			prevOp = stack[stack.length - 1].op;
		}

		// Fuse nested identical ops on the top of the stack
		while (stack.length > 1 && stack[stack.length - 2].op == op) {
			const args = stack.pop().args;
			stack[stack.length - 1].args.push(...args);
		}

		if (prevOp == op) {
			// Same infix op (e.g., a + b + c)
			//	Extend top argument list
			stack[stack.length-1].args.push(c);
		} else {
			// Right Associative (e.g., a + b * c)
			// 	Start a new argument list for the higher precedence op
			const b = stack[stack.length - 1].args.pop();
			stack.push({op: op, args: [b, c]});
		}
	}

	// Pop everything from the stack
	while (stack.length > 1) {
		const top = stack.pop();
		stack[stack.length - 1].args.push(new FuncExpr(Parser.infixFunc[Parser.precedence[top.op]], top.args, top.op));
	}

	const top = stack.pop();
	if (top.op) {
		top.args = [new FuncExpr(Parser.infixFunc[Parser.precedence[top.op]], top.args, top.op)];
	}

	return top.args.pop();
}

Parser.prototype.parse = function() {
	const expr = this.expr_();
	this.expect_(Parser.EOT);
	return expr;
}

Parser.prototype.commas_ = function(func) {
	const result = [func()];
	while (this.peek_(Parser.SYMBOL, ',')) {
		this.next_();
		result.push(func());
	}
	this.expect_(Parser.EOT);
	return result;
}

Parser.prototype.as_ = function(alias) {
	if (!this.peek_(Parser.IDENTIFIER, 'as')) {
		return alias;
	}

	this.next_();
	if (this.peek_(Parser.REFERENCE)) {
		return this.factor_().reference;
	}

	return this.expect_(Parser.IDENTIFIER).text;
}

Parser.prototype.aggr_ = function() {
	const name = this.expect_(Parser.IDENTIFIER).text;
	const aggr = Aggr[name];
	if (!aggr) {
    	const candidates = Object.keys(Aggr).filter(key => (key == key.toLowerCase()))
    	const closest = Expr.topNLevenshtein(candidates, name, 1, 5);
    	if (closest.length) {
      	throw new SyntaxError("Unknown aggregate: " + name +
      		'. Did you mean "' + closest[0].candidate.toUpperCase() + '"?');
      } else {
      	throw new SyntaxError("Unknown aggregate: '" + name);
      }
	}

	const args = this.args_();
	const options = {};
	const func = new aggr(args, options);

	return {func: func, as: this.as_(name)}
}

Parser.prototype.aggrs = function() {
	return this.commas_(this.aggr_.bind(this));
}

Parser.prototype.select_ = function() {
	const expr = this.expr_();
	return {expr: expr, as: this.as_(expr.alias())};
}

Parser.prototype.selects = function() {
	return this.commas_(this.select_.bind(this));
}

Parser.prototype.order_ = function() {
	const result = {expr: this.expr_(), asc: true, nullsFirst: true};

	// ASC/DESC or NULLS FIRST/LAST
	while (this.peek_(Parser.IDENTIFIER)) {
		var token = this.expect_(Parser.IDENTIFIER);
		switch (token.text) {
		case 'asc':
		case 'desc':
			result.asc = (token.text == 'asc');
			break;
		case 'nulls':
			token = this.expect_(Parser.IDENTIFIER);
			switch (token.text) {
			case 'first':
			case 'last':
				result.nullsFirst = (token.text == 'first');
				break;
			default:
				throw SyntaxError('Unexpected NULLS qualifier: ' + token.text);
			}
			break;
		default:
			throw SyntaxError('Unexpected ORDER BY qualifier: ' + token.text);
		}
	}

	return result;
}

Parser.prototype.orders = function() {
	return this.commas_(this.order_.bind(this));
}

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Parser
  }
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
if (typeof Parser === 'undefined') {
  Parser = require("./parser").Parser;
}
if (typeof SQLDate === 'undefined') {
  SQLDate = require("./timestamp").SQLDate;
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

		const col0 = this.namespace[this.ordinals[0]] || new Column(undefined, []);
    this.selection = selection || col0.data.map((v, rowid) => rowid);
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
 * defaultColumnName
 *
 * @param {Number} Column number (0-based)
 * @returns {String} the default column name (A-ZZ)
 */
Table.defaultColumnName = function(colno) {
	const d0 = colno % 26;
	const d1 = (colno - d0) / 26;
	if (d1) {
		return String.fromCharCode(d1 + 65, d0 + 65);
	} else {
		return String.fromCharCode(d0 + 65);
	}
}

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
    options.limit = Math.max(bounds.limit, 0);
  }
  // Adjust for inclusive header
  if (!options.header) {
    options.header = options.top;
  	options.headerCount = Math.min(options.headerCount, options.limit + 1);
    options.top += options.headerCount;
  }

  // Extract the header
  var header = options.columns || Array(options.width).fill(null).map((v, colno) => Table.defaultColumnName(colno));
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
    header = header.map((name, colno) => name ? name : Table.defaultColumnName(colno));
  }

	// Strip trailing spaces
	header = header.map(name => name.replace(/[\s]+$/, ""));

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

  // Extract the values (if any)
  const namespace = {};
  if (options.limit > 0) {
		const valueRange = sheet.getRange(options.top, options.left, options.limit, options.width);
		const values = valueRange.getValues();

		// Pivot the data into columns
		for (var c = 0; c < valueRange.getNumColumns(); ++c) {
			const raw = Array.from(values, row => row[c]);
			var data = raw;
			const dates = raw.map(d => SQLDate.fromDate(d));
			if (dates.filter((d, i) => ((d !== raw[i]) || (d == null))).length == raw.length) {
				data = dates;
			}
			const type = undefined;
			const name = ordinals[c];
			const col = new Column(type, data);
			namespace[name] = col;
		}
	} else {
		//	Zero rows, so create empty, untyped columns
		ordinals.forEach(name => namespace[name] = new Column(undefined, new Array(0)));
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
 * Write a Table out to an array
 *
 * @returns {Array}
 */
Table.prototype.toArray = function() {
  const lastColumn = this.ordinals.length;
  if (lastColumn == 0) {
    return [];
  }

  // Write the column headers in the first row
  let headerArray = [];
  let headers = [].concat([this.ordinals]);
  headerArray.push(headers);

  // Write the remaining data in the subsequent rows
  const that = this;
  const lastRow = 1 + this.getRowCount();
  let selectionArray = [];
  if (lastRow > 1) {
    selectionArray = (that.selection.map(selid => this.ordinals.map(name => that.namespace[name].data[selid])));
  }
  return headers.concat(selectionArray);
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
 * @param {Array} selects - An ordered list of expressions and aliases.
 * @returns {Table}
 */
Table.prototype.select = function(selects) {
  const namespace = {};
  const ordinals = [];
  const that = this;
  if (typeof selects == 'string') {
  	selects = new Parser(selects).selects();
  }
  selects
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
  if (typeof predicate == 'string') {
  	predicate = new Parser(predicate).parse();
  }
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
 * Convert a join predicate to a set of equi-join keys
 *
 * @param {Expr} predicate - The predicate to convert
 * @returns {Object} The key pairs for an equi-join, or null
 */
Table.equiJoinKeys = function(predicate) {
	if (predicate.type != 'function') {
		return null;
	}

	// Handle single comparison by faking unary AND
	var args = predicate.args;
	switch (predicate.fname) {
	case '=':
	case 'isnotdistinct':
		args = [predicate];
		break;
	case 'and':
		break;
	default:
		return null;
	}

	const keys = [];
	for (var i = 0; i < args.length; ++i) {
		const arg = args[i];
		if (arg.type != 'function') {
			return null;
		}
		switch (arg.fname) {
		case '=':
		case 'isnotdistinct':
			keys.push({left: arg.args[0], right: arg.args[1], distinct: (arg.fname != '=')});
			break;
		default:
			return null;
		}
	}

	return keys;
}

/**
 * Implements a relational equi-join, which is a join where all the predicates
 * are AND-ed and involve equality of key pairs, one from each table.
 * This is the most common kind of join, and is used for looking up data,
 * or connecting tables with primary/foreign key matches.
 *
 * @param {Table} build - The right hand side (smaller) table.
 * @param {Array} keys - The key expression pairs [{build: <expr>, probe: <expr>, distinct: <Boolean>}, ...]
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
  if (typeof keys == 'string') {
  	keys = Table.equiJoinKeys(new Parser(keys).parse());
  }
  if (!Array.isArray(keys)) {
    keys = [keys,];
  };
  keys = keys.map(pair => ({
    build: Table.normaliseExpr(pair.build || pair.right),
    probe: Table.normaliseExpr(pair.probe || pair.left),
    distinct: pair.distinct || false
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
  const ht = build.selection.reduce(function (ht, buildID) {
  	//	Only insert nulls for distinct comparisons.
  	const values = buildKeys.map(result => result.data[buildID]);
  	if (values.filter((value, i) => (value == null && !keys[i].distinct)).length) {
  		return ht;
  	}
    const key = JSON.stringify(values);
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
  probe.selection.forEach(function (probeID) {
  	const values = probeKeys.map(result => result.data[probeID]);
  	//	Only check nulls for distinct comparisons.
  	if (values.filter((value, i) => (value == null && !keys[i].distinct)).length) {
  		return;
  	}
    const key = JSON.stringify(values);
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
  if (!aggr.func.initialize) {
  	aggr.func = new aggr.func;
  }
  aggr.func.args = aggr.func.args || [];
  if (!Array.isArray(aggr.func.args)) {
  	aggr.func.args = [aggr.func.args];
  }
  aggr.func.args = aggr.func.args.map(arg => Table.normaliseExpr(arg));

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
  if (typeof groups == 'string') {
  	groups = new Parser(groups).selects()
  }
  if (groups && !Array.isArray(groups)) {
    groups = [groups,];
  }
  groups = groups.map(group => Table.normaliseBinding(group));

  aggrs = aggrs || [];
  if (typeof aggrs == 'string') {
  	aggrs = new Parser(aggrs).aggrs()
  }
  if (aggrs && !Array.isArray(aggrs)) {
    aggrs = [aggrs,];
  }
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
  if (typeof orders == 'string') {
  	orders = new Parser(orders).orders();
  }
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
