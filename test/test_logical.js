const expect = require ("chai").expect;
const expr = require('../src/expr');
const Expr = expr.Expr;

describe('Logical functions', function() {
	describe('AND', function() {
		const f = Expr.and;
		it('should produce the binary truth table', function() {
			expect(f(false, false)).to.be.false;
			expect(f(true, false)).to.be.false;
			expect(f(false, true)).to.be.false;
			expect(f(true, true)).to.be.true;
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, false)).to.be.null;
			expect(f(null, true)).to.be.null;
			expect(f(false, null)).to.be.null;
			expect(f(true, null)).to.be.null;
		});
		it('should support nary evaluation', function() {
			expect(f(true, true, null)).to.be.null;
			expect(f(true, true, false)).to.be.false;
			expect(f(true, true, true)).to.be.true;
		});
	});

	describe('OR', function() {
		const f = Expr.or;
		it('should produce the binary truth table', function() {
			expect(f(false, false)).to.be.false;
			expect(f(true, false)).to.be.true;
			expect(f(false, true)).to.be.true;
			expect(f(true, true)).to.be.true;
		});
		it('should produce null if any argument is null', function() {
			expect(f(null, false)).to.be.null;
			expect(f(null, true)).to.be.null;
			expect(f(false, null)).to.be.null;
			expect(f(true, null)).to.be.null;
		});
		it('should support nary evaluation', function() {
			expect(f(false, false, null)).to.be.null;
			expect(f(false, false, false)).to.be.false;
			expect(f(false, false, true)).to.be.true;
		});
	});

	describe('NOT', function() {
		const f = Expr.not;
		it('should produce the unary truth table', function() {
			expect(f(false)).to.be.true;
			expect(f(true)).to.be.false;
		});
		it('should produce null if the argument is null', function() {
			expect(f(null)).to.be.null;
		});
	});
});
