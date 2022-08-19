const expect = require ("chai").expect;
const expr = require('../src/expr');
const Expr = expr.Expr;

describe('Date functions', function() {
	describe('NOW', function() {
		it('should return a Date close to the current time', function() {
			const expected = new Date();
			const actual = Expr.now();
			expect(actual).to.be.a('date');
			expect(actual).to.not.be.above(expected);
			expect(actual).to.be.below(new Date(expected.getTime() + 5000));
		});
	});
	describe('TODAY', function() {
		it('should return a Date at midnight UTC', function() {
			const today = Expr.today();
			expect(today.getUTCHours()).to.equal(0);
			expect(today.getUTCMinutes()).to.equal(0);
			expect(today.getUTCSeconds()).to.equal(0);
			expect(today.getUTCMilliseconds()).to.equal(0);
		});
	});
});
