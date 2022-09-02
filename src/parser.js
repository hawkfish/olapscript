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

/**
 * Parser - A class for tokenising and parsing Expr (and Aggr) nodes from strings.
 */
class Parser {
	constructor(text, options = {}) {
		this.text = text;
		this.alltokens = Parser.tokenise(text);
		this.tokens = this.alltokens
			.filter(token => token.type > Parser.COMMENT)
			.map(token => Object.assign({}, token, {text: token.text ? token.text.toLowerCase() : token.text}))
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
	/^(<>|(?:[=<>!]=?))/
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

Parser.onUnexpected = function(token) {
	throw SyntaxError('Unexpected token type ' +  token.type + ' ("' + token.text + '")');
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
	if (token.type != type) {
		throw SyntaxError("Expected token type " +  type + " but found " + token.type);
	}
	if (text && text != token.text) {
		throw SyntaxError("Expected token '" +  text + "' but found '" + token.text + "'");
	}

	return token;
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

	const args = [];

	this.expect_(Parser.SYMBOL, '(');
	while (!this.peek_(Parser.SYMBOL, ')')) {
		args.push(this.expr_());
		if (this.peek_(Parser.SYMBOL, ',')) {
			this.expect_(Parser.SYMBOL, ',');
		}
	}
	this.expect_(Parser.SYMBOL, ')');

	return new FuncExpr(func, args);
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

	return new CaseExpr(args, expr);
}

Parser.prototype.between_ = function(expr) {
	const args = [expr];

	// BETWEEN <factor>
	this.expect_(Parser.IDENTIFIER, 'between');
	args.push(this.factor_());

	// AND <factor>
	this.expect_(Parser.IDENTIFIER, 'and');
	args.push(this.factor_());

	return new FuncExpr(Expr.between, args);
}

Parser.compareFuncs = {
	'=':  Expr.eq,
	'<>': Expr.ne,
	'!=': Expr.ne,
	'<':  Expr.lt,
	'<=': Expr.le,
	'>':  Expr.gt,
	'>=': Expr.ge
};

Parser.prototype.compare_ = function(factor) {
	const args = [factor];

	const op = this.expect_(Parser.COMPARISON);
	const func = Parser.compareFuncs[op.text];

	args.push(this.factor_());

	return new FuncExpr(func, args);
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
			return new FuncExpr(Expr.not, [this.expr_()]);
		case 'case':
			return this.case_();
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
	default:
		Parser.onUnexpected(token);
	}
}

Parser.prototype.expr_ = function() {
	const factor = this.factor_();

	// Postfix handling
	if (this.peek_(Parser.IDENTIFIER, "between")) {
		return this.between_(factor);
	}

	// Infix handling
	if (this.peek_(Parser.COMPARISON)) {
		return this.compare_(factor);
	}

	return factor;
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

