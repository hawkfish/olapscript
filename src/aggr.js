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
