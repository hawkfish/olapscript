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
			expect(f(1, 1, 0)).to.equal(2);
			expect(f(1, 1, 1)).to.equal(3);
		});
		it('should support nary evaluation for strings', function() {
			expect(f('a', 'b', null)).to.be.null;
			expect(f('a', 'b', '')).to.equal('ab');
			expect(f('a', 'b', 'c')).to.equal('abc');
		});
	});

	describe('MINUS', function() {
		const f = Expr.minus;
		it('should subtract two numbers', function() {
			expect(f(0, 0)).to.equal(0);
			expect(f(-2, 2)).to.equal(-4);
			expect(f(1, 2)).to.equal(-1);
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, 0)).to.be.null;
			expect(f(null, 1)).to.be.null;
			expect(f(0, null)).to.be.null;
			expect(f(1, null)).to.be.null;
		});
		it('should support nary evaluation for numbers', function() {
			expect(f(1, 1, null)).to.be.null;
			expect(f(1, 1, 0)).to.equal(0);
			expect(f(1, 1, 1)).to.equal(-1);
		});
	});

	describe('TIMES', function() {
		const f = Expr.times;
		it('should multiply two numbers', function() {
			expect(f(0, 0)).to.equal(0);
			expect(f(-2, 2)).to.equal(-4);
			expect(f(1, 2)).to.equal(2);
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, 0)).to.be.null;
			expect(f(null, 1)).to.be.null;
			expect(f(0, null)).to.be.null;
			expect(f(1, null)).to.be.null;
		});
		it('should support nary evaluation for numbers', function() {
			expect(f(1, 1, null)).to.be.null;
			expect(f(1, 1, 0)).to.equal(0);
			expect(f(1, 1, 1)).to.equal(1);
		});
	});

	describe('DIVIDE', function() {
		const f = Expr.divide;
		it('should divide two numbers', function() {
			expect(f(-2, 2)).to.equal(-1);
			expect(f(1, 2)).to.equal(0.5);
			expect(f(1, 0)).to.equal(Infinity);
			expect(f(0, 0)).to.be.NaN;
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, 0)).to.be.null;
			expect(f(null, 1)).to.be.null;
			expect(f(0, null)).to.be.null;
			expect(f(1, null)).to.be.null;
		});
		it('should support nary evaluation for numbers', function() {
			expect(f(1, 1, null)).to.be.null;
			expect(f(1, 1, 0)).to.equal(Infinity);
			expect(f(1, 1, 1)).to.equal(1);
		});
	});

	describe('MOD', function() {
		const f = Expr.mod;
		it('should compute the modulus of two positive integers', function() {
			expect(f(2, 2)).to.equal(0);
			expect(f(1, 2)).to.equal(1);
			expect(f(1, 0)).to.be.NaN;
			expect(f(0, 0)).to.be.NaN;
		});
		it('should compute the modulus of two integers', function() {
			expect(f(3, 2)).to.equal(1);
			expect(f(-3, 2)).to.equal(-1);
			expect(f(3, -2)).to.equal(1);
			expect(f(-3, -2)).to.equal(-1);
		});
		it('should compute the modulus of two floating point numbers', function() {
			expect(f(3.5, 2.25)).to.equal(1.25);
			expect(f(-3.5, 2.25)).to.equal(-1.25);
			expect(f(3.5, -2.25)).to.equal(1.25);
			expect(f(-3.5, -2.25)).to.equal(-1.25);
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, 0)).to.be.null;
			expect(f(null, 1)).to.be.null;
			expect(f(0, null)).to.be.null;
			expect(f(1, null)).to.be.null;
		});
		it('should support nary evaluation for numbers', function() {
			expect(f(1, 1, null)).to.be.null;
			expect(f(1, 1, 0)).to.be.NaN;
			expect(f(1, 1, 1)).to.equal(0);
		});
	});
});
