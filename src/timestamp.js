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

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    SQLDate
  }
};
