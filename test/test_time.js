const expect = require ("chai").expect;
const expr = require('../src/expr');
const timestamp = require('../src/timestamp');

const Expr = expr.Expr;
const SQLDate = timestamp.SQLDate;

describe('SQLDate', function() {
	describe('constructor', function() {
		it('should default to the Unix epoch', function() {
			const actual = new SQLDate();
			expect(actual.getFullYear()).to.equal(1970);
			expect(actual.getMonth()).to.equal(0);
			expect(actual.getDate()).to.equal(1);
			expect(actual.getDay()).to.equal(4);
			expect(actual.valueOf()).to.equal(0);
			expect(actual.toString()).to.equal('1970-01-01');
		});
		it('should construct daylight savings time dates', function() {
			const actual = new SQLDate(2022, 9, 4);
			expect(actual.getFullYear()).to.equal(2022);
			expect(actual.getMonth()).to.equal(9);
			expect(actual.getDate()).to.equal(4);
			expect(actual.getDay()).to.equal(2);
			expect(actual.valueOf()).to.equal(1664841600);
			expect(actual.toString()).to.equal('2022-10-04');
		});
		it('should construct standard time dates', function() {
			const actual = new SQLDate(2022, 10, 11);
			expect(actual.getFullYear()).to.equal(2022);
			expect(actual.getMonth()).to.equal(10);
			expect(actual.getDate()).to.equal(11);
			expect(actual.getDay()).to.equal(5);
			expect(actual.valueOf()).to.equal(1668124800);
			expect(actual.toString()).to.equal('2022-11-11');
		});
		it('should construct dates before the epoch', function() {
			const actual = new SQLDate(1964, 10, 5);
			expect(actual.getFullYear()).to.equal(1964);
			expect(actual.getMonth()).to.equal(10);
			expect(actual.getDate()).to.equal(5);
			expect(actual.getDay()).to.equal(4);
			expect(actual.valueOf()).to.equal(-162691200);
			expect(actual.toString()).to.equal('1964-11-05');
		});
	});
	describe('fromDate', function() {
		it('should detect UTC dates', function() {
			const setup = new Date(Date.UTC(2022, 9, 5))
			const expected = new SQLDate(setup.getUTCFullYear(), setup.getUTCMonth(), setup.getUTCDate());
			const actual = SQLDate.fromDate(setup);
			expect(actual.valueOf()).to.equal(expected.valueOf());
		});
		it('should detect local dates', function() {
			const setup = new Date(2022, 9, 5)
			const expected = new SQLDate(setup.getFullYear(), setup.getMonth(), setup.getDate());
			const actual = SQLDate.fromDate(setup);
			expect(actual.valueOf()).to.equal(expected.valueOf());
		});
		it('should ignore non-date timestamps', function() {
			const setup = new Date(2022, 9, 5, 20, 23,41)
			const actual = SQLDate.fromDate(setup);
			expect(actual).to.equal(setup);
		});
		it('should ignore non-dates', function() {
			const setup = "string";
			const actual = SQLDate.fromDate(setup);
			expect(actual).to.equal(setup);
		});
	});
	describe('valueOf', function() {
		it('should compare values', function() {
			const lo = new SQLDate(2012, 5, 15);
			const hi = new SQLDate(2022, 9, 4);

			expect(lo < lo).to.be.false;
			expect(lo <= lo).to.be.true;
			expect(lo != lo).to.be.false;
			expect(lo == hi).to.be.false;
			expect(lo >= lo).to.be.true;
			expect(lo > lo).to.be.false;

			expect(lo < hi).to.be.true;
			expect(lo <= hi).to.be.true;
			expect(lo != hi).to.be.true;
			expect(lo == hi).to.be.false;
			expect(lo >= hi).to.be.false;
			expect(lo > hi).to.be.false;

			expect(hi < lo).to.be.false;
			expect(hi <= lo).to.be.false;
			expect(hi == lo).to.be.false;
			expect(hi != lo).to.be.true;
			expect(hi >= lo).to.be.true;
			expect(hi > lo).to.be.true;
		});
	});
});

describe('Date functions', function() {
	describe('NOW', function() {
		it('should return a Date close to the current time', function() {
			const actual = Expr.now();
			const expected = new Date();
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
