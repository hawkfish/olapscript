const expect = require ("chai").expect;
const parser = require('../src/parser');

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
	});

	describe('parse', function() {
		const expectExpr = function(expected, actual, msg) {
			expect(actual.type).to.equal(expected.type);
			switch (expected.type) {
			case 'constant':
				expect(actual.constant).to.deep.equal(expected.constant);
				break;
			case 'reference':
				expect(actual.reference).to.equal(expected.reference);
				break;
			case 'function':
				expect(actual.func).to.equal(expected.func);
				expect(actual.args.length).to.equal(expected.args.length);
				actual.args.forEach((arg, a) => expectExpr(arg, expected.args[a], setup));
				break;
			case 'case':
				expectExpr(actual.expr, expected.expr);
				expect(actual.args.length).to.equal(expected.args.length);
				actual.args.forEach((arg, a) => expectExpr(arg, expected.args[a], setup));
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

		it('should parse strings', function() {
			expectParse("''", new ConstExpr(""));
			expectParse("'string'", new ConstExpr("string"));
			expectParse("'first''second'", new ConstExpr("first'second"));
			expectParse("'first''second''third'", new ConstExpr("first'second'third"));
			expectParse("''''", new ConstExpr("'"));
			expectParse("''''''", new ConstExpr("''"));
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
	});
});
