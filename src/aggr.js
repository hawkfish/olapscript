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
    super();
    this.sum = null;
  }
  
  update(val) {
    super.update(val);
    if (val !== null) {
      if (this.sum == null) {
        this.sum = val;
      } else {
        this.sum += val;
      }
    }
  }
  
  finalize() {
    return this.sum;
  }
};

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

if (typeof module !== 'undefined') {
  module.exports  = {
    CountStar, Count, Sum, Avg
  };
};
