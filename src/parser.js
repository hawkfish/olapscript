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

	return new CaseExpr(args, expr);
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

Parser.prototype.select_ = function() {
	const expr = this.expr_();
	if (!this.peek_(Parser.IDENTIFIER, 'as')) {
		return {expr: expr, as: expr.alias()};
	}

	this.next_();
	if (this.peek_(Parser.REFERENCE)) {
		return {expr: expr, as: this.factor_().reference};
	}

	return {expr: expr, as: this.expect_(Parser.IDENTIFIER).text};
}

Parser.prototype.selects = function() {
	const result = [this.select_()];
	while (this.peek_(Parser.SYMBOL, ',')) {
		this.next_();
		result.push(this.select_());
	}
	this.expect_(Parser.EOT);
	return result;
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
	const result = [this.order_()];
	while (this.peek_(Parser.SYMBOL, ',')) {
		this.next_();
		result.push(this.order_());
	}
	this.expect_(Parser.EOT);
	return result;
}

/**
 * Node exports
 */
if (typeof module !== 'undefined') {
  module.exports  = {
    Parser
  }
};

