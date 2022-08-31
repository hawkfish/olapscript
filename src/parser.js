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

/**
 * Parser - A class for tokenising and parsing Expr (and Aggr) nodes from strings.
 */
class Parser {
	constructor(text, options = {}) {
		this.text = text;
		this.alltokens = Parser.tokenise(text);
		this.tokens = this.alltokens.filter(token => token.type > Parser.COMMENT);
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
	/^([(),:\[\]{}])/
];

/**
 *
 * Toke type codes
 */
Parser.WHITESPACE = 0;
Parser.COMMENT = Parser.WHITESPACE + 1;
Parser.STRING = Parser.COMMENT + 1;
Parser.REFERENCE = Parser.STRING + 1;
Parser.NUMBER = Parser.REFERENCE + 1;
Parser.DATE = Parser.NUMBER + 1;
Parser.IDENTIFIER = Parser.DATE + 1;
Parser.SYMBOL = Parser.IDENTIFIER + 1;
Parser.UNKNOWN = Parser.patterns.length;
// End of Text token type
Parser.EOT = Parser.UNKNOWN + 1;

/**
 * readToken - Reads a token from the current position
 *
 *	@param {String} text - The text to read from
 *	@param {Number} pos - The position to read from
 *
 * Tokens have the structure {type: Number, text: String, pos: Number}
 */
Parser.readToken = function(text, pos) {
	const target = text.slice(pos);
	const token = {type: 0, pos: pos, text: null};
	for (; token.type < Parser.patterns.length; ++token.type) {
		const pat = Parser.patterns[token.type];
		const match = pat.exec(text.slice(pos))
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
Parser.tokenise = function(text) {
	const tokens = [];
	for (var pos = 0; pos < text.length;) {
		const token = Parser.readToken(text, pos);
		if (token.text === null) {
			throw SyntaxError("Unknown token at position " + pos);
		}
		tokens.push(token);
		pos += token.text.length;
	}
	tokens.push({type: Parser.EOT, pos: pos, text: null});

	return tokens;
}

Parser.tokenize = Parser.tokenise;

Parser.prototype.peek_ = function() {
	return this.tokens[this.next];
}

Parser.prototype.next_ = function() {
	return this.tokens[this.next++];
}

Parser.prototype.expect_ = function(type, text) {
	const token = this.next_();
	if (token.type != type) {
		throw SyntaxError("Expected token type " +  type + " but found " + token.type);
	}
	if (text && text != token.text) {
		throw SyntaxError("Expected token '" +  text + "' but found '" + token.text + "'");
	}

	return token;
}

Parser.prototype.expr_ = function() {
	var token = this.next_();
	switch (token.type) {
	case Parser.STRING:
		return new ConstExpr(token.text.slice(1, -1).replace(/''/g, "'"));
	case Parser.NUMBER:
		return new ConstExpr(JSON.parse(token.text));
	case Parser.DATE:
		return new ConstExpr(new Date(token.text.slice(1, -1)));
	}
}

Parser.prototype.parse = function() {
	const expr = this.expr_();
	this.expect_(Parser.EOT);
	return expr;
}

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Parser
  }
};

