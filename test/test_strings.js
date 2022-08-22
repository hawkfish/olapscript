const expect = require ("chai").expect;
const expr = require('../src/expr');
const Expr = expr.Expr;

describe('String functions', function() {
	describe('CONTAINS', function() {
		const target = 'Twas brillig and the slithy toves';
		it('should return true if the search is in the target', function() {
				expect(Expr.contains(target, 'slithy')).to.be.true;
		});
		it('should return false if the search is not in the target', function() {
				expect(Expr.contains(target, 'gyre')).to.be.false;
		});
		it('should return null for any null argument', function() {
				expect(Expr.contains(target, null)).to.be.null;
				expect(Expr.contains(null, 'wabe')).to.be.null;
				expect(Expr.contains(null, null)).to.be.null;
		});
	});

	describe('LTRIM', function() {
		it('should trim only the left side of a string', function() {
				expect(Expr.ltrim(' Both  ')).to.equal('Both  ');
		});
		it('should not trim the right side of a string', function() {
				expect(Expr.ltrim('Both  ')).to.equal('Both  ');
		});
		it('should not trim a string with no spaces', function() {
				expect(Expr.ltrim('Both')).to.equal('Both');
		});
		it('should return null for a null argument', function() {
				expect(Expr.ltrim(null)).to.be.null;
		});
	});

	describe('RTRIM', function() {
		it('should trim only the right side of a string', function() {
				expect(Expr.rtrim(' Both  ')).to.equal(' Both');
		});
		it('should not trim the left side of a string', function() {
				expect(Expr.rtrim(' Both')).to.equal(' Both');
		});
		it('should not trim a string with no spaces', function() {
				expect(Expr.rtrim('Both')).to.equal('Both');
		});
		it('should return null for a null argument', function() {
				expect(Expr.rtrim(null)).to.be.null;
		});
	});

	describe('TRIM', function() {
		it('should trim the left side of a string', function() {
				expect(Expr.trim(' Both')).to.equal('Both');
		});
		it('should trim the right side of a string', function() {
				expect(Expr.trim('Both  ')).to.equal('Both');
		});
		it('should trim both sides of a string', function() {
				expect(Expr.trim(' Both  ')).to.equal('Both');
		});
		it('should not trim a string with no spaces', function() {
				expect(Expr.trim('Both')).to.equal('Both');
		});
		it('should return null for a null argument', function() {
				expect(Expr.trim(null)).to.be.null;
		});
	});
});
