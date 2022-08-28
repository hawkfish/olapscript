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
