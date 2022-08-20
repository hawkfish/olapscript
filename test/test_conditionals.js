"use strict";

const expect = require ("chai").expect;
const expr = require('../src/expr');
const Expr = expr.Expr;

describe('Conditional functions', function() {
	// Ordered test data
	const fixtures = {
		'boolean': [false, true],
		'number': [0, 1.25],
		'string': ['abc', 'def'],
		'Date': [new Date(1980, 5, 7), new Date(2022, 8, 20)],
		'Array': [[0, 1, 2], [3, 4, 5]]
	};

	describe('eq', function() {
		const f = Expr.eq;

		it('should compare semantically equal values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.true;
				expect(f(vals[1], vals[1]), type).to.be.true;
				expect(f(vals[0], vals[1]), type).to.be.false;
				expect(f(vals[1], vals[0]), type).to.be.false;
			});
		});

		it('should return null when comparing to null', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.null;
					expect(f(null, val), type).to.be.null;
				});
			});
		});
	});

	describe('ne', function() {
		const f = Expr.ne;

		it('should compare semantically unequal values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.false;
				expect(f(vals[1], vals[1]), type).to.be.false;
				expect(f(vals[0], vals[1]), type).to.be.true;
				expect(f(vals[1], vals[0]), type).to.be.true;
			});
		});

		it('should return null when comparing to null', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.null;
					expect(f(null, val), type).to.be.null;
				});
			});
		});
	});

	describe('lt', function() {
		const f = Expr.lt;

		it('should compare semantically less values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.false;
				expect(f(vals[1], vals[1]), type).to.be.false;
				expect(f(vals[0], vals[1]), type).to.be.true;
				expect(f(vals[1], vals[0]), type).to.be.false;
			});
		});

		it('should return null when comparing to null', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.null;
					expect(f(null, val), type).to.be.null;
				});
			});
		});
	});

	describe('le', function() {
		const f = Expr.le;

		it('should compare semantically less or equal values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.true;
				expect(f(vals[1], vals[1]), type).to.be.true;
				expect(f(vals[0], vals[1]), type).to.be.true;
				expect(f(vals[1], vals[0]), type).to.be.false;
			});
		});

		it('should return null when comparing to null', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.null;
					expect(f(null, val), type).to.be.null;
				});
			});
		});
	});

	describe('gt', function() {
		const f = Expr.gt;

		it('should compare semantically greater values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.false;
				expect(f(vals[1], vals[1]), type).to.be.false;
				expect(f(vals[0], vals[1]), type).to.be.false;
				expect(f(vals[1], vals[0]), type).to.be.true;
			});
		});

		it('should return null when comparing to null', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.null;
					expect(f(null, val), type).to.be.null;
				});
			});
		});
	});

	describe('ge', function() {
		const f = Expr.ge;

		it('should compare semantically greater or equal values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.true;
				expect(f(vals[1], vals[1]), type).to.be.true;
				expect(f(vals[0], vals[1]), type).to.be.false;
				expect(f(vals[1], vals[0]), type).to.be.true;
			});
		});

		it('should return null when comparing to null', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.null;
					expect(f(null, val), type).to.be.null;
				});
			});
		});
	});

	describe('isdistinct', function() {
		const f = Expr.isdistinct;

		it('should compare semantically distinct values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.false;
				expect(f(vals[1], vals[1]), type).to.be.false;
				expect(f(vals[0], vals[1]), type).to.be.true;
				expect(f(vals[1], vals[0]), type).to.be.true;
			});
		});

		it('should return null when comparing to null', function() {
			expect(f(null, null), 'null').to.be.false;
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.true;
					expect(f(null, val), type).to.be.true;
				});
			});
		});
	});

	describe('isnotdistinct', function() {
		const f = Expr.isnotdistinct;

		it('should compare semantically indistinct values', function() {
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];

				expect(f(vals[0], vals[0]), type).to.be.true;
				expect(f(vals[1], vals[1]), type).to.be.true;
				expect(f(vals[0], vals[1]), type).to.be.false;
				expect(f(vals[1], vals[0]), type).to.be.false;
			});
		});

		it('should return null when comparing to null', function() {
			expect(f(null, null), 'null').to.be.true;
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0]
				const vals = entry[1];
				entry[1].forEach(function(val) {
					expect(f(val, null), type).to.be.false;
					expect(f(null, val), type).to.be.false;
				});
			});
		});
	});

	describe('isnotnull', function() {
		const f = Expr.isnotnull;

		it('should test not null values', function() {
			expect(f(null), 'null').to.be.false;
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0];
				entry[1].forEach(function(val) {
					expect(f(val), type).to.be.true;
				});
			});
		});
	});

	describe('isnull', function() {
		const f = Expr.isnull;

		it('should test not null values', function() {
			expect(f(null), 'null').to.be.true;
			Object.entries(fixtures).forEach(function(entry) {
				const type = entry[0];
				entry[1].forEach(function(val) {
					expect(f(val), type).to.be.false;
				});
			});
		});
	});
});
