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
 * Hack around App Script import mess
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
    return String(this.constant);
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
 return new Column(this.datatype, Array(count).fill(that.constant));
};

if (typeof module !== 'undefined') {
  module.exports  = {
    Expr, FuncExpr, ConstExpr, RefExpr
  }
};
