const expect = require ("chai").expect;
const parser = require('../src/parser');
const expr = require('../src/expr');

const Parser = parser.Parser;

describe('Parser', function() {
	describe('readToken', function() {
		const expectReadToken = function(setup, type) {
			expect(Parser.readToken(setup, 0)).to.deep.equal({type: type, pos: 0, text: setup});
		}

		it('should read whitespace', function() {
			expectReadToken(' ', Parser.WHITESPACE);
			expectReadToken('  ', Parser.WHITESPACE);
			expectReadToken(' \t', Parser.WHITESPACE);
			expectReadToken(' \n \n', Parser.WHITESPACE);
		});
		it('should read comments', function() {
			expectReadToken("-- Comment", Parser.COMMENT);
			expect(Parser.readToken('-- Comment\n  \n', 0)).to.deep.equal({type: Parser.COMMENT, pos: 0, text: '-- Comment'});
		});
		it('should read strings', function() {
			expect(Parser.readToken("'string'", 0)).to.deep.equal({type: Parser.STRING, pos: 0, text: "'string'"});
			expectReadToken("'string'", Parser.STRING);
			expectReadToken("'front''back'", Parser.STRING);
			expectReadToken("''", Parser.STRING);
		});
		it('should read references', function() {
			expect(Parser.readToken('"column"', 0)).to.deep.equal({type: Parser.REFERENCE, pos: 0, text: '"column"'});
			expectReadToken('"column"', Parser.REFERENCE);
			expectReadToken('"column""quotes"', Parser.REFERENCE);
			// This is not a valid reference, but that is not our problem!
			expectReadToken('""', Parser.REFERENCE);
		});
		it('should read numbers', function() {
			expectReadToken('1', Parser.NUMBER);
			expectReadToken('-1', Parser.NUMBER);
			expectReadToken('-1.5', Parser.NUMBER);
		});
		it('should read dates', function() {
			expectReadToken('#1970-01-01#', Parser.DATE);
			expectReadToken('#2022-08-29 11:59:20.123456#', Parser.DATE);
			expectReadToken('#2022-08-29 11:59:20.123456 -07:00#', Parser.DATE);
		});
		it('should read identifiers', function() {
			expectReadToken('TAN', Parser.IDENTIFIER);
			expectReadToken('TAN2', Parser.IDENTIFIER);
			expectReadToken('X', Parser.IDENTIFIER);
			expectReadToken('sin', Parser.IDENTIFIER);
			expectReadToken('case', Parser.IDENTIFIER);
		});
		it('should read symbols', function() {
			expectReadToken('(', Parser.SYMBOL);
			expectReadToken(')', Parser.SYMBOL);
			expectReadToken('[', Parser.SYMBOL);
			expectReadToken(']', Parser.SYMBOL);
			expectReadToken('{', Parser.SYMBOL);
			expectReadToken('}', Parser.SYMBOL);
		});
	});

	describe('tokenise', function() {
		it('should tokenise whitespace and comments', function() {
			expect(Parser.tokenise('-- Comment\n  \n', 0)).to.deep.equal([
				{pos:  0, type: Parser.COMMENT, text: '-- Comment'},
				{pos: 10, type: Parser.WHITESPACE, text: '\n  \n'},
				{pos: 14, type: Parser.EOT, text: null}
			]);
		});

		it('should tokenise nullary function calls', function() {
			expect(Parser.tokenise('now()')).to.deep.equal([
				{pos: 0, type: Parser.IDENTIFIER, text: 'now'},
				{pos: 3, type: Parser.SYMBOL, text: '('},
				{pos: 4, type: Parser.SYMBOL, text: ')'},
				{pos: 5, type: Parser.EOT, text: null}
			]);
		});
	});

	describe('parse', function() {
		const Expr = expr.Expr;
		const FuncExpr = expr.FuncExpr;
		const CaseExpr = expr.CaseExpr;

		const expectExpr = function(expected, actual, msg) {
			expect(actual.type, msg).to.equal(expected.type);
			switch (expected.type) {
			case 'constant':
				expect(actual.constant).to.deep.equal(expected.constant);
				break;
			case 'reference':
				expect(actual.reference).to.equal(expected.reference);
				break;
			case 'function':
				expect(actual.func.name).to.equal(expected.func.name);
				expect(actual.args.length).to.equal(expected.args.length);
				expected.args.forEach((arg, a) => expectExpr(arg, actual.args[a], msg));
				break;
			case 'case':
				if (expected.expr == null) {
					expect(actual.expr).to.be.null;
				} else {
					expectExpr(expected.expr, actual.expr);
				}
				expect(actual.args.length).to.equal(expected.args.length);
				expected.args.forEach((arg, a) => expectExpr(arg, actual.args[a], msg));
				break;
			default:
				expect(false, "Unknown expression type").to.be.true;
				break;
			}
		}

		const expectParse = function(setup, expected) {
			const parser = new Parser(setup);
			const actual = parser.parse(setup);
			expectExpr(expected, actual, setup);
		}

		const expectThrow = function(setup, expected) {
			const parser = new Parser(setup);
			expect(parser.parse.bind(parser)).to.throw(SyntaxError, expected);
		}

		it('should parse strings', function() {
			expectParse("''", new ConstExpr(""));
			expectParse("'string'", new ConstExpr("string"));
			expectParse("'first''second'", new ConstExpr("first'second"));
			expectParse("'first''second''third'", new ConstExpr("first'second'third"));
			expectParse("''''", new ConstExpr("'"));
			expectParse("''''''", new ConstExpr("''"));
		});

		it('should parse references', function() {
			expectParse('"column"', new RefExpr('column'));
			expectParse('"column name"', new RefExpr('column name'));
			expectParse('"column ""name"" with quotes"', new RefExpr('column "name" with quotes'));
			expectThrow('""', "Empty identifier");
		});

		it('should parse numbers', function() {
			expectParse("0", new ConstExpr(0));
			expectParse("0.5", new ConstExpr(0.5));
			expectParse("-1.25", new ConstExpr(-1.25));
		});

		it('should parse dates', function() {
			expectParse("#2022-08-30#", new ConstExpr(new Date(Date.UTC(2022, 7, 30, 0, 0, 0))));
			expectParse("#1996-05-30 12:31:47#", new ConstExpr(new Date(1996, 4, 30, 12, 31, 47)));
		});

		it('should parse nulls', function() {
			expectParse("NULL", new ConstExpr(null));
			expectParse("null", new ConstExpr(null));
			expectParse("Null", new ConstExpr(null));
		});

		it('should parse Booleans', function() {
			expectParse("TRUE", new ConstExpr(true));
			expectParse("true", new ConstExpr(true));
			expectParse("True", new ConstExpr(true));

			expectParse("FALSE", new ConstExpr(false));
			expectParse("false", new ConstExpr(false));
			expectParse("False", new ConstExpr(false));
		});

		it('should parse CASE WHEN ELSE', function() {
			const setup = 'CASE\n' +
				'WHEN CONTAINS("importance", \'high\') THEN 1\n' +
				'WHEN CONTAINS("importance", \'medium\') THEN 2\n' +
				'WHEN CONTAINS("importance", \'low\') THEN 3\n' +
				'ELSE 4\n' +
				'END'
			;
			const importance = new RefExpr("importance");
			const expected = new CaseExpr([
				new FuncExpr(Expr.contains, [importance, new ConstExpr('high')]), new ConstExpr(1),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('medium')]), new ConstExpr(2),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('low')]), new ConstExpr(3),
				new ConstExpr(4)
			]);
			expectParse(setup, expected);
		});

		it('should parse CASE WHEN', function() {
			const setup = 'CASE\n' +
				'WHEN CONTAINS("importance", \'high\') THEN 1\n' +
				'WHEN CONTAINS("importance", \'medium\') THEN 2\n' +
				'WHEN CONTAINS("importance", \'low\') THEN 3\n' +
				'END'
			;
			const importance = new RefExpr("importance");
			const expected = new CaseExpr([
				new FuncExpr(Expr.contains, [importance, new ConstExpr('high')]), new ConstExpr(1),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('medium')]), new ConstExpr(2),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('low')]), new ConstExpr(3),
				new ConstExpr(null)
			]);
			expectParse(setup, expected);
		});

		it('should parse CASE <expr> WHEN ELSE', function() {
			const setup = 'CASE "importance"\n' +
				"WHEN 'high' THEN 1\n" +
				"WHEN 'medium' THEN 2\n" +
				"WHEN 'low' THEN 3\n" +
				'ELSE 4\n' +
				'END'
			;
			const importance = new RefExpr("importance");
			const expected = new CaseExpr([
				new ConstExpr('high'), new ConstExpr(1),
				new ConstExpr('medium'), new ConstExpr(2),
				new ConstExpr('low'), new ConstExpr(3),
				new ConstExpr(4)
			], importance);
			expectParse(setup, expected);
		});

		it('should parse CASE <expr> WHEN', function() {
			const setup = 'CASE "importance"\n' +
				"WHEN 'high' THEN 1\n" +
				"WHEN 'medium' THEN 2\n" +
				"WHEN 'low' THEN 3\n" +
				'END'
			;
			const importance = new RefExpr("importance");
			const expected = new CaseExpr([
				new ConstExpr('high'), new ConstExpr(1),
				new ConstExpr('medium'), new ConstExpr(2),
				new ConstExpr('low'), new ConstExpr(3),
				new ConstExpr(null)
			], importance);
			expectParse(setup, expected);
		});

		it('should parse nullary function calls', function() {
			expectParse("now()", new FuncExpr(Expr.now, []));
			expectParse("NOW()", new FuncExpr(Expr.now, []));
		});

		it('should parse unary function calls', function() {
			expectParse("ltrim('fnord')", new FuncExpr(Expr.ltrim, [new ConstExpr('fnord')]));
			expectParse("RTrim('fnord')", new FuncExpr(Expr.rtrim, [new ConstExpr('fnord')]));
		});

		it('should parse binary function calls', function() {
			expectParse("contains('fnord', 'o')", new FuncExpr(Expr.contains, [new ConstExpr('fnord'), new ConstExpr('o')]));
		});

		it('should parse function calls with parenthesised arguments', function() {
			const setup = "contains(('fnord'), 'o')"
			const expected = new FuncExpr(Expr.contains, [new ConstExpr('fnord'), new ConstExpr('o')])
			expectParse(setup, expected);
		});

		it('should throw for unknown functions', function() {
			expectThrow("unknown(1, 2)", "Unknown function");
			expectThrow("trimm(1, 2)", 'Did you mean "TRIM"');
		});

		it('should parse prefix functions', function() {
			expectParse("NOT true", new FuncExpr(Expr.not, [new ConstExpr(true)]));
		});

		it('should parse parenthesised expressions', function() {
			expectParse("(NOT true)", new FuncExpr(Expr.not, [new ConstExpr(true)]));
			expectParse("((NOT false))", new FuncExpr(Expr.not, [new ConstExpr(false)]));
		});

		it('should throw for unexpected tokens', function() {
			expectThrow("contains[1, 2]", "Expected token");
			expectThrow("contains(1: 2)", "Unexpected token");
			expectThrow("contains(1, 2) }", "Expected token");
			expectThrow("}", "Unexpected token");
			expectThrow("(54(", "Expected token ')'");
		});
	});
});
