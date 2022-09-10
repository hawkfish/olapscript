const expect = require ("chai").expect;
const parser = require('../src/parser');
const expr = require('../src/expr');

const Parser = parser.Parser;

describe('Parser', function() {
	describe('readToken', function() {
		const expectReadToken = function(setup, type) {
			expect(Parser.readToken(setup, 0)).to.deep.equal({type: type, pos: 0, text: setup, input: setup});
		}

		it('should read whitespace', function() {
			expectReadToken(' ', Parser.WHITESPACE);
			expectReadToken('  ', Parser.WHITESPACE);
			expectReadToken(' \t', Parser.WHITESPACE);
			expectReadToken(' \n \n', Parser.WHITESPACE);
		});
		it('should read comments', function() {
			expectReadToken("-- Comment", Parser.COMMENT);
			const returns = '-- Comment\n  \n';
			expect(Parser.readToken(returns, 0)).to.deep.equal({
				type: Parser.COMMENT, pos: 0, text: '-- Comment', input: returns
			});
		});
		it('should read strings', function() {
			expectReadToken("'string'", Parser.STRING);
			expectReadToken("'front''back'", Parser.STRING);
			expectReadToken("''", Parser.STRING);
		});
		it('should read references', function() {
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
		it('should read comparisons', function() {
			expectReadToken('=', Parser.COMPARISON);
			expectReadToken('<', Parser.COMPARISON);
			expectReadToken('>', Parser.COMPARISON);
			expectReadToken('<=', Parser.COMPARISON);
			expectReadToken('>=', Parser.COMPARISON);
			expectReadToken('!=', Parser.COMPARISON);
			expectReadToken('<>', Parser.COMPARISON);
		});
		it('should read operators', function() {
			expectReadToken('+', Parser.OPERATOR);
			expectReadToken('-', Parser.OPERATOR);
			expectReadToken('*', Parser.OPERATOR);
			expectReadToken('/', Parser.OPERATOR);
			expectReadToken('%', Parser.OPERATOR);
			expectReadToken('^', Parser.OPERATOR);
		});
	});

	describe('tokenise', function() {
		it('should tokenise whitespace and comments', function() {
			const input = '-- Comment\n  \n';
			expect(Parser.tokenise(input, 0)).to.deep.equal([
				{pos:  0, type: Parser.COMMENT, text: '-- Comment', input: input},
				{pos: 10, type: Parser.WHITESPACE, text: '\n  \n', input: input},
				{pos: 14, type: Parser.EOT, text: null, input: input}
			]);
		});

		it('should tokenise nullary function calls', function() {
			const input = 'now()';
			expect(Parser.tokenise(input)).to.deep.equal([
				{pos: 0, type: Parser.IDENTIFIER, text: 'now', input: input},
				{pos: 3, type: Parser.SYMBOL, text: '(', input: input},
				{pos: 4, type: Parser.SYMBOL, text: ')', input: input},
				{pos: 5, type: Parser.EOT, text: null, input: input}
			]);
		});
	});

	describe('parse', function() {
		const Expr = expr.Expr;
		const FuncExpr = expr.FuncExpr;
		const CaseExpr = expr.CaseExpr;

		const expectExpr = function(expected, actual, msg) {
			expect(actual.type, expected.toString()).to.equal(expected.type);
			switch (expected.type) {
			case 'constant':
				expect(actual.constant).to.deep.equal(expected.constant);
				break;
			case 'reference':
				expect(actual.reference).to.equal(expected.reference);
				break;
			case 'function':
				expect(actual.fname).to.equal(expected.fname);
				expect(actual.args.length, actual.toString()).to.equal(expected.args.length);
				expected.args.forEach((arg, a) => expectExpr(arg, actual.args[a], expected.fname));
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
			expectParse("'Mixed Case'", new ConstExpr("Mixed Case"));
			expectParse("'first''second'", new ConstExpr("first'second"));
			expectParse("'first''second''third'", new ConstExpr("first'second'third"));
			expectParse("''''", new ConstExpr("'"));
			expectParse("''''''", new ConstExpr("''"));
		});

		it('should parse references', function() {
			expectParse('"column"', new RefExpr('column'));
			expectParse('"Column Name"', new RefExpr('Column Name'));
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
				new FuncExpr(Expr.contains, [importance, new ConstExpr('high')], 'contains'), new ConstExpr(1),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('medium')], 'contains'), new ConstExpr(2),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('low')], 'contains'), new ConstExpr(3),
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
				new FuncExpr(Expr.contains, [importance, new ConstExpr('high')], 'contains'), new ConstExpr(1),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('medium')], 'contains'), new ConstExpr(2),
				new FuncExpr(Expr.contains, [importance, new ConstExpr('low')], 'contains'), new ConstExpr(3),
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
			expectParse("now()", new FuncExpr(Expr.now, [], 'now'));
			expectParse("NOW()", new FuncExpr(Expr.now, [], 'now'));
		});

		it('should parse unary function calls', function() {
			expectParse("ltrim('fnord')", new FuncExpr(Expr.ltrim, [new ConstExpr('fnord')], 'ltrim'));
			expectParse("RTrim('fnord')", new FuncExpr(Expr.rtrim, [new ConstExpr('fnord')], 'rtrim'));
		});

		it('should parse binary function calls', function() {
			expectParse("contains('fnord', 'o')",
				new FuncExpr(Expr.contains, [new ConstExpr('fnord'), new ConstExpr('o')], 'contains'));
		});

		it('should parse function calls with parenthesised arguments', function() {
			const setup = "contains(('fnord'), 'o')"
			const expected = new FuncExpr(Expr.contains, [new ConstExpr('fnord'), new ConstExpr('o')], 'contains')
			expectParse(setup, expected);
		});

		it('should throw for unknown functions', function() {
			expectThrow("unknown(1, 2)", "Unknown function");
			expectThrow("trimm(1, 2)", 'Did you mean "TRIM"');
		});

		it('should parse prefix functions', function() {
			expectParse("NOT true", new FuncExpr(Expr.not, [new ConstExpr(true)], 'not'));
			const cost = new RefExpr("cost");
			expectParse('- "cost"', new FuncExpr(Expr.negate, [cost], '-'));
			expectParse('+ "cost"', cost);
		});

		it('should parse parenthesised expressions', function() {
			expectParse("(NOT true)", new FuncExpr(Expr.not, [new ConstExpr(true)], 'not'));
			expectParse("((NOT false))", new FuncExpr(Expr.not, [new ConstExpr(false)], 'not'));
		});

		it('should parse BETWEEN', function() {
			const setup = '"importance" BETWEEN 0 AND 3';
			const expected = new FuncExpr(
				Expr.between,
				[new RefExpr("importance"), new ConstExpr(0), new ConstExpr(3)],
				'between'
			);
			expectParse(setup, expected);
		});

		it('should parse comparisons', function() {
			const ref = new RefExpr("importance");
			const one = new ConstExpr(1);
			expectParse('"importance" = 1', new FuncExpr(Expr.eq, [ref, one], '='));
			expectParse('"importance" > 1', new FuncExpr(Expr.gt, [ref, one], '>'));
			expectParse('"importance" >= 1', new FuncExpr(Expr.ge, [ref, one], '>='));
			expectParse('"importance" < 1', new FuncExpr(Expr.lt, [ref, one], '<'));
			expectParse('"importance" <= 1', new FuncExpr(Expr.le, [ref, one], '<='));
			expectParse('"importance" <> 1', new FuncExpr(Expr.ne, [ref, one], '<>'));
		});

		it('should parse IS [NOT] NULL', function() {
			const ref = new RefExpr("importance");
			expectParse('"importance" IS NULL', new FuncExpr(Expr.isnull, [ref], 'isnull'));
			expectParse('"importance" IS NOT NULL', new FuncExpr(Expr.isnull, [ref], 'isnotnull'));
			expectThrow('"importance" IS DEAD', 'Unexpected identifier ("dead") at position 16');
		});

		it('should parse IS [NOT] DISTINCT FROM', function() {
			const ref = new RefExpr("importance");
			const one = new ConstExpr(1);
			expectParse('"importance" IS DISTINCT FROM 1', new FuncExpr(Expr.isdistinct, [ref, one], 'isdistinct'));
			expectParse('"importance" IS NOT DISTINCT FROM 1', new FuncExpr(Expr.isnotdistinct, [ref, one], 'isnotdistinct'));
			expectThrow('"importance" IS DISTINCT 1', "Expected 'from' but found '1' at position 25"	);
		});

		it('should parse AND chains', function() {
			const setup = `"firstName" = 'fname'
			AND "lastName" = 'lname'
			AND "email" = 'email@example.com'
			AND "date" = #2022-09-05T17:42:40.000Z#
			AND "invalidTimestamp" IS NULL
			`;
			const expected = new FuncExpr(Expr.and, [
					new FuncExpr(Expr.eq, [new RefExpr("firstName"), new ConstExpr('fname')], '='),
					new FuncExpr(Expr.eq, [new RefExpr("lastName"), new ConstExpr('lname')], '='),
					new FuncExpr(Expr.eq, [new RefExpr("email"), new ConstExpr('email@example.com')], '='),
					new FuncExpr(Expr.eq, [new RefExpr("date"), new ConstExpr(new Date(Date.UTC(2022, 8, 5, 17, 42, 40)))], '='),
					new FuncExpr(Expr.isnull, [new RefExpr('invalidTimestamp')], 'isnull')
				],
				'and');
			expectParse(setup, expected);
		});

		it('should parse multi-level associativity', function() {
			const setup = `"a" AND "b" + "c" * "d" AND "e"`;
			const expected = new FuncExpr(Expr.and, [
				new RefExpr("a"),
				new FuncExpr(Expr.plus, [
					new RefExpr("b"),
					new FuncExpr(Expr.times, [
						new RefExpr("c"),
						new RefExpr("d")
					], '*')
				], '+'),
				new RefExpr("e")
			], 'and');
			expectParse(setup, expected);
		});

		it('should throw for unexpected tokens', function() {
			expectThrow("contains[1, 2]", "Expected the end but found a symbol at position 8");
			expectThrow("contains(1: 2)", "Expected ')' but found ':' at position 10");
			expectThrow("contains(1, 2) }", "Expected the end but found a symbol at position 15");
			expectThrow("}", 'Unexpected symbol ("}") at position 0');
			expectThrow("(54(", "Expected ')' but found '(' at position 3");
		});
	});

	describe('selects', function() {
		const Expr = expr.Expr;
		const RefExpr = expr.RefExpr;

		const expectSelects = function(setup, expected) {
			const parser = new Parser(setup);
			const actual = parser.selects(setup)
				.map(select => select.expr.toString() + ' AS ' + RefExpr.encode(select.as))
				.join(", ")
			;
			expect(actual).to.equal(expected);
		}

		it('should parse single expressions', function() {
			expectSelects('"a"', '"a" AS "a"');
			expectSelects('"a" AS "b"', '"a" AS "b"');
			expectSelects('"a" AS b', '"a" AS "b"');
		});

		it('should parse multiple expressions', function() {
			expectSelects('"a", 1 AS one', '"a" AS "a", 1 AS "one"');
			expectSelects('ltrim("a"), 1 AS one', 'LTRIM("a") AS "ltrim(a)", 1 AS "one"');
		});
	});

	describe('orders', function() {
		const expectOrders = function(setup, expected) {
			const parser = new Parser(setup);
			const actual = parser.orders(setup)
				.map(order => order.expr.toString()
									  + (order.asc ? " ASC" : " DESC")
									  + " NULLS " + (order.nullsFirst ? "FIRST" : "LAST")
				 )
				.join(", ")
			;
			expect(actual).to.equal(expected);
		}

		const expectThrow = function(setup, expected) {
			const parser = new Parser(setup);
			expect(parser.orders.bind(parser)).to.throw(SyntaxError, expected);
		}

		it('should parse single order by', function() {
			expectOrders('"a"', '"a" ASC NULLS FIRST');
			expectOrders('"a" ASC', '"a" ASC NULLS FIRST');
			expectOrders('"a" ASC NULLS FIRST', '"a" ASC NULLS FIRST');
			expectOrders('a ASC NULLS FIRST', '"a" ASC NULLS FIRST');
			expectOrders('a DESC NULLS FIRST', '"a" DESC NULLS FIRST');
			expectOrders('a DESC NULLS LAST', '"a" DESC NULLS LAST');
			expectOrders('a  NULLS FIRST ASC', '"a" ASC NULLS FIRST');
			expectOrders('a  NULLS LAST DESC', '"a" DESC NULLS LAST');
		});

		it('should parse multiple order bys', function() {
			expectOrders('"a", b DESC', '"a" ASC NULLS FIRST, "b" DESC NULLS FIRST');
			expectOrders('"a", b DESC, c NULLS LAST',
				'"a" ASC NULLS FIRST, "b" DESC NULLS FIRST, "c" ASC NULLS LAST');
		});

		it('should throw on malformed order bys', function() {
			expectThrow('"a" fnord', 'Unexpected ORDER BY qualifier');
			expectThrow('"a" NULLS WHEREVER', 'Unexpected NULLS qualifier');
			expectThrow('a: b', 'Expected the end but found a symbol at position 1');
		});
	});

	describe('aggregates', function() {
		const expectAggrs = function(setup, expected) {
			const parser = new Parser(setup);
			const actual = parser.aggrs()
				.map(aggr => aggr.func.toString() + ' AS ' + RefExpr.encode(aggr.as))
				.join(", ")
			;
			expect(actual).to.equal(expected);
		}
		const expectThrow = function(setup, expected) {
			const parser = new Parser(setup);
			expect(parser.aggrs.bind(parser)).to.throw(SyntaxError, expected);
		}

		it('should parse single aggregate', function() {
			expectAggrs('SUM("a")', 'SUM("a") AS "sum"');
			expectAggrs('COUNT("a")', 'COUNT("a") AS "count"');
			expectAggrs('COUNTSTAR()', 'COUNTSTAR() AS "countstar"');
			expectAggrs('COUNTSTAR() as n', 'COUNTSTAR() AS "n"');
		});

		it('should parse multiple aggregates', function() {
			expectAggrs(
				'MIN("a") as min_a, avg("a") as avg_a, MAX(a) as max_a',
				'MIN("a") AS "min_a", AVG("a") AS "avg_a", MAX("a") AS "max_a"');
		});

		it('should throw on malformed aggregates', function() {
			expectThrow('fnord("a")', 'Unknown aggregate: fnord. Did you mean "FIRST"');
			expectThrow('first("a", )', 'Unexpected symbol (")") at position 11');
		});
	});
});
