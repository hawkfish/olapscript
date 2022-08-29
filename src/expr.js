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
