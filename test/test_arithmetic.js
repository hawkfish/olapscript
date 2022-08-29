const expect = require ("chai").expect;
const expr = require('../src/expr');
const Expr = expr.Expr;

describe('Arithmetic functions', function() {
	describe('PLUS', function() {
		const f = Expr.plus;
		it('should add two numbers', function() {
			expect(f(0, 0)).to.equal(0);
			expect(f(-2, 2)).to.equal(0);
			expect(f(1, 2)).to.equal(3);
		});
		it('should concatenate two strings', function() {
			expect(f('', '')).to.equal('');
			expect(f('a', '')).to.equal('a');
			expect(f('', 'b')).to.equal('b');
			expect(f('a', 'b')).to.equal('ab');
			expect(f('abc', 'd')).to.equal('abcd');
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, 0)).to.be.null;
			expect(f(null, 1)).to.be.null;
			expect(f(0, null)).to.be.null;
			expect(f(1, null)).to.be.null;
			expect(f(null, '')).to.be.null;
			expect(f(null, 'abc')).to.be.null;
			expect(f('', null)).to.be.null;
			expect(f('abc', null)).to.be.null;
		});
		it('should support nary evaluation for numbers', function() {
			expect(f(1, 1, null)).to.be.null;
			expect(f(1, 1, false)).to.equal(2);
			expect(f(true, true, true)).to.equal(3);
		});
	});
});
